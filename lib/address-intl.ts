import { City, State } from 'country-state-city'

export interface AddressOption {
  code: string
  name: string
}

const subdivisionCache = new Map<string, AddressOption[]>()
const cityCache = new Map<string, AddressOption[]>()

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function getSubdivisions(countryCode: string): AddressOption[] {
  const code = countryCode.trim().toUpperCase()
  if (!code) return []

  const cached = subdivisionCache.get(code)
  if (cached) return cached

  const subdivisions = State.getStatesOfCountry(code).map((state) => ({
    code: state.isoCode,
    name: state.name,
  }))

  subdivisionCache.set(code, subdivisions)
  return subdivisions
}

export function findSubdivisionCode(countryCode: string, subdivisionName: string): string | null {
  const match = getSubdivisions(countryCode).find(
    (subdivision) => normalize(subdivision.name) === normalize(subdivisionName),
  )
  return match?.code ?? null
}

export function getCities(countryCode: string, subdivisionCode?: string | null): AddressOption[] {
  const country = countryCode.trim().toUpperCase()
  if (!country) return []

  const regionCode = subdivisionCode?.trim().toUpperCase() ?? ''
  const cacheKey = `${country}:${regionCode}`
  const cached = cityCache.get(cacheKey)
  if (cached) return cached

  const rawCities = (regionCode
    ? City.getCitiesOfState(country, regionCode)
    : City.getCitiesOfCountry(country)) ?? []

  const unique = new Map<string, AddressOption>()

  for (const city of rawCities) {
    const name = city.name.trim()
    if (!name) continue
    const key = normalize(name)
    if (!unique.has(key)) {
      unique.set(key, { code: key, name })
    }
  }

  const cities = Array.from(unique.values())
  cityCache.set(cacheKey, cities)
  return cities
}

export function filterOptions(options: AddressOption[], query: string, limit = 80): AddressOption[] {
  const q = normalize(query)
  if (!q) return options.slice(0, limit)

  const startsWith = options.filter((option) => normalize(option.name).startsWith(q))
  const includes = options.filter((option) => !normalize(option.name).startsWith(q) && normalize(option.name).includes(q))

  return [...startsWith, ...includes].slice(0, limit)
}

export function getRegionLabel(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()

  if (code === 'US') return 'State'
  if (code === 'BR') return 'State'
  if (code === 'IN') return 'State'
  if (code === 'JP') return 'Prefecture'
  if (code === 'GB' || code === 'IE') return 'County'
  if (code === 'AE') return 'Emirate'

  return 'Province / Region'
}

export function getPostalLabel(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()

  if (code === 'US') return 'ZIP Code'
  if (code === 'IN') return 'PIN Code'
  if (code === 'BR') return 'CEP'
  if (code === 'GB') return 'Postcode'

  return 'Postal Code'
}

export async function suggestPostalCode(params: {
  countryCode: string
  countryName: string
  city: string
  region?: string
  signal?: AbortSignal
}): Promise<string | null> {
  const countryCode = params.countryCode.trim().toLowerCase()
  const city = params.city.trim()
  const region = params.region?.trim()

  if (!countryCode || !city) return null

  const query = [city, region, params.countryName].filter(Boolean).join(', ')

  const searchParams = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: countryCode,
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: params.signal,
  })

  if (!response.ok) return null

  const payload = (await response.json()) as Array<{ address?: { postcode?: string } }>

  const postcodes = new Set(
    payload
      .map((entry) => entry.address?.postcode?.trim())
      .filter((value): value is string => Boolean(value && value.length >= 3)),
  )

  if (postcodes.size !== 1) return null
  return Array.from(postcodes)[0]
}
