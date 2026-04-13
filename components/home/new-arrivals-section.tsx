'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, staggerItem, viewportOnce, imageHover, hoverLift } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { formatMoney } from '@/lib/shopify/format-money'

interface ArrivalItem {
  id: string | number
  name: string
  price: string
  modelImage: string
  flatImage: string
  href: string
}

const demoArrivals: ArrivalItem[] = [
  {
    id: 1,
    name: 'Structured Wool-Blend Coat',
    price: '790,00',
    modelImage: '/images/model-1.jpg',
    flatImage: '/images/flat-1.jpg',
    href: '/product/structured-coat',
  },
  {
    id: 2,
    name: 'Oversized Technical Parka',
    price: '1.490,00',
    modelImage: '/images/model-2.jpg',
    flatImage: '/images/flat-2.jpg',
    href: '/product/oversized-parka',
  },
  {
    id: 3,
    name: 'Fine Knit Turtleneck',
    price: '650,00',
    modelImage: '/images/model-3.jpg',
    flatImage: '/images/flat-3.jpg',
    href: '/product/fine-knit-turtleneck',
  },
]

function shopifyToArrival(product: ShopifyProduct): ArrivalItem {
  const images = product.images.edges.map(e => e.node.url)
  const minPrice = product.priceRange.minVariantPrice
  return {
    id: product.id,
    name: product.title,
    price: formatMoney(minPrice.amount, minPrice.currencyCode),
    modelImage: images[0] || '/images/model-1.jpg',
    flatImage: images[1] || images[0] || '/images/flat-1.jpg',
    href: `/product/${product.handle}`,
  }
}

/** Fade-in image with skeleton */
function FadeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
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
            className,
            'transition-opacity duration-[320ms] ease-out',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </>
  )
}

export function NewArrivalsSection({ products }: { products?: ShopifyProduct[] }) {
  const arrivals: ArrivalItem[] =
    products && products.length > 0
      ? products.slice(0, 3).map(shopifyToArrival)
      : demoArrivals

  return (
    <section className="pt-16 pb-16 lg:pt-16 lg:pb-28 bg-background">
      <div className="zara-px">
        {/* Subtle divider */}
        <div className="divider-line mb-10 lg:mb-12" />

        {/* Header */}
        <motion.div
          className="flex items-end justify-between mb-10 lg:mb-14"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <h2 className="text-5xl md:text-6xl lg:text-[5.5rem] font-bold tracking-[0.20em] uppercase leading-[0.88]">
            New
            <br />
            Arrivals
          </h2>
          <Link
            href="/collections/new-arrivals"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200 mb-2 link-underline"
          >
            <span>See All</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </motion.div>

        {/* Background Year - reduced opacity */}
        <div className="relative">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold text-foreground/[0.012] pointer-events-none select-none tracking-tight">
            2026
          </span>

          {/* Products Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {arrivals.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <Link href={item.href} className="group block">
                  {/* Model + Flat composition */}
                  <div className="relative mb-6">
                    {/* Model image with hover zoom */}
                    <motion.div
                      className="relative aspect-[3/4] bg-secondary overflow-hidden"
                    whileHover={imageHover}
                    >
                      <FadeImage
                        src={item.modelImage}
                        alt={`${item.name} — look`}
                        className="object-cover object-top"
                      />
                      {/* Subtle overlay on hover */}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.03] transition-colors duration-300" />
                    </motion.div>
                    {/* Flat image overlay — lifts 2px on card hover */}
                    <motion.div
                      className="absolute bottom-3 right-3 w-[72px] h-[90px] md:w-20 md:h-[100px] bg-card overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-foreground/[0.06] group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] transition-shadow duration-300"
                      whileHover={hoverLift}
                    >
                      <FadeImage
                        src={item.flatImage}
                        alt={`${item.name} — detail`}
                        className="object-cover object-top"
                      />
                    </motion.div>
                  </div>
                  {/* Product Info - refined spacing */}
                  <div>
                    <p className="text-[13px] font-bold tracking-[0.1em] text-foreground leading-none">
                      {item.price}
                    </p>
                    <p className="text-[10px] tracking-[0.14em] uppercase text-foreground/40 mt-2.5 link-underline">
                      {item.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
