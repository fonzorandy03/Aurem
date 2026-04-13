'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { ShopifyCart, ShopifyProduct, ProductVariant } from '@/lib/shopify/types'
import { createCart, addCartLines, updateCartLines, removeCartLines, getCart } from '@/lib/shopify'
import { toast } from 'sonner'

type CartContextType = {
  cart: ShopifyCart | null
  isLoading: boolean
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (variant: ProductVariant, product: ShopifyProduct) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<ShopifyCart | undefined>
  removeItem: (lineId: string) => Promise<void>
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextType | null>(null)

const CART_ID_KEY = 'aurem_cart_id'
const CART_COUNTRY_KEY = 'aurem_cart_country'

/** Try to associate the cart with the logged-in customer (best-effort, non-blocking) */
function tryAssociateCart(cartId: string) {
  fetch('/api/cart/associate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId }),
    credentials: 'same-origin',
  }).catch(() => {})
}

/** Safely read from localStorage */
function getStoredCartId(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(CART_ID_KEY) : null
  } catch { return null }
}

/** Safely write to localStorage */
function setStoredCartId(id: string) {
  try { typeof window !== 'undefined' && window.localStorage.setItem(CART_ID_KEY, id) } catch {}
}

/** Safely remove from localStorage */
function removeStoredCartId() {
  try { typeof window !== 'undefined' && window.localStorage.removeItem(CART_ID_KEY) } catch {}
}

function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookieKey = 'aurem_country_code='
  const hit = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieKey))
  return hit ? decodeURIComponent(hit.slice(cookieKey.length)) : null
}

function getStoredCartCountry(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(CART_COUNTRY_KEY) : null
  } catch {
    return null
  }
}

