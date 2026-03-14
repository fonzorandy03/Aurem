// ─── Shared primitives ────────────────────────────────────────────────────────

export interface Money {
  amount: string
  currencyCode: string
}

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

export interface PaginatedResult<T> {
  items: T[]
  pageInfo: PageInfo
  totalCount?: number
}

// ─── Product & Images ─────────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  width: number | null
  height: number | null
  /** Assigned position in the product image gallery */
  position: number
}

export interface ProductOption {
  id: string
  name: string
  values: string[]
}

export interface ProductVariant {
  id: string
  title: string
  sku: string | null
  price: Money
  compareAtPrice: Money | null
  availableForSale: boolean
  inventoryQuantity: number
  selectedOptions: Array<{ name: string; value: string }>
  image: ProductImage | null
}

export interface Product {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  vendor: string
  productType: string | null
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  tags: string[]
  options: ProductOption[]
  variants: ProductVariant[]
  images: ProductImage[]
  priceRange: { min: Money; max: Money }
  compareAtPriceRange: { min: Money | null; max: Money | null }
  /** IDs of collections this product belongs to */
  collectionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProductInput {
  title: string
  descriptionHtml?: string
  vendor?: string
  productType?: string
  tags?: string[]
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  options?: string[]
  variants?: Array<{
    price: string
    sku?: string
    inventoryQuantity?: number
    options?: string[]
  }>
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

// ─── Collections ─────────────────────────────────────────────────────────────

export interface Collection {
  id: string
  title: string
  handle: string
  description: string
  descriptionHtml: string
  image: ProductImage | null
  /** Number of products in this collection */
  productsCount: number
  sortOrder: string
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionInput {
  title: string
  descriptionHtml?: string
  handle?: string
  image?: { altText?: string; src?: string }
  /** Sort order: ALPHA_ASC | ALPHA_DESC | BEST_SELLING | CREATED | etc. */
  sortOrder?: string
}

export interface UpdateCollectionInput extends Partial<CreateCollectionInput> {
  id: string
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface CustomerAddress {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  address1: string
  address2: string | null
  city: string
  province: string | null
  country: string
  zip: string
  phone: string | null
}

export interface Customer {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  acceptsMarketing: boolean
  tags: string[]
  state: 'ENABLED' | 'DISABLED' | 'INVITED' | 'DECLINED'
  addresses: CustomerAddress[]
  defaultAddress: CustomerAddress | null
  ordersCount: number
  totalSpent: Money
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerInput {
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  password?: string
  acceptsMarketing?: boolean
  tags?: string[]
  addresses?: Array<Omit<CustomerAddress, 'id'>>
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface LineItem {
  id: string
  title: string
  quantity: number
  sku: string | null
  variantId: string | null
  price: Money
  totalDiscount: Money
  image: ProductImage | null
}

export interface Order {
  id: string
  name: string          // e.g. "#1001"
  email: string | null
  phone: string | null
  financialStatus: OrderFinancialStatus
  fulfillmentStatus: OrderFulfillmentStatus
  lineItems: LineItem[]
  subtotalPrice: Money
  totalDiscounts: Money
  totalShippingPrice: Money
  totalTax: Money
  totalPrice: Money
  shippingAddress: CustomerAddress | null
  billingAddress: CustomerAddress | null
  customerId: string | null
  note: string | null
  tags: string[]
  cancelledAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type OrderFinancialStatus =
  | 'AUTHORIZED'
  | 'EXPIRED'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'PARTIALLY_REFUNDED'
  | 'PENDING'
  | 'REFUNDED'
  | 'VOIDED'

export type OrderFulfillmentStatus =
  | 'FULFILLED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'OPEN'
  | 'PARTIALLY_FULFILLED'
  | 'PENDING_FULFILLMENT'
  | 'RESTOCKED'
  | 'SCHEDULED'
  | 'UNFULFILLED'

export interface CreateOrderInput {
  lineItems: Array<{ variantId: string; quantity: number }>
  email?: string
  shippingAddress?: Omit<CustomerAddress, 'id'>
  note?: string
  tags?: string[]
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  orderId: string
  kind: 'AUTHORIZATION' | 'CAPTURE' | 'REFUND' | 'SALE' | 'VOID'
  status: 'AWAITING_RESPONSE' | 'ERROR' | 'FAILURE' | 'PENDING' | 'SUCCESS'
  amount: Money
  gateway: string
  paymentId: string | null
  errorCode: string | null
  createdAt: string
}

export interface RefundInput {
  orderId: string
  /** If omitted, full refund */
  amount?: string
  reason?: string
  note?: string
  refundLineItems?: Array<{ lineItemId: string; quantity: number }>
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryLevel {
  id: string
  locationId: string
  locationName: string
  inventoryItemId: string
  available: number
  incoming: number
  committed: number
  reserved: number
  updatedAt: string
}

export interface AdjustInventoryInput {
  inventoryItemId: string
  locationId: string
  delta: number
  reason?: string
}

// ─── Discounts ───────────────────────────────────────────────────────────────

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

export interface DiscountCode {
  id: string
  title: string
  code: string
  type: DiscountType
  value: number
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  usageLimit: number | null
  usageCount: number
  customerSelection: 'ALL' | 'SPECIFIC'
  startsAt: string
  endsAt: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'SCHEDULED'
  createdAt: string
}

export interface CreateDiscountInput {
  title: string
  code: string
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  usageLimit?: number
  startsAt?: string
  endsAt?: string
  customerSelection?: 'ALL' | 'SPECIFIC'
  customerIds?: string[]
}

// ─── Shipping ────────────────────────────────────────────────────────────────

export interface ShippingZone {
  id: string
  name: string
  countries: Array<{ code: string; name: string }>
  shippingRates: ShippingRate[]
}

export interface ShippingRate {
  id: string
  name: string
  price: Money
  /** Minimum order weight in grams */
  weightConditionMin: number | null
  weightConditionMax: number | null
  /** Minimum order subtotal */
  priceConditionMin: Money | null
  priceConditionMax: Money | null
}

export interface Fulfillment {
  id: string
  orderId: string
  status: string
  trackingCompany: string | null
  trackingNumbers: string[]
  trackingUrls: string[]
  lineItems: LineItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateFulfillmentInput {
  orderId: string
  lineItems: Array<{ id: string; quantity: number }>
  trackingCompany?: string
  trackingNumber?: string
  notifyCustomer?: boolean
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export type WebhookTopic =
  | 'ORDERS_CREATE'
  | 'ORDERS_UPDATED'
  | 'ORDERS_CANCELLED'
  | 'ORDERS_FULFILLED'
  | 'ORDERS_PAID'
  | 'PRODUCTS_CREATE'
  | 'PRODUCTS_UPDATE'
  | 'PRODUCTS_DELETE'
  | 'CUSTOMERS_CREATE'
  | 'CUSTOMERS_UPDATE'
  | 'INVENTORY_LEVELS_UPDATE'
  | 'REFUNDS_CREATE'

export interface Webhook {
  id: string
  topic: WebhookTopic
  callbackUrl: string
  format: 'JSON' | 'XML'
  createdAt: string
  updatedAt: string
}

export interface CreateWebhookInput {
  topic: WebhookTopic
  callbackUrl: string
  format?: 'JSON' | 'XML'
}
