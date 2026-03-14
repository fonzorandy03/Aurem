/**
 * Shopify Webhook Endpoint
 * POST /api/webhooks/shopify
 *
 * Receives and verifies all Shopify webhook events.
 * Registration: configure the webhook URL in Shopify Partner Dashboard
 * or use WebhookDAO.create() in a setup script.
 *
 * SECURITY CHECKLIST:
 *  ✅ Raw body read before any JSON parsing (required for HMAC)
 *  ✅ HMAC-SHA256 signature verified before processing
 *  ✅ Timing-safe comparison to prevent timing attacks
 *  ✅ Topic validated and unknown topics ignored
 *  ✅ Error logged but 200 returned to prevent Shopify retry loops
 */

import { NextRequest, NextResponse } from 'next/server'
import { WebhookDAO, OrderDAO, ProductDAO, logger, toErrorResponse } from '@/dao'
import type { WebhookTopic } from '@/dao'

export const runtime = 'nodejs' // Required for crypto buffer operations

// ─── Handlers ────────────────────────────────────────────────────────────────
// Each handler receives the verified parsed payload.

async function handleOrdersPaid(payload: any) {
  const orderId = payload.admin_graphql_api_id
  logger.info('[webhook] ORDERS_PAID received', { orderId, orderName: payload.name })

  // Example: fetch full order and send confirmation email
  const order = await OrderDAO.getById(orderId)
  logger.info('[webhook] order fetched for confirmation', { orderName: order.name, total: order.totalPrice })

  // TODO: trigger email notification, update analytics, etc.
}

async function handleProductsUpdate(payload: any) {
  const productId = payload.admin_graphql_api_id
  logger.info('[webhook] PRODUCTS_UPDATE received', { productId, title: payload.title })

  // Example: invalidate CDN cache, update search index
  // TODO: revalidateTag(productId)
}

async function handleOrdersCancelled(payload: any) {
  const orderId = payload.admin_graphql_api_id
  logger.warn('[webhook] ORDERS_CANCELLED received', { orderId })
  // TODO: trigger cancellation email, restock inventory
}

// ─── Topic Router ─────────────────────────────────────────────────────────────

const HANDLERS: Partial<Record<WebhookTopic, (payload: any) => Promise<void>>> = {
  ORDERS_PAID: handleOrdersPaid,
  ORDERS_CANCELLED: handleOrdersCancelled,
  PRODUCTS_UPDATE: handleProductsUpdate,
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Read raw body BEFORE any JSON parsing (required for HMAC verification)
  const rawBody = await req.arrayBuffer()
  const bodyBuffer = Buffer.from(rawBody)

  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const topic = req.headers.get('x-shopify-topic')?.toUpperCase().replace('/', '_') as WebhookTopic | null
  const shopDomain = req.headers.get('x-shopify-shop-domain')

  logger.debug('[webhook] incoming', { topic, shopDomain })

  // 2. Verify HMAC signature — reject immediately if invalid
  try {
    WebhookDAO.verifySignature(bodyBuffer, hmacHeader)
  } catch {
    logger.warn('[webhook] REJECTED — invalid signature', { topic, shopDomain })
    // Return 401; Shopify will retry. After multiple failures it pauses delivery.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse and dispatch
  let payload: any
  try {
    payload = JSON.parse(bodyBuffer.toString('utf-8'))
  } catch {
    logger.error('[webhook] failed to parse JSON body')
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  if (!topic) {
    logger.warn('[webhook] missing topic header')
    return NextResponse.json({ ok: true }) // Acknowledge unknown events
  }

  const handler = HANDLERS[topic]

  if (!handler) {
    logger.debug('[webhook] unhandled topic — acknowledged', { topic })
    return NextResponse.json({ ok: true })
  }

  try {
    await handler(payload)
  } catch (err) {
    // Log the error but return 200 to prevent Shopify from disabling the webhook
    const errorPayload = toErrorResponse(err)
    logger.error('[webhook] handler error', { topic, error: errorPayload })
    // Returning 200 intentionally — otherwise Shopify retries and may pause delivery
  }

  return NextResponse.json({ ok: true })
}

// Only POST is allowed
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
