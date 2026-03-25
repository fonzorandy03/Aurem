/**
 * POST /api/auth/login
 *
 * Autentica un cliente tramite Shopify Storefront API.
 * In caso di successo emette un cookie HTTP-only con l'access token.
 *
 * Sicurezza:
 * - Cookie: httpOnly, secure (in produzione), sameSite=lax, path=/
 * - Il token Shopify scade di default dopo 24 h (configurabile nel dashboard)
 * - Nessuna credenziale viene loggata
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CUSTOMER_TOKEN_COOKIE, COOKIE_MAX_AGE } from '@/lib/auth/constants'
import {
  consumeRateLimit,
  getClientIp,
  normalizeEmail,
  tooManyRequestsResponse,
} from '@/lib/security/request-guard'

const LOGIN_MUTATION = /* gql */ `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
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
    const { email, password } = await req.json()
    const normalizedEmail = normalizeEmail(email)

    const ip = getClientIp(req)
    const limit = consumeRateLimit({
      bucket: 'auth-login',
      key: `${ip}:${normalizedEmail || 'unknown-email'}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    })

    if (!limit.ok) {
      return tooManyRequestsResponse(limit.retryAfterSeconds)
    }

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori.' },
        { status: 400 },
      )
    }

    const { data } = await storefrontFetch<any>({
      query: LOGIN_MUTATION,
      variables: { input: { email: normalizedEmail, password } },
    })

    const { customerAccessToken, customerUserErrors } =
      data.customerAccessTokenCreate

    if (customerUserErrors?.length) {
      return NextResponse.json({ error: 'Credenziali non valide.' }, { status: 401 })
    }

    if (!customerAccessToken?.accessToken) {
      return NextResponse.json(
        { error: 'Credenziali non valide.' },
        { status: 401 },
      )
    }

    const res = NextResponse.json({ ok: true })

    res.cookies.set(CUSTOMER_TOKEN_COOKIE, customerAccessToken.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return res
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json(
      { error: 'Errore interno del server.' },
      { status: 500 },
    )
  }
}
