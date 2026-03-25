import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { AccountPageClient } from '@/components/account/account-page-client'

export const metadata = {
  title: 'Login | AUREM',
  description: 'Accedi al tuo account AUREM per continuare.',
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <AccountPageClient />
      <Footer />
      <CartPanel />
    </>
  )
}
