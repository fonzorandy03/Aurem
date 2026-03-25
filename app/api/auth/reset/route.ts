/**
 * POST /api/auth/reset
 *
 * Invia un'email di recupero password tramite Shopify Storefront API.
 * Shopify gestisce interamente la consegna e il link di reset.
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
  const genericOk = NextResponse.json({
    ok: true,
    message: 'Se l\'indirizzo è registrato riceverai un link di reset.',
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

    // Always return a generic response to avoid account enumeration.
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return genericOk
    }

    const { data } = await storefrontFetch<any>({
      query: RECOVER_MUTATION,
      variables: { email: normalizedEmail },
    })

    const errors = data.customerRecover?.customerUserErrors
    if (errors?.length) {
      return genericOk
    }

    return genericOk
  } catch {
    return genericOk
  }
}
