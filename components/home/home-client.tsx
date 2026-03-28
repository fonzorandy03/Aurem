'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AuremFixedLayer } from '@/components/home/aurem-fixed-layer'
import { MoodboardSection } from '@/components/home/moodboard-section'
import { NewArrivalsSection } from '@/components/home/new-arrivals-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { CartPanel } from '@/components/cart/cart-panel'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface HomeClientProps {
  products: ShopifyProduct[]
  coatsImageUrl?: string | null
}

export function HomeClient({ products, coatsImageUrl }: HomeClientProps) {
  return (
    <>
      <AuremFixedLayer />
      <Header />
      <motion.main
        className="relative z-10"
        variants={pageTransition}
        initial="hidden"
        animate="visible"
      >
        <MoodboardSection />
        <NewArrivalsSection products={products} />
        <CategoriesSection coatsImageUrl={coatsImageUrl} />
      </motion.main>

      <div id="aurem-sentinel" className="h-px w-full" aria-hidden="true" />
      <Footer />
      <CartPanel />
    </>
  )
}
