import { HomeClient } from '@/components/home/home-client'
import { getCollectionProducts, getNewArrivals } from '@/lib/shopify'
import { resolvePricingCountryCode } from '@/lib/shopify/pricing-country'
import type { ShopifyProduct } from '@/lib/shopify/types'

export default async function HomePage() {
  let products: ShopifyProduct[] = []
  let coatsImageUrl: string | null = null
  const countryCode = await resolvePricingCountryCode()

  try {
    products = await getNewArrivals({
      first: 6,
      countryCode,
    })
  } catch {
    // fallback to demo if Shopify is unavailable
  }

  try {
    const tryHandles = ['coats', 'cappotti']
    for (const handle of tryHandles) {
      const coats = await getCollectionProducts({
        collection: handle,
        limit: 1,
        countryCode,
      })

      const rawImage = coats[0]?.images?.edges?.[0]?.node?.url
      const image = rawImage?.startsWith('//') ? `https:${rawImage}` : rawImage
      if (image) {
        coatsImageUrl = image
        break
      }
    }
  } catch {
    // keep local fallback image when Shopify collection image is unavailable
  }

  return <HomeClient products={products} coatsImageUrl={coatsImageUrl} />
}
