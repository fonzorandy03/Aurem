/**
 * useSearch — advanced Shopify search hook
 *
 * Features:
 *  - 280ms debounce (avoids API spam)
 *  - AbortController (cancels in-flight requests)
 *  - Client-side in-memory cache (keyed by query:filters, 60 s TTL)
 *  - Client-side facet filters over fetched results (inStock, vendor, type)
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { SearchProduct } from '@/app/api/search/route'

export type { SearchProduct }

export interface SearchFilters {
  inStockOnly: boolean
  vendors: string[]
  types: string[]
}

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: SearchProduct[]
  filteredResults: SearchProduct[]
  isLoading: boolean
  error: string | null
  filters: SearchFilters
  setFilters: (f: Partial<SearchFilters>) => void
  availableVendors: string[]
  availableTypes: string[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
  reset: () => void
}

/* ─── Client cache ───────────────────────────────────────────────────────── */
const CLIENT_CACHE_TTL = 60_000
const clientCache = new Map<string, { ts: number; data: SearchProduct[] }>()

function getClientCache(key: string): SearchProduct[] | null {
  const hit = clientCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > CLIENT_CACHE_TTL) { clientCache.delete(key); return null }
  return hit.data
}
function setClientCache(key: string, data: SearchProduct[]) {
  if (clientCache.size >= 100) {
    const first = clientCache.keys().next().value
    if (first) clientCache.delete(first)
  }
  clientCache.set(key, { ts: Date.now(), data })
}

const DEFAULT_FILTERS: SearchFilters = {
  inStockOnly: false,
  vendors:     [],
  types:       [],
}

const DEBOUNCE_MS   = 280
const MIN_QUERY_LEN = 2
const AUTOCOMPLETE_COUNT = 8

export function useSearch(): UseSearchReturn {
  const [query,   setQueryRaw]  = useState('')
  const [results, setResults]   = useState<SearchProduct[]>([])
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [filters, setFiltersRaw] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [pageInfo, setPageInfo]  = useState<{ hasNextPage: boolean; endCursor: string | null }>({
    hasNextPage: false,
    endCursor: null,
  })

  const abortRef  = useRef<AbortController | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q)
  }, [])

  const setFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFiltersRaw(prev => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setQueryRaw('')
    setResults([])
    setError(null)
    setFiltersRaw(DEFAULT_FILTERS)
  }, [])

  /* ─── Debounced fetch ────────────────────────────────────────────────── */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (abortRef.current)  abortRef.current.abort()

    if (query.trim().length < MIN_QUERY_LEN) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      const cacheKey = query.trim().toLowerCase()
      const cached   = getClientCache(cacheKey)

      if (cached) {
        setResults(cached)
        setLoading(false)
        return
      }

      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        const params = new URLSearchParams({
          q:     query.trim(),
          first: String(AUTOCOMPLETE_COUNT),
        })
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal })

        if (!res.ok) throw new Error(`Search error ${res.status}`)

        const json = await res.json()
        const prods: SearchProduct[] = json.products ?? []

        setClientCache(cacheKey, prods)
        setResults(prods)
        setPageInfo(json.pageInfo ?? { hasNextPage: false, endCursor: null })
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return
        setError('Search unavailable')
      } finally {
        setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  /* ─── Derived facet options ──────────────────────────────────────────── */
  const availableVendors = useMemo(() => {
    const set = new Set<string>()
    results.forEach(p => { if (p.vendor) set.add(p.vendor) })
    return Array.from(set).slice(0, 5)
  }, [results])

  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    results.forEach(p => { if (p.productType) set.add(p.productType) })
    return Array.from(set).slice(0, 5)
  }, [results])

  /* ─── Client-side filtered results ──────────────────────────────────── */
  const filteredResults = useMemo(() => {
    let r = results
    if (filters.inStockOnly)       r = r.filter(p => p.availableForSale)
    if (filters.vendors.length)    r = r.filter(p => filters.vendors.includes(p.vendor))
    if (filters.types.length)      r = r.filter(p => filters.types.includes(p.productType))
    return r
  }, [results, filters])

  return {
    query,
    setQuery,
    results,
    filteredResults,
    isLoading: loading,
    error,
    filters,
    setFilters,
    availableVendors,
    availableTypes,
    pageInfo,
    reset,
  }
}
