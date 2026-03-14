import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { AccountPageClient } from '@/components/account/account-page-client'

export const metadata = {
  title: 'Account | AUREM',
  description: 'Accedi o crea il tuo account AUREM.',
}

export default function AccountPage() {
  return (
    <>
      <Header />
      <AccountPageClient />
      <Footer />
      <CartPanel />
    </>
  )
}
