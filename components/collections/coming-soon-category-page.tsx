import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { CollectionHero } from '@/components/collections/collection-hero'

interface ComingSoonCategoryPageProps {
  title: string
  subtitle: string
  description: string
  image: string
}

export function ComingSoonCategoryPage({
  title,
  subtitle,
  description,
  image,
}: ComingSoonCategoryPageProps) {
  return (
    <>
      <Header />
      <main className="pt-10 min-h-screen">
        <CollectionHero
          title={title}
          subtitle={subtitle}
          description={description}
          image={image}
          productCount={0}
        />

        <section className="zara-px pb-24 lg:pb-32">
          <div className="divider-line mb-10 lg:mb-12" />
          <div className="min-h-[30vh] md:min-h-[34vh] flex items-center justify-center">
            <div className="w-full max-w-[760px] border border-foreground/[0.08] px-7 md:px-10 py-10 md:py-12">
              <div className="border border-foreground/[0.05] px-6 md:px-8 py-9 md:py-10">
                <div className="flex items-center justify-between text-[8px] tracking-[0.22em] uppercase text-foreground/25">
                  <span>Aurem</span>
                  <span>Collection Preview</span>
                </div>

                <div className="my-7 md:my-8 h-px bg-foreground/[0.09]" aria-hidden="true" />

                <div className="text-center">
                  <p className="text-[10px] md:text-[11px] tracking-[0.34em] uppercase text-foreground/35">
                    Coming Soon
                  </p>
                  <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-[0.03em] uppercase leading-[0.95] text-foreground/85">
                    {title}
                  </h2>
                </div>

                <div className="my-7 md:my-8 h-px bg-foreground/[0.09]" aria-hidden="true" />

                <p className="text-center text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-foreground/28">
                  Available Soon Online
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
