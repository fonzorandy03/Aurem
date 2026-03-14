/**
 * GET /api/search?q=<query>&first=<n>&after=<cursor>
 *
 * Server-side Shopify Storefront API search endpoint.
 * Called exclusively by SearchBar / search results page.
 * Never exposes SHOPIFY_STOREFRONT_ACCESS_TOKEN to the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'

/* ─── In-memory cache ────────────────────────────────────────────────────── */
// Keyed by `${query}:${first}:${after}`. TTL: 60 s.
const CACHE_TTL_MS = 60_000
const cache = new Map<string, { ts: number; data: unknown }>()

function getCache(key: string): unknown | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > CACHE_TTL_MS) { cache.delete(key); return null }
  return hit.data
}
function setCache(key: string, data: unknown) {
  // Evict if too large (> 200 entries)
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(key, { ts: Date.now(), data })
}

/* ─── Simple per-IP throttle ─────────────────────────────────────────────── */
const RATE_WINDOW_MS = 10_000  // 10 s window
const RATE_LIMIT     = 15       // max 15 requests per window
const rateMap = new Map<string, { count: number; reset: number }>()

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

/* ─── GraphQL query ──────────────────────────────────────────────────────── */
const SEARCH_QUERY = /* graphql */ `
  query SearchProducts($query: String!, $first: Int!, $after: String) {
    products(query: $query, first: $first, after: $after, sortKey: RELEVANCE) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          availableForSale
          productType
          vendor
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`

/* ─── Types ──────────────────────────────────────────────────────────────── */
export interface SearchProduct {
  id: string
  title: string
  handle: string
  availableForSale: boolean
  productType: string
  vendor: string
  image: { url: string; altText: string | null } | null
  price: { min: string; max: string; currency: string }
}

interface ShopifySearchResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    edges: Array<{
      node: {
        id: string
        title: string
        handle: string
        availableForSale: boolean
        productType: string
        vendor: string
        featuredImage: { url: string; altText: string | null } | null
        priceRange: {
          minVariantPrice: { amount: string; currencyCode: string }
          maxVariantPrice: { amount: string; currencyCode: string }
        }
      }
    }>
  }
}

/* ─── Client-side ranking (returned pre-sorted) ─────────────────────────── */
// Prioritises: exact title > title contains > handle > vendor > productType
function rankResults(products: SearchProduct[], q: string): SearchProduct[] {
  const ql = q.toLowerCase()
  const score = (p: SearchProduct): number => {
    const t = p.title.toLowerCase()
    if (t === ql)                return 100
    if (t.startsWith(ql))       return 80
    if (t.includes(ql))         return 60
    if (p.handle.includes(ql))  return 40
    if (p.vendor.toLowerCase().includes(ql)) return 20
    if (p.productType.toLowerCase().includes(ql)) return 10
    return 0
  }
  return [...products].sort((a, b) => score(b) - score(a))
}

/* ─── Input sanitisation ─────────────────────────────────────────────────── */
function sanitize(raw: string): string {
  return raw.trim().slice(0, 200).replace(/[<>"'&]/g, '')
}

/* ─── Route handler ──────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl
  const rawQ  = searchParams.get('q') ?? ''
  const first = Math.min(parseInt(searchParams.get('first') ?? '8', 10), 50)
  const after = searchParams.get('after') ?? undefined

  const q = sanitize(rawQ)
  if (q.length < 2) {
    return NextResponse.json({ products: [], pageInfo: { hasNextPage: false, endCursor: null } })
  }

  // Cache check
  const cacheKey = `${q}:${first}:${after ?? ''}`
  const cached = getCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'private, max-age=60' },
    })
  }

  try {
    const { data } = await storefrontFetch<ShopifySearchResponse>({
      query: SEARCH_QUERY,
      variables: { query: q, first, after: after ?? null },
    })

    const products: SearchProduct[] = data.products.edges.map(({ node }) => ({
      id:             node.id,
      title:          node.title,
      handle:         node.handle,
      availableForSale: node.availableForSale,
      productType:    node.productType ?? '',
      vendor:         node.vendor ?? '',
      image:          node.featuredImage
        ? { url: node.featuredImage.url, altText: node.featuredImage.altText }
        : null,
      price: {
        min:      node.priceRange.minVariantPrice.amount,
        max:      node.priceRange.maxVariantPrice.amount,
        currency: node.priceRange.minVariantPrice.currencyCode,
      },
    }))

    const ranked = rankResults(products, q)
    const result = { products: ranked, pageInfo: data.products.pageInfo }

    setCache(cacheKey, result)

    return NextResponse.json(result, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'private, max-age=60' },
    })
  } catch (err) {
    console.error('[/api/search]', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
