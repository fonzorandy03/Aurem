import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'

export const metadata = {
  title: 'Privacy Policy | AUREM',
  description: 'Privacy information for AUREM customers.',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-6">Privacy Policy</h1>
        <p className="text-[12px] leading-relaxed text-foreground/70">
          This page provides information about how personal data is handled on AUREM. Replace this placeholder with your legal text.
        </p>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
