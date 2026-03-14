'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, staggerItem, viewportOnce, imageHover } from '@/lib/motion'
import { cn } from '@/lib/utils'

const categories = [
  {
    name: 'Coats',
    href: '/collections/coats',
    image: '/images/category-coats.jpg',
  },
  {
    name: 'Bags',
    href: '/collections/bags',
    image: '/images/category-bags.jpg',
  },
  {
    name: 'Jewelry',
    href: '/collections/jewelry',
    image: '/images/category-jewelry.jpg',
  },
]

function CategoryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  const onError = useCallback(() => setError(true), [])
  return (
    <>
      {!error && (
        <div
          className={cn(
            'absolute inset-0 bg-neutral-100 transition-opacity duration-300 ease-out',
            loaded ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        />
      )}
      {error ? (
        <div className="absolute inset-0 bg-neutral-100" aria-hidden="true" />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            'object-cover object-top transition-opacity duration-[320ms] ease-out',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </>
  )
}

export function CategoriesSection() {
  return (
    <section className="pt-16 pb-20 lg:pt-20 lg:pb-28 bg-background">
      <div className="zara-px">
        {/* Subtle divider */}
        <div className="divider-line mb-10 lg:mb-12" />

        <motion.h2
          className="text-[10px] font-bold tracking-[0.18em] uppercase mb-10 lg:mb-12 text-foreground/50"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          Explore Collections
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {categories.map((cat) => (
            <motion.div key={cat.name} variants={staggerItem}>
              <Link href={cat.href} className="group block">
                <motion.div
                  className="relative aspect-[3/4] overflow-hidden bg-secondary"
                  whileHover={imageHover}
                >
                  <CategoryImage src={cat.image} alt={cat.name} />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.04] transition-colors duration-300" />
                </motion.div>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-[13px] font-bold tracking-[0.16em] uppercase text-foreground link-underline">
                    {cat.name}
                  </p>
                  <span className="text-[10px] tracking-[0.14em] text-foreground/20 uppercase">
                    View
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
