'use client'

import { useState, useMemo } from 'react'
import { CollectionToolbar, type SortOption, type Filters } from './collection-toolbar'
import { CollectionGrid } from './collection-grid'
import type { ShopifyProduct } from '@/lib/shopify/types'

/* Demo product counts — should match the demo arrays in collection-grid.tsx */
const DEMO_COUNTS: Record<string, number> = {
  coats: 6,
  bags: 4,
  jewelry: 4,
  accessories: 3,
  'new-arrivals': 6,
  /* legacy Italian handles */
  cappotti: 6,
  borse: 4,
  gioielli: 4,
  accessori: 3,
}

interface CollectionPageClientProps {
  products: ShopifyProduct[]
  handle: string
}

export function CollectionPageClient({ products, handle }: CollectionPageClientProps) {
  const [sort, setSort] = useState<SortOption>('newest')
  const [filters, setFilters] = useState<Filters>({
    sizes: [],
    colors: [],
    priceRange: null,
  })

  /* ── Sort Shopify products client-side ────────────────────────────────── */
  const sortedProducts = useMemo(() => {
    if (products.length === 0) return products

    const sorted = [...products]
    switch (sort) {
      case 'price-asc':
        sorted.sort(
          (a, b) =>
            parseFloat(a.priceRange.minVariantPrice.amount) -
            parseFloat(b.priceRange.minVariantPrice.amount)
        )
        break
      case 'price-desc':
        sorted.sort(
          (a, b) =>
            parseFloat(b.priceRange.minVariantPrice.amount) -
            parseFloat(a.priceRange.minVariantPrice.amount)
        )
        break
      default:
        // 'newest' / 'best-selling' — keep API order
        break
    }

    /* ── Client-side filter (for Shopify products with real metadata) ──── */
    return sorted.filter((product) => {
      // Size filter
      if (filters.sizes.length > 0) {
        const productSizes = product.options
          .find((o) => o.name.toLowerCase() === 'size')
          ?.values.map((v) => v.toUpperCase()) || []
        if (!filters.sizes.some((s) => productSizes.includes(s.toUpperCase()))) return false
      }

      // Color filter
      if (filters.colors.length > 0) {
        const productColors = product.options
          .find((o) => o.name.toLowerCase() === 'color')
          ?.values.map((v) => v.toLowerCase()) || []
        if (!filters.colors.some((c) => productColors.map((pc) => pc).includes(c.toLowerCase()))) return false
      }

      // Price filter
      if (filters.priceRange) {
        const price = parseFloat(product.priceRange.minVariantPrice.amount)
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false
      }

      return true
    })
  }, [products, sort, filters])

  /* Show accurate count for both Shopify and demo */
  const productCount =
    products.length > 0 ? sortedProducts.length : (DEMO_COUNTS[handle] || 4)

  return (
    <>
      <div className="zara-px">
        <CollectionToolbar
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onFiltersChange={setFilters}
          productCount={productCount}
        />
      </div>
      <CollectionGrid products={sortedProducts} handle={handle} />
    </>
  )
}
