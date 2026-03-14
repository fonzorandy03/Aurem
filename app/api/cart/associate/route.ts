/**
 * POST /api/cart/associate
 *
 * Associates the current Shopify cart with the logged-in customer by:
 *  1. Reading the HTTP-only customer token from the cookie
 *  2. Fetching the customer email from Shopify (server-side, not trusted from client)
 *  3. Calling cartBuyerIdentityUpdate with { customerAccessToken, email }
 *
 * Returns { ok: true, checkoutUrl } on success so the caller can redirect.
 *
 * Body: { cartId: string }
 * Cookie: aurem_customer_token (HTTP-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CUSTOMER_TOKEN_COOKIE } from '@/lib/auth/constants'

const GET_CUSTOMER_EMAIL = /* gql */ `
  query getCustomerEmail($token: String!) {
    customer(customerAccessToken: $token) {
      email
    }
  }
`

const BUYER_IDENTITY_MUTATION = /* gql */ `
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
        checkoutUrl
      }
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

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      )
    }

    const { cartId } = await req.json()

    if (!cartId || typeof cartId !== 'string') {
      return NextResponse.json(
        { error: 'cartId is required' },
        { status: 400 },
      )
    }

    // Fetch the customer email from Shopify using the server-side token.
    // This prevents a client from spoofing another user's email.
    const { data: customerData } = await storefrontFetch<{
      customer: { email: string } | null
    }>({
      query: GET_CUSTOMER_EMAIL,
      variables: { token },
    })

    const email = customerData.customer?.email

    // Attach both customerAccessToken and email to the buyer identity.
    // With both set, Shopify definitively links the resulting order to
    // the correct customer account rather than treating it as a guest order.
    const buyerIdentity: Record<string, string> = { customerAccessToken: token }
    if (email) buyerIdentity.email = email

    const { data } = await storefrontFetch<any>({
      query: BUYER_IDENTITY_MUTATION,
      variables: { cartId, buyerIdentity },
    })

    const { cart, userErrors } = data.cartBuyerIdentityUpdate

    if (userErrors?.length) {
      console.error('[cart/associate] userErrors:', userErrors)
      return NextResponse.json(
        { error: userErrors[0].message },
        { status: 422 },
      )
    }

    return NextResponse.json({ ok: true, checkoutUrl: cart?.checkoutUrl ?? null, email: email ?? null })
  } catch (err) {
    console.error('[cart/associate]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
