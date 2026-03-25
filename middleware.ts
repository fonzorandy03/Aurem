import { NextResponse, type NextRequest } from 'next/server'
import { CUSTOMER_TOKEN_COOKIE } from './lib/auth/constants'

export function middleware(request: NextRequest) {
  const token = request.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
    loginUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*'],
}
