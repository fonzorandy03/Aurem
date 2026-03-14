import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { OrderDetailClient } from './client'

export const metadata = {
  title: 'Order Details | AUREM',
  description: 'View your order details',
}

export default function OrderDetailPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <OrderDetailClient />
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
