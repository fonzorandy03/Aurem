/**
 * SearchBar — advanced Shopify autocomplete panel
 *
 * Drop-in replacement for the inline <input> in header.tsx.
 * Receives `open` + `onClose` from the header; owns all UX internally.
 *
 * ARIA: combobox pattern (role="combobox" + role="listbox")
 * Keyboard: ↑↓ navigate, Enter select / submit, Esc close
 */

'use client'

import { useEffect, useRef, useCallback, useState, useId } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, ShoppingBag } from 'lucide-react'
import { searchSlideDown } from '@/lib/motion'
import { useSearch } from '@/hooks/use-search'
import type { SearchProduct } from '@/hooks/use-search'

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function fmt(amount: string, currency: string) {
  return new Intl.NumberFormat('it-IT', {
    style:    'currency',
    currency: currency ?? 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount))
}

/** Wraps matching substrings in <mark> */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts  = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-transparent text-foreground font-semibold">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface SearchBarProps {
  open:    boolean
  onClose: () => void
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export function SearchBar({ open, onClose }: SearchBarProps) {
  const router = useRouter()
  const uid    = useId()
  const inputId   = `search-input-${uid}`
  const listboxId = `search-listbox-${uid}`

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropRef     = useRef<HTMLUListElement>(null)
  const [activeIdx, setActiveIdx] = useState(-1)

  const {
    query, setQuery,
    filteredResults, isLoading, error,
    filters, setFilters,
    availableVendors, availableTypes,
    reset,
  } = useSearch()

  const showDropdown = open && query.trim().length >= 2
  const hasResults   = filteredResults.length > 0

  /* Focus input when panel opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      reset()
      setActiveIdx(-1)
    }
  }, [open, reset])

  /* Reset active index when results change */
  useEffect(() => { setActiveIdx(-1) }, [filteredResults])

  /* ─── Close on outside click ─────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !inputRef.current?.closest('[data-search-panel]')?.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  /* ─── Submit / navigate to full results page ─────────────────────────── */
  const submitSearch = useCallback(() => {
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    onClose()
  }, [query, router, onClose])

  /* ─── Select a specific product ──────────────────────────────────────── */
  const selectProduct = useCallback((product: SearchProduct) => {
    router.push(`/product/${product.handle}`)
    onClose()
  }, [router, onClose])

  /* ─── Keyboard navigation ────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') submitSearch()
      if (e.key === 'Escape') onClose()
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, filteredResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIdx >= 0 && filteredResults[activeIdx]) {
          selectProduct(filteredResults[activeIdx])
        } else {
          submitSearch()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [showDropdown, filteredResults, activeIdx, submitSearch, onClose, selectProduct])

  /* ─── Scroll active item into view ───────────────────────────────────── */
  useEffect(() => {
    if (activeIdx < 0 || !dropRef.current) return
    const item = dropRef.current.querySelector(`[data-idx="${activeIdx}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-search-panel
          className="fixed top-0 left-0 right-0 bg-background z-[60] pointer-events-auto"
          variants={searchSlideDown}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ── Input row ──────────────────────────────────────────────── */}
          <div
            role="search"
            className="flex items-center gap-4 py-4 border-b border-foreground/10 zara-px"
          >
            <Search
              className="h-3.5 w-3.5 text-foreground/30 flex-shrink-0"
              aria-hidden
            />

            <input
              ref={inputRef}
              id={inputId}
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              aria-label="Search products"
              aria-autocomplete="list"
              aria-controls={showDropdown ? listboxId : undefined}
              aria-activedescendant={
                activeIdx >= 0 ? `${listboxId}-item-${activeIdx}` : undefined
              }
              aria-expanded={showDropdown}
              role="combobox"
              className="w-full bg-transparent text-[12px] tracking-[0.06em] outline-none placeholder:text-foreground/30 font-sans"
            />

            {isLoading && (
              <Loader2
                className="h-3.5 w-3.5 text-foreground/30 flex-shrink-0 animate-spin"
                aria-label="Searching…"
              />
            )}

            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="text-foreground/30 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="text-[10px] tracking-[0.14em] uppercase text-foreground/40 hover:text-foreground transition-colors duration-200 font-sans flex-shrink-0"
              aria-label="Close search"
            >
              CLOSE
            </button>
          </div>

          {/* ── Dropdown ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-foreground/10 max-h-[70vh] overflow-y-auto zara-px pb-6"
              >

                {/* ── Filters row ──────────────────────────────────────── */}
                {(availableVendors.length > 0 || availableTypes.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-3 pb-1" aria-label="Filter results">
                    {/* In stock toggle */}
                    <FilterChip
                      active={filters.inStockOnly}
                      onToggle={() => setFilters({ inStockOnly: !filters.inStockOnly })}
                    >
                      In stock
                    </FilterChip>

                    {/* Vendor chips */}
                    {availableVendors.map(v => (
                      <FilterChip
                        key={v}
                        active={filters.vendors.includes(v)}
                        onToggle={() =>
                          setFilters({
                            vendors: filters.vendors.includes(v)
                              ? filters.vendors.filter(x => x !== v)
                              : [...filters.vendors, v],
                          })
                        }
                      >
                        {v}
                      </FilterChip>
                    ))}

                    {/* Type chips */}
                    {availableTypes.map(t => (
                      <FilterChip
                        key={t}
                        active={filters.types.includes(t)}
                        onToggle={() =>
                          setFilters({
                            types: filters.types.includes(t)
                              ? filters.types.filter(x => x !== t)
                              : [...filters.types, t],
                          })
                        }
                      >
                        {t}
                      </FilterChip>
                    ))}
                  </div>
                )}

                {/* ── Results list ─────────────────────────────────────── */}
                {error && (
                  <p className="text-[11px] text-foreground/40 py-6 font-sans tracking-[0.06em]">
                    {error}
                  </p>
                )}

                {!error && !hasResults && !isLoading && (
                  <p className="text-[11px] text-foreground/40 py-6 font-sans tracking-[0.06em]">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                )}

                {!error && hasResults && (
                  <ul
                    ref={dropRef}
                    id={listboxId}
                    role="listbox"
                    aria-label={`Search results for ${query}`}
                    className="mt-1"
                  >
                    {filteredResults.map((product, idx) => (
                      <li
                        key={product.id}
                        id={`${listboxId}-item-${idx}`}
                        role="option"
                        data-idx={idx}
                        aria-selected={activeIdx === idx}
                        onClick={() => selectProduct(product)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`flex items-center gap-4 py-3 cursor-pointer border-b border-foreground/5 transition-colors duration-150 ${
                          activeIdx === idx ? 'bg-foreground/[0.03]' : ''
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-12 h-16 bg-foreground/5 overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image.url}
                              alt={product.image.altText ?? product.title}
                              width={48}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-foreground/20" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] tracking-[0.06em] font-sans text-foreground leading-snug truncate">
                            <HighlightMatch text={product.title} query={query} />
                          </p>
                          {product.vendor && (
                            <p className="text-[10px] tracking-[0.10em] uppercase text-foreground/35 font-sans mt-0.5">
                              {product.vendor}
                            </p>
                          )}
                          <p className="text-[11px] tracking-[0.04em] text-foreground/60 font-sans mt-1">
                            {fmt(product.price.min, product.price.currency)}
                          </p>
                        </div>

                        {/* Availability badge */}
                        <div className="flex-shrink-0 text-right">
                          {product.availableForSale ? (
                            <span className="text-[8px] tracking-[0.14em] uppercase text-foreground/40 font-sans">
                              In stock
                            </span>
                          ) : (
                            <span className="text-[8px] tracking-[0.14em] uppercase text-foreground/20 font-sans">
                              Sold out
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* ── View all link ─────────────────────────────────────── */}
                {hasResults && (
                  <div className="pt-4">
                    <Link
                      href={`/search?q=${encodeURIComponent(query.trim())}`}
                      onClick={onClose}
                      className="text-[10px] tracking-[0.18em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-200 font-sans link-underline"
                    >
                      View all results for &ldquo;{query}&rdquo; →
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Filter chip ───────────────────────────────────────────────────────── */
function FilterChip({
  active,
  onToggle,
  children,
}: {
  active: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`text-[9px] tracking-[0.14em] uppercase font-sans px-2.5 py-1 border transition-colors duration-150 ${
        active
          ? 'border-foreground text-foreground bg-foreground/5'
          : 'border-foreground/15 text-foreground/40 hover:border-foreground/40 hover:text-foreground/60'
      }`}
    >
      {children}
    </button>
  )
}
