import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'

export const metadata = {
  title: 'Sustainability | AUREM',
  description: 'AUREM sustainability commitments and materials policy.',
}

export default function SustainabilityPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-6">Sustainability</h1>
        <p className="text-[12px] leading-relaxed text-foreground/70">
          This page outlines AUREM sustainability commitments. Replace this placeholder with your finalized policy content.
        </p>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
