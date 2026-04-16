'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth, type ShopifyOrder } from '@/components/account/auth-context'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { Package, MapPin, LogOut, ArrowRight, Mail, Phone, Pencil } from 'lucide-react'

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
      className="group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-x-4 gap-y-1 p-4 border border-border/50 rounded-md bg-background/70 transition-all duration-200 hover:bg-foreground/[0.03] hover:border-foreground/25 items-center"
    >
      {/* Thumbnail */}
      <div className="relative w-[60px] h-[80px] sm:w-[70px] sm:h-[90px] flex-shrink-0 overflow-hidden rounded-[3px] bg-secondary/40 border border-border/50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 60px, 70px"
          />
        ) : (
          <div className="w-full h-full bg-secondary/60" />
        )}
      </div>

      {/* Order # + product name + date */}
      <div className="flex flex-col gap-0.5 min-w-0">
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
  const { customer, logout, updateDefaultAddress } = useAuth()

  if (!customer) return null

  const displayName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email
  const recentOrders = (customer.orders ?? []).slice(0, 3)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    address1: customer.defaultAddress?.address1 ?? '',
    address2: customer.defaultAddress?.address2 ?? '',
    city: customer.defaultAddress?.city ?? '',
    province: customer.defaultAddress?.province ?? '',
    zip: customer.defaultAddress?.zip ?? '',
    country: customer.defaultAddress?.country ?? '',
    phone: customer.defaultAddress?.phone ?? '',
  })

  useEffect(() => {
    setAddressForm({
      address1: customer.defaultAddress?.address1 ?? '',
      address2: customer.defaultAddress?.address2 ?? '',
      city: customer.defaultAddress?.city ?? '',
      province: customer.defaultAddress?.province ?? '',
      zip: customer.defaultAddress?.zip ?? '',
      country: customer.defaultAddress?.country ?? '',
      phone: customer.defaultAddress?.phone ?? '',
    })
  }, [customer.defaultAddress?.id])

  async function handleAddressSave() {
    const currentCustomer = customer
    if (!currentCustomer?.defaultAddress?.id) return

    if (!addressForm.address1 || !addressForm.city || !addressForm.zip || !addressForm.country) {
      setAddressError('Address, city, ZIP and country are required.')
      setAddressSuccess(null)
      return
    }

    setIsSavingAddress(true)
    setAddressError(null)
    setAddressSuccess(null)

    try {
      await updateDefaultAddress({
        addressId: currentCustomer.defaultAddress.id,
        firstName: currentCustomer.firstName ?? undefined,
        lastName: currentCustomer.lastName ?? undefined,
        address1: addressForm.address1,
        address2: addressForm.address2 || undefined,
        city: addressForm.city,
        province: addressForm.province || undefined,
        zip: addressForm.zip,
        country: addressForm.country,
        phone: addressForm.phone || undefined,
      })

      setAddressSuccess('Default address updated.')
      setIsEditingAddress(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update address.'
      setAddressError(message)
    } finally {
      setIsSavingAddress(false)
    }
  }

  return (
    <motion.div
      className="relative max-w-[1180px] mx-auto px-6 md:px-10 py-14 md:py-20"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-foreground/[0.025] blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-foreground/[0.03] blur-3xl" />
      </div>

      {/* ── Header ── */}
      <motion.section variants={fadeUp} className="mb-10 md:mb-14 border border-border/60 bg-background/80 backdrop-blur-sm rounded-lg p-7 md:p-10">
        <p className="text-[10px] tracking-[0.28em] uppercase text-foreground/35 mb-5">
          AUREM / My Account
        </p>
        <h1 className="text-4xl md:text-[44px] font-bold tracking-tight uppercase leading-none mb-3">
          {displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs tracking-wide-industrial uppercase text-muted-foreground">
          <span>Member since {formatDate(customer.createdAt)}</span>
          <span className="inline-block h-1 w-1 rounded-full bg-foreground/30" />
          <span>{customer.orders?.length ?? 0} orders</span>
        </div>
      </motion.section>

      {/* ── 2-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">

        {/* ── LEFT: Account info + address ── */}
        <motion.section variants={fadeUp} className="border border-border/60 bg-background/80 rounded-lg p-6 md:p-8 flex flex-col gap-10">

          {/* Account details */}
          <div>
            <h2 className="text-sm tracking-wide-industrial uppercase font-bold mb-5">
              Account Details
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border border-border/50 rounded-md px-4 py-3 bg-background/60">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-[15px] tracking-industrial text-foreground">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 border border-border/50 rounded-md px-4 py-3 bg-background/60">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[15px] tracking-industrial text-foreground">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Default address */}
          {customer.defaultAddress && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-sm tracking-wide-industrial uppercase font-bold">
                  <MapPin className="inline h-4 w-4 mr-2 opacity-50" />
                  Default Address
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setAddressError(null)
                    setAddressSuccess(null)
                    setIsEditingAddress((prev) => !prev)
                  }}
                  className="inline-flex items-center gap-2 text-[11px] tracking-wide-industrial uppercase text-foreground/70 hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isEditingAddress ? 'Close' : 'Modify'}
                </button>
              </div>

              <div className="border border-border/60 p-6 rounded-md bg-background/60 space-y-4">
                {isEditingAddress ? (
                  <div className="space-y-3">
                    <input
                      value={addressForm.address1}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, address1: e.target.value }))}
                      placeholder="Address line 1"
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                    />
                    <input
                      value={addressForm.address2}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, address2: e.target.value }))}
                      placeholder="Address line 2 (optional)"
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                      />
                      <input
                        value={addressForm.province}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))}
                        placeholder="Province/Region"
                        className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, zip: e.target.value }))}
                        placeholder="ZIP / Postal code"
                        className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                      />
                      <input
                        value={addressForm.country}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                        className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                      />
                    </div>
                    <input
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm tracking-industrial"
                    />

                    {addressError && <p className="text-xs text-red-600 tracking-industrial">{addressError}</p>}
                    {addressSuccess && <p className="text-xs text-emerald-700 tracking-industrial">{addressSuccess}</p>}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleAddressSave}
                        disabled={isSavingAddress}
                        className="text-xs tracking-wide-industrial uppercase text-background bg-foreground rounded-full px-4 py-2 disabled:opacity-60"
                      >
                        {isSavingAddress ? 'Saving...' : 'Save address'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="text-xs tracking-wide-industrial uppercase text-foreground border border-foreground/25 rounded-full px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[15px] tracking-industrial leading-relaxed text-foreground">
                    {customer.defaultAddress.address1}
                    {customer.defaultAddress.address2 && <>, {customer.defaultAddress.address2}</>}
                    <br />
                    {customer.defaultAddress.zip} {customer.defaultAddress.city}{customer.defaultAddress.province && `, ${customer.defaultAddress.province}`}
                    <br />
                    {customer.defaultAddress.country}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2.5 text-xs tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors duration-150 border border-border/60 rounded-full px-4 py-2 self-start"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <Link
              href="/"
              className="text-xs tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors duration-150 border border-foreground/20 hover:border-foreground/40 rounded-full px-4 py-2 self-start"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.section>

        {/* ── RIGHT: Recent orders ── */}
        <motion.section variants={fadeUp} className="border border-border/60 bg-background/80 rounded-lg p-6 md:p-8">
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
            <div className="border border-dashed border-border/60 rounded-md p-8 md:p-10 flex flex-col gap-5 bg-background/50">
              <Package className="h-8 w-8 text-foreground/20" />
              <p className="text-sm tracking-industrial text-muted-foreground max-w-[260px]">
                No orders yet.
              </p>
              <Link
                href="/"
                className="text-xs tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors duration-150 border border-foreground/20 hover:border-foreground/40 rounded-full px-4 py-2 self-start"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map(order => (
                <RecentOrderRow key={order.id} order={order} />
              ))}
            </div>
          )}
        </motion.section>

      </div>
    </motion.div>
  )
}
