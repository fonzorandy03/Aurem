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
    image: '/images/runway-1.jpg',
    comingSoon: false,
  },
  {
    name: 'Bags',
    href: '/collections/bags',
    image: '/images/moodboard-2.jpg',
    comingSoon: true,
  },
  {
    name: 'Jewelry',
    href: '/collections/jewelry',
    image: '/images/category-jewelry.jpg',
    comingSoon: true,
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

function ComingSoonTeaser({ name }: { name: string }) {
  return (
    <motion.div
      className="relative aspect-[3/4] overflow-hidden bg-secondary"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      whileHover={imageHover}
    >
      <div className="absolute inset-[14px] border border-foreground/[0.09]" aria-hidden="true" />
      <div className="absolute inset-[24px] border border-foreground/[0.05]" aria-hidden="true" />

      <motion.div
        className="absolute left-[24px] right-[24px] top-1/2 h-px bg-foreground/[0.08]"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 px-10 py-9 flex flex-col">
        <div className="flex items-center justify-between text-[8px] tracking-[0.24em] uppercase text-foreground/25">
          <span>Aurem</span>
          <span>Preview</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] tracking-[0.34em] uppercase text-foreground/28 mb-3">Coming Soon</p>
          <p className="text-[28px] md:text-[32px] font-bold tracking-[0.03em] uppercase text-foreground/85 leading-[0.95]">
            {name}
          </p>
        </div>

        <motion.div
          className="flex items-center gap-3"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-foreground/[0.12]" />
          <span className="text-[8px] tracking-[0.28em] uppercase text-foreground/28">Soon</span>
          <span className="h-px flex-1 bg-foreground/[0.12]" />
        </motion.div>
      </div>
    </motion.div>
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
              {cat.comingSoon ? (
                <div className="block cursor-default" aria-disabled="true">
                  <ComingSoonTeaser name={cat.name} />
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-[13px] font-bold tracking-[0.16em] uppercase text-foreground">
                      {cat.name}
                    </p>
                    <span className="text-[10px] tracking-[0.14em] text-foreground/20 uppercase">
                      View
                    </span>
                  </div>
                </div>
              ) : (
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
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
