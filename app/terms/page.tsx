import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'

export const metadata = {
  title: 'Terms of Service | AUREM',
  description: 'Terms and conditions for AUREM customers.',
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-6">Terms of Service</h1>
        <p className="text-[12px] leading-relaxed text-foreground/70">
          This page contains the terms of service for AUREM. Replace this placeholder with your final legal terms.
        </p>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
