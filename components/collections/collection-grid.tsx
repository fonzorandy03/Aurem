'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, imageHover, hoverLift } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { formatMoney } from '@/lib/shopify/format-money'

/* ─── Demo catalogue ──────────────────────────────────────────────────────────
 * Used when Shopify collection is empty. Maps to actual /public/images.
 * When connected to Shopify, this entire block becomes unused.
 * ──────────────────────────────────────────────────────────────────────────── */
const demoProducts: Record<string, Array<{
  id: string
  title: string
  price: string
  image: string
  flatImage: string
  handle: string
  category: string
}>> = {
  coats: [
    { id: 'c1', title: 'Structured Wool-Blend Coat', price: '1,890.00', image: '/images/runway-1.jpg', flatImage: '/images/flat-1.jpg', handle: 'structured-wool-coat', category: 'Outerwear' },
    { id: 'c2', title: 'Oversized Technical Parka', price: '1,490.00', image: '/images/model-1.jpg', flatImage: '/images/flat-2.jpg', handle: 'oversized-nylon-parka', category: 'Outerwear' },
    { id: 'c3', title: 'Belted Trench Coat', price: '2,150.00', image: '/images/runway-1.jpg', flatImage: '/images/flat-3.jpg', handle: 'belted-trench-coat', category: 'Outerwear' },
    { id: 'c4', title: 'Technical Shell Jacket', price: '1,250.00', image: '/images/runway-2.jpg', flatImage: '/images/flat-1.jpg', handle: 'technical-shell-jacket', category: 'Outerwear' },
    { id: 'c5', title: 'Double-Breasted Wool Coat', price: '2,490.00', image: '/images/runway-3.jpg', flatImage: '/images/flat-2.jpg', handle: 'double-breasted-wool', category: 'Outerwear' },
    { id: 'c6', title: 'Quilted Down Jacket', price: '1,190.00', image: '/images/model-2.jpg', flatImage: '/images/flat-3.jpg', handle: 'quilted-down-jacket', category: 'Outerwear' },
  ],
  bags: [
    { id: 'b1', title: 'Structured Leather Tote', price: '890.00', image: '/images/moodboard-2.jpg', flatImage: '/images/moodboard-2.jpg', handle: 'structured-leather-tote', category: 'Bags' },
    { id: 'b2', title: 'Mini Crossbody Bag', price: '650.00', image: '/images/moodboard-2.jpg', flatImage: '/images/moodboard-2.jpg', handle: 'mini-crossbody', category: 'Bags' },
    { id: 'b3', title: 'Oversized Clutch', price: '490.00', image: '/images/moodboard-3.jpg', flatImage: '/images/moodboard-2.jpg', handle: 'oversized-clutch', category: 'Bags' },
    { id: 'b4', title: 'Leather Bucket Bag', price: '720.00', image: '/images/runway-4.jpg', flatImage: '/images/moodboard-2.jpg', handle: 'leather-bucket-bag', category: 'Bags' },
  ],
  jewelry: [
    { id: 'j1', title: 'Geometric Silver Earrings', price: '290.00', image: '/images/category-jewelry.jpg', flatImage: '/images/category-jewelry.jpg', handle: 'geometric-earrings', category: 'Jewelry' },
    { id: 'j2', title: 'Industrial Chain Necklace', price: '450.00', image: '/images/moodboard-1.jpg', flatImage: '/images/category-jewelry.jpg', handle: 'industrial-chain', category: 'Jewelry' },
    { id: 'j3', title: 'Sculptural Cuff Bracelet', price: '380.00', image: '/images/runway-5.jpg', flatImage: '/images/category-jewelry.jpg', handle: 'sculptural-cuff', category: 'Jewelry' },
    { id: 'j4', title: 'Minimal Bar Ring', price: '190.00', image: '/images/runway-6.jpg', flatImage: '/images/category-jewelry.jpg', handle: 'minimal-bar-ring', category: 'Jewelry' },
  ],
  accessories: [
    { id: 'a1', title: 'Leather Belt', price: '190.00', image: '/images/moodboard-3.jpg', flatImage: '/images/flat-1.jpg', handle: 'leather-belt', category: 'Accessories' },
    { id: 'a2', title: 'Technical Wool Scarf', price: '290.00', image: '/images/runway-7.jpg', flatImage: '/images/flat-2.jpg', handle: 'technical-scarf', category: 'Accessories' },
    { id: 'a3', title: 'Leather Gloves', price: '220.00', image: '/images/model-3.jpg', flatImage: '/images/flat-3.jpg', handle: 'leather-gloves', category: 'Accessories' },
  ],
  'new-arrivals': [
    { id: 'n1', title: 'Technical Nylon Tank Top', price: '790.00', image: '/images/model-1.jpg', flatImage: '/images/flat-1.jpg', handle: 'technical-nylon-tank', category: 'Tops' },
    { id: 'n2', title: 'Oversized Technical Parka', price: '1,490.00', image: '/images/model-2.jpg', flatImage: '/images/flat-2.jpg', handle: 'oversized-parka', category: 'Outerwear' },
    { id: 'n3', title: 'Fine Knit Turtleneck', price: '650.00', image: '/images/model-3.jpg', flatImage: '/images/flat-3.jpg', handle: 'fine-knit-turtleneck', category: 'Knitwear' },
    { id: 'n4', title: 'Structured Wool Coat', price: '1,890.00', image: '/images/runway-1.jpg', flatImage: '/images/flat-1.jpg', handle: 'structured-wool-coat-2', category: 'Outerwear' },
    { id: 'n5', title: 'Geometric Earrings', price: '290.00', image: '/images/category-jewelry.jpg', flatImage: '/images/category-jewelry.jpg', handle: 'geometric-earrings-2', category: 'Jewelry' },
    { id: 'n6', title: 'Mini Leather Crossbody', price: '650.00', image: '/images/moodboard-2.jpg', flatImage: '/images/moodboard-2.jpg', handle: 'mini-leather-crossbody', category: 'Bags' },
  ],
}

