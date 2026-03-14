/**
 * InventoryDAO
 *
 * Manages Shopify inventory levels across locations.
 * All adjustments are location-aware and audited.
 */

import { adminFetch } from './core/admin-client'
import { logger } from './core/logger'
import { NotFoundError, ValidationError } from './core/errors'
import type { InventoryLevel, AdjustInventoryInput } from './interfaces'

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapLevel(node: any): InventoryLevel {
  return {
    id: node.id,
    locationId: node.location?.id ?? '',
    locationName: node.location?.name ?? '',
    inventoryItemId: node.item?.id ?? '',
    available: node.available ?? 0,
    incoming: node.incoming ?? 0,
    committed: node.committed ?? 0,
    reserved: node.reserved ?? 0,
    updatedAt: node.updatedAt,
  }
}

// ─── DAO ─────────────────────────────────────────────────────────────────────

export const InventoryDAO = {
  /**
   * Get all inventory levels for a specific inventory item (i.e. a variant).
   */
  async getAll(inventoryItemId: string): Promise<InventoryLevel[]> {
    const gid = inventoryItemId.startsWith('gid://')
      ? inventoryItemId
      : `gid://shopify/InventoryItem/${inventoryItemId}`

    const query = /* gql */ `
      query GetInventoryItem($id: ID!) {
        inventoryItem(id: $id) {
          id
          inventoryLevels(first: 30) {
            edges {
              node {
                id
                available
                incoming
                committed
                reserved
                updatedAt
                location { id name }
                item { id }
              }
            }
          }
        }
      }
    `

    logger.info('[InventoryDAO] getAll', { inventoryItemId: gid })

    const { data } = await adminFetch<any>({ query, variables: { id: gid } })
    if (!data.inventoryItem) throw new NotFoundError('InventoryItem', inventoryItemId)

    return (data.inventoryItem.inventoryLevels?.edges ?? []).map((e: any) => mapLevel(e.node))
  },

  /** Get a single inventory level by its ID. */
  async getById(id: string): Promise<InventoryLevel> {
    const levels = await InventoryDAO.getAll(id)
    if (!levels.length) throw new NotFoundError('InventoryLevel', id)
    return levels[0]
  },

  /** Adjust inventory quantity at a specific location (relative delta). */
  async adjust(input: AdjustInventoryInput): Promise<InventoryLevel> {
    const itemGid = input.inventoryItemId.startsWith('gid://')
      ? input.inventoryItemId
      : `gid://shopify/InventoryItem/${input.inventoryItemId}`

    const locationGid = input.locationId.startsWith('gid://')
      ? input.locationId
      : `gid://shopify/Location/${input.locationId}`

    const mutation = /* gql */ `
      mutation AdjustInventory($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
          inventoryLevel {
            id
            available
            incoming
            committed
            reserved
            updatedAt
            location { id name }
            item { id }
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[InventoryDAO] adjust', {
      inventoryItemId: itemGid,
      locationId: locationGid,
      delta: input.delta,
      reason: input.reason,
    })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: {
        input: {
          inventoryItemId: itemGid,
          locationId: locationGid,
          availableDelta: input.delta,
        },
      },
    })

    const { inventoryLevel, userErrors } = data.inventoryAdjustQuantity
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    return mapLevel(inventoryLevel)
  },

  /** Set inventory to an absolute quantity (overwrite, not delta). */
  async set(
    inventoryItemId: string,
    locationId: string,
    quantity: number,
  ): Promise<InventoryLevel> {
    if (quantity < 0) throw new ValidationError('quantity must be >= 0', 'quantity')

    const itemGid = inventoryItemId.startsWith('gid://')
      ? inventoryItemId
      : `gid://shopify/InventoryItem/${inventoryItemId}`
    const locationGid = locationId.startsWith('gid://')
      ? locationId
      : `gid://shopify/Location/${locationId}`

    const mutation = /* gql */ `
      mutation SetInventory($input: InventorySetOnHandQuantitiesInput!) {
        inventorySetOnHandQuantities(input: $input) {
          inventoryAdjustmentGroup {
            createdAt
            reason
            changes {
              name
              delta
              quantityAfterChange
            }
          }
          userErrors { field message }
        }
      }
    `

    logger.info('[InventoryDAO] set', { inventoryItemId: itemGid, locationId: locationGid, quantity })

    const { data } = await adminFetch<any>({
      query: mutation,
      variables: {
        input: {
          reason: 'correction',
          setQuantities: [{ inventoryItemId: itemGid, locationId: locationGid, quantity }],
        },
      },
    })

    const { userErrors } = data.inventorySetOnHandQuantities
    if (userErrors?.length) throw new ValidationError(userErrors.map((e: any) => e.message).join('; '))

    // Return the updated level
    const levels = await InventoryDAO.getAll(inventoryItemId)
    const level = levels.find(l => l.locationId === locationGid)
    if (!level) throw new NotFoundError('InventoryLevel', locationGid)
    return level
  },

  /** Inventory levels are not deleted — they are zeroed when a location is removed. */
  delete(_id: string): never {
    throw new ValidationError('InventoryLevels cannot be deleted. Use set(quantity: 0) instead.')
  },

  /** create() is not directly supported — levels are auto-created when a variant is tracked. */
  create: undefined,
  update: undefined,
}
