/**
 * PaymentDAO
 *
 * Manages Shopify order transactions and refunds.
 * Payments are always connected to an Order — there is no
 * standalone Payment entity in the Shopify Admin API.
 *
 * For Shopify Payments extended data use the Balance API
 * (separate REST endpoint, not modelled here).
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { Transaction, RefundInput } from './interfaces'

// ─── Fragment ────────────────────────────────────────────────────────────────

const TRANSACTION_FRAGMENT = /* gql */ `
  fragment TransactionFields on OrderTransaction {
    id
    kind
    status
    amountSet { shopMoney { amount currencyCode } }
    gateway
    paymentId
    errorCode
    createdAt
    order { id }
  }
`

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapTransaction(node: any): Transaction {
  return {
    id: node.id,
    orderId: node.order?.id ?? '',
    kind: node.kind,
    status: node.status,
    amount: node.amountSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    gateway: node.gateway ?? '',
    paymentId: node.paymentId ?? null,
    errorCode: node.errorCode ?? null,
    createdAt: node.createdAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const PaymentDAO = {
  /** All transactions for an order (authorizations, captures, refunds). */
  async getAll(orderId: string): Promise<Transaction[]> {
    const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`

    const query = /* gql */ `
      ${TRANSACTION_FRAGMENT}
      query GetTransactions($id: ID!) {
        order(id: $id) {
          transactions {
            ...TransactionFields
          }
        }
      }
    `

    logger.info('[PaymentDAO] getAll', { orderId: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.order) throw new NotFoundError('Order', orderId)

    return (data.order.transactions ?? []).map(mapTransaction)
  },

  /** Get a single transaction by ID. */
  async getById(transactionId: string): Promise<Transaction> {
    // Shopify doesn't have a standalone getTransaction query;
    // we derive orderId from the GID and fetch all transactions.
    if (!transactionId.startsWith('gid://shopify/OrderTransaction/')) {
      throw new ValidationError('transactionId must be a valid Shopify GID', 'transactionId')
    }

    // Extract orderId from transaction GID context is unavailable here;
    // callers should use getAll(orderId) instead.
    throw new ValidationError(
      'getById is not supported for Transactions — use getAll(orderId) instead.',
    )
  },

  /**
   * Void an authorization (before capture).
   * Only valid for transactions with kind=AUTHORIZATION and status=SUCCESS.
   */
  async void(orderId: string, parentTransactionId: string): Promise<Transaction> {
    const orderGid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`

    const mutation = /* gql */ `
      ${TRANSACTION_FRAGMENT}
      mutation VoidTransaction($input: OrderTransactionInput!) {
        orderTransactionCreate(input: $input) {
          transaction { ...TransactionFields }
          userErrors { field message }
        }
      }
    `

    logger.warn('[PaymentDAO] void', { orderId: orderGid, parentTransactionId })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { input: { orderId: orderGid, kind: 'VOID', parentId: parentTransactionId } },
    })

    const { transaction, userErrors } = data.orderTransactionCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapTransaction(transaction)
  },

  /**
   * Issue a refund for an order.
   * Partial refund: specify amount and/or refundLineItems.
   * Full refund: omit amount.
   */
  async refund(input: RefundInput): Promise<void> {
    const orderGid = input.orderId.startsWith('gid://')
      ? input.orderId
      : `gid://shopify/Order/${input.orderId}`

    const mutation = /* gql */ `
      mutation RefundOrder($input: RefundInput!) {
        refundCreate(input: $input) {
          refund {
            id
            createdAt
            totalRefundedSet { shopMoney { amount currencyCode } }
          }
          userErrors { field message }
        }
      }
    `

    logger.warn('[PaymentDAO] refund', { orderId: orderGid, amount: input.amount ?? 'full' })

    const refundInput = {
      orderId: orderGid,
      note: input.note,
      ...(input.amount && { transactions: [{ amount: input.amount, kind: 'REFUND', gateway: 'shopify_payments' }] }),
      ...(input.refundLineItems && { refundLineItems: input.refundLineItems }),
    }

    const { data } = await adminFetch<any>({ query: mutation, variables: { input: refundInput } })

    const { userErrors } = data.refundCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
  },

  /** Payments are immutable — create() creates a capture transaction. */
  async capture(orderId: string, parentTransactionId: string, amount?: string): Promise<Transaction> {
    const orderGid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`

    const mutation = /* gql */ `
      ${TRANSACTION_FRAGMENT}
      mutation CapturePayment($input: OrderTransactionInput!) {
        orderTransactionCreate(input: $input) {
          transaction { ...TransactionFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[PaymentDAO] capture', { orderId: orderGid, amount: amount ?? 'full' })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { input: { orderId: orderGid, kind: 'CAPTURE', parentId: parentTransactionId, ...(amount && { amount }) } },
    })

    const { transaction, userErrors } = data.orderTransactionCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapTransaction(transaction)
  },

  /** Transactions cannot be updated or deleted — they are immutable financial records. */
  update: undefined,
  delete: undefined,
}