function setStoredCartCountry(countryCode: string | null) {
  try {
    if (typeof window === 'undefined') return
    if (countryCode) {
      window.localStorage.setItem(CART_COUNTRY_KEY, countryCode)
    } else {
      window.localStorage.removeItem(CART_COUNTRY_KEY)
    }
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null)
  const cartRef = useRef<ShopifyCart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  // Mutex: prevent concurrent cart mutations
  const mutationLock = useRef(false)

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  // keep ref always in sync so callbacks never have stale cart
  useEffect(() => {
    cartRef.current = cart
  }, [cart])

  // Migrate legacy sessionStorage cart ID → localStorage (one-time)
  useEffect(() => {
    try {
      const legacy = typeof window !== 'undefined' ? window.sessionStorage.getItem('shopify_cart_id') : null
      if (legacy) {
        setStoredCartId(legacy)
        window.sessionStorage.removeItem('shopify_cart_id')
      }
    } catch {}
  }, [])

  // Load existing cart on mount
  useEffect(() => {
    const cookieCountry = readCountryCookie()
    const cartCountry = getStoredCartCountry()

    if (cartCountry && cookieCountry && cartCountry !== cookieCountry) {
      removeStoredCartId()
      setStoredCartCountry(cookieCountry)
      setCart(null)
      cartRef.current = null
      return
    }

    const cartId = getStoredCartId()
    if (!cartId) return
    getCart(cartId)
      .then((existingCart) => {
        if (existingCart) {
          if (cartRef.current) return // race condition guard: addItem already set a newer cart
          const cleaned = {
            ...existingCart,
            lines: {
              edges: existingCart.lines.edges.filter((e) => e.node.quantity > 0),
            },
          }
          setStoredCartCountry(cookieCountry)
          setCart(cleaned)
          tryAssociateCart(existingCart.id)
        } else {
          removeStoredCartId()
          setStoredCartCountry(null)
        }
      })
      .catch(() => {
        removeStoredCartId()
        setStoredCartCountry(null)
      })
  }, [])

  // Post-checkout cleanup: if user returns with checkout indicators, wipe the cart
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.has('checkout_complete') || url.pathname.includes('/thank-you')) {
      removeStoredCartId()
      setStoredCartCountry(null)
      cartRef.current = null
      setCart(null)
    }
  }, [])

  /** Recover from expired cart — creates a fresh cart and notifies user */
  const handleExpiredCart = useCallback(() => {
    removeStoredCartId()
    setStoredCartCountry(null)
    cartRef.current = null
    setCart(null)
    toast.error('Your cart expired', { description: 'Please add items again.' })
  }, [])

  /** Create a fresh cart and persist its ID */
  const freshCart = useCallback(async (): Promise<ShopifyCart> => {
    const newCart = await createCart()
    setStoredCartId(newCart.id)
    setStoredCartCountry(readCountryCookie())
    cartRef.current = newCart
    setCart(newCart)
    return newCart
  }, [])

  const addItem = useCallback(async (variant: ProductVariant, product: ShopifyProduct) => {
    if (mutationLock.current) return
    if (!variant?.id) {
      toast('Select a variant', { description: 'Choose a size or colour before adding to cart' })
      return
    }
    if (variant.availableForSale === false) {
      toast.error('Unavailable', { description: 'This item is out of stock' })
      return
    }
    mutationLock.current = true
    setIsLoading(true)
    try {
      let currentCart = cartRef.current
      if (!currentCart) {
        currentCart = await freshCart()
      }

      let updatedCart: ShopifyCart
      try {
        updatedCart = await addCartLines(currentCart.id, [
          { merchandiseId: variant.id, quantity: 1 },
        ])
      } catch {
        // Cart may have expired — create a fresh one and retry once
        const newCart = await freshCart()
        updatedCart = await addCartLines(newCart.id, [
          { merchandiseId: variant.id, quantity: 1 },
        ])
      }

      // Shopify returns quantity:0 when item is out of stock
      const hasRealItems = updatedCart.lines.edges.some(e => e.node.quantity > 0)
      if (!hasRealItems) {
        toast.error('Out of stock', {
          description: 'This item is not available for purchase.',
        })
        return
      }

      cartRef.current = updatedCart
      setCart(updatedCart)
      setIsOpen(true)
      toast('Added to cart', { description: product.title })
    } catch (error) {
      console.error('[Cart] addItem failed:', error)
      toast.error('Cart error', { description: 'Please try again' })
    } finally {
      mutationLock.current = false
      setIsLoading(false)
    }
  }, [freshCart])

  const removeItem = useCallback(async (lineId: string) => {
    if (!cartRef.current || mutationLock.current) return
    mutationLock.current = true
    setIsLoading(true)
    try {
      const updatedCart = await removeCartLines(cartRef.current.id, [lineId])
      cartRef.current = updatedCart
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to remove item:', error)
      // Check if cart expired
      if (String(error).includes('Cart not found') || String(error).includes('invalid')) {
        handleExpiredCart()
      } else {
        toast.error('Could not remove item', { description: 'Please try again' })
      }
    } finally {
      mutationLock.current = false
      setIsLoading(false)
    }
  }, [handleExpiredCart])

  const updateItem = useCallback(async (lineId: string, quantity: number): Promise<ShopifyCart | undefined> => {
    if (!cartRef.current || mutationLock.current) return
    // guard: if quantity drops to 0 or below, remove the line entirely
    if (quantity <= 0) {
      await removeItem(lineId)
      return cartRef.current ?? undefined
    }
    mutationLock.current = true
    setIsLoading(true)
    try {
      const updatedCart = await updateCartLines(cartRef.current.id, [{ id: lineId, quantity }])
      cartRef.current = updatedCart
      setCart(updatedCart)
      return updatedCart
    } catch (error) {
      console.error('Failed to update item:', error)
      if (String(error).includes('Cart not found') || String(error).includes('invalid')) {
        handleExpiredCart()
      } else {
        toast.error('Could not update quantity', { description: 'Please try again' })
      }
    } finally {
      mutationLock.current = false
      setIsLoading(false)
    }
  }, [removeItem, handleExpiredCart])

  /** Clear cart state (used after checkout or manual reset) */
  const clearCart = useCallback(() => {
    removeStoredCartId()
    setStoredCartCountry(null)
    cartRef.current = null
    setCart(null)
  }, [])

  const itemCount = cart?.lines.edges.reduce((total, edge) => total + edge.node.quantity, 0) ?? 0

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
