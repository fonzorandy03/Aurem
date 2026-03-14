'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Package, ArrowLeft, ArrowRight } from 'lucide-react'
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion'
import { useAuth, type ShopifyOrder } from '@/components/account/auth-context'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: currencyCode,
  }).format(parseFloat(amount))
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    FULFILLED: 'Shipped',
    UNFULFILLED: 'Processing',
    PARTIALLY_FULFILLED: 'Partial',
    PAID: 'Paid',
    PENDING: 'Pending',
    REFUNDED: 'Refunded',
  }
  return map[status?.toUpperCase()] ?? status
}

function isFulfilled(status: string) {
  return status?.toUpperCase() === 'FULFILLED'
}

function getFirstImage(order: ShopifyOrder): string | null {
  const first = order.lineItems[0]
  return first?.variant?.image?.url ?? null
}

// ─── Order row ──────────────────────────────────────────────────────────────

function OrderRow({ order }: { order: ShopifyOrder }) {
  const itemCount = order.lineItems.reduce((s, li) => s + li.quantity, 0)
  const imageUrl = getFirstImage(order)
  const imageAlt = order.lineItems[0]?.variant?.image?.altText ?? order.lineItems[0]?.title ?? ''

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={`/account/orders/${order.orderNumber}`}
        className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-x-5 gap-y-2 py-5 border-b border-border/40 transition-colors duration-150 hover:bg-foreground/[0.02] items-center -mx-4 px-4 rounded-sm"
      >
        {/* Thumbnail */}
        <div className="relative w-[60px] h-[80px] sm:w-[70px] sm:h-[90px] flex-shrink-0 overflow-hidden rounded-[2px] bg-secondary/40">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 60px, 70px"
            />
          ) : (
            <div className="w-full h-full bg-secondary/60" />
          )}
        </div>

        {/* Order # + date */}
        <div className="flex flex-col gap-1">
          <span className="text-sm tracking-industrial font-bold uppercase">
            Order #{order.orderNumber}
          </span>
          <span className="text-xs text-muted-foreground tracking-industrial line-clamp-1">
            {order.lineItems[0]?.title}
          </span>
          <span className="text-xs text-muted-foreground tracking-industrial">
            {formatDate(order.processedAt)} &middot; {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Status */}
        <div className="hidden sm:flex items-center">
          <span className={`text-[10px] tracking-wide-industrial uppercase px-3 py-1.5 ${
            isFulfilled(order.fulfillmentStatus)
              ? 'bg-foreground text-background'
              : 'border border-foreground/30 text-foreground/70'
          }`}>
            {statusLabel(order.fulfillmentStatus)}
          </span>
        </div>

        {/* Financial status (desktop only) */}
        <span className="text-xs text-muted-foreground tracking-industrial hidden sm:block">
          {statusLabel(order.financialStatus)}
        </span>

        {/* Price + arrow */}
        <div className="flex items-center gap-3 justify-end">
          <span className="text-sm font-bold tracking-industrial tabular-nums">
            {formatPrice(order.currentTotalPrice.amount, order.currentTotalPrice.currencyCode)}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
        </div>

        {/* Mobile: status below (spans image + text columns) */}
        <div className="sm:hidden col-span-3 flex items-center gap-2 -mt-1">
          <span className={`text-[10px] tracking-wide-industrial uppercase px-2.5 py-1 ${
            isFulfilled(order.fulfillmentStatus)
              ? 'bg-foreground text-background'
              : 'border border-foreground/30 text-foreground/70'
          }`}>
            {statusLabel(order.fulfillmentStatus)}
          </span>
          <span className="text-xs text-muted-foreground tracking-industrial">
            {statusLabel(order.financialStatus)}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Orders list ────────────────────────────────────────────────────────────

export function OrdersList() {
  const { customer, isLoading } = useAuth()
  const orders = Array.isArray(customer?.orders) ? customer.orders : []

  if (isLoading) {
    return (
      <div className="max-w-[1140px] mx-auto px-6 md:px-10 py-20">
        <span className="text-xs tracking-wide-industrial uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
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
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="mb-12">
        <Link
          href="/account"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-2 mb-8 link-underline self-start w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> My Account
        </Link>
        <h1 className="text-4xl md:text-[40px] font-bold tracking-tight uppercase leading-none mb-3">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground tracking-industrial">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </motion.div>

      {/* ── Table header (desktop) ── */}
      {orders.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="hidden sm:grid sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] gap-x-5 pb-4 border-b border-foreground/10 items-end"
        >
          {/* Blank column matching image width */}
          <div className="w-[70px]" />
          <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground">Order</span>
          <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground">Status</span>
          <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground">Payment</span>
          <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground text-right">Total</span>
        </motion.div>
      )}

      {orders.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col py-20 gap-5 text-muted-foreground"
        >
          <Package className="h-8 w-8 text-foreground/15" />
          <p className="text-sm tracking-wide-industrial uppercase">No orders yet</p>
          <Link
            href="/"
            className="text-xs tracking-wide-industrial uppercase text-foreground mt-2 flex items-center gap-2 hover:text-muted-foreground transition-colors duration-150 link-underline self-start"
          >
            Start Shopping <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} className="flex flex-col">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </motion.div>
      )}

      {/* ── Footer ── */}
      <motion.div
        variants={fadeUp}
        className="pt-12 flex gap-8"
      >
        <Link
          href="/account"
          className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 link-underline"
        >
          My Account
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
