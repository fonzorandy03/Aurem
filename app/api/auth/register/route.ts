/**
 * POST /api/auth/register
 *
 * Crea un nuovo account cliente su Shopify e, se il flag autoLogin è true,
 * effettua il login automatico emettendo il cookie di sessione.
 *
 * Sicurezza:
 * - La password non viene mai loggata
 * - Validazione minima lato server (Shopify valida in modo completo)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getMarketForCountry,
  validateCustomerRegistrationInput,
} from '@/lib/customer-market'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import {
  COOKIE_MAX_AGE,
  COUNTRY_COOKIE_MAX_AGE,
  CUSTOMER_COUNTRY_COOKIE,
  CUSTOMER_TOKEN_COOKIE,
} from '@/lib/auth/constants'
import {
  createCustomerDefaultAddress,
  saveCustomerMarketAssignment,
} from '@/lib/shopify/customer-registration'
import { sendAccountWelcomeEmail } from '@/lib/email/account'
import {
  consumeRateLimit,
  getClientIp,
  normalizeEmail,
  tooManyRequestsResponse,
} from '@/lib/security/request-guard'

const REGISTER_MUTATION = /* gql */ `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`

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
    const rawInput = await req.json()
    const validation = validateCustomerRegistrationInput(rawInput)

    const ip = getClientIp(req)
    const limit = consumeRateLimit({
      bucket: 'auth-register',
      key: `${ip}:${normalizeEmail((rawInput as Record<string, unknown>)?.email) || 'unknown-email'}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })

    if (!limit.ok) {
      return tooManyRequestsResponse(limit.retryAfterSeconds)
    }

    if (!validation.data) {
      return NextResponse.json(
        { error: validation.error ?? 'Registration data is invalid.' },
        { status: 400 },
      )
    }

    const input = validation.data
    const market = getMarketForCountry(input.countryCode)

    // 1. Crea il cliente
    const { data: registerData } = await storefrontFetch<any>({
      query: REGISTER_MUTATION,
      variables: {
        input: {
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          acceptsMarketing: input.acceptsMarketing,
        },
      },
    })

    const { customer, customerUserErrors: regErrors } =
      registerData.customerCreate

    if (regErrors?.length) {
      return NextResponse.json({ error: regErrors[0].message }, { status: 422 })
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Impossibile creare l\'account.' },
        { status: 500 },
      )
    }

    // 2. Login automatico dopo la registrazione
    const { data: loginData } = await storefrontFetch<any>({
      query: LOGIN_MUTATION,
      variables: { input: { email: input.email, password: input.password } },
    })

    const { customerAccessToken, customerUserErrors: loginErrors } =
      loginData.customerAccessTokenCreate

    if (loginErrors?.length) {
      return NextResponse.json({ error: loginErrors[0].message }, { status: 422 })
    }

    if (!customerAccessToken?.accessToken) {
      return NextResponse.json(
        { error: 'Account created, but automatic sign-in failed. Please sign in manually.' },
        { status: 422 },
      )
    }

    let setupCompleted = true
    try {
      await createCustomerDefaultAddress(customerAccessToken.accessToken, input)
      await saveCustomerMarketAssignment({
        customerId: customer.id,
        market,
        countryCode: input.countryCode,
      })
    } catch (setupError) {
      setupCompleted = false
      console.warn('[auth/register/setup] non-blocking setup failed', setupError)
    }

    void sendAccountWelcomeEmail(customer.email, customer.firstName)
      .then((emailResult) => {
        if (emailResult.status === 'skipped' && process.env.NODE_ENV !== 'production') {
          console.warn('[auth/register/welcome-email] skipped:', emailResult.reason)
        } else if (emailResult.status === 'sent') {
          console.log('[auth/register/welcome-email] sent successfully', { to: customer.email, emailId: emailResult.id })
        }
      })
      .catch((emailError) => {
        console.error('[auth/register/welcome-email] failed', emailError)
      })

    const res = NextResponse.json({
      ok: true,
      customer,
      marketAssignment: {
        market,
        countryCode: input.countryCode,
      },
      setupCompleted,
    })

    if (customerAccessToken?.accessToken) {
      res.cookies.set(CUSTOMER_TOKEN_COOKIE, customerAccessToken.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })

      res.cookies.set(CUSTOMER_COUNTRY_COOKIE, input.countryCode, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COUNTRY_COOKIE_MAX_AGE,
      })
    }

    return res
  } catch (err) {
    console.error('[auth/register]', err)
    return NextResponse.json(
      { error: 'Errore interno del server.' },
      { status: 500 },
    )
  }
}
