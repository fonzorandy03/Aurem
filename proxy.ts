import { NextResponse, type NextRequest } from 'next/server'
import {
  COUNTRY_COOKIE_MAX_AGE,
  CUSTOMER_COUNTRY_COOKIE,
  CUSTOMER_TOKEN_COOKIE,
} from './lib/auth/constants'
import { resolveMarketFromValues } from './lib/shopify/pricing-country'

function withCountryCookie(
  request: NextRequest,
  response: NextResponse,
  countryCode: string,
) {
  const currentCookie = request.cookies.get(CUSTOMER_COUNTRY_COOKIE)?.value ?? ''

  if (currentCookie === countryCode) {
    return response
  }

  response.cookies.set(CUSTOMER_COUNTRY_COOKIE, countryCode, {
    httpOnly: false,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: COUNTRY_COOKIE_MAX_AGE,
  })

  return response
}

export function proxy(request: NextRequest) {
  const resolvedMarket = resolveMarketFromValues({
    cookieCountryCode: request.cookies.get(CUSTOMER_COUNTRY_COOKIE)?.value,
    getHeader: (headerName) => request.headers.get(headerName),
  })

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/cart') ||
    request.nextUrl.pathname.startsWith('/checkout')

  const token = request.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
    loginUrl.searchParams.set('next', nextPath)

    return withCountryCookie(
      request,
      NextResponse.redirect(loginUrl),
      resolvedMarket.countryCode,
    )
  }

  return withCountryCookie(
    request,
    NextResponse.next(),
    resolvedMarket.countryCode,
  )
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
}
