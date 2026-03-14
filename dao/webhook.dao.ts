/**
 * WebhookDAO
 *
 * Manages Shopify webhook subscriptions and handles incoming webhook
 * verification using HMAC-SHA256.
 *
 * SECURITY: All incoming webhook requests MUST be verified before
 * processing. Never process a payload that fails verification.
 *
 * Environment variables required:
 *   SHOPIFY_WEBHOOK_SECRET — from Partner Dashboard > App > Webhooks
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError, WebhookVerificationError } from './core/errors'
import type { Webhook, CreateWebhookInput, WebhookTopic } from './interfaces'

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapWebhook(node: any): Webhook {
  return {
    id: node.id,
    topic: node.topic as WebhookTopic,
    callbackUrl: node.callbackUrl,
    format: node.format ?? 'JSON',
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const WebhookDAO = {
  async getAll(): Promise<Webhook[]> {
    const query = /* gql */ `
      query GetWebhooks {
        webhookSubscriptions(first: 100) {
          edges {
            node {
              id
              topic
              callbackUrl
              format
              createdAt
              updatedAt
            }
          }
        }
      }
    `

    logger.info('[WebhookDAO] getAll')

    const { data } = await adminFetch<any>({ query })
    return (data.webhookSubscriptions?.edges ?? []).map((e: any) => mapWebhook(e.node))
  },

  async getById(id: string): Promise<Webhook> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/WebhookSubscription/${id}`

    const query = /* gql */ `
      query GetWebhook($id: ID!) {
        webhookSubscription(id: $id) {
          id topic callbackUrl format createdAt updatedAt
        }
      }
    `

    logger.info('[WebhookDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.webhookSubscription) throw new NotFoundError('Webhook', id)

    return mapWebhook(data.webhookSubscription)
  },

  async create(input: CreateWebhookInput): Promise<Webhook> {
    if (!input.topic) throw new ValidationError('topic is required', 'topic')
    if (!input.callbackUrl?.startsWith('https://')) {
      throw new ValidationError('callbackUrl must be a valid HTTPS URL', 'callbackUrl')
    }

    const mutation = /* gql */ `
      mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id topic callbackUrl format createdAt updatedAt
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[WebhookDAO] create', { topic: input.topic, callbackUrl: input.callbackUrl })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: {
        topic: input.topic,
        webhookSubscription: {
          callbackUrl: input.callbackUrl,
          format: input.format ?? 'JSON',
        },
      },
    })

    const { webhookSubscription, userErrors } = data.webhookSubscriptionCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapWebhook(webhookSubscription)
  },

  async update(id: string, callbackUrl: string): Promise<Webhook> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/WebhookSubscription/${id}`

    if (!callbackUrl?.startsWith('https://')) {
      throw new ValidationError('callbackUrl must be a valid HTTPS URL', 'callbackUrl')
    }

    const mutation = /* gql */ `
      mutation UpdateWebhook($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id topic callbackUrl format createdAt updatedAt
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[WebhookDAO] update', { id: gid })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { id: gid, webhookSubscription: { callbackUrl } },
    })

    const { webhookSubscription, userErrors } = data.webhookSubscriptionUpdate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapWebhook(webhookSubscription)
  },

  async delete(id: string): Promise<void> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/WebhookSubscription/${id}`

    const mutation = /* gql */ `
      mutation DeleteWebhook($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
          deletedWebhookSubscriptionId
          userErrors { field message }
        }
      }
    `

    logger.warn('[WebhookDAO] delete', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: gid } })

    const { userErrors } = data.webhookSubscriptionDelete
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
  },

  // ─── Security: HMAC Verification ───────────────────────────────────────────

  /**
   * Verify an incoming Shopify webhook request.
   *
   * Shopify sends a HMAC-SHA256 signature in the header:
   *   X-Shopify-Hmac-Sha256: <base64-encoded-signature>
   *
   * This MUST be called before processing any webhook payload.
   * Uses `timingSafeEqual` to prevent timing-based attacks.
   *
   * @throws WebhookVerificationError if the signature is invalid
   */
  verifySignature(rawBody: Buffer | string, hmacHeader: string | null): void {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET

    if (!secret) {
      throw new Error('[WebhookDAO] SHOPIFY_WEBHOOK_SECRET is not configured')
    }

    if (!hmacHeader) {
      logger.warn('[WebhookDAO] verifySignature — missing HMAC header')
      throw new WebhookVerificationError('Missing X-Shopify-Hmac-Sha256 header')
    }

    const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody
    const digest = createHmac('sha256', secret).update(body).digest('base64')

    const digestBuffer = Buffer.from(digest, 'utf8')
    const headerBuffer = Buffer.from(hmacHeader, 'utf8')

    // Buffers must be same length for timingSafeEqual
    if (digestBuffer.length !== headerBuffer.length) {
      logger.warn('[WebhookDAO] verifySignature — length mismatch')
      throw new WebhookVerificationError()
    }

    if (!timingSafeEqual(digestBuffer, headerBuffer)) {
      logger.warn('[WebhookDAO] verifySignature — HMAC mismatch')
      throw new WebhookVerificationError()
    }

    logger.debug('[WebhookDAO] verifySignature — OK')
  },
}
