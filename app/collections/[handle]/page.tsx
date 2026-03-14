import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { CollectionPageClient } from '@/components/collections/collection-page-client'
import { CollectionHero } from '@/components/collections/collection-hero'
import { getCollectionProducts } from '@/lib/shopify'
import { notFound } from 'next/navigation'

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

/* ─── Collection metadata ─────────────────────────────────────────────────── */
const collectionMeta: Record<string, {
  title: string
  subtitle: string
  description: string
  image: string
}> = {
  coats: {
    title: 'COATS',
    subtitle: 'FW26 Collection',
    description: 'Structured silhouettes in premium wools and technical fabrics. Architectural outerwear designed for the modern wardrobe.',
    image: '/images/category-coats.jpg',
  },
  bags: {
    title: 'BAGS',
    subtitle: 'Essential Accessories',
    description: 'Structured leather goods with clean geometric lines. Timeless forms in quality materials.',
    image: '/images/category-bags.jpg',
  },
  jewelry: {
    title: 'JEWELRY',
    subtitle: 'Fine Objects',
    description: 'Geometric pieces in precious metals. Minimal design with industrial precision.',
    image: '/images/category-jewelry.jpg',
  },
  accessories: {
    title: 'ACCESSORIES',
    subtitle: 'The Details',
    description: 'Minimal accessories to complete every look. Essential design, premium materials.',
    image: '/images/moodboard-3.jpg',
  },
  'new-arrivals': {
    title: 'NEW ARRIVALS',
    subtitle: 'SS26 Season',
    description: 'The latest from this season. Discover the newest additions to the collection.',
    image: '/images/model-1.jpg',
  },
}

/* Legacy Italian handles → English */
const handleRedirects: Record<string, string> = {
  cappotti: 'coats',
  borse: 'bags',
  gioielli: 'jewelry',
  accessori: 'accessories',
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const resolvedHandle = handleRedirects[handle] || handle
  const meta = collectionMeta[resolvedHandle] || {
    title: resolvedHandle.replace(/-/g, ' ').toUpperCase(),
    subtitle: 'Collection',
    description: '',
    image: '/images/editorial-break.jpg',
  }

  let products: Awaited<ReturnType<typeof getCollectionProducts>> = []
  try {
    products = await getCollectionProducts({ collection: resolvedHandle, limit: 24 })
  } catch (error) {
    console.error(`[Collection] Failed to fetch "${resolvedHandle}":`, error)
    if (!IS_DEMO) {
      // In production, empty products → collection-grid shows nothing (no fake demo data)
    }
  }

  // If no products and not in demo mode, show 404
  if (products.length === 0 && !IS_DEMO) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="pt-10 min-h-screen">
        {/* Collection hero header */}
        <CollectionHero
          title={meta.title}
          subtitle={meta.subtitle}
          description={meta.description}
          image={meta.image}
          productCount={products.length}
        />

        {/* Products grid + toolbar */}
        <CollectionPageClient products={products} handle={resolvedHandle} />
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
