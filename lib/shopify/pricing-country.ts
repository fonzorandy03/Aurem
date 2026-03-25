import { cookies, headers } from 'next/headers'
import { getCountryByCode, normalizeCountryCode } from '@/lib/customer-market'
import { CUSTOMER_COUNTRY_COOKIE } from '@/lib/auth/constants'

const GEO_COUNTRY_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry', 'x-country-code']

function toValidCountryCode(value: string | null | undefined): string | null {
  if (!value) return null

  const countryCode = normalizeCountryCode(value)

  if (!countryCode) return null
  if (!getCountryByCode(countryCode)) return null

  return countryCode
}

function getDefaultCountryCode(): string {
  const configuredDefault =
    process.env.DEFAULT_MARKET_COUNTRY_CODE ??
    process.env.NEXT_PUBLIC_DEFAULT_MARKET_COUNTRY_CODE ??
    'IT'

  return toValidCountryCode(configuredDefault) ?? 'IT'
}

/**
 * Resolve pricing country with this precedence:
 * 1) persisted customer country cookie
 * 2) edge/geolocation headers (if available)
 * 3) configured default (IT)
 */
export async function resolvePricingCountryCode(): Promise<string> {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const cookieCountry = toValidCountryCode(
    cookieStore.get(CUSTOMER_COUNTRY_COOKIE)?.value,
  )

  if (cookieCountry) {
    return cookieCountry
  }

  for (const headerName of GEO_COUNTRY_HEADERS) {
    const headerCountry = toValidCountryCode(headerStore.get(headerName))
    if (headerCountry) {
      return headerCountry
    }
  }

  return getDefaultCountryCode()
}
