/**
 * POST /api/auth/logout
 *
 * Invalida il token su Shopify e cancella il cookie di sessione.
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CUSTOMER_TOKEN_COOKIE } from '@/lib/auth/constants'

const DELETE_TOKEN_MUTATION = /* gql */ `
  mutation CustomerAccessTokenDelete($customerAccessToken: String!) {
    customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
      deletedAccessToken
      userErrors {
        field
        message
      }
    }
  }
`

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value

    if (token) {
      // Invalida il token anche lato Shopify (fire-and-forget)
      storefrontFetch<any>({
        query: DELETE_TOKEN_MUTATION,
        variables: { customerAccessToken: token },
      }).catch(() => {})
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.delete(CUSTOMER_TOKEN_COOKIE)
    return res
  } catch (err) {
    console.error('[auth/logout]', err)
    return NextResponse.json(
      { error: 'Errore interno del server.' },
      { status: 500 },
    )
  }
}
