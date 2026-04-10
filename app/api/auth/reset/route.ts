/**
 * POST /api/auth/reset
 *
 * Invia un'email di recupero password tramite Shopify Storefront API.
 * Prima verifica che l'email sia registrata usando Admin API.
 * Se registrata: invia il reset via Shopify
 * Se non registrata: ritorna errore specifico
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CustomerDAO } from '@/dao/customer.dao'
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
  const genericOk = NextResponse.json({
    ok: true,
    message: 'If this email is registered, you will receive a password reset link.',
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

    // Valida email format
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'INVALID_EMAIL',
          message: 'Invalid email address.',
        },
        { status: 400 },
      )
    }

    // Verifica che l'email sia registrata
    try {
      const customer = await CustomerDAO.getByEmail(normalizedEmail)
      if (!customer) {
        return NextResponse.json(
          {
            error: 'EMAIL_NOT_FOUND',
            message: 'This email address is not registered.',
          },
          { status: 404 },
        )
      }
    } catch (err) {
      // Se Admin API fallisce, ritorna generico
      return NextResponse.json(
        {
          error: 'SERVICE_ERROR',
          message: 'We could not verify this email address. Please try again.',
        },
        { status: 500 },
      )
    }

    // Email è registrata — procedi con il reset
    const { data } = await storefrontFetch<any>({
      query: RECOVER_MUTATION,
      variables: { email: normalizedEmail },
    })

    const errors = data.customerRecover?.customerUserErrors
    if (errors?.length) {
      console.error('[auth/reset] customerRecover userErrors', {
        email: normalizedEmail,
        errors,
      })
    } else {
      console.log('[auth/reset] customerRecover accepted', {
        email: normalizedEmail,
      })
    }

    if (errors?.length) {
      return NextResponse.json(
        {
          error: 'RESET_FAILED',
          message: 'We could not send the password reset email. Please try again.',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'If this email is registered, you will receive a password reset link by email.',
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Server error. Please try again.',
      },
      { status: 500 },
    )
  }
}
