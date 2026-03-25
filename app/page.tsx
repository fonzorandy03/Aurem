import { HomeClient } from '@/components/home/home-client'
import { getNewArrivals } from '@/lib/shopify'
import { resolvePricingCountryCode } from '@/lib/shopify/pricing-country'
import type { ShopifyProduct } from '@/lib/shopify/types'

export default async function HomePage() {
  let products: ShopifyProduct[] = []
  const countryCode = await resolvePricingCountryCode()

  try {
    products = await getNewArrivals({
      first: 6,
      countryCode,
    })
  } catch {
    // fallback to demo if Shopify is unavailable
  }

  return <HomeClient products={products} />
}
