'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem, fadeUp } from '@/lib/motion'
import type { SearchProduct } from '@/app/api/search/route'
import { formatMoney } from '@/lib/shopify/format-money'

/* ─── Price formatter ───────────────────────────────────────────────────── */
function fmt(amount: string, currency: string) {
  return formatMoney(amount, currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/* ─── Filter pill ────────────────────────────────────────────────────────── */
function FilterChip({
  active, onToggle, children,
}: {
  active: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`text-[8.5px] tracking-[0.18em] uppercase font-sans px-3 py-1.5 border transition-all duration-300 select-none cursor-pointer ${
        active
          ? 'border-foreground/60 text-foreground bg-foreground/[0.04]'
          : 'border-foreground/12 text-foreground/35 hover:text-foreground/60 hover:border-foreground/30'
      }`}
    >
      {children}
    </button>
  )
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-foreground/5" style={{ aspectRatio: '3/4' }} />
      <div className="pt-3 space-y-2">
        <div className="h-[8px] w-1/3 bg-foreground/5" />
        <div className="h-[12px] w-3/4 bg-foreground/[0.07]" />
        <div className="h-[10px] w-1/4 bg-foreground/5" />
      </div>
    </div>
  )
}

/* ─── Product card ───────────────────────────────────────────────────────── */
function ProductCard({ product }: { product: SearchProduct }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  return (
    <motion.div variants={staggerItem} className="group">
      <Link href={`/product/${product.handle}`} className="block">
        {/* Image — 3:4 portrait, contain so full garment is visible */}
        <div className="relative overflow-hidden bg-[#f5f4f2]" style={{ aspectRatio: '3/4' }}>
          {product.image ? (
            <>
              <div className={`absolute inset-0 bg-[#eeede9] transition-opacity duration-500 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} />
              <Image
                src={product.image.url}
                alt={product.image.altText ?? product.title}
                fill
                onLoad={() => setImgLoaded(true)}
                className={`object-contain object-[center_top] transition-transform duration-200 ease-out group-hover:scale-[1.02] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-foreground/10" />
            </div>
          )}
          {!product.availableForSale && (
            <div className="absolute bottom-0 left-0 right-0 py-2 px-3">
              <span className="text-[8px] tracking-[0.20em] uppercase text-foreground/45 font-sans">Sold out</span>
            </div>
          )}
        </div>

        {/* Product info — minimal, no card container */}
        <div className="pt-3">
          <p className="text-[12px] tracking-[0.02em] text-foreground font-sans leading-snug mb-1.5 line-clamp-2">
            {product.title}
          </p>
          <span className="text-[11px] tracking-[0.04em] text-foreground/55 font-sans">
            {fmt(product.price.min, product.price.currency)}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── Inner page (reads from useSearchParams) ───────────────────────────── */
function SearchResultsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') ?? ''

  const [products,    setProducts]    = useState<SearchProduct[]>([])
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [cursor,      setCursor]      = useState<string | null>(null)
  const [hasMore,     setHasMore]     = useState(false)

  const [inStockOnly, setInStockOnly] = useState(false)
  const [selVendors,  setSelVendors]  = useState<string[]>([])
  const [selTypes,    setSelTypes]    = useState<string[]>([])

  const allVendors = Array.from(new Set(products.map(p => p.vendor).filter(Boolean))).slice(0, 5)
  const allTypes   = Array.from(new Set(products.map(p => p.productType).filter(Boolean))).slice(0, 5)

  const fetchPage = useCallback(async (query: string, after?: string) => {
    const params = new URLSearchParams({ q: query, first: '16' })
    if (after) params.set('after', after)
    const res = await fetch(`/api/search?${params}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return res.json() as Promise<{
      products: SearchProduct[]
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }>
  }, [])

  useEffect(() => {
    if (!q.trim()) { setProducts([]); setLoading(false); return }
    setLoading(true)
    setError(null)
    setProducts([])
    setCursor(null)
    setHasMore(false)
    setInStockOnly(false)
    setSelVendors([])
    setSelTypes([])
    fetchPage(q)
      .then(data => {
        setProducts(data.products)
        setHasMore(data.pageInfo.hasNextPage)
        setCursor(data.pageInfo.endCursor)
      })
      .catch(() => setError('Search unavailable. Please try again.'))
      .finally(() => setLoading(false))
  }, [q, fetchPage])

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage(q, cursor)
      setProducts(prev => [...prev, ...data.products])
      setHasMore(data.pageInfo.hasNextPage)
      setCursor(data.pageInfo.endCursor)
    } catch { /* silent */ }
    finally { setLoadingMore(false) }
  }

  const visible = products
    .filter(p => !inStockOnly || p.availableForSale)
    .filter(p => selVendors.length === 0 || selVendors.includes(p.vendor))
    .filter(p => selTypes.length   === 0 || selTypes.includes(p.productType))

  const hasFilters = inStockOnly || selVendors.length > 0 || selTypes.length > 0
  const showFilters = products.length > 0

  return (
    <main className="min-h-screen bg-background">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="pt-[60px] pb-6 zara-px"
      >
        <div className="mb-4">
          <Link
            href="/"
            className="text-[8.5px] tracking-[0.22em] uppercase text-foreground/25 hover:text-foreground/60 transition-colors font-sans"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="text-[12px] tracking-[0.15em] uppercase text-foreground/30 font-sans mb-3">
          Search results
        </p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h1 className="font-sans text-[clamp(2rem,4.5vw,2.75rem)] tracking-[-0.01em] leading-none text-foreground uppercase">
            {q || <span className="text-foreground/15">—</span>}
          </h1>
          {!loading && visible.length > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-[12px] tracking-[0.15em] uppercase text-foreground/30 font-sans self-end pb-0.5"
            >
              {visible.length}&thinsp;{visible.length === 1 ? 'item' : 'items'}
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="zara-px py-4 border-b border-foreground/8 flex flex-wrap items-center gap-2"
            aria-label="Refine results"
          >
            <span className="text-[8px] tracking-[0.22em] uppercase text-foreground/20 font-sans mr-2 hidden sm:block">
              Refine
            </span>

            <FilterChip active={inStockOnly} onToggle={() => setInStockOnly(v => !v)}>
              In stock
            </FilterChip>

            {allVendors.map(v => (
              <FilterChip
                key={v}
                active={selVendors.includes(v)}
                onToggle={() =>
                  setSelVendors(prev =>
                    prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
                  )
                }
              >
                {v}
              </FilterChip>
            ))}

            {allTypes.map(t => (
              <FilterChip
                key={t}
                active={selTypes.includes(t)}
                onToggle={() =>
                  setSelTypes(prev =>
                    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                  )
                }
              >
                {t}
              </FilterChip>
            ))}

            {hasFilters && (
              <button
                onClick={() => { setInStockOnly(false); setSelVendors([]); setSelTypes([]) }}
                className="text-[8px] tracking-[0.18em] uppercase text-foreground/25 hover:text-foreground/55 font-sans transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="zara-px pt-8 pb-24">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-20 flex flex-col gap-5">
            <p className="text-[11px] text-foreground/40 font-sans tracking-[0.06em]">{error}</p>
            <Link href="/" className="text-[9px] tracking-[0.18em] uppercase text-foreground/35 hover:text-foreground transition-colors font-sans link-underline">
              Return home
            </Link>
          </div>
        )}

        {/* No query */}
        {!loading && !error && !q.trim() && (
          <div className="py-32 text-center">
            <p className="text-[10px] tracking-[0.20em] uppercase text-foreground/20 font-sans">
              Begin your search above
            </p>
          </div>
        )}

        {/* No results — filters active */}
        {!loading && !error && q.trim() && visible.length === 0 && products.length > 0 && (
          <div className="py-20">
            <p className="text-[11px] text-foreground/40 font-sans tracking-[0.04em] mb-4">
              No items match the selected filters.
            </p>
            <button
              onClick={() => { setInStockOnly(false); setSelVendors([]); setSelTypes([]) }}
              className="text-[9px] tracking-[0.18em] uppercase text-foreground/35 hover:text-foreground transition-colors font-sans link-underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* No results — no products at all */}
        {!loading && !error && q.trim() && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="py-16 md:py-24 max-w-[620px]"
          >
            {/* Title */}
            <h2 className="text-[11px] tracking-[0.18em] uppercase text-foreground/70 font-sans mb-3">
              No results for &ldquo;{q}&rdquo;
            </h2>

            {/* Supporting copy */}
            <p className="text-[12px] tracking-[0.03em] text-foreground/30 font-sans leading-relaxed mb-10">
              Try a different term, or explore our collections below.
            </p>

            {/* Divider */}
            <div className="w-10 h-px bg-foreground/10 mb-10" />

            {/* Actions */}
            <div className="flex items-center gap-6 mb-12">
              <button
                onClick={() => router.push('/search')}
                className="text-[9px] tracking-[0.20em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200 font-sans link-underline"
              >
                Clear search
              </button>
              <Link
                href="/"
                className="text-[9px] tracking-[0.20em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200 font-sans link-underline"
              >
                Back to home
              </Link>
            </div>

            {/* Explore categories */}
            <p className="text-[9px] tracking-[0.22em] uppercase text-foreground/20 font-sans mb-5">
              Explore
            </p>
            <div className="flex flex-wrap gap-x-7 gap-y-3">
              {[
                { label: 'Coats', href: '/collections/coats' },
                { label: 'Bags', href: '/collections/bags' },
                { label: 'Jewelry', href: '/collections/jewelry' },
                { label: 'Accessories', href: '/collections/accessories' },
                { label: 'New Arrivals', href: '/collections/new-arrivals' },
              ].map(cat => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="text-[11px] tracking-[0.10em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-200 font-sans link-underline"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Product grid */}
        {!loading && visible.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10"
          >
            {visible.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}

        {/* Load more — editorial rule-style button */}
        {!loading && hasMore && visible.length > 0 && (
          <div className="mt-20 flex flex-col items-center gap-4">
            <div className="w-full border-t border-foreground/8" />
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="group flex items-center gap-4 py-2 text-[9px] tracking-[0.24em] uppercase font-sans text-foreground/35 hover:text-foreground transition-colors duration-300 disabled:pointer-events-none"
            >
              {loadingMore ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="block w-6 h-[0.5px] bg-current transition-all duration-300 group-hover:w-10" />
              )}
              <span>{loadingMore ? 'Loading' : 'Continue'}</span>
              {!loadingMore && (
                <span className="block w-6 h-[0.5px] bg-current transition-all duration-300 group-hover:w-10" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM SIGNATURE ────────────────────────────────────────────── */}
      <div className="zara-px py-8 border-t border-foreground/8 flex items-center justify-end">
        <p className="text-[8px] tracking-[0.18em] uppercase text-foreground/12 font-sans">
          Aurem — The Coat Society
        </p>
      </div>
    </main>
  )
}

/* ─── Page export ────────────────────────────────────────────────────────── */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-[60px] zara-px">
          <div className="pb-6">
            <div className="h-[9px] w-28 bg-foreground/5 animate-pulse mb-3" />
            <div className="h-10 w-64 bg-foreground/[0.06] animate-pulse" />
          </div>
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      }
    >
      <SearchResultsInner />
    </Suspense>
  )
}
