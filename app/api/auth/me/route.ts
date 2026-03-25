/**
 * GET /api/auth/me
 *
 * Restituisce il profilo del cliente autenticato leggendo
 * il cookie HTTP-only e interrogando la Storefront API.
 *
 * By default returns only basic profile data (lightweight).
 * Pass ?include=orders to also fetch order history (heavier query).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCountryByCode, normalizeCountryCode } from '@/lib/customer-market'
import { getCustomerMarketAssignment } from '@/lib/shopify/customer-registration'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import {
  COUNTRY_COOKIE_MAX_AGE,
  CUSTOMER_COUNTRY_COOKIE,
  CUSTOMER_TOKEN_COOKIE,
} from '@/lib/auth/constants'

/** Lightweight profile query — used on every page load */
const CUSTOMER_PROFILE_QUERY = /* gql */ `
  query GetCustomerProfile($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      acceptsMarketing
      createdAt
      defaultAddress {
        id
        address1
        address2
        city
        province
        country
        countryCodeV2
        zip
        phone
      }
    }
  }
`

/** Full query with orders — used only on account pages */
const CUSTOMER_WITH_ORDERS_QUERY = /* gql */ `
  query GetCustomerWithOrders($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      acceptsMarketing
      createdAt
      orders(first: 25, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            name
            processedAt
            financialStatus
            fulfillmentStatus
            currentTotalPrice {
              amount
              currencyCode
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalShippingPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
            shippingAddress {
              firstName
              lastName
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            lineItems(first: 50) {
              edges {
                node {
                  title
                  quantity
                  originalTotalPrice {
                    amount
                    currencyCode
                  }
                  variant {
                    title
                    price {
                      amount
                      currencyCode
                    }
                    image {
                      url
                      altText
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
            successfulFulfillments(first: 5) {
              trackingCompany
              trackingInfo(first: 5) {
                number
                url
              }
            }
            discountApplications(first: 5) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    applicable
                  }
                  value {
                    ... on MoneyV2 {
                      amount
                      currencyCode
                    }
                    ... on PricingPercentageValue {
                      percentage
                    }
                  }
                }
              }
            }
          }
        }
      }
      defaultAddress {
        id
        address1
        address2
        city
        province
        country
        countryCodeV2
        zip
        phone
      }
    }
  }
`

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ customer: null }, { status: 200 })
    }

    // Use full query only when orders are requested (account pages)
    const includeOrders = req.nextUrl.searchParams.get('include') === 'orders'
    const query = includeOrders ? CUSTOMER_WITH_ORDERS_QUERY : CUSTOMER_PROFILE_QUERY

    const { data } = await storefrontFetch<any>({
      query,
      variables: { customerAccessToken: token },
    })

    const raw = data?.customer ?? null

    // Token scaduto o invalido
    if (!raw) {
      const res = NextResponse.json({ customer: null }, { status: 200 })
      res.cookies.delete(CUSTOMER_TOKEN_COOKIE)
      res.cookies.delete(CUSTOMER_COUNTRY_COOKIE)
      return res
    }

    // Keep default profile path fast; resolve market assignment only on account-heavy fetches.
    let marketAssignment = null

    if (includeOrders) {
      try {
        marketAssignment = await getCustomerMarketAssignment(raw.id)
      } catch (marketError) {
        console.error('[auth/me][market-assignment]', marketError)
      }
    }

    const customer = {
      ...raw,
      marketAssignment,
      orders: raw.orders
        ? (raw.orders.edges ?? []).map((e: any) => ({
            ...e.node,
            lineItems: (e.node.lineItems?.edges ?? []).map((li: any) => li.node),
            successfulFulfillments: e.node.successfulFulfillments ?? [],
            discountApplications: (e.node.discountApplications?.edges ?? []).map((d: any) => d.node),
          }))
        : [],
    }

    const res = NextResponse.json({ customer })

    const addressCountryCode = normalizeCountryCode(
      String(raw?.defaultAddress?.countryCodeV2 ?? ''),
    )

    if (addressCountryCode && getCountryByCode(addressCountryCode)) {
      res.cookies.set(CUSTOMER_COUNTRY_COOKIE, addressCountryCode, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COUNTRY_COOKIE_MAX_AGE,
      })
    }

    return res
  } catch (err) {
    console.error('[auth/me]', err)
    return NextResponse.json({ customer: null }, { status: 200 })
  }
}
