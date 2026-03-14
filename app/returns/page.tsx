import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import Link from 'next/link'

export const metadata = {
  title: 'Returns | AUREM',
  description: 'Returns and exchange policy for AUREM',
}

const steps = [
  {
    number: '01',
    title: 'Request a Return',
    description: 'Log in to your account and select the items you wish to return from "My Orders". Alternatively, contact us by email.',
  },
  {
    number: '02',
    title: 'Pack Your Items',
    description: 'Pack the items in the original AUREM packaging. Ensure all garments are in perfect condition with all tags attached.',
  },
  {
    number: '03',
    title: 'Send the Return',
    description: 'You will receive a prepaid return label by email. Drop off the parcel at your nearest collection point within 14 days of delivery.',
  },
  {
    number: '04',
    title: 'Refund',
    description: 'Once your return is received and verified, a refund will be processed within 5–7 business days to the original payment method.',
  },
]

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <div className="max-w-3xl zara-px py-20 lg:py-32">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-3">
            Returns &amp; Exchanges
          </h1>
          <p className="text-[11px] text-muted-foreground tracking-industrial mb-16 leading-relaxed max-w-lg">
            You have 14 days from the delivery date to return your purchases. Returns are free for all orders shipped within Italy.
          </p>

          <div className="flex flex-col gap-0">
            {steps.map((step) => (
              <div key={step.number} className="border-t border-border py-8 flex gap-6">
                <span className="text-3xl font-bold text-foreground/10 tracking-tight flex-shrink-0">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-[11px] font-bold tracking-wide-industrial uppercase mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground tracking-industrial leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 mt-4 flex gap-6">
            <Link
              href="/account/orders"
              className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/"
              className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
