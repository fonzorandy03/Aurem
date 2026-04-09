'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from './cart-context'
import { useAuth } from '@/components/account/auth-context'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { drawer, overlayFade, cartItem, cartList, ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { buildLoginRedirect } from '@/lib/auth/redirect'
import { isValidCheckoutUrl } from '@/lib/shopify/is-valid-checkout-url'

// ── Stock alert modal ─────────────────────────────────────────────────────────
type StockAlert = { available: number | null }

function StockAlertModal({ alert, onClose }: { alert: StockAlert; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18, ease: ease.luxury } }}
      exit={{ opacity: 0, transition: { duration: 0.14, ease: ease.sharp } }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-[280px] bg-background border border-border px-6 py-7 flex flex-col gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.sharp } }}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.14, ease: ease.sharp } }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold tracking-wide-industrial uppercase">Item unavailable</p>
          <p className="text-[11px] text-muted-foreground tracking-industrial leading-relaxed">
            {alert.available === 0
              ? 'This item is out of stock.'
              : alert.available !== null
                ? `Only ${alert.available} left in stock.`
                : 'Requested quantity is not available.'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full border border-foreground py-3 text-[11px] tracking-wide-industrial uppercase hover:bg-foreground hover:text-background transition-colors duration-200"
        >
          OK
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Animated qty number ───────────────────────────────────────────────────────
function QtyNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: ease.sharp } }}
        exit={{ opacity: 0, y: 6, transition: { duration: 0.12, ease: ease.sharp } }}
        className="text-xs tracking-industrial min-w-[1.25rem] text-center tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

