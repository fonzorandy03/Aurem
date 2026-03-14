/**
 * Shopify Admin API GraphQL Client
 *
 * Uses the Admin API (not Storefront) for privileged operations:
 * orders, customers, inventory, payments, discounts, shipping, webhooks.
 *
 * Environment variables required:
 *   SHOPIFY_STORE_DOMAIN        — e.g. your-store.myshopify.com
 *   SHOPIFY_ADMIN_ACCESS_TOKEN  — Admin API private app token
 *   SHOPIFY_API_VERSION         — e.g. 2025-07
 */

import { logger } from './logger'
import { RateLimiter } from './rate-limiter'
import { ShopifyAdminError } from './errors'

// ─── Config ──────────────────────────────────────────────────────────────────

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-07'

function getAdminApiUrl(): string {
  if (!STORE_DOMAIN || !ACCESS_TOKEN) {
    throw new Error(
      '[AdminClient] Missing env vars: SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN',
    )
  }
  return `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Shopify Admin API: 1000 points / second (leaky bucket).
// Conservative: 40 req/s with burst of 80.
const rateLimiter = new RateLimiter({ requestsPerSecond: 40, burstLimit: 80 })

// ─── Core Fetch ──────────────────────────────────────────────────────────────

export interface AdminFetchOptions {
  query: string
  variables?: Record<string, unknown>
  /** Optional correlation ID for logging/tracing */
  requestId?: string
}

export interface AdminFetchResult<T> {
  data: T
  extensions?: {
    cost?: {
      requestedQueryCost: number
      actualQueryCost: number
      throttleStatus: {
        maximumAvailable: number
        currentlyAvailable: number
        restoreRate: number
      }
    }
  }
}

export async function adminFetch<T>(
  options: AdminFetchOptions,
): Promise<AdminFetchResult<T>> {
  const { query, variables = {}, requestId = crypto.randomUUID() } = options

  // Wait for rate limiter slot
  await rateLimiter.acquire()

  const start = Date.now()

  try {
    logger.debug(`[AdminClient] [${requestId}] GraphQL request`, {
      query: query.slice(0, 120) + (query.length > 120 ? '...' : ''),
      variables,
    })

    const response = await fetch(getAdminApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ACCESS_TOKEN!,
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({ query, variables }),
      // SSR: no-store for mutations, revalidate for reads (caller decides)
      cache: 'no-store',
    })

    const elapsed = Date.now() - start

    if (!response.ok) {
      const body = await response.text()
      logger.error(`[AdminClient] [${requestId}] HTTP ${response.status}`, { body })
      throw new ShopifyAdminError(
        `HTTP ${response.status}: ${body}`,
        response.status,
        requestId,
      )
    }

    const json = await response.json()

    if (json.errors?.length) {
      logger.error(`[AdminClient] [${requestId}] GraphQL errors`, { errors: json.errors })
      throw new ShopifyAdminError(
        `GraphQL: ${json.errors.map((e: any) => e.message).join('; ')}`,
        422,
        requestId,
        json.errors,
      )
    }

    logger.debug(`[AdminClient] [${requestId}] OK in ${elapsed}ms`, {
      cost: json.extensions?.cost?.actualQueryCost,
    })

    return json as AdminFetchResult<T>
  } catch (error) {
    if (error instanceof ShopifyAdminError) throw error
    logger.error(`[AdminClient] [${requestId}] Unexpected error`, { error })
    throw new ShopifyAdminError(String(error), 500, requestId)
  }
}
