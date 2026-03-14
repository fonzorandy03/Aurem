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
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CUSTOMER_TOKEN_COOKIE, COOKIE_MAX_AGE } from '@/lib/auth/constants'

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
    const { email, password, firstName, lastName, acceptsMarketing = false } =
      await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori.' },
        { status: 400 },
      )
    }

    // 1. Crea il cliente
    const { data: registerData } = await storefrontFetch<any>({
      query: REGISTER_MUTATION,
      variables: {
        input: { email, password, firstName, lastName, acceptsMarketing },
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
      variables: { input: { email, password } },
    })

    const { customerAccessToken } = loginData.customerAccessTokenCreate

    const res = NextResponse.json({ ok: true, customer })

    if (customerAccessToken?.accessToken) {
      res.cookies.set(CUSTOMER_TOKEN_COOKIE, customerAccessToken.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
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
