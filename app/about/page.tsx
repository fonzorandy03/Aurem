import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { Reveal } from '@/components/ui/reveal'

export const metadata = {
  title: 'Our Story | AUREM — The Coat Society',
  description: 'AUREM is a coat-only luxury house. Built on silence, craft, and the conviction that one thing done perfectly is enough.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <CartPanel />

      <main className="pt-28 pb-32 zara-px">
        <div className="max-w-[1200px] mx-auto">

        {/* ─── I. Chapter marker ─────────────────────────────────────────── */}
        <div className="mb-14">
          <div className="w-8 h-px bg-foreground mb-8" />
          <p className="text-[9px] tracking-[0.26em] uppercase text-foreground/25">
            Our Story
          </p>
        </div>

        {/* ─── II. Opening title ─────────────────────────────────────────── */}
        <div className="max-w-3xl mb-24">
          <h1 className="text-[clamp(2.6rem,5.5vw,4.8rem)] tracking-tight uppercase leading-[1.06]">
            Quiet luxury<br />with a backbone.
          </h1>
        </div>

        {/* ─── III. Origin ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-16 mb-20 items-center">
          <Reveal className="flex flex-col gap-7" delayMs={0}>
            <p className="text-[9px] tracking-[0.22em] uppercase text-foreground/30">
              Origin
            </p>
            <div className="group relative aspect-[4/5] w-full overflow-hidden bg-foreground/5">
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                <Image
                  src="/images/our1-fixed.jpeg"
                  alt="AUREM craftsmanship tools"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </Reveal>
          <Reveal className="flex flex-col gap-5 lg:pr-6" delayMs={120}>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              AUREM comes from the Latin <em>aurum</em> — gold.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              Gold is formed under pressure. It survives time. It carries light within itself.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              AUREM is not about surface shine. It is about inner strength —
              protection without losing elegance, structure without losing softness,
              power without noise.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              Like gold, AUREM is designed to endure. To hold value beyond trends,
              beyond seasons, beyond the moment.
            </p>
          </Reveal>
        </div>

        {/* ─── IV. Pull quote ────────────────────────────────────────────── */}
        <div className="mb-20 border-l-2 border-foreground/10 pl-8">
          <blockquote className="text-[clamp(1.05rem,2.2vw,1.45rem)] leading-[1.65] tracking-[0.01em] text-foreground/70 italic">
            "In a world that accelerates, AUREM slows down.
            In a system that produces noise, AUREM builds silence.
            In an industry obsessed with novelty, AUREM chooses permanence."
          </blockquote>
        </div>

        {/* ─── V. Only Coats ─────────────────────────────────────────────── */}
        <div className="w-full h-px bg-foreground/8 mb-20" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-16 mb-20 items-center">
          <Reveal className="flex flex-col gap-7" delayMs={0}>
            <p className="text-[9px] tracking-[0.22em] uppercase text-foreground/30">
              Only Coats. Always.
            </p>
            <div className="grid grid-cols-2 gap-4 lg:gap-5 w-full items-start">
              <div className="group overflow-hidden bg-foreground/5" style={{ height: '480px' }}>
                <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                  <img
                    src="/images/our2.jpeg"
                    alt="AUREM luxury fiber texture"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="group overflow-hidden bg-foreground/5" style={{ height: '480px' }}>
                <div className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                  <img
                    src="/images/our3-v2.jpeg"
                    alt="AUREM craftsmanship tools"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal className="flex flex-col gap-5 lg:pr-6" delayMs={120}>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              AUREM was born from a radical choice: to do just one thing, and do it forever.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              AUREM is a coat-only house. Not because the coat is a garment —
              but because it is an act.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              The coat is the first gesture before going out. It protects, envelops,
              and structures the body and identity. It is the boundary between
              the world and those who pass through it.
            </p>
            <p className="text-[11px] leading-[1.85] tracking-[0.03em] text-foreground/60">
              This is why AUREM does not produce collections.
              It produces coats that are meant to last.
            </p>
          </Reveal>
        </div>

        {/* ─── VI. Pillars ───────────────────────────────────────────────── */}
        <div className="w-full h-px bg-foreground/8 mb-20" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-12 gap-y-10 mb-20">
          {[
            {
              index: '01',
              label: 'Material',
              body: 'Wool. Cashmere. Alpaca. Noble, living fibers that breathe, that weigh, that age with dignity. The material is not a detail — it is the language with which AUREM speaks.',
            },
            {
              index: '02',
              label: 'Craft as Responsibility',
              body: 'Every AUREM coat is designed to last in construction, in design, in meaning. Producing less is not a strategy. It is a responsibility. Every piece must deserve to exist.',
            },
            {
              index: '03',
              label: 'No Seasons. No Noise.',
              body: 'AUREM does not follow the calendar. Every model exists because it must. When it is ready, it arrives. When it is complete, it stays. Time is not a deadline — it is an ally.',
            },
          ].map(({ index, label, body }) => (
            <div key={index} className="flex flex-col gap-4">
              <p className="text-[9px] tracking-[0.22em] uppercase text-foreground/20">
                {index}
              </p>
              <p className="text-[9px] tracking-[0.22em] uppercase text-foreground font-bold mb-1">
                {label}
              </p>
              <div className="w-5 h-px bg-foreground/15" />
              <p className="text-[10px] leading-[1.8] tracking-[0.03em] text-foreground/50">
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* ─── VII. Closing statement ────────────────────────────────────── */}
        <div className="w-full h-px bg-foreground/8 mb-20" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-16 mb-20 items-start">
          <div className="max-w-2xl">
            <p className="text-[9px] tracking-[0.22em] uppercase text-foreground/25 mb-8">
              The Coat Society
            </p>
            <p className="text-[clamp(1rem,2vw,1.25rem)] leading-[1.7] tracking-[0.01em] text-foreground/65">
              AUREM does not target an audience.
            </p>
            <p className="text-[clamp(1rem,2vw,1.25rem)] leading-[1.7] tracking-[0.01em] text-foreground/45 mt-2">
              It speaks to those who recognize the value of weight,
              structure, and conscious choice.
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-center mt-8 lg:mt-20 lg:translate-x-15">
            <Link
              href="/collections/coats"
              className="inline-flex items-center justify-center px-6 py-3 text-[9px] tracking-[0.22em] uppercase text-foreground border border-foreground/20 hover:border-foreground/45 hover:text-foreground/75 transition-colors duration-200"
            >
              Explore the Collection
            </Link>
          </div>
        </div>

        </div>

      </main>

      <Footer />
    </>
  )
}
