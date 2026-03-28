'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/require-auth'
import { useCart } from '@/components/cart/cart-context'

function isValidCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && (
      parsed.hostname.endsWith('.myshopify.com') ||
      parsed.hostname.endsWith('.shopify.com') ||
      parsed.hostname === 'checkout.shopify.com'
    )
  } catch {
    return false
  }
}

export function CheckoutPageClient() {
  const router = useRouter()
  const { cart, isLoading } = useCart()

  useEffect(() => {
    if (isLoading) return
    if (!cart?.checkoutUrl) {
      router.replace('/cart')
      return
    }

    if (!isValidCheckoutUrl(cart.checkoutUrl)) {
      router.replace('/cart')
      return
    }

    void (async () => {
      try {
        if (cart.id) {
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
            return
          }
        }

        window.location.href = cart.checkoutUrl
      } catch {
        window.location.href = cart.checkoutUrl
      }
    })()
  }, [cart, isLoading, router])

  return (
    <Suspense fallback={<main className="pt-20 min-h-screen bg-background" />}>
      <RequireAuth>
        <main className="pt-20 min-h-screen bg-background flex items-center justify-center">
          <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground animate-pulse">
            Redirecting to checkout...
          </span>
        </main>
      </RequireAuth>
    </Suspense>
  )
}
