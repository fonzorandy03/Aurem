/**
 * ProductDAO
 *
 * All product read/write operations against the Shopify Admin API.
 * Supports Cappotti, Accessori, Gioielli, Borse via productType / collection filters.
 *
 * Read operations (getAll, getById) use SSR-friendly fetch caching.
 * Write operations (create, update, delete) use cache: 'no-store'.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type {
  Product,
  ProductImage,
  CreateProductInput,
  UpdateProductInput,
  PaginatedResult,
} from './interfaces'

// ─── Fragments ───────────────────────────────────────────────────────────────

const PRODUCT_FRAGMENT = /* gql */ `
  fragment ProductFields on Product {
    id
    title
    handle
    description
    descriptionHtml
    vendor
    productType
    status
    tags
    createdAt
    updatedAt
    options {
      id
      name
      values
    }
    images(first: 20) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    priceRangeV2 {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantCompareAtPrice { amount currencyCode }
      maxVariantCompareAtPrice { amount currencyCode }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          sku
          availableForSale
          inventoryQuantity
          price
          compareAtPrice
          selectedOptions { name value }
          image {
            id url altText width height
          }
        }
      }
    }
    collections(first: 10) {
      edges { node { id } }
    }
  }
`

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapImage(node: any): ProductImage {
  return {
    id: node.id,
    url: node.url,
    altText: node.altText ?? null,
    width: node.width ?? null,
    height: node.height ?? null,
    position: 0, // position not returned by default query; use explicit image query if needed
  }
}

