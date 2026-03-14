/**
 * POST /api/auth/reset
 *
 * Invia un'email di recupero password tramite Shopify Storefront API.
 * Shopify gestisce interamente la consegna e il link di reset.
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'

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
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email obbligatoria.' },
        { status: 400 },
      )
    }

    const { data } = await storefrontFetch<any>({
      query: RECOVER_MUTATION,
      variables: { email },
    })

    const errors = data.customerRecover?.customerUserErrors
    if (errors?.length) {
      return NextResponse.json({ error: errors[0].message }, { status: 422 })
    }

    // Risposta generica per sicurezza (non rivelare se l'email esiste)
    return NextResponse.json({
      ok: true,
      message: 'Se l\'indirizzo è registrato riceverai un link di reset.',
    })
  } catch (err) {
    console.error('[auth/reset]', err)
    return NextResponse.json(
      { error: 'Errore interno del server.' },
      { status: 500 },
    )
  }
}