// ── Main cart panel ───────────────────────────────────────────────────────────
export function CartPanel() {
  const { cart, isOpen, closeCart, updateItem, removeItem, isLoading } = useCart()
  const { isAuthenticated, customer } = useAuth()
  const [stockAlert, setStockAlert] = useState<StockAlert | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const lines = (cart?.lines.edges.map(e => e.node) ?? []).filter(l => l.quantity > 0)
  const total = cart?.cost.totalAmount
  const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0)

  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !stockAlert) closeCart() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, closeCart, stockAlert])

  // Before redirecting to Shopify checkout, refresh the buyer identity so
  // the order is always linked to the logged-in customer account.
  const handleCheckout = useCallback(async () => {
    if (!cart?.checkoutUrl) return
    if (!isValidCheckoutUrl(cart.checkoutUrl)) {
      toast.error('Checkout unavailable', { description: 'Please try again later' })
      return
    }
    if (!isAuthenticated) {
      window.location.href = buildLoginRedirect('/checkout')
      return
    }
    if (!cart?.id) {
      window.location.href = cart.checkoutUrl
      return
    }
    setIsCheckingOut(true)
    try {
      const res = await fetch('/api/cart/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId: cart.id }),
        credentials: 'same-origin',
      })
      const json = res.ok ? await res.json() : null
      const finalUrl = json?.checkoutUrl ?? cart.checkoutUrl
      if (isValidCheckoutUrl(finalUrl)) {
        window.location.href = finalUrl
      } else {
        window.location.href = cart.checkoutUrl
      }
    } catch {
      window.location.href = cart.checkoutUrl
    }
  }, [cart, isAuthenticated])

  const handleIncrement = useCallback(async (lineId: string, qty: number, merch: typeof lines[0]['merchandise']) => {
    if (merch.availableForSale === false) { setStockAlert({ available: 0 }); return }
    const wanted = qty + 1
    const updatedCart = await updateItem(lineId, wanted)
    if (updatedCart) {
      const line = updatedCart.lines.edges.find(e => e.node.id === lineId)
      const actual = line?.node.quantity ?? wanted
      if (actual < wanted) {
        setStockAlert({ available: actual })
      }
    }
  }, [updateItem])

  const handleDecrement = useCallback((lineId: string, qty: number) => {
    if (qty <= 1) removeItem(lineId)
    else updateItem(lineId, qty - 1)
  }, [updateItem, removeItem])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[3px]"
            onClick={closeCart}
            aria-hidden="true"
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Carrello"
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border flex flex-col"
            variants={drawer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-bold tracking-wide-industrial uppercase">
                Cart ({totalQuantity})
              </h2>
              <motion.button
                onClick={closeCart}
                aria-label="Close cart"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.12, ease: ease.sharp }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6 relative">
              <AnimatePresence>
                {stockAlert && (
                  <StockAlertModal alert={stockAlert} onClose={() => setStockAlert(null)} />
                )}
              </AnimatePresence>

              {lines.length === 0 ? (
                <motion.div
                  variants={cartItem}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground"
                >
                  <ShoppingBag className="h-12 w-12" />
                  <p className="text-xs tracking-wide-industrial uppercase">Your cart is empty</p>
                </motion.div>
              ) : (
                <motion.div
                  className="flex flex-col"
                  variants={cartList}
                  initial="hidden"
                  animate="visible"
                >
                  {lines.map((line, idx) => {
                    const image = line.merchandise.product?.images.edges[0]?.node
                    const variantLabel = line.merchandise.title !== 'Default Title' ? line.merchandise.title : null
                    const linePrice = (parseFloat(line.merchandise.price.amount) * line.quantity).toFixed(2)

                    return (
                      <motion.div
                        key={line.id}
                        variants={cartItem}
                        layout
                        className={cn(
                          'flex gap-4 py-5',
                          idx < lines.length - 1 && 'border-b border-border/50'
                        )}
                      >
                        {/* Thumbnail — object-contain, centered, no crop */}
                        <div className="relative w-[72px] h-[90px] flex-shrink-0">
                          {image ? (
                            <Image
                              src={image.url}
                              alt={image.altText || line.merchandise.product?.title || 'Product'}
                              fill
                              className="object-contain object-center"
                              sizes="72px"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold tracking-industrial uppercase leading-tight truncate">
                                {line.merchandise.product?.title}
                              </p>
                              {variantLabel && (
                                <p className="text-[11px] text-muted-foreground tracking-industrial mt-0.5">
                                  {variantLabel}
                                </p>
                              )}
                            </div>
                            <motion.button
                              onClick={() => removeItem(line.id)}
                              disabled={isLoading}
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ duration: 0.12 }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Qty stepper — unified border */}
                            <div className="flex items-center border border-border">
                              <motion.button
                                onClick={() => handleDecrement(line.id, line.quantity)}
                                disabled={isLoading}
                                aria-label="Decrease quantity"
                                className="h-7 w-7 flex items-center justify-center hover:bg-secondary transition-colors duration-150 disabled:opacity-40"
                                whileTap={{ scale: 0.85 }}
                                transition={{ duration: 0.1 }}
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </motion.button>
                              <QtyNumber value={line.quantity} />
                              <motion.button
                                onClick={() => handleIncrement(line.id, line.quantity, line.merchandise)}
                                disabled={isLoading}
                                aria-label="Increase quantity"
                                className="h-7 w-7 flex items-center justify-center hover:bg-secondary transition-colors duration-150 disabled:opacity-40"
                                whileTap={{ scale: 0.85 }}
                                transition={{ duration: 0.1 }}
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </motion.button>
                            </div>

                            {/* Animated line price */}
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.p
                                key={linePrice}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: ease.sharp } }}
                                exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                                className="text-xs font-bold tracking-industrial tabular-nums"
                              >
                                {linePrice}&euro;
                              </motion.p>
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {totalQuantity > 0 && (
                <motion.div
                  className="px-6 py-6 border-t border-border flex flex-col gap-4 flex-shrink-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.luxury } }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-wide-industrial uppercase text-muted-foreground">Total</span>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={total?.amount}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: ease.sharp } }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-bold tracking-industrial tabular-nums"
                      >
                        {total ? `${parseFloat(total.amount).toFixed(2)}\u20AC` : '0.00\u20AC'}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {isAuthenticated && customer?.email && (
                    <p className="text-[10px] text-muted-foreground tracking-industrial text-center">
                      Checkout linked to&nbsp;
                      <span className="font-medium text-foreground">{customer.email}</span>
                    </p>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || isLoading}
                    className="block w-full bg-foreground text-background text-center py-4 text-xs tracking-wide-industrial uppercase hover:bg-foreground/90 transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isCheckingOut ? 'Redirecting...' : 'Checkout'}
                  </button>

                  <p className="text-[10px] text-muted-foreground text-center tracking-industrial">
                    Secure payments via Shopify Checkout
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
