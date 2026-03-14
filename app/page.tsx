import { HomeClient } from '@/components/home/home-client'
import { getProducts } from '@/lib/shopify'
import type { ShopifyProduct } from '@/lib/shopify/types'

export default async function HomePage() {
  let products: ShopifyProduct[] = []
  try {
    products = await getProducts({ first: 6, sortKey: 'CREATED_AT', reverse: true })
  } catch {
    // fallback to demo if Shopify is unavailable
  }

  return <HomeClient products={products} />
}
