/**
 * storefrontFetch — client leggero per la Shopify Storefront API.
 *
 * Usato dalle API route server-side (/api/auth/*).
 * Non usa NEXT_PUBLIC_* per evitare esposizione lato client accidentale.
 */

import { parseShopifyDomain } from '@/lib/shopify/parse-shopify-domain'

const rawDomain =
  process.env.SHOPIFY_STORE_DOMAIN ??
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ??
  ''

const STORE_DOMAIN = rawDomain ? parseShopifyDomain(rawDomain) : ''

const STOREFRONT_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ??
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ??
  ''

const API_URL = `https://${STORE_DOMAIN}/api/2025-07/graphql.json`
const STOREFRONT_TIMEOUT_MS = 12_000

export async function storefrontFetch<T>({
  query,
  variables = {},
}: {
  query: string
  variables?: Record<string, unknown>
}): Promise<{ data: T }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), STOREFRONT_TIMEOUT_MS)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `Shopify Storefront API error ${res.status}: ${body}`,
      )
    }

    const json = await res.json()

    if (json.errors?.length) {
      throw new Error(
        `Shopify Storefront GraphQL errors: ${JSON.stringify(json.errors)}`,
      )
    }

    return { data: json.data }
  } finally {
    clearTimeout(timeoutId)
  }
}