function mapProduct(node: any): Product {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    vendor: node.vendor,
    productType: node.productType ?? null,
    status: node.status,
    tags: node.tags ?? [],
    options: node.options ?? [],
    images: (node.images?.edges ?? []).map((e: any) => mapImage(e.node)),
    variants: (node.variants?.edges ?? []).map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      sku: e.node.sku ?? null,
      price: { amount: e.node.price, currencyCode: 'EUR' },
      compareAtPrice: e.node.compareAtPrice
        ? { amount: e.node.compareAtPrice, currencyCode: 'EUR' }
        : null,
      availableForSale: e.node.availableForSale,
      inventoryQuantity: e.node.inventoryQuantity ?? 0,
      selectedOptions: e.node.selectedOptions,
      image: e.node.image ? mapImage(e.node.image) : null,
    })),
    priceRange: {
      min: node.priceRangeV2.minVariantPrice,
      max: node.priceRangeV2.maxVariantPrice,
    },
    compareAtPriceRange: {
      min: node.compareAtPriceRange?.minVariantCompareAtPrice ?? null,
      max: node.compareAtPriceRange?.maxVariantCompareAtPrice ?? null,
    },
    collectionIds: (node.collections?.edges ?? []).map((e: any) => e.node.id),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const ProductDAO = {
  /**
   * Fetch all products, with optional filter.
   * filter examples:
   *   'product_type:Cappotti'
   *   'tag:new-arrivals'
   *   'collection_id:123456789'
   */
  async getAll(options?: {
    first?: number
    after?: string
    filter?: string
  }): Promise<PaginatedResult<Product>> {
    const { first = 50, after, filter } = options ?? {}

    const query = /* gql */ `
      ${PRODUCT_FRAGMENT}
      query GetProducts($first: Int!, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          edges { node { ...ProductFields } }
        }
      }
    `

    logger.info('[ProductDAO] getAll', { first, filter })

    const { data } = await adminFetch<any>({
      query,
      variables: { first, after: after ?? null, query: filter ?? null },
    })

    return {
      items: data.products.edges.map((e: any) => mapProduct(e.node)),
      pageInfo: data.products.pageInfo,
    }
  },

  /** Get a single product by its Shopify GID or numeric ID. */
  async getById(id: string): Promise<Product> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`

    const query = /* gql */ `
      ${PRODUCT_FRAGMENT}
      query GetProduct($id: ID!) {
        product(id: $id) { ...ProductFields }
      }
    `

    logger.info('[ProductDAO] getById', { id: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })

    if (!data.product) throw new NotFoundError('Product', id)
    return mapProduct(data.product)
  },

  /** Get a single product by handle (URL slug). */
  async getByHandle(handle: string): Promise<Product> {
    if (!handle) throw new ValidationError('handle is required', 'handle')

    const query = /* gql */ `
      ${PRODUCT_FRAGMENT}
      query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) { ...ProductFields }
      }
    `

    logger.info('[ProductDAO] getByHandle', { handle })

    const { data } = await adminFetch<any>({ query, variables: { handle } })

    if (!data.productByHandle) throw new NotFoundError('Product', handle)
    return mapProduct(data.productByHandle)
  },

  /** Filter by category (productType). Common values: Cappotti, Accessori, Gioielli, Borse */
  async getByCategory(category: string, first = 50): Promise<PaginatedResult<Product>> {
    return ProductDAO.getAll({ first, filter: `product_type:${category}` })
  },

  /** Create a new product. */
  async create(input: CreateProductInput): Promise<Product> {
    if (!input.title?.trim()) throw new ValidationError('title is required', 'title')

    const mutation = /* gql */ `
      ${PRODUCT_FRAGMENT}
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product { ...ProductFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[ProductDAO] create', { title: input.title })

    const { data } = await adminFetch<any>({ query: mutation, variables: { input } })

    const { product, userErrors } = data.productCreate
    if (userErrors?.length) {
      throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    }

    return mapProduct(product)
  },

  /** Update an existing product. */
  async update(input: UpdateProductInput): Promise<Product> {
    if (!input.id) throw new ValidationError('id is required', 'id')
    const gid = input.id.startsWith('gid://') ? input.id : `gid://shopify/Product/${input.id}`

    const mutation = /* gql */ `
      ${PRODUCT_FRAGMENT}
      mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product { ...ProductFields }
          userErrors { field message }
        }
      }
    `

    logger.info('[ProductDAO] update', { id: gid })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { input: { ...input, id: gid } },
    })

    const { product, userErrors } = data.productUpdate
    if (userErrors?.length) {
      throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    }

    return mapProduct(product)
  },

  /**
   * Archive a product (Shopify does not allow hard deletion of products
   * that have associated orders; archiving is the safe approach).
   */
  async archive(id: string): Promise<void> {
    await ProductDAO.update({ id, status: 'ARCHIVED' })
    logger.info('[ProductDAO] archived', { id })
  },

  /**
   * Hard-delete a product with no order history.
   * Prefer archive() for products that have been sold.
   */
  async delete(id: string): Promise<void> {
    const gid = id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`

    const mutation = /* gql */ `
      mutation DeleteProduct($id: ID!) {
        productDelete(input: { id: $id }) {
          deletedProductId
          userErrors { field message }
        }
      }
    `

    logger.warn('[ProductDAO] delete', { id: gid })

    const { data } = await adminFetch<any>({ query: mutation, variables: { id: gid } })

    const { userErrors } = data.productDelete
    if (userErrors?.length) {
      throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    }
  },

  /** Attach an image to a product by URL. */
  async addImage(productId: string, imageUrl: string, altText?: string): Promise<ProductImage> {
    const gid = productId.startsWith('gid://')
      ? productId
      : `gid://shopify/Product/${productId}`

    const mutation = /* gql */ `
      mutation AddProductImage($productId: ID!, $image: ImageInput!) {
        productImageCreate(productId: $productId, image: $image) {
          image { id url altText width height }
          userErrors { field message }
        }
      }
    `

    logger.info('[ProductDAO] addImage', { productId: gid, imageUrl })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { productId: gid, image: { src: imageUrl, altText: altText ?? '' } },
    })

    const { image, userErrors } = data.productImageCreate
    if (userErrors?.length) {
      throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    }

    return mapImage(image)
  },

  /** Remove an image from a product. */
  async removeImage(productId: string, imageId: string): Promise<void> {
    const productGid = productId.startsWith('gid://')
      ? productId
      : `gid://shopify/Product/${productId}`
    const imageGid = imageId.startsWith('gid://')
      ? imageId
      : `gid://shopify/ProductImage/${imageId}`

    const mutation = /* gql */ `
      mutation RemoveProductImage($productId: ID!, $imageIds: [ID!]!) {
        productDeleteImages(id: $productId, imageIds: $imageIds) {
          deletedImageIds
          userErrors { field message }
        }
      }
    `

    logger.warn('[ProductDAO] removeImage', { productId: productGid, imageId: imageGid })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: { productId: productGid, imageIds: [imageGid] },
    })

    const { userErrors } = data.productDeleteImages
    if (userErrors?.length) {
      throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))
    }
  },
}
