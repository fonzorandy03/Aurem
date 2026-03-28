import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'

export const metadata = {
  title: 'Contact | AUREM',
  description: 'Contact AUREM support and customer care.',
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-6">Contact</h1>
        <p className="text-[12px] leading-relaxed text-foreground/70">
          For support requests, write to support@aurem.com. Replace this with your official contacts.
        </p>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
