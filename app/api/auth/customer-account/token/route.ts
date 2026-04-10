import { NextRequest, NextResponse } from 'next/server'
import { CUSTOMER_ACCOUNT_ID_TOKEN_COOKIE, COOKIE_MAX_AGE } from '@/lib/auth/constants'

function getTokenEndpoint(): string | null {
  const explicit = process.env.SHOPIFY_CUSTOMER_ACCOUNT_TOKEN_ENDPOINT?.trim()
  if (explicit) {
    return explicit
  }

  const authBase = process.env.SHOPIFY_CUSTOMER_ACCOUNT_AUTH_BASE_URL?.trim()
  if (!authBase) {
    return null
  }

  return `${authBase.replace(/\/$/, '')}/oauth/token`
}

export async function POST(req: NextRequest) {
  try {
    const { code, id_token: idTokenFromClient } = await req.json()

    if (idTokenFromClient) {
      const res = NextResponse.json({ ok: true, source: 'id_token' })
      res.cookies.set(CUSTOMER_ACCOUNT_ID_TOKEN_COOKIE, idTokenFromClient, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })
      return res
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ ok: false, error: 'MISSING_CODE' }, { status: 400 })
    }

    const clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim()
    const redirectUri = process.env.SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI?.trim()
    const tokenEndpoint = getTokenEndpoint()

    if (!clientId || !redirectUri || !tokenEndpoint) {
      return NextResponse.json({ ok: false, error: 'MISSING_CONFIG' }, { status: 500 })
    }

    const codeVerifier = req.cookies.get('aurem_shopify_pkce_verifier')?.value

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    })

    if (codeVerifier) {
      body.set('code_verifier', codeVerifier)
    }

    const upstream = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })

    const data = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'TOKEN_EXCHANGE_FAILED',
          details: data,
        },
        { status: 502 },
      )
    }

    const idToken = data?.id_token
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'MISSING_ID_TOKEN' }, { status: 502 })
    }

    const res = NextResponse.json({ ok: true, source: 'code' })
    res.cookies.set(CUSTOMER_ACCOUNT_ID_TOKEN_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return res
  } catch (error) {
    console.error('[auth/customer-account/token]', error)
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
