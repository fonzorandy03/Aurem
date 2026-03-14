'use client'

import { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { filterDrawer, overlayFade, ease } from '@/lib/motion'

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'best-selling'

export type Filters = {
  sizes: string[]
  colors: string[]
  priceRange: [number, number] | null
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const AVAILABLE_COLORS = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'White', value: '#fafafa' },
  { name: 'Ivory', value: '#ece5d8' },
  { name: 'Charcoal', value: '#36454f' },
  { name: 'Navy', value: '#1c2841' },
  { name: 'Camel', value: '#c4a777' },
]
const PRICE_RANGES: { label: string; value: [number, number] }[] = [
  { label: 'Under €500', value: [0, 500] },
  { label: '€500 — €1,000', value: [500, 1000] },
  { label: '€1,000 — €2,000', value: [1000, 2000] },
  { label: 'Over €2,000', value: [2000, 99999] },
]

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'New Arrivals', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
]

interface CollectionToolbarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  productCount: number
}

export function CollectionToolbar({
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  productCount,
}: CollectionToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  /* Close sort dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    if (sortOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sortOpen])

  /* Lock body scroll when filter drawer is open */
  useEffect(() => {
    document.body.style.overflow = filterOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filterOpen])

  const activeFilterCount =
    filters.sizes.length + filters.colors.length + (filters.priceRange ? 1 : 0)

  const toggleSize = (size: string) => {
    const next = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size]
    onFiltersChange({ ...filters, sizes: next })
  }

  const toggleColor = (color: string) => {
    const next = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color]
    onFiltersChange({ ...filters, colors: next })
  }

  const setPriceRange = (range: [number, number] | null) => {
    onFiltersChange({ ...filters, priceRange: range })
  }

  const clearAll = () => {
    onFiltersChange({ sizes: [], colors: [], priceRange: null })
  }

  return (
    <>
      {/* ─── Toolbar bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-5 mb-6 lg:mb-8 border-b border-foreground/[0.06]">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Filter trigger */}
          <button
            onClick={() => { setFilterOpen(true); setSortOpen(false) }}
            className="flex items-center gap-2.5 text-[10px] tracking-[0.14em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-foreground text-background text-[8px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200"
            >
              <span>Sort: {SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  className="absolute top-full left-0 mt-3 bg-background border border-foreground/[0.06] z-30 min-w-[220px] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: ease.luxury }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSortChange(opt.value); setSortOpen(false) }}
                      className={`flex items-center justify-between w-full text-left px-5 py-3.5 text-[10px] tracking-[0.1em] uppercase transition-colors duration-200 ${
                        sort === opt.value
                          ? 'text-foreground bg-foreground/[0.03]'
                          : 'text-foreground/30 hover:text-foreground hover:bg-foreground/[0.015]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sort === opt.value && <Check className="h-3 w-3" strokeWidth={2} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-[10px] tracking-[0.12em] uppercase text-foreground/20 tabular-nums hidden sm:block">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* ─── Active filter chips ──────────────────────────────────────────── */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            className="flex flex-wrap items-center gap-2 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: ease.luxury }}
          >
            {filters.sizes.map(s => (
              <button
                key={`chip-s-${s}`}
                onClick={() => toggleSize(s)}
                className="inline-flex items-center gap-1.5 border border-foreground/12 px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase text-foreground/50 hover:border-foreground/40 hover:text-foreground transition-colors duration-200"
              >
                {s}
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              </button>
            ))}
            {filters.colors.map(c => (
              <button
                key={`chip-c-${c}`}
                onClick={() => toggleColor(c)}
                className="inline-flex items-center gap-1.5 border border-foreground/12 px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase text-foreground/50 hover:border-foreground/40 hover:text-foreground transition-colors duration-200"
              >
                {c}
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              </button>
            ))}
            {filters.priceRange && (
              <button
                onClick={() => setPriceRange(null)}
                className="inline-flex items-center gap-1.5 border border-foreground/12 px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase text-foreground/50 hover:border-foreground/40 hover:text-foreground transition-colors duration-200"
              >
                {PRICE_RANGES.find(r => r.value[0] === filters.priceRange![0])?.label}
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-[9px] tracking-[0.12em] uppercase text-foreground/30 hover:text-foreground ml-2 link-underline transition-colors duration-200"
            >
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Filter Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px]"
              onClick={() => setFilterOpen(false)}
              aria-hidden="true"
              variants={overlayFade}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-[380px] bg-background flex flex-col"
              variants={filterDrawer}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-label="Filter products"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-foreground/[0.06] shrink-0">
                <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase">
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="ml-2 text-foreground/30 font-normal">({activeFilterCount})</span>
                  )}
                </h2>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="text-foreground/30 hover:text-foreground transition-colors p-1"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Filter sections */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* ── Size ─────────────────────────────── */}
                <div className="px-6 py-7">
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-5 text-foreground/40">
                    Size
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`h-11 border text-[10px] tracking-[0.1em] flex items-center justify-center transition-all duration-200 ${
                          filters.sizes.includes(size)
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-foreground/10 text-foreground/35 hover:border-foreground/35 hover:text-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mx-6 divider-line" />

                {/* ── Colour ───────────────────────────── */}
                <div className="px-6 py-7">
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-5 text-foreground/40">
                    Colour
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => toggleColor(color.name)}
                        className="flex items-center gap-3 group py-1"
                      >
                        <span
                          className={`w-6 h-6 border transition-all duration-200 shrink-0 ${
                            filters.colors.includes(color.name)
                              ? 'border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background'
                              : 'border-foreground/12 group-hover:border-foreground/35'
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                        <span className={`text-[10px] tracking-[0.1em] uppercase transition-colors duration-200 ${
                          filters.colors.includes(color.name)
                            ? 'text-foreground'
                            : 'text-foreground/30 group-hover:text-foreground'
                        }`}>
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mx-6 divider-line" />

                {/* ── Price ─────────────────────────────── */}
                <div className="px-6 py-7">
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-5 text-foreground/40">
                    Price
                  </p>
                  <div className="flex flex-col gap-2">
                    {PRICE_RANGES.map((range) => {
                      const isActive =
                        filters.priceRange?.[0] === range.value[0] &&
                        filters.priceRange?.[1] === range.value[1]
                      return (
                        <button
                          key={range.label}
                          onClick={() => setPriceRange(isActive ? null : range.value)}
                          className={`flex items-center justify-between text-left px-4 py-3 border text-[10px] tracking-[0.08em] transition-all duration-200 ${
                            isActive
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-foreground/[0.06] text-foreground/30 hover:border-foreground/25 hover:text-foreground'
                          }`}
                        >
                          <span>{range.label}</span>
                          {isActive && <Check className="h-3 w-3" strokeWidth={2} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-foreground/[0.06] flex gap-3 shrink-0">
                <button
                  onClick={clearAll}
                  disabled={activeFilterCount === 0}
                  className="flex-1 border border-foreground/15 py-3.5 text-[10px] tracking-[0.14em] uppercase text-foreground/40 hover:border-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 bg-foreground text-background py-3.5 text-[10px] tracking-[0.14em] uppercase hover:bg-foreground/90 transition-colors duration-200"
                >
                  View Results
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
