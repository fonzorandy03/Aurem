'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth, type ShopifyOrder } from '@/components/account/auth-context'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { Package, MapPin, LogOut, ArrowRight, Mail, Phone } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatDateShort(iso: string) {
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
    PAID: 'Paid', PENDING: 'Pending', REFUNDED: 'Refunded',
    FULFILLED: 'Shipped', UNFULFILLED: 'Processing', PARTIALLY_FULFILLED: 'Partially Shipped',
  }
  return map[status?.toUpperCase()] ?? status
}

// ─── Recent order row ────────────────────────────────────────────────────────

function RecentOrderRow({ order }: { order: ShopifyOrder }) {
  const imageUrl = order.lineItems[0]?.variant?.image?.url ?? null
  const imageAlt = order.lineItems[0]?.variant?.image?.altText ?? order.lineItems[0]?.title ?? ''

  return (
    <Link
      href={`/account/orders/${order.orderNumber}`}
      className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-x-4 gap-y-1 py-4 border-b border-border/40 last:border-0 transition-colors duration-150 hover:bg-foreground/[0.02] -mx-4 px-4 rounded-sm items-center"
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

      {/* Order # + product name + date */}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm tracking-industrial font-bold">#{order.orderNumber}</span>
        <span className="text-xs text-muted-foreground tracking-industrial line-clamp-1">
          {order.lineItems[0]?.title}
        </span>
        <span className="text-xs text-muted-foreground tracking-industrial hidden sm:block">
          {formatDateShort(order.processedAt)}
        </span>
      </div>

      {/* Status (desktop) */}
      <span className="text-xs text-muted-foreground tracking-industrial sm:text-center hidden sm:block">
        {statusLabel(order.fulfillmentStatus)}
      </span>

      {/* Price + arrow */}
      <div className="flex items-center gap-3 justify-end">
        <span className="text-sm font-bold tracking-industrial tabular-nums">
          {formatPrice(order.currentTotalPrice.amount, order.currentTotalPrice.currencyCode)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
      </div>
    </Link>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function AccountDashboard() {
  const { customer, logout } = useAuth()

  if (!customer) return null

  const displayName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email
  const recentOrders = (customer.orders ?? []).slice(0, 3)

  return (
    <motion.div
      className="max-w-[1140px] mx-auto px-6 md:px-10 py-16 md:py-20"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="mb-12 md:mb-16">
        <p className="text-[10px] tracking-[0.28em] uppercase text-foreground/30 mb-5">
          AUREM / My Account
        </p>
        <h1 className="text-4xl md:text-[40px] font-bold tracking-tight uppercase leading-none mb-3">
          {displayName}
        </h1>
        <p className="text-sm text-muted-foreground tracking-industrial">
          Member since {formatDate(customer.createdAt)}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="h-px bg-foreground/10 w-full mb-12 md:mb-16" />

      {/* ── 2-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">

        {/* ── LEFT: Account info + address ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-12">

          {/* Account details */}
          <div>
            <h2 className="text-sm tracking-wide-industrial uppercase font-bold mb-6">
              Account Details
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-[15px] tracking-industrial text-foreground">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[15px] tracking-industrial text-foreground">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Default address */}
          {customer.defaultAddress && (
            <div>
              <h2 className="text-sm tracking-wide-industrial uppercase font-bold mb-6">
                <MapPin className="inline h-4 w-4 mr-2 opacity-50" />
                Default Address
              </h2>
              <div className="border border-border/60 p-6">
                <p className="text-[15px] tracking-industrial leading-relaxed text-foreground">
                  {customer.defaultAddress.address1}
                  {customer.defaultAddress.address2 && <>, {customer.defaultAddress.address2}</>}
                  <br />
                  {customer.defaultAddress.zip} {customer.defaultAddress.city}{customer.defaultAddress.province && `, ${customer.defaultAddress.province}`}
                  <br />
                  {customer.defaultAddress.country}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2.5 text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 link-underline self-start"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <Link
              href="/"
              className="text-xs tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors duration-150 link-underline self-start"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>

        {/* ── RIGHT: Recent orders ── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-sm tracking-wide-industrial uppercase font-bold">
              Recent Orders
            </h2>
            {customer.orders?.length > 0 && (
              <Link
                href="/account/orders"
                className="text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-2 link-underline"
              >
                All orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="border-t border-border/40 pt-10 flex flex-col gap-5">
              <Package className="h-8 w-8 text-foreground/15" />
              <p className="text-sm tracking-industrial text-muted-foreground">
                No orders yet.
              </p>
              <Link
                href="/"
                className="text-xs tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors duration-150 link-underline self-start"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="border-t border-border/40">
              {recentOrders.map(order => (
                <RecentOrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  )
}
