import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import Link from 'next/link'

export const metadata = {
  title: 'Shipping | AUREM',
  description: 'Shipping and delivery information for AUREM orders',
}

const shippingInfo = [
  {
    title: 'Standard Shipping — Italy',
    time: '3–5 business days',
    cost: 'Free on orders over €300',
  },
  {
    title: 'Express Shipping — Italy',
    time: '1–2 business days',
    cost: '€15.00',
  },
  {
    title: 'Europe',
    time: '5–7 business days',
    cost: '€25.00 — Free over €500',
  },
  {
    title: 'International',
    time: '7–14 business days',
    cost: '€45.00',
  },
]

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <div className="max-w-3xl zara-px py-20 lg:py-32">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-3">
            Shipping
          </h1>
          <p className="text-[11px] text-muted-foreground tracking-industrial mb-16 leading-relaxed max-w-lg">
            Every order is carefully packaged and shipped in AUREM premium packaging.
          </p>

          <div className="flex flex-col gap-0">
            {shippingInfo.map((item) => (
              <div key={item.title} className="border-t border-border py-8">
                <h3 className="text-[11px] font-bold tracking-wide-industrial uppercase mb-2">
                  {item.title}
                </h3>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground tracking-industrial">
                    {item.time}
                  </p>
                  <p className="text-[11px] tracking-industrial">
                    {item.cost}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8 mt-4">
            <p className="text-[10px] text-muted-foreground tracking-industrial leading-relaxed mb-8">
              All orders are processed within 24–48 hours of payment confirmation. You will receive a tracking email as soon as your parcel is dispatched.
            </p>
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
