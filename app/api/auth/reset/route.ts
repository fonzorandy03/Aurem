/**
 * POST /api/auth/reset
 *
 * Invia un'email di recupero password tramite Shopify Storefront API.
 * Risponde in modo generico per sicurezza (anti-enumerazione) e per ridurre latenza.
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import {
  consumeRateLimit,
  getClientIp,
  isValidEmail,
  normalizeEmail,
  tooManyRequestsResponse,
} from '@/lib/security/request-guard'

const RECOVER_MUTATION = /* gql */ `
  mutation CustomerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const genericOk = NextResponse.json({
    ok: true,
    message:
      'If this email is registered, you will receive password reset instructions by email. Depending on Shopify account settings, you may continue on a secure Shopify page.',
  })

  try {
    const { email } = await req.json()
    const normalizedEmail = normalizeEmail(email)
    const ip = getClientIp(req)

    const limit = consumeRateLimit({
      bucket: 'auth-reset',
      key: `${ip}:${normalizedEmail || 'unknown-email'}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.ok) {
      return tooManyRequestsResponse(limit.retryAfterSeconds)
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'INVALID_EMAIL',
          message: 'Invalid email address.',
        },
        { status: 400 },
      )
    }

    const { data } = await storefrontFetch<any>({
      query: RECOVER_MUTATION,
      variables: { email: normalizedEmail },
    })

    const errors = data?.customerRecover?.customerUserErrors
    if (errors?.length) {
      console.error('[auth/reset] customerRecover userErrors', {
        email: normalizedEmail,
        errors,
        elapsedMs: Date.now() - startedAt,
      })
      // Manteniamo risposta generica anche in errore per non esporre esistenza account.
      return genericOk
    }

    console.log('[auth/reset] customerRecover accepted', {
      email: normalizedEmail,
      elapsedMs: Date.now() - startedAt,
    })

    return genericOk
  } catch (err) {
    console.error('[auth/reset] internal error', err)
    // Anche qui: risposta generica per UX coerente e sicurezza.
    return NextResponse.json(
      {
        ok: true,
        message:
          'If this email is registered, you will receive password reset instructions by email. Please check spam or promotions folders as well.',
      },
      { status: 200 },
    )
  }
}
