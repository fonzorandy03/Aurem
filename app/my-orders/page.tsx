import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { OrdersList } from '@/components/account/orders-list'
import { RequireAuth } from '@/components/auth/require-auth'

export const metadata = {
  title: 'My Orders | AUREM',
  description: 'View and manage your AUREM orders',
}

export default function MyOrdersPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <RequireAuth>
          <OrdersList />
        </RequireAuth>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
