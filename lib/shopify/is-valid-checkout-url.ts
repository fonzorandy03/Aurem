function normalizeHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
}

export function isValidCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false

    const host = parsed.hostname.toLowerCase()
    const appHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : ''
    const storeHost = normalizeHost(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? '')

    // Shopify can return checkout URLs on different domains depending on setup:
    // myshopify domain, checkout.shopify.com, custom storefront domain, or current app domain.
    if (
      host.endsWith('.myshopify.com') ||
      host.endsWith('.shopify.com') ||
      host === 'checkout.shopify.com' ||
      (storeHost && host === storeHost) ||
      (appHost && host === appHost)
    ) {
      return true
    }

    // Fallback for custom checkout domains: require canonical Shopify checkout paths.
    return parsed.pathname.includes('/checkouts/') || parsed.pathname.startsWith('/cart/c/')
  } catch {
    return false
  }
}
