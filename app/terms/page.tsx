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
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl pb-20">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-2">Terms of Service</h1>
        <p className="text-[10px] tracking-[0.12em] uppercase text-foreground/45 mb-8">Last updated: March 28, 2026</p>

        <div className="space-y-7 text-[12px] leading-relaxed text-foreground/75">
          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">1. Scope</h2>
            <p>
              These Terms of Service govern access to and use of the AUREM website and services, including product browsing,
              purchases, and customer account features.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">2. Eligibility</h2>
            <p>
              By placing an order, you confirm that the information provided is accurate and that you are legally able to enter
              into a binding agreement under applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">3. Products and Pricing</h2>
            <p>
              Product descriptions, availability, and prices are shown on the website and may be updated at any time.
              We reserve the right to correct any pricing or typographical error before order acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">4. Orders and Acceptance</h2>
            <p>
              Submitting an order request does not guarantee acceptance. An order is considered accepted only after confirmation
              by AUREM and successful payment authorization.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">5. Payments</h2>
            <p>
              Payments are processed through secure third-party providers. You agree to provide valid payment details and authorize
              the corresponding charges for purchases and related fees.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">6. Shipping and Delivery</h2>
            <p>
              Estimated delivery times are indicative and may vary depending on destination, customs processing, or courier delays.
              Risk of loss passes to the customer upon delivery.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">7. Returns and Refunds</h2>
            <p>
              Returns are handled according to the published return policy. Refunds are issued to the original payment method,
              subject to inspection and eligibility conditions.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">8. Intellectual Property</h2>
            <p>
              All content on this website, including trademarks, designs, images, and text, is owned by or licensed to AUREM.
              Unauthorized use, reproduction, or distribution is prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, AUREM is not liable for indirect, incidental, or consequential damages
              arising from use of the website or services.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">10. Governing Law</h2>
            <p>
              These Terms are governed by applicable laws of the jurisdiction in which AUREM operates, without prejudice to
              mandatory consumer protections.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">11. Contact</h2>
            <p>
              For legal or service inquiries regarding these Terms, contact: support@aurem.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
