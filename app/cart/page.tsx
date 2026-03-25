import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { CartPageClient } from '@/components/cart/cart-page-client'

export const metadata = {
  title: 'Cart | AUREM',
  description: 'Review your cart items before checkout.',
}

export default function CartPage() {
  return (
    <>
      <Header />
      <CartPageClient />
      <Footer />
      <CartPanel />
    </>
  )
}
