import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { Shield, Lock, CreditCard, RefreshCw } from 'lucide-react'

export const metadata = {
  title: 'Secure Payments | AUREM',
  description: 'Payment methods and security information for AUREM',
}

const paymentMethods = [
  { name: 'Visa', label: 'VISA' },
  { name: 'Mastercard', label: 'MASTERCARD' },
  { name: 'American Express', label: 'AMEX' },
  { name: 'Apple Pay', label: 'APPLE PAY' },
  { name: 'Google Pay', label: 'GOOGLE PAY' },
  { name: 'Shop Pay', label: 'SHOP PAY' },
  { name: 'PayPal', label: 'PAYPAL' },
]

const features = [
  {
    icon: Shield,
    title: 'Secure Checkout',
    description: 'Every transaction is protected by 256-bit SSL encryption via Shopify Checkout — the most advanced security standard available.',
  },
  {
    icon: Lock,
    title: 'Data Protection',
    description: 'We never store your card details. All payment information is handled directly by Shopify Payments.',
  },
  {
    icon: CreditCard,
    title: 'Payment Methods',
    description: 'We accept all major credit cards, Apple Pay, Google Pay, Shop Pay, and PayPal for your convenience.',
  },
  {
    icon: RefreshCw,
    title: 'Guaranteed Refunds',
    description: 'Upon approval of a return, your refund will be processed within 5–7 business days to the original payment method.',
  },
]

export default function PaymentsPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <div className="max-w-3xl zara-px py-20 lg:py-32">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-3">
            Secure Payments
          </h1>
          <p className="text-[11px] text-muted-foreground tracking-industrial mb-16 leading-relaxed max-w-lg">
            Your security is our priority. All payments are processed through Shopify Checkout with the highest security standards.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-3">
                <feature.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                <h3 className="text-[11px] font-bold tracking-wide-industrial uppercase">
                  {feature.title}
                </h3>
                <p className="text-[11px] text-muted-foreground tracking-industrial leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="border-t border-border pt-12">
            <h2 className="text-[11px] font-bold tracking-wide-industrial uppercase mb-6">
              Accepted Methods
            </h2>
            <div className="flex flex-wrap gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="border border-border px-4 py-3 text-[10px] tracking-wide-industrial uppercase text-muted-foreground"
                >
                  {method.label}
                </div>
              ))}
            </div>
          </div>

          {/* PCI compliance */}
          <div className="border-t border-border pt-12 mt-12">
            <p className="text-[10px] text-muted-foreground tracking-industrial leading-relaxed">
              AUREM uses Shopify Checkout, certified PCI DSS Level 1, to ensure the highest security for every transaction. Sensitive data is encrypted end-to-end and is never stored on our servers.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
