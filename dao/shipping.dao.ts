/**
 * ShippingDAO
 *
 * Manages Shopify shipping zones, rates, and fulfillments.
 *
 * Shipping zones and rates are read-only via GraphQL Admin API.
 * Fulfillment creation uses the FulfillmentOrder workflow.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { ShippingZone, Fulfillment, CreateFulfillmentInput } from './interfaces'

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapZone(node: any): ShippingZone {
  return {
    id: node.id,
    name: node.name,
    countries: (node.countries ?? []).map((c: any) => ({
      code: c.code.countryCode,
      name: c.name,
    })),
    shippingRates: (node.shippingRates ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      price: r.price ?? { amount: '0', currencyCode: 'EUR' },
      weightConditionMin: r.weightConditions?.minimum?.value ?? null,
      weightConditionMax: r.weightConditions?.maximum?.value ?? null,
      priceConditionMin: r.priceCondition?.minimum?.value ?? null,
      priceConditionMax: r.priceCondition?.maximum?.value ?? null,
    })),
  }
}

function mapFulfillment(node: any): Fulfillment {
  return {
    id: node.id,
    orderId: node.order?.id ?? '',
    status: node.status,
    trackingCompany: node.trackingInfo?.[0]?.company ?? null,
    trackingNumbers: (node.trackingInfo ?? []).map((t: any) => t.number).filter(Boolean),
    trackingUrls: (node.trackingInfo ?? []).map((t: any) => t.url).filter(Boolean),
    lineItems: (node.fulfillmentLineItems?.edges ?? []).map((e: any) => ({
      id: e.node.lineItem?.id ?? '',
      title: e.node.lineItem?.title ?? '',
      quantity: e.node.quantity,
      sku: e.node.lineItem?.sku ?? null,
      variantId: e.node.lineItem?.variant?.id ?? null,
      price: { amount: '0', currencyCode: 'EUR' },
      totalDiscount: { amount: '0', currencyCode: 'EUR' },
      image: null,
    })),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const ShippingDAO = {
  /** List all shipping zones configured in the store. */
  async getAll(): Promise<ShippingZone[]> {
    const query = /* gql */ `
      query GetShippingZones {
        deliveryProfiles(first: 30) {
          edges {
            node {
              id
              name
              profileLocationGroups {
                locationGroupZones(first: 50) {
                  edges {
                    node {
                      zone {
                        id
                        name
                        countries {
                          name
                          code { countryCode }
                        }
                        shippingRates {
                          id
                          name
                          price { amount currencyCode }
                          weightConditions {
                            minimum { value }
                            maximum { value }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    logger.info('[ShippingDAO] getAll')

    const { data } = await adminFetch<any>({ query })

    const zones: ShippingZone[] = []
    for (const profile of data.deliveryProfiles?.edges ?? []) {
      for (const group of profile.node?.profileLocationGroups ?? []) {
        for (const edge of group.locationGroupZones?.edges ?? []) {
          zones.push(mapZone(edge.node.zone))
        }
      }
    }
    return zones
  },

  async getById(id: string): Promise<ShippingZone> {
    const zones = await ShippingDAO.getAll()
    const zone = zones.find(z => z.id === id || z.id.endsWith(`/${id}`))
    if (!zone) throw new NotFoundError('ShippingZone', id)
    return zone
  },

  /** Shipping zones are managed from the Shopify admin UI. Create not exposed. */
  create: undefined,
  update: undefined,
  delete: undefined,

  // ─── Fulfillments ──────────────────────────────────────────────────────────

  /** Get all fulfillments for an order. */
  async getFulfillments(orderId: string): Promise<Fulfillment[]> {
    const gid = orderId.startsWith('gid://') ? orderId : `gid://shopify/Order/${orderId}`

    const query = /* gql */ `
      query GetFulfillments($id: ID!) {
        order(id: $id) {
          fulfillments(first: 20) {
            id
            status
            createdAt
            updatedAt
            order { id }
            trackingInfo { company number url }
            fulfillmentLineItems(first: 50) {
              edges {
                node {
                  quantity
                  lineItem { id title sku variant { id } }
                }
              }
            }
          }
        }
      }
    `

    logger.info('[ShippingDAO] getFulfillments', { orderId: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.order) throw new NotFoundError('Order', orderId)

    return (data.order.fulfillments ?? []).map(mapFulfillment)
  },

  /** Create a fulfillment for an order (ship items). */
  async createFulfillment(input: CreateFulfillmentInput): Promise<Fulfillment> {
    if (!input.orderId) throw new ValidationError('orderId is required', 'orderId')
    if (!input.lineItems?.length) throw new ValidationError('lineItems cannot be empty', 'lineItems')

    const orderGid = input.orderId.startsWith('gid://')
      ? input.orderId
      : `gid://shopify/Order/${input.orderId}`

    // Step 1: get fulfillment order ID
    const foQuery = /* gql */ `
      query GetFulfillmentOrders($id: ID!) {
        order(id: $id) {
          fulfillmentOrders(first: 1) {
            edges { node { id } }
          }
        }
      }
    `

    const { data: foData } = await adminFetch<any>({ query: foQuery, variables: { id: orderGid } })
    const fulfillmentOrderId = foData.order?.fulfillmentOrders?.edges?.[0]?.node?.id

    if (!fulfillmentOrderId) throw new NotFoundError('FulfillmentOrder', orderGid)

    // Step 2: create the fulfillment
    const mutation = /* gql */ `
      mutation CreateFulfillment($fulfillment: FulfillmentInput!) {
        fulfillmentCreate(fulfillment: $fulfillment) {
          fulfillment {
            id
            status
            createdAt
            updatedAt
            order { id }
            trackingInfo { company number url }
            fulfillmentLineItems(first: 50) {
              edges {
                node {
                  quantity
                  lineItem { id title sku variant { id } }
                }
              }
            }
          }
          userErrors { field message }
        }
      }
    `

    const fulfillmentInput = {
      lineItemsByFulfillmentOrder: [{
        fulfillmentOrderId,
        fulfillmentOrderLineItems: input.lineItems.map(li => ({
          id: li.id,
          quantity: li.quantity,
        })),
      }],
      ...(input.trackingCompany && {
        trackingInfo: {
          company: input.trackingCompany,
          number: input.trackingNumber ?? '',
        },
      }),
      notifyCustomer: input.notifyCustomer ?? true,
    }

    logger.info('[ShippingDAO] createFulfillment', { orderId: orderGid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { fulfillment: fulfillmentInput } })

    const { fulfillment, userErrors } = data.fulfillmentCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapFulfillment(fulfillment)
  },
}
