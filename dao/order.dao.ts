/**
 * OrderDAO
 *
 * Manages Shopify orders. Orders are connected to payments via
 * transactions and to fulfillments via the FulfillmentOrder API.
 *
 * NOTE: Order creation via API creates "custom" orders (no checkout flow).
 * For storefront orders use the Storefront Cart/Checkout API.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type {
  Order,
  CreateOrderInput,
  PaginatedResult,
  OrderFinancialStatus,
  OrderFulfillmentStatus,
} from './interfaces'

// ─── Fragment ────────────────────────────────────────────────────────────────

const ORDER_FRAGMENT = /* gql */ `
  fragment OrderFields on Order {
    id
    name
    email
    phone
    financialStatus
    fulfillmentStatus
    note
    tags
    cancelledAt
    closedAt
    createdAt
    updatedAt
    subtotalPriceSet { shopMoney { amount currencyCode } }
    totalDiscountsSet { shopMoney { amount currencyCode } }
    totalShippingPriceSet { shopMoney { amount currencyCode } }
    totalTaxSet { shopMoney { amount currencyCode } }
    totalPriceSet { shopMoney { amount currencyCode } }
    customer { id }
    shippingAddress {
      id firstName lastName company
      address1 address2 city province country zip phone
    }
    billingAddress {
      id firstName lastName company
      address1 address2 city province country zip phone
    }
    lineItems(first: 50) {
      edges {
        node {
          id
          title
          quantity
          sku
          variant { id }
          originalUnitPriceSet { shopMoney { amount currencyCode } }
          discountedTotalSet { shopMoney { amount currencyCode } }
          image { id url altText width height }
        }
      }
    }
  }
`

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapOrder(node: any): Order {
  return {
    id: node.id,
    name: node.name,
    email: node.email ?? null,
    phone: node.phone ?? null,
    financialStatus: node.financialStatus as OrderFinancialStatus,
    fulfillmentStatus: node.fulfillmentStatus as OrderFulfillmentStatus,
    note: node.note ?? null,
    tags: node.tags ?? [],
    cancelledAt: node.cancelledAt ?? null,
    closedAt: node.closedAt ?? null,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    subtotalPrice: node.subtotalPriceSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    totalDiscounts: node.totalDiscountsSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    totalShippingPrice: node.totalShippingPriceSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    totalTax: node.totalTaxSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    totalPrice: node.totalPriceSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
    customerId: node.customer?.id ?? null,
    shippingAddress: node.shippingAddress ?? null,
    billingAddress: node.billingAddress ?? null,
    lineItems: (node.lineItems?.edges ?? []).map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      quantity: e.node.quantity,
      sku: e.node.sku ?? null,
      variantId: e.node.variant?.id ?? null,
      price: e.node.originalUnitPriceSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
      totalDiscount: e.node.discountedTotalSet?.shopMoney ?? { amount: '0', currencyCode: 'EUR' },
      image: e.node.image
        ? { id: e.node.image.id, url: e.node.image.url, altText: e.node.image.altText ?? null,
            width: e.node.image.width ?? null, height: e.node.image.height ?? null, position: 0 }
        : null,
    })),
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const OrderDAO = {
  async getAll(options?: {
    first?: number
    after?: string
    /** Shopify order query string, e.g. 'financial_status:paid' */
    filter?: string
  }): Promise<PaginatedResult<Order>> {
    const { first = 50, after, filter } = options ?? {}

    const query = /* gql */ `
      ${ORDER_FRAGMENT}
      query GetOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          edges { node { ...OrderFields } }
        }
      }
    `

    logger.info('[OrderDAO] getAll', { first, filter })

    const { data } = await adminFetch<any>({ query, variables: { first, after: after ?? null, query: filter ?? null } })

    return {
      items: data.orders.edges.map((e: any) => mapOrder(e.node)),
      pageInfo: data.orders.pageInfo,
    }
  },

  async getById(id: string): Promise<Order> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Order/${id}`

    const query = /* gql */ `
      ${ORDER_FRAGMENT}
      query GetOrder($id: ID!) {
        order(id: $id) { ...OrderFields }
      }
    `

    logger.info('[OrderDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.order) throw new NotFoundError('Order', id)

    return mapOrder(data.order)
  },

  async getByCustomer(customerId: string, first = 50): Promise<PaginatedResult<Order>> {
    const gid = customerId.startsWith('gid://') ? customerId : `gid://shopify/Customer/${customerId}`
    return OrderDAO.getAll({ first, filter: `customer_id:${gid}` })
  },

  async getByFinancialStatus(status: OrderFinancialStatus, first = 50): Promise<PaginatedResult<Order>> {
    return OrderDAO.getAll({ first, filter: `financial_status:${status.toLowerCase()}` })
  },

  /**
   * Create a draft order (requires manual payment capture or auto-complete).
   * For real storefront orders use the Checkout/CartAPI.
   */
  async create(input: CreateOrderInput): Promise<Order> {
    if (!input.lineItems?.length) throw new ValidationError('lineItems cannot be empty', 'lineItems')

    const mutation = /* gql */ `
      ${ORDER_FRAGMENT}
      mutation CreateDraftOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            order { ...OrderFields }
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[OrderDAO] create', { lineItemCount: input.lineItems.length })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input } })

    const { draftOrder, userErrors } = data.draftOrderCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    if (!draftOrder?.order) throw new ValidationError('Draft order was created but has no completed order reference')

    return mapOrder(draftOrder.order)
  },

  async update(id: string, fields: { note?: string; tags?: string[] }): Promise<Order> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Order/${id}`

    const mutation = /* gql */ `
      ${ORDER_FRAGMENT}
      mutation UpdateOrder($input: OrderInput!) {
        orderUpdate(input: $input) {
          order { ...OrderFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[OrderDAO] update', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input: { id: gid, ...fields } } })

    const { order, userErrors } = data.orderUpdate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapOrder(order)
  },

  /** Cancel an order. Orders cannot be permanently deleted via API. */
  async cancel(id: string, reason = 'CUSTOMER'): Promise<Order> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Order/${id}`

    const mutation = /* gql */ `
      ${ORDER_FRAGMENT}
      mutation CancelOrder($id: ID!, $reason: OrderCancelReason) {
        orderCancel(orderId: $id, reason: $reason, refund: true, restock: true) {
          order { ...OrderFields }
          userErrors { field message }
        }
      }
    `

    logger.warn('[OrderDAO] cancel', { id: gid, reason })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: gid, reason } })

    const { order, userErrors } = data.orderCancel
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapOrder(order)
  },

  /** delete() is not available — orders are immutable records. Use cancel(). */
  delete(_id: string): never {
    throw new ValidationError('Orders cannot be deleted. Use cancel() instead.')
  },
}
