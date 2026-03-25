import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { CheckoutPageClient } from '@/components/cart/checkout-page-client'

export const metadata = {
  title: 'Checkout | AUREM',
  description: 'Secure checkout for your AUREM order.',
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutPageClient />
      <Footer />
      <CartPanel />
    </>
  )
}
