import { cookies, headers } from 'next/headers'
import { getCountryByCode, normalizeCountryCode } from '@/lib/customer-market'
import { CUSTOMER_COUNTRY_COOKIE } from '@/lib/auth/constants'

export const GEO_COUNTRY_HEADERS = [
  'x-vercel-ip-country',
  'cf-ipcountry',
  'x-country-code',
] as const

export type GeoCountryHeader = (typeof GEO_COUNTRY_HEADERS)[number]

export type ResolvedMarket = {
  countryCode: string
  source: 'cookie' | 'header' | 'default'
}

function toValidCountryCode(value: string | null | undefined): string | null {
  if (!value) return null

  const countryCode = normalizeCountryCode(value)

  if (!countryCode) return null
  if (!getCountryByCode(countryCode)) return null

  return countryCode
}

export function getDefaultCountryCode(): string {
  const configuredDefault =
    process.env.DEFAULT_MARKET_COUNTRY_CODE ??
    process.env.NEXT_PUBLIC_DEFAULT_MARKET_COUNTRY_CODE ??
    'IT'

  return toValidCountryCode(configuredDefault) ?? 'IT'
}

export function resolveCountryCodeFromHeaders(
  getHeader: (header: GeoCountryHeader) => string | null | undefined,
): string | null {
  for (const headerName of GEO_COUNTRY_HEADERS) {
    const headerCountry = toValidCountryCode(getHeader(headerName))
    if (headerCountry) return headerCountry
  }

  return null
}

export function resolveMarketFromValues(params: {
  cookieCountryCode?: string | null
  getHeader?: (header: GeoCountryHeader) => string | null | undefined
}): ResolvedMarket {
  const cookieCountry = toValidCountryCode(params.cookieCountryCode)
  if (cookieCountry) {
    return { countryCode: cookieCountry, source: 'cookie' }
  }

  if (params.getHeader) {
    const headerCountry = resolveCountryCodeFromHeaders(params.getHeader)
    if (headerCountry) {
      return { countryCode: headerCountry, source: 'header' }
    }
  }

  return { countryCode: getDefaultCountryCode(), source: 'default' }
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

  return resolveMarketFromValues({
    cookieCountryCode: cookieStore.get(CUSTOMER_COUNTRY_COOKIE)?.value,
    getHeader: (headerName) => headerStore.get(headerName),
  }).countryCode
}
