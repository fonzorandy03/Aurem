'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import { useCart } from '@/components/cart/cart-context'
import { useAuth } from '@/components/account/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { buildLoginRedirect } from '@/lib/auth/redirect'
import { formatMoney } from '@/lib/shopify/format-money'

interface DemoProduct {
  title: string
  price: string
  description: string
  images: string[]
  colors: string[]
  sizes: string[]
}

interface ProductDetailProps {
  shopifyProduct: ShopifyProduct | null
  demo: DemoProduct
}

// Demo availability - simulate some sizes being unavailable
const UNAVAILABLE_SIZES = ['34', '44']

export function ProductDetail({ shopifyProduct, demo }: ProductDetailProps) {
  const { addItem, cart, isLoading: cartLoading } = useCart()
  const { isAuthenticated } = useAuth()
  const [currentImage, setCurrentImage] = useState(0)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [descOpen, setDescOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const onImgLoad = useCallback(() => setImgLoaded(true), [])

  // Use Shopify product data if available, otherwise demo
  const title = shopifyProduct?.title || demo.title
  const price = shopifyProduct
    ? formatMoney(
      shopifyProduct.priceRange.minVariantPrice.amount,
      shopifyProduct.priceRange.minVariantPrice.currencyCode,
    )
    : `${demo.price}\u20AC`
  const description = shopifyProduct?.description || demo.description
  const images = shopifyProduct
    ? shopifyProduct.images.edges.map(e => ({ url: e.node.url, alt: e.node.altText || title }))
    : demo.images.map(url => ({ url, alt: title }))
  const looksLikeSize  = (name: string) => ['size', 'taglia', 'sizes', 'taille', 'misura', 'formato', 'dimensione'].includes(name.toLowerCase())
  const looksLikeColor = (name: string) => ['color', 'colour', 'colore', 'colori', 'colors', 'colours'].includes(name.toLowerCase())

  // Maps raw Shopify option names to AUREM display labels
  const optionLabel = (name: string): string => {
    const n = name.toLowerCase()
    if (looksLikeSize(n))  return 'SIZE'
    if (looksLikeColor(n)) return 'COLOUR'
    return name.toUpperCase()
  }

  // ALL Shopify options — we render every single one, never drop silently
  const shopifyOptions = shopifyProduct?.options ?? []

  // For each option, track selected value in a map: { [optionName]: selectedValue }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    shopifyProduct?.options.forEach(o => { init[o.name] = o.values[0] ?? '' })
    return init
  })

  // Legacy aliases used by handleAddToCart
  const selectedSize  = selectedOptions[shopifyOptions.find(o => looksLikeSize(o.name))?.name ?? ''] ?? null
  const selectedColor = selectedOptions[shopifyOptions.find(o => looksLikeColor(o.name))?.name ?? ''] ?? null

  // Sizes for the main size selector (first size-like option, or first option if none match)
  const sizeOptionObj = shopifyOptions.find(o => looksLikeSize(o.name)) ?? shopifyOptions[0] ?? null
  const sizes = shopifyProduct ? (sizeOptionObj?.values ?? []) : demo.sizes

  const isVariantAvailable = (optName: string, optValue: string) => {
    if (!shopifyProduct) return !UNAVAILABLE_SIZES.includes(optValue)
    return shopifyProduct.variants.some(
      v => v.selectedOptions.some(o => o.name === optName && o.value === optValue) && v.availableForSale
    )
  }

  /** Find the variant that exactly matches all selected options */
  const findMatchingVariant = () => {
    if (!shopifyProduct || shopifyProduct.variants.length === 0) return null
    // Strict match: every option on the variant must match the user's selection
    return shopifyProduct.variants.find((v) =>
      v.selectedOptions.every(o => selectedOptions[o.name] === o.value)
    ) ?? null
  }

  const handleAddToCart = () => {
    if (shopifyProduct && shopifyProduct.variants.length > 0) {
      const variant = findMatchingVariant()
      if (!variant) {
        toast.error('Please select all options', { description: 'Choose size and colour before adding to cart' })
        return
      }
      if (!variant.availableForSale) {
        toast.error('Out of stock', { description: 'This combination is currently unavailable' })
        return
      }
      addItem(variant, shopifyProduct)
    } else {
      // Demo: show toast manually
      toast('Added to cart', { description: title })
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      const nextPath = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/'
      window.location.href = buildLoginRedirect(nextPath)
      return
    }

    if (!shopifyProduct || shopifyProduct.variants.length === 0) {
      toast('Added to cart', { description: title })
      return
    }
    const variant = findMatchingVariant()
    if (!variant) {
      toast.error('Please select all options', { description: 'Choose size and colour before adding to cart' })
      return
    }
    if (!variant.availableForSale) {
      toast.error('Out of stock', { description: 'This combination is currently unavailable' })
      return
    }
    setIsBuyingNow(true)
    try {
      await addItem(variant, shopifyProduct)
      // Wait a tick for cart state to update, then redirect
      await new Promise(r => setTimeout(r, 300))
      const checkoutUrl = cart?.checkoutUrl
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } finally {
      setIsBuyingNow(false)
    }
  }

  const isDisabled = cartLoading || isBuyingNow

  return (
    <>
      <motion.div
        className="zara-px py-8 lg:py-12"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Thumbnail Gallery */}
          <div className="hidden lg:flex lg:col-span-2 flex-col gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setCurrentImage(i); setImgLoaded(false) }}
                className={cn(
                  'relative aspect-[3/4] bg-transparent border-2 transition-colors',
                  currentImage === i ? 'border-foreground' : 'border-transparent'
                )}
              >
                <Image
                  src={img.url}
                  alt={`${img.alt} - thumbnail ${i + 1}`}
                  fill
                  className="object-contain"
                />
              </button>
            ))}
            {/* Navigation arrows */}
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => { setCurrentImage(Math.max(0, currentImage - 1)); setImgLoaded(false) }}
                disabled={currentImage === 0}
                className="disabled:opacity-30"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setCurrentImage(Math.min(images.length - 1, currentImage + 1)); setImgLoaded(false) }}
                disabled={currentImage === images.length - 1}
                className="disabled:opacity-30"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Center: Main Image with fade-in */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] bg-transparent overflow-hidden">
              {/* Skeleton */}
              <div
                className={cn(
                  'absolute inset-0 bg-background/60 transition-opacity duration-300 ease-out z-10',
                  imgLoaded ? 'opacity-0' : 'opacity-100'
                )}
                aria-hidden="true"
              />
              <Image
                src={images[currentImage]?.url || images[0]?.url}
                alt={images[currentImage]?.alt || title}
                fill
                className={cn(
                  'object-contain transition-opacity duration-[320ms] ease-out',
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                )}
                priority
                onLoad={onImgLoad}
              />
            </div>
            {/* Mobile thumbnails */}
            <div className="flex lg:hidden gap-2 mt-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentImage(i); setImgLoaded(false) }}
                  className={cn(
                    'relative w-16 h-20 flex-shrink-0 bg-transparent border-2 transition-colors',
                    currentImage === i ? 'border-foreground' : 'border-transparent'
                  )}
                >
                  <Image src={img.url} alt={`Thumbnail ${i + 1}`} fill className="object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5 flex flex-col pb-24 lg:pb-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-industrial uppercase leading-tight">
              {title}
            </h1>
            <p className="text-base tracking-industrial mt-3">
              {price}
            </p>

            {/* ── All Shopify options: rendered in order, no option ever dropped ── */}
            {(shopifyProduct ? shopifyOptions : [
              ...(demo.colors.length > 0 ? [{ id: 'demo-color', name: 'Colour', values: demo.colors }] : []),
              { id: 'demo-size', name: 'Size', values: demo.sizes },
            ]).map((option) => {
              const isColor = looksLikeColor(option.name)
              const current = shopifyProduct
                ? (selectedOptions[option.name] ?? option.values[0])
                : isColor
                  ? (selectedOptions[option.name] ?? option.values[0])
                  : (selectedOptions[option.name] ?? null)

              return (
                <div key={option.id} className="mt-8">
                  <p className="text-xs tracking-wide-industrial uppercase mb-3">
                    <span className="font-bold">{optionLabel(option.name)}</span>
                    {current && <span className="text-muted-foreground ml-2">{current}</span>}
                  </p>

                  {isColor ? (
                    /* ── Color swatches ── */
                    <div className="flex gap-2">
                      {option.values.map((val) => {
                        const available = isVariantAvailable(option.name, val)
                        // Extended fashion palette map for non-standard CSS color names
                        const fashionMap: Record<string, string> = {
                          'black':          '#1a1a1a',
                          'nero':           '#1a1a1a',
                          'white':          '#f8f8f8',
                          'bianco':         '#f8f8f8',
                          'off white':      '#f5f0e8',
                          'off-white':      '#f5f0e8',
                          'ivory':          '#fffff0',
                          'avorio':         '#fffff0',
                          'cream':          '#fffdd0',
                          'panna':          '#fffdd0',
                          'charcoal':       '#36454f',
                          'antracite':      '#36454f',
                          'grey':           '#9e9e9e',
                          'gray':           '#9e9e9e',
                          'grigio':         '#9e9e9e',
                          'light grey':     '#d4d4d4',
                          'light gray':     '#d4d4d4',
                          'dark grey':      '#555555',
                          'dark gray':      '#555555',
                          'beige':          '#d4c5a9',
                          'sand':           '#c2b280',
                          'sabbia':         '#c2b280',
                          'camel':          '#c19a6b',
                          'caramello':      '#c19a6b',
                          'taupe':          '#8b7355',
                          'brown':          '#795548',
                          'marrone':        '#795548',
                          'chocolate':      '#3e1f00',
                          'cioccolato':     '#3e1f00',
                          'navy':           '#1a237e',
                          'blu navy':       '#1a237e',
                          'blue':           '#1565c0',
                          'blu':            '#1565c0',
                          'light blue':     '#90caf9',
                          'cobalt':         '#0047ab',
                          'electric blue':  '#0044ff',
                          'red':            '#c62828',
                          'rosso':          '#c62828',
                          'burgundy':       '#6d1b33',
                          'bordò':          '#6d1b33',
                          'bordeaux':       '#6d1b33',
                          'wine':           '#722f37',
                          'cherry':         '#800020',
                          'blush':          '#f4a7b0',
                          'pink':           '#e91e8c',
                          'rosa':           '#f48fb1',
                          'dusty rose':     '#c2877f',
                          'green':          '#2e7d32',
                          'verde':          '#2e7d32',
                          'forest green':   '#1b5e20',
                          'military':       '#4a5240',
                          'militare':       '#4a5240',
                          'olive':          '#808000',
                          'kaki':           '#8e8c5c',
                          'khaki':          '#8e8c5c',
                          'emerald':        '#00695c',
                          'yellow':         '#fbc02d',
                          'giallo':         '#fbc02d',
                          'mustard':        '#e3a013',
                          'senape':         '#e3a013',
                          'orange':         '#e65100',
                          'arancio':        '#e65100',
                          'rust':           '#b7410e',
                          'ruggine':        '#b7410e',
                          'copper':         '#b87333',
                          'rame':           '#b87333',
                          'gold':           '#d4a017',
                          'oro':            '#d4a017',
                          'silver':         '#9e9e9e',
                          'argento':        '#9e9e9e',
                          'purple':         '#6a1b9a',
                          'viola':          '#6a1b9a',
                          'lilac':          '#b39ddb',
                          'lilla':          '#b39ddb',
                          'lavender':       '#9575cd',
                          'lavanda':        '#9575cd',
                        }
                        const key = val.toLowerCase().trim()
                        // 1. Check fashion map
                        // 2. Fall back to CSS color name directly (handles red, blue, navy, etc.)
                        // 3. Final fallback: light neutral
                        const swatchColor = fashionMap[key] ?? val
                        return (
                          <button
                            key={val}
                            onClick={() => available && setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                            disabled={!available}
                            title={val}
                            aria-label={`${option.name}: ${val}`}
                            className={cn(
                              'w-8 h-8 border-2 transition-colors',
                              !available && 'opacity-30 cursor-not-allowed',
                              current === val ? 'border-foreground' : 'border-border'
                            )}
                            style={{ backgroundColor: swatchColor }}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    /* ── Text buttons (size or any other option) ── */
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => {
                        const available = isVariantAvailable(option.name, val)
                        return (
                          <button
                            key={val}
                            onClick={() => available && setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                            disabled={!available}
                            className={cn(
                              'min-w-[3rem] h-10 px-3 border text-xs tracking-industrial flex items-center justify-center transition-colors relative',
                              !available && 'opacity-30 cursor-not-allowed',
                              current === val
                                ? 'border-foreground bg-foreground text-background'
                                : available
                                  ? 'border-border hover:border-foreground'
                                  : 'border-border'
                            )}
                          >
                            {val}
                            {!available && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="block w-[140%] h-[1px] bg-foreground/30 rotate-45 absolute" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Action Buttons (hidden on mobile - sticky bar below instead) */}
            <div className="hidden lg:flex gap-3 mt-10">
              <button
                onClick={handleBuyNow}
                disabled={isDisabled}
                className="flex-1 bg-foreground text-background py-4 text-xs tracking-wide-industrial uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {isBuyingNow ? 'Redirecting...' : 'Buy Now'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isDisabled}
                className="flex-1 border border-foreground py-4 text-xs tracking-wide-industrial uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {cartLoading && !isBuyingNow ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {/* Description Accordion */}
            <div className="mt-10 border-t border-border">
              <button
                onClick={() => setDescOpen(!descOpen)}
                className="flex items-center justify-between w-full py-4"
              >
                <span className="text-xs font-bold tracking-wide-industrial uppercase">Description</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', descOpen && 'rotate-180')} />
              </button>
              {descOpen && (
                <div className="pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed tracking-industrial">
                    {description}
                  </p>
                </div>
              )}
            </div>

            {/* Details Accordion — derived from Shopify description lines */}
            {(() => {
              const detailLines = description
                ? description.split('\n').map(l => l.trim()).filter(Boolean)
                : []
              if (detailLines.length < 2) return null
              return (
                <div className="border-t border-border">
                  <button
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    className="flex items-center justify-between w-full py-4"
                  >
                    <span className="text-xs font-bold tracking-wide-industrial uppercase">Details</span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
                  </button>
                  {detailsOpen && (
                    <div className="pb-4">
                      <ul className="text-xs text-muted-foreground leading-relaxed tracking-industrial flex flex-col gap-1.5">
                        {detailLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}

          </div>
        </div>
      </motion.div>

      {/* Sticky CTA on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t border-border px-4 py-3 flex gap-3">
        <button
          onClick={handleBuyNow}
          disabled={isDisabled}
          className="flex-1 bg-foreground text-background py-3.5 text-[10px] tracking-wide-industrial uppercase disabled:opacity-50 disabled:cursor-wait"
        >
          {isBuyingNow ? 'Redirecting...' : `Buy Now — ${price}\u20AC`}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={isDisabled}
          className="border border-foreground px-5 py-3.5 text-[10px] tracking-wide-industrial uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {cartLoading && !isBuyingNow ? '...' : 'Add'}
        </button>
      </div>
    </>
  )
}
