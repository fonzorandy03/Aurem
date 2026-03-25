'use client'

import { useEffect } from 'react'
import { RequireAuth } from '@/components/auth/require-auth'
import { useCart } from '@/components/cart/cart-context'

export function CartPageClient() {
  const { openCart } = useCart()

  useEffect(() => {
    openCart()
  }, [openCart])

  return (
    <RequireAuth>
      <main className="pt-20 min-h-screen bg-background" />
    </RequireAuth>
  )
}
