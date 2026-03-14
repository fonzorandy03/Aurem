/**
 * CollectionDAO
 *
 * Manages Shopify Collections (smart and custom).
 * Example categories: Cappotti, Accessori, Gioielli, Borse.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { Collection, CreateCollectionInput, UpdateCollectionInput, PaginatedResult } from './interfaces'

// ─── Fragment ────────────────────────────────────────────────────────────────

const COLLECTION_FRAGMENT = /* gql */ `
  fragment CollectionFields on Collection {
    id
    title
    handle
    description
    descriptionHtml
    productsCount
    sortOrder
    createdAt
    updatedAt
    image {
      id
      url
      altText
      width
      height
    }
  }
`

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapCollection(node: any): Collection {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description ?? '',
    descriptionHtml: node.descriptionHtml ?? '',
    productsCount: node.productsCount ?? 0,
    sortOrder: node.sortOrder ?? 'MANUAL',
    image: node.image
      ? { id: node.image.id, url: node.image.url, altText: node.image.altText ?? null,
          width: node.image.width ?? null, height: node.image.height ?? null, position: 0 }
      : null,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const CollectionDAO = {
  async getAll(options?: { first?: number; after?: string }): Promise<PaginatedResult<Collection>> {
    const { first = 50, after } = options ?? {}

    const query = /* gql */ `
      ${COLLECTION_FRAGMENT}
      query GetCollections($first: Int!, $after: String) {
        collections(first: $first, after: $after) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          edges { node { ...CollectionFields } }
        }
      }
    `

    logger.info('[CollectionDAO] getAll', { first })

    const { data } = await adminFetch<any>({ query, variables: { first, after: after ?? null } })

    return {
      items: data.collections.edges.map((e: any) => mapCollection(e.node)),
      pageInfo: data.collections.pageInfo,
    }
  },

  async getById(id: string): Promise<Collection> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Collection/${id}`

    const query = /* gql */ `
      ${COLLECTION_FRAGMENT}
      query GetCollection($id: ID!) {
        collection(id: $id) { ...CollectionFields }
      }
    `

    logger.info('[CollectionDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.collection) throw new NotFoundError('Collection', id)

    return mapCollection(data.collection)
  },

  async getByHandle(handle: string): Promise<Collection> {
    if (!handle) throw new ValidationError('handle is required', 'handle')

    const query = /* gql */ `
      ${COLLECTION_FRAGMENT}
      query GetCollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) { ...CollectionFields }
      }
    `

    logger.info('[CollectionDAO] getByHandle', { handle })

    const { data } = await adminFetch<any>({ query, variables: { handle } })
    if (!data.collectionByHandle) throw new NotFoundError('Collection', handle)

    return mapCollection(data.collectionByHandle)
  },

  async create(input: CreateCollectionInput): Promise<Collection> {
    if (!input.title?.trim()) throw new ValidationError('title is required', 'title')

    const mutation = /* gql */ `
      ${COLLECTION_FRAGMENT}
      mutation CreateCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection { ...CollectionFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[CollectionDAO] create', { title: input.title })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input } })

    const { collection, userErrors } = data.collectionCreate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapCollection(collection)
  },

  async update(input: UpdateCollectionInput): Promise<Collection> {
    if (!input.id) throw new ValidationError('id is required', 'id')
    const gid = input.id.startsWith('gid://') ? input.id : `gid://shopify/Collection/${input.id}`

    const mutation = /* gql */ `
      ${COLLECTION_FRAGMENT}
      mutation UpdateCollection($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { ...CollectionFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[CollectionDAO] update', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input: { ...input, id: gid } } })

    const { collection, userErrors } = data.collectionUpdate
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapCollection(collection)
  },

  async delete(id: string): Promise<void> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Collection/${id}`

    const mutation = /* gql */ `
      mutation DeleteCollection($input: CollectionDeleteInput!) {
        collectionDelete(input: $input) {
          deletedCollectionId
          userErrors { field message }
        }
      }
    `

    logger.warn('[CollectionDAO] delete', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input: { id: gid } } })

    const { userErrors } = data.collectionDelete
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
  },

  /** Add product(s) to a collection. */
  async addProducts(collectionId: string, productIds: string[]): Promise<void> {
    const collGid = collectionId.startsWith('gid://') ? collectionId : `gid://shopify/Collection/${collectionId}`
    const productGids = productIds.map(id => id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`)

    const mutation = /* gql */ `
      mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }
    `

    logger.info('[CollectionDAO] addProducts', { collectionId: collGid, count: productGids.length })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: collGid, productIds: productGids } })

    const { userErrors } = data.collectionAddProducts
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
  },
}
