'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Truck, ExternalLink } from 'lucide-react'
import { staggerContainer, fadeUp } from '@/lib/motion'
import {
  useAuth,
  type ShopifyOrder,
  type ShopifyOrderLineItem,
  type ShopifyOrderAddress,
  type ShopifyFulfillment,
} from '@/components/account/auth-context'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: currencyCode,
  }).format(parseFloat(amount))
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    FULFILLED: 'Shipped', UNFULFILLED: 'Processing', PARTIALLY_FULFILLED: 'Partially Shipped',
    PAID: 'Paid', PENDING: 'Pending', REFUNDED: 'Refunded', AUTHORIZED: 'Authorized',
  }
  return map[status?.toUpperCase()] ?? status
}

function isFulfilled(status: string) {
  return status?.toUpperCase() === 'FULFILLED'
}

function isNonZero(money: { amount: string } | null | undefined): boolean {
  return !!money && parseFloat(money.amount) > 0
}

// ─── Address block ──────────────────────────────────────────────────────────

function AddressBlock({ address, label }: { address: ShopifyOrderAddress; label: string }) {
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  return (
    <div>
      <h3 className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground mb-4">{label}</h3>
      <div className="text-[15px] tracking-industrial leading-relaxed text-foreground">
        {name && <p className="font-bold">{name}</p>}
        {address.address1 && <p>{address.address1}</p>}
        {address.address2 && <p>{address.address2}</p>}
        <p>
          {[address.zip, address.city].filter(Boolean).join(' ')}
          {address.province && `, ${address.province}`}
        </p>
        {address.country && <p>{address.country}</p>}
        {address.phone && <p className="mt-1 text-muted-foreground">{address.phone}</p>}
      </div>
    </div>
  )
}

// ─── Line item row ──────────────────────────────────────────────────────────

function LineItemRow({ item }: { item: ShopifyOrderLineItem }) {
  const imageUrl = item.variant?.image?.url
  const options = item.variant?.selectedOptions?.filter(o => o.value !== 'Default Title') ?? []
  const variantLabel = options.length > 0
    ? options.map(o => o.value).join(' / ')
    : (item.variant?.title && item.variant.title !== 'Default Title' ? item.variant.title : null)

  return (
    <div className="flex gap-5 py-5 border-b border-border/30 last:border-0">
      {/* Thumbnail */}
      <div className="relative w-[90px] h-[115px] bg-secondary/30 flex-shrink-0 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.variant?.image?.altText ?? item.title}
            fill
            className="object-cover object-top"
            sizes="90px"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <p className="text-sm tracking-wide-industrial uppercase font-bold leading-snug truncate">
          {item.title}
        </p>
        {variantLabel && (
          <p className="text-xs text-muted-foreground tracking-industrial">{variantLabel}</p>
        )}
        <p className="text-xs text-muted-foreground tracking-industrial">
          Qty: {item.quantity}
        </p>
      </div>

      {/* Price */}
      <div className="flex items-center flex-shrink-0">
        <span className="text-sm font-bold tracking-industrial tabular-nums">
          {item.originalTotalPrice
            ? formatPrice(item.originalTotalPrice.amount, item.originalTotalPrice.currencyCode)
            : item.variant?.price
              ? formatPrice(
                  (parseFloat(item.variant.price.amount) * item.quantity).toFixed(2),
                  item.variant.price.currencyCode,
                )
              : ''}
        </span>
      </div>
    </div>
  )
}

// ─── Tracking block ─────────────────────────────────────────────────────────

