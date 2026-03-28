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
      <main className="pt-20 min-h-screen bg-background zara-px max-w-3xl pb-20">
        <h1 className="text-[28px] tracking-[0.08em] uppercase mb-2">Privacy Policy</h1>
        <p className="text-[10px] tracking-[0.12em] uppercase text-foreground/45 mb-8">Last updated: March 28, 2026</p>

        <div className="space-y-7 text-[12px] leading-relaxed text-foreground/75">
          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">1. Data Controller</h2>
            <p>
              AUREM is the data controller for personal data collected through this website and related services.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">2. Data We Collect</h2>
            <p>
              We may collect identity data (name), contact data (email, shipping address), order data, and technical data
              (device/browser information, IP-derived country, and usage metrics).
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">3. Purpose and Legal Basis</h2>
            <p>
              We process personal data to provide services, fulfill orders, manage customer support, prevent fraud,
              and comply with legal obligations. Processing is based on contract performance, legitimate interests,
              legal obligations, or consent where required.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">4. Payments and Third Parties</h2>
            <p>
              Payment and checkout processing is handled by trusted third-party providers. We only receive the information
              necessary to confirm and manage transactions.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">5. Cookies and Analytics</h2>
            <p>
              We use technical cookies required for website functionality and may use analytics tools to measure traffic,
              improve performance, and optimize user experience.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">6. Data Retention</h2>
            <p>
              Personal data is retained only for as long as necessary for the purposes described in this policy,
              including legal, accounting, or dispute-resolution requirements.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, rectify, erase, restrict, or object to
              processing, and to request data portability.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">8. Security</h2>
            <p>
              We adopt reasonable technical and organizational measures to protect personal data against unauthorized access,
              loss, misuse, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">9. International Transfers</h2>
            <p>
              If personal data is transferred internationally, appropriate safeguards are applied in accordance with
              applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-[12px] tracking-[0.12em] uppercase text-foreground mb-2">10. Contact</h2>
            <p>
              For privacy requests or questions, contact: privacy@aurem.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
