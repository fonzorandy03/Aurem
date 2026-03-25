import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartPanel } from '@/components/cart/cart-panel'
import { ProductDetail } from '@/components/product/product-detail'
import { NewArrivalsSection } from '@/components/home/new-arrivals-section'
import { getNewArrivals, getProduct } from '@/lib/shopify'
import { resolvePricingCountryCode } from '@/lib/shopify/pricing-country'
import { notFound } from 'next/navigation'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Demo product data — only used when NEXT_PUBLIC_DEMO_MODE=true
const demoProducts: Record<string, {
  title: string
  price: string
  description: string
  images: string[]
  colors: string[]
  sizes: string[]
}> = {
  'structured-wool-coat': {
    title: 'Structured Wool Coat',
    price: '1.890,00',
    description: 'Cappotto in lana strutturata con spalle architettoniche. Silhouette oversize con linee nette e costruzione sartoriale. Chiusura con bottoni nascosti, tasche laterali con patta.',
    images: ['/images/category-coats.jpg', '/images/model-parka.jpg'],
    colors: ['Black', 'Charcoal'],
    sizes: ['36', '38', '40', '42'],
  },
  'oversized-nylon-parka': {
    title: 'Oversized Nylon Parka',
    price: '1.490,00',
    description: 'Parka oversize in nylon tecnico con cappuccio nascosto. Costruzione a strati con imbottitura leggera. Coulisse in vita per regolare il volume.',
    images: ['/images/model-parka.jpg', '/images/flat-parka.jpg'],
    colors: ['Black'],
    sizes: ['36', '38', '40'],
  },
  'scarf-trench-coat': {
    title: 'Scarf Trench Coat',
    price: '2.150,00',
    description: 'Trench coat con dettaglio sciarpa integrata. Taglio lungo asimmetrico in gabardine di cotone. Cintura in vita con fibbia nascosta.',
    images: ['/images/category-coats.jpg', '/images/flat-parka.jpg'],
    colors: ['Beige', 'Black'],
    sizes: ['36', '38', '40', '42'],
  },
  'technical-nylon-tank': {
    title: 'Technical Nylon Wide Tank Top',
    price: '790,00',
    description: 'Top senza maniche in nylon tecnico con taglio ampio. Costruzione minimal con cuciture a vista. Vestibilita oversize.',
    images: ['/images/model-tank.jpg', '/images/flat-tank.jpg'],
    colors: ['Black'],
    sizes: ['36', '38', '40'],
  },
  'silk-turtleneck': {
    title: 'Silk Turtleneck Top',
    price: '650,00',
    description: 'Dolcevita in seta pura con maniche lunghe oversize. Collo alto morbido. Tessuto leggero e fluido con finish opaco.',
    images: ['/images/model-turtleneck.jpg', '/images/flat-turtleneck.jpg'],
    colors: ['Black'],
    sizes: ['36', '38', '40'],
  },
}

const defaultProduct = {
  title: 'AUREM Product',
  price: '0,00',
  description: '',
  images: [] as string[],
  colors: [],
  sizes: [],
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const countryCode = await resolvePricingCountryCode()

  // Try Shopify first
  let shopifyProduct = null
  try {
    shopifyProduct = await getProduct(handle, countryCode)
  } catch (error) {
    console.error(`[ProductPage] Failed to fetch product "${handle}":`, error)
  }

  // In production (non-demo), if product not found → 404
  if (!shopifyProduct && !DEMO_MODE) {
    notFound()
  }

  let newArrivals = []
  try {
    newArrivals = await getNewArrivals({
      first: 6,
      countryCode,
      excludeHandle: handle,
      excludeProductId: shopifyProduct?.id,
      availableOnly: true,
    })
  } catch (error) {
    console.error('[ProductPage] Failed to fetch New Arrivals:', error)
  }

  const demo = DEMO_MODE ? (demoProducts[handle] || defaultProduct) : defaultProduct

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen">
        <ProductDetail
          shopifyProduct={shopifyProduct}
          demo={demo}
        />
        <NewArrivalsSection products={newArrivals} />
      </main>
      <Footer />
      <CartPanel />
    </>
  )
}
