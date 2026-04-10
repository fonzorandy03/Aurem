/**
 * POST /api/auth/reset-password/confirm
 *
 * Riceve il reset URL di Shopify e la nuova password.
 * Usa Shopify Storefront API per resettare la password.
 *
 * Request:
 *   POST /api/auth/reset-password/confirm
 *   { resetUrl: string, password: string }
 *
 * Response:
 *   { ok: true }
 *   oppure errore: EXPIRED_TOKEN, INVALID_TOKEN, WEAK_PASSWORD, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import {
  consumeRateLimit,
  getClientIp,
  tooManyRequestsResponse,
} from '@/lib/security/request-guard'

const CUSTOMER_RESET_BY_URL_MUTATION = /* gql */ `
  mutation CustomerResetByUrl($resetUrl: URL!, $password: String!) {
    customerResetByUrl(resetUrl: $resetUrl, password: $password) {
      customer {
        id
        email
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export async function POST(req: NextRequest) {
  try {
    const { resetUrl, token, password } = await req.json()
    const resolvedResetUrl =
      typeof resetUrl === 'string' && resetUrl
        ? resetUrl
        : typeof token === 'string'
          ? token
          : ''

    const ip = getClientIp(req)
    const limit = consumeRateLimit({
      bucket: 'auth-reset-confirm',
      key: `${ip}:${resolvedResetUrl || 'unknown'}`,
      limit: 3,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.ok) {
      return tooManyRequestsResponse(limit.retryAfterSeconds)
    }

    if (!resolvedResetUrl) {
      return NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: 'Token di reset non fornito o non valido.',
        },
        { status: 400 },
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        {
          error: 'WEAK_PASSWORD',
          message: 'Password insufficiente.',
        },
        { status: 400 },
      )
    }

    // Shopify fornisce un reset URL completo da usare in customerResetByUrl.
    const { data } = await storefrontFetch<any>({
      query: CUSTOMER_RESET_BY_URL_MUTATION,
      variables: {
        resetUrl: resolvedResetUrl,
        password,
      },
    })

    const result = data?.customerResetByUrl
    if (!result) {
      return NextResponse.json(
        {
          error: 'UNKNOWN_ERROR',
          message: 'Errore durante il reset della password.',
        },
        { status: 500 },
      )
    }

    const userErrors = result.customerUserErrors
    if (userErrors && userErrors.length > 0) {
      const firstError = userErrors[0]
      const code = firstError.code?.toUpperCase()

      if (code === 'EXPIRED_TOKEN' || code === 'INVALID_TOKEN') {
        return NextResponse.json(
          {
            error: code,
            message: 'Link di reset scaduto o non valido.',
          },
          { status: 400 },
        )
      }

      if (code === 'PASSWORD_TOO_SHORT' || code === 'WEAK_PASSWORD') {
        return NextResponse.json(
          {
            error: 'WEAK_PASSWORD',
            message: 'Password troppo debole. Usa lettere maiuscole, minuscole e numeri.',
          },
          { status: 400 },
        )
      }

      if (code === 'PASSWORD_ALREADY_USED') {
        return NextResponse.json(
          {
            error: 'PASSWORD_ALREADY_USED',
            message: 'Hai già utilizzato questa password. Prova una password diversa.',
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: code || 'RESET_FAILED',
          message: firstError.message || 'Errore durante il reset della password.',
        },
        { status: 400 },
      )
    }

    if (!result.customer) {
      return NextResponse.json(
        {
          error: 'RESET_FAILED',
          message: 'Non è stato possibile resettare la password.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Password resettata con successo.',
    })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)

    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Errore del server durante il reset della password.',
      },
      { status: 500 },
    )
  }
}
