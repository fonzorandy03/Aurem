/**
 * DiscountDAO
 *
 * Manages Shopify discount codes and automatic discounts.
 * Supports percentage, fixed-amount, and free-shipping types.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { DiscountCode, CreateDiscountInput, PaginatedResult } from './interfaces'

// ─── Fragment ────────────────────────────────────────────────────────────────

const DISCOUNT_FRAGMENT = /* gql */ `
  fragment DiscountFields on DiscountCodeNode {
    id
    codeDiscount {
      ... on DiscountCodeBasic {
        title
        codes(first: 1) { edges { node { code usageCount } } }
        usageLimit
        startsAt
        endsAt
        status
        customerGets {
          value {
            ... on DiscountPercentage { percentage }
            ... on DiscountAmount { amount { amount currencyCode } }
          }
        }
        customerSelection {
          ... on DiscountCustomers { __typename }
          ... on DiscountCustomerAll { __typename }
        }
        createdAt: startsAt
      }
    }
  }
`

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapDiscount(node: any): DiscountCode {
  const d = node.codeDiscount ?? {}
  const codeEdge = d.codes?.edges?.[0]?.node
  const value = d.customerGets?.value

  let type: DiscountCode['type'] = 'PERCENTAGE'
  let numericValue = 0
  let valueType: DiscountCode['valueType'] = 'PERCENTAGE'

  if (value?.percentage !== undefined) {
    type = 'PERCENTAGE'
    valueType = 'PERCENTAGE'
    numericValue = value.percentage * 100
  } else if (value?.amount) {
    type = 'FIXED_AMOUNT'
    valueType = 'FIXED_AMOUNT'
    numericValue = parseFloat(value.amount.amount)
  }

  return {
    id: node.id,
    title: d.title ?? '',
    code: codeEdge?.code ?? '',
    type,
    value: numericValue,
    valueType,
    usageLimit: d.usageLimit ?? null,
    usageCount: codeEdge?.usageCount ?? 0,
    customerSelection:
      d.customerSelection?.__typename === 'DiscountCustomers' ? 'SPECIFIC' : 'ALL',
    startsAt: d.startsAt ?? new Date().toISOString(),
    endsAt: d.endsAt ?? null,
    status: d.status ?? 'ACTIVE',
    createdAt: d.startsAt ?? new Date().toISOString(),
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const DiscountDAO = {
  async getAll(options?: { first?: number; after?: string }): Promise<PaginatedResult<DiscountCode>> {
    const { first = 50, after } = options ?? {}

    const query = /* gql */ `
      ${DISCOUNT_FRAGMENT}
      query GetDiscounts($first: Int!, $after: String) {
        discountNodes(first: $first, after: $after) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          edges { node { ...DiscountFields } }
        }
      }
    `

    logger.info('[DiscountDAO] getAll', { first })

    const { data } = await adminFetch<any>({ query, variables: { first, after: after ?? null } })

    return {
      items: data.discountNodes.edges.map((e: any) => mapDiscount(e.node)),
      pageInfo: data.discountNodes.pageInfo,
    }
  },

  async getById(id: string): Promise<DiscountCode> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/DiscountCodeNode/${id}`

    const query = /* gql */ `
      ${DISCOUNT_FRAGMENT}
      query GetDiscount($id: ID!) {
        discountNode(id: $id) { ...DiscountFields }
      }
    `

    logger.info('[DiscountDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.discountNode) throw new NotFoundError('Discount', id)

    return mapDiscount(data.discountNode)
  },

  /** Create a basic discount code (percentage or fixed amount). */
  async create(input: CreateDiscountInput): Promise<DiscountCode> {
    if (!input.code?.trim()) throw new ValidationError('code is required', 'code')
    if (!input.title?.trim()) throw new ValidationError('title is required', 'title')
    if (input.value <= 0) throw new ValidationError('value must be > 0', 'value')

    const isPercentage = input.valueType === 'PERCENTAGE'

    const mutation = /* gql */ `
      mutation CreateDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) { edges { node { code usageCount } } }
                usageLimit
                startsAt
                endsAt
                status
              }
            }
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[DiscountDAO] create', { code: input.code, title: input.title })

    const discountInput = {
      title: input.title,
      code: input.code,
      startsAt: input.startsAt ?? new Date().toISOString(),
      endsAt: input.endsAt ?? null,
      usageLimit: input.usageLimit ?? null,
      customerSelection: input.customerSelection === 'SPECIFIC'
        ? { customers: { add: input.customerIds?.map(id => ({ id })) ?? [] } }
        : { all: true },
      customerGets: {
        value: isPercentage
          ? { percentage: input.value / 100 }
          : { discountAmount: { amount: String(input.value), appliesOnEachItem: false } },
        items: { all: true },
      },
    }

    const { data } = await adminFetch<any>({ query: mutation, variables: { basicCodeDiscount: discountInput } })

    const { codeDiscountNode, userErrors } = data.discountCodeBasicCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapDiscount(codeDiscountNode)
  },

  /** Update a discount code (e.g. extend expiration, change usage limit). */
  async update(id: string, fields: Partial<CreateDiscountInput>): Promise<DiscountCode> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/DiscountCodeNode/${id}`

    const mutation = /* gql */ `
      mutation UpdateDiscountCode($id: ID!, $basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicUpdate(id: $id, basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) { edges { node { code usageCount } } }
                usageLimit
                startsAt
                endsAt
                status
              }
            }
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[DiscountDAO] update', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: gid, basicCodeDiscount: fields } })

    const { codeDiscountNode, userErrors } = data.discountCodeBasicUpdate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapDiscount(codeDiscountNode)
  },

  /** Deactivate a discount code. */
  async delete(id: string): Promise<void> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/DiscountCodeNode/${id}`

    const mutation = /* gql */ `
      mutation DeactivateDiscount($id: ID!) {
        discountCodeDeactivate(id: $id) {
          codeDiscountNode { id }
          userErrors { field message }
        }
      }
    `

    logger.warn('[DiscountDAO] delete (deactivate)', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: gid } })

    const { userErrors } = data.discountCodeDeactivate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
  },
}