function TrackingBlock({ fulfillments }: { fulfillments: ShopifyFulfillment[] }) {
  const trackingEntries = fulfillments.flatMap(f =>
    f.trackingInfo.map(t => ({ ...t, company: f.trackingCompany }))
  )
  if (trackingEntries.length === 0) return null

  return (
    <div>
      <h3 className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground mb-4">
        Tracking
      </h3>
      <div className="flex flex-col gap-3">
        {trackingEntries.map((t, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            <span className="text-[15px] tracking-industrial">
              {t.company && <span className="text-muted-foreground">{t.company}: </span>}
              {t.url ? (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors duration-150"
                >
                  {t.number} <ExternalLink className="inline h-2.5 w-2.5" />
                </a>
              ) : (
                <span>{t.number}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Totals breakdown ───────────────────────────────────────────────────────

function TotalsBlock({ order }: { order: ShopifyOrder }) {
  const rows: { label: string; value: string }[] = []

  if (order.subtotalPrice) {
    rows.push({ label: 'Subtotal', value: formatPrice(order.subtotalPrice.amount, order.subtotalPrice.currencyCode) })
  }
  if (isNonZero(order.totalShippingPrice)) {
    rows.push({ label: 'Shipping', value: formatPrice(order.totalShippingPrice!.amount, order.totalShippingPrice!.currencyCode) })
  }
  if (isNonZero(order.totalTax)) {
    rows.push({ label: 'Tax', value: formatPrice(order.totalTax!.amount, order.totalTax!.currencyCode) })
  }
  // Discounts
  if (order.discountApplications?.length) {
    for (const d of order.discountApplications) {
      const label = d.code ? `Discount (${d.code})` : 'Discount'
      const val = d.value?.amount
        ? `-${formatPrice(d.value.amount, d.value.currencyCode ?? order.currentTotalPrice.currencyCode)}`
        : d.value?.percentage
          ? `-${d.value.percentage}%`
          : ''
      if (val) rows.push({ label, value: val })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="text-xs tracking-industrial text-muted-foreground">{r.label}</span>
          <span className="text-sm tracking-industrial tabular-nums">{r.value}</span>
        </div>
      ))}
      <div className="h-px bg-foreground/10 my-2" />
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wide-industrial uppercase font-bold">Total</span>
        <span className="text-lg tracking-industrial font-bold tabular-nums">
          {formatPrice(order.currentTotalPrice.amount, order.currentTotalPrice.currencyCode)}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function OrderDetail() {
  const params = useParams()
  const { customer, isLoading } = useAuth()
  const orders = Array.isArray(customer?.orders) ? customer.orders : []

  // Match by orderNumber (the route param)
  const orderNum = params?.id ? parseInt(String(params.id), 10) : NaN
  const order = orders.find(o => o.orderNumber === orderNum)

  if (isLoading) {
    return (
      <div className="max-w-[1140px] mx-auto px-6 md:px-10 py-20">
        <span className="text-xs tracking-wide-industrial uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-[1140px] mx-auto px-6 md:px-10 py-16 md:py-20">
        <Link
          href="/account/orders"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-2 mb-8 link-underline w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
        <p className="text-sm tracking-industrial text-muted-foreground">
          Order not found.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-[1140px] mx-auto px-6 md:px-10 py-16 md:py-20"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ── Back link ── */}
      <motion.div variants={fadeUp}>
        <Link
          href="/account/orders"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-2 mb-10 link-underline w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
      </motion.div>

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-4xl md:text-[40px] font-bold tracking-tight uppercase leading-none mb-3">
          Order #{order.orderNumber}
        </h1>
        <p className="text-sm text-muted-foreground tracking-industrial">
          Placed on {formatDate(order.processedAt)}
        </p>
      </motion.div>

      {/* ── Status badges ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-12">
        <span className={`text-[10px] tracking-wide-industrial uppercase px-3 py-1.5 ${
          isFulfilled(order.fulfillmentStatus)
            ? 'bg-foreground text-background'
            : 'border border-foreground/30 text-foreground/70'
        }`}>
          {statusLabel(order.fulfillmentStatus)}
        </span>
        <span className="text-[10px] tracking-wide-industrial uppercase px-3 py-1.5 border border-foreground/30 text-foreground/70">
          {statusLabel(order.financialStatus)}
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="h-px bg-foreground/10 w-full mb-12" />

      {/* ── 2-column: items left, summary right ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-14 md:gap-20">

        {/* ── LEFT: Line items ── */}
        <motion.div variants={fadeUp}>
          <h2 className="text-sm tracking-wide-industrial uppercase font-bold mb-5">
            Items
          </h2>
          <div className="border-t border-border/40">
            {order.lineItems.map((item, i) => (
              <LineItemRow key={i} item={item} />
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT: Summary ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-10">

          {/* Totals */}
          <div>
            <h2 className="text-sm tracking-wide-industrial uppercase font-bold mb-5">
              Summary
            </h2>
            <TotalsBlock order={order} />
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <AddressBlock address={order.shippingAddress} label="Shipping Address" />
          )}

          {/* Tracking */}
          {order.successfulFulfillments?.length > 0 && (
            <TrackingBlock fulfillments={order.successfulFulfillments} />
          )}

        </motion.div>
      </div>

      {/* ── Footer ── */}
      <motion.div variants={fadeUp} className="pt-14 flex gap-8">
        <Link
          href="/account/orders"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 link-underline"
        >
          All Orders
        </Link>
        <Link
          href="/"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 link-underline"
        >
          Continue Shopping
        </Link>
      </motion.div>
    </motion.div>
  )
}
