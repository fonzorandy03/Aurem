/**
 * CustomerDAO
 *
 * Read and write Shopify customer records.
 * Passwords are never logged or exposed in responses.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { Customer, CreateCustomerInput, UpdateCustomerInput, PaginatedResult } from './interfaces'

// ─── Fragment ────────────────────────────────────────────────────────────────

const CUSTOMER_FRAGMENT = /* gql */ `
  fragment CustomerFields on Customer {
    id
    firstName
    lastName
    email
    phone
    acceptsMarketing
    tags
    state
    ordersCount
    totalSpentV2 { amount currencyCode }
    createdAt
    updatedAt
    addresses(first: 10) {
      edges {
        node {
          id
          firstName lastName company
          address1 address2
          city province country zip phone
        }
      }
    }
    defaultAddress {
      id firstName lastName company
      address1 address2
      city province country zip phone
    }
  }
`

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapCustomer(node: any): Customer {
  return {
    id: node.id,
    firstName: node.firstName ?? null,
    lastName: node.lastName ?? null,
    email: node.email,
    phone: node.phone ?? null,
    acceptsMarketing: node.acceptsMarketing,
    tags: node.tags ?? [],
    state: node.state,
    ordersCount: node.ordersCount ?? 0,
    totalSpent: node.totalSpentV2 ?? { amount: '0', currencyCode: 'EUR' },
    addresses: (node.addresses?.edges ?? []).map((e: any) => e.node),
    defaultAddress: node.defaultAddress ?? null,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const CustomerDAO = {
  async getAll(options?: {
    first?: number
    after?: string
    query?: string
  }): Promise<PaginatedResult<Customer>> {
    const { first = 50, after, query: filter } = options ?? {}

    const query = /* gql */ `
      ${CUSTOMER_FRAGMENT}
      query GetCustomers($first: Int!, $after: String, $query: String) {
        customers(first: $first, after: $after, query: $query) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          edges { node { ...CustomerFields } }
        }
      }
    `

    logger.info('[CustomerDAO] getAll', { first, filter })

    const { data } = await adminFetch<any>({ query, variables: { first, after: after ?? null, query: filter ?? null } })

    return {
      items: data.customers.edges.map((e: any) => mapCustomer(e.node)),
      pageInfo: data.customers.pageInfo,
    }
  },

  async getById(id: string): Promise<Customer> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Customer/${id}`

    const query = /* gql */ `
      ${CUSTOMER_FRAGMENT}
      query GetCustomer($id: ID!) {
        customer(id: $id) { ...CustomerFields }
      }
    `

    logger.info('[CustomerDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.customer) throw new NotFoundError('Customer', id)

    return mapCustomer(data.customer)
  },

  async getByEmail(email: string): Promise<Customer | null> {
    if (!email) throw new ValidationError('email is required', 'email')

    const result = await CustomerDAO.getAll({ first: 1, query: `email:${email}` })
    return result.items[0] ?? null
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    if (!input.email) throw new ValidationError('email is required', 'email')

    const mutation = /* gql */ `
      ${CUSTOMER_FRAGMENT}
      mutation CreateCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { ...CustomerFields }
          userErrors { field message }
        }
      }
    `

    // Never log the password field
    logger.info('[CustomerDAO] create', { email: input.email })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input } })

    const { customer, userErrors } = data.customerCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapCustomer(customer)
  },

  async update(input: UpdateCustomerInput): Promise<Customer> {
    if (!input.id) throw new ValidationError('id is required', 'id')
    const gid = input.id.startsWith('gid://') ? input.id : `gid://shopify/Customer/${input.id}`

    const mutation = /* gql */ `
      ${CUSTOMER_FRAGMENT}
      mutation UpdateCustomer($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { ...CustomerFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[CustomerDAO] update', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input: { ...input, id: gid } } })

    const { customer, userErrors } = data.customerUpdate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapCustomer(customer)
  },

  /**
   * Shopify does not allow deleting customers with orders.
   * This method disables the account instead.
   */
  async delete(id: string): Promise<void> {
    logger.warn('[CustomerDAO] delete is blocked — disabling instead', { id })
    await CustomerDAO.update({ id, tags: ['disabled'] })
  },
}
