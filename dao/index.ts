/**
 * DAO Layer — Public API
 *
 * Import from here in your server-side code (API routes, Server Components,
 * Server Actions). Never import DAO modules directly from client components.
 *
 * @example
 *   import { ProductDAO, OrderDAO } from '@/dao'
 */

export { ProductDAO } from './product.dao'
export { CollectionDAO } from './collection.dao'
export { CustomerDAO } from './customer.dao'
export { OrderDAO } from './order.dao'
export { PaymentDAO } from './payment.dao'
export { InventoryDAO } from './inventory.dao'
export { DiscountDAO } from './discount.dao'
export { ShippingDAO } from './shipping.dao'
export { WebhookDAO } from './webhook.dao'

// Core utilities (for advanced use only)
export { logger } from './core/logger'
export {
  ShopifyAdminError,
  ValidationError,
  NotFoundError,
  WebhookVerificationError,
  toErrorResponse,
} from './core/errors'
export type { ErrorResponse } from './core/errors'

// All TypeScript interfaces
export type * from './interfaces'
