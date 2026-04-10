function generateRandomString(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((byte) => chars[byte % chars.length])
    .join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  const binary = String.fromCharCode(...new Uint8Array(digest))

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function getAuthorizeEndpoint(): string {
  const endpoint = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_ENDPOINT?.trim()
  if (!endpoint) {
    throw new Error('Missing NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_AUTHORIZE_ENDPOINT')
  }
  return endpoint
}

function getClientId(): string {
  const clientId =
    process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID?.trim() ??
    process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID?.trim()

  if (!clientId) {
    throw new Error('Missing NEXT_PUBLIC_SHOPIFY_CLIENT_ID')
  }

  return clientId
}

function getRedirectUri(): string {
  const configured = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_REDIRECT_URI?.trim()
  if (configured) {
    return configured
  }

  return `${window.location.origin}/auth/callback`
}

export async function startLogin(): Promise<void> {
  const state = generateRandomString(16)
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  sessionStorage.setItem('oauth_state', state)
  sessionStorage.setItem('code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email customer-account-api:full',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${getAuthorizeEndpoint()}?${params.toString()}`
}