/* ─── Legacy handle mapping ────────────────────────────────────────────────── */
const handleAliases: Record<string, string> = {
  cappotti: 'coats',
  borse: 'bags',
  gioielli: 'jewelry',
  accessori: 'accessories',
}

/* ─── FadeImage — skeleton → image reveal ─────────────────────────────────── */
function FadeImage({ src, alt, className, priority = false }: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  return (
    <>
      <div
        className={cn(
          'absolute inset-0 bg-secondary/60 transition-opacity duration-500 ease-out',
          loaded ? 'opacity-0' : 'opacity-100'
        )}
        aria-hidden="true"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={priority}
        className={cn(
          className,
          'transition-opacity duration-500 ease-out',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={onLoad}
        onError={() => setLoaded(true)}
      />
    </>
  )
}

/* ─── Quick Add CTA ───────────────────────────────────────────────────────── */
function QuickAddButton() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none group-hover:pointer-events-auto">
      <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <button className="w-full py-3 bg-foreground text-background text-[9px] tracking-[0.18em] uppercase font-bold hover:bg-foreground/85 transition-colors duration-150 pointer-events-auto">
          Quick Add
        </button>
      </div>
    </div>
  )
}

/* ─── Product Card (Shopify) ──────────────────────────────────────────────── */
function ShopifyProductCard({ product, index }: {
  product: ShopifyProduct
  index: number
}) {
  const image = product.images.edges[0]?.node
  const secondImage = product.images.edges[1]?.node
  const price = parseFloat(product.priceRange.minVariantPrice.amount)
  const minPrice = product.priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.minVariantPrice
    ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
    : null
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice ?? null
  const isOnSale = !!(compareAt && compareAt > price)
  const category = product.productType || product.category?.name

  return (
    <motion.div variants={staggerItem}>
      <Link href={`/product/${product.handle}`} className="group block">
        {/* Image container */}
        <div className="relative mb-4 overflow-hidden">
          <motion.div
            className="relative aspect-[3/4] bg-secondary/40"
            whileHover={imageHover}
          >
            {image && (
              <FadeImage
                src={image.url}
                alt={image.altText || product.title}
                className="object-cover object-top"
                priority={index < 4}
              />
            )}

            {/* Hover tint */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.02] transition-colors duration-500" />

            {/* Sale badge */}
            {isOnSale && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-block bg-foreground text-background text-[8px] tracking-[0.18em] uppercase font-bold px-2.5 py-1">
                  Sale
                </span>
              </div>
            )}
          </motion.div>

          {/* Quick add — outside the scaling div so overflow-hidden clips correctly */}
          <QuickAddButton />

          {/* Flat secondary image overlay */}
          {secondImage && (
            <motion.div
              className="absolute bottom-3 right-3 w-14 h-[70px] md:w-16 md:h-20 overflow-hidden flat-overlay z-[5]"
              whileHover={hoverLift}
            >
              <FadeImage
                src={secondImage.url}
                alt={`${product.title} — detail`}
                className="object-contain"
              />
            </motion.div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-1.5">
          {category && (
            <p className="text-[9px] tracking-[0.18em] uppercase text-foreground/25 leading-none">
              {category}
            </p>
          )}
          <p className="text-[10px] tracking-[0.08em] uppercase text-foreground/50 leading-snug link-underline">
            {product.title}
          </p>
          <div className="flex items-center gap-2">
            <p className={cn(
              'text-[11px] font-semibold tracking-[0.06em] leading-none',
              isOnSale ? 'text-destructive' : 'text-foreground'
            )}>
              {formatMoney(minPrice.amount, minPrice.currencyCode)}
            </p>
            {isOnSale && compareAtPrice && (
              <p className="text-[10px] tracking-[0.06em] text-foreground/30 line-through leading-none">
                {formatMoney(compareAtPrice.amount, compareAtPrice.currencyCode)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── Product Card (Demo) ─────────────────────────────────────────────────── */
function DemoProductCard({ item, index }: {
  item: (typeof demoProducts)['coats'][0]
  index: number
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link href={`/product/${item.handle}`} className="group block">
        {/* Image container */}
        <div className="relative mb-4 overflow-hidden">
          <motion.div
            className="relative aspect-[3/4] bg-secondary/40"
            whileHover={imageHover}
          >
            <FadeImage
              src={item.image}
              alt={item.title}
              className="object-cover object-top"
              priority={index < 4}
            />

            {/* Hover tint */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.02] transition-colors duration-500" />
          </motion.div>

          {/* Quick add — outside the scaling div so overflow-hidden clips correctly */}
          <QuickAddButton />

          {/* Flat overlay */}
          <motion.div
            className="absolute bottom-3 right-3 w-14 h-[70px] md:w-16 md:h-20 overflow-hidden flat-overlay z-[5]"
            whileHover={hoverLift}
          >
            <FadeImage
              src={item.flatImage}
              alt={`${item.title} — flat lay`}
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* Product info */}
        <div className="space-y-1.5">
          <p className="text-[9px] tracking-[0.18em] uppercase text-foreground/25 leading-none">
            {item.category}
          </p>
          <p className="text-[10px] tracking-[0.08em] uppercase text-foreground/50 leading-snug link-underline">
            {item.title}
          </p>
          <p className="text-[13px] font-semibold tracking-[0.06em] text-foreground leading-none">
            €{item.price}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── Main Grid ───────────────────────────────────────────────────────────── */
interface CollectionGridProps {
  products: ShopifyProduct[]
  handle: string
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export function CollectionGrid({ products, handle }: CollectionGridProps) {
  const resolvedHandle = handleAliases[handle] || handle
  const demo = IS_DEMO ? (demoProducts[resolvedHandle] || demoProducts['new-arrivals']) : []

  /* ── Shopify products ─────────────────────────────────────────────────── */
  if (products.length > 0) {
    return (
      <div className="pb-24 zara-px">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14 lg:gap-x-8 lg:gap-y-16"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.3, staggerChildren: 0.07 }}
        >
          {products.map((product, i) => (
            <ShopifyProductCard
              key={product.id}
              product={product}
              index={i}
            />
          ))}
        </motion.div>

        {/* Load more — Shopify cursor-pagination hook point */}
        {products.length >= 12 && (
          <div className="flex justify-center mt-16">
            <button className="border border-foreground/15 px-10 py-3.5 text-[10px] tracking-[0.16em] uppercase text-foreground/40 hover:border-foreground hover:text-foreground transition-all duration-300">
              Load More
            </button>
          </div>
        )}
      </div>
    )
  }

  /* ── Demo products ────────────────────────────────────────────────────── */
  return (
    <div className="pb-24 zara-px">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14 lg:gap-x-8 lg:gap-y-16"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ delayChildren: 0.3, staggerChildren: 0.07 }}
      >
        {demo.map((item, i) => (
          <DemoProductCard
            key={item.id}
            item={item}
            index={i}
          />
        ))}
      </motion.div>
    </div>
  )
}
