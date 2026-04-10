'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Completing secure sign-in...')

  useEffect(() => {
    let aborted = false

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const hasError = params.has('error') || params.has('error_description')

      if (hasError) {
        router.replace('/account?mode=login&callback_error=1')
        return
      }

      const code = params.get('code')
      const returnedState = params.get('state')
      const idToken = params.get('id_token')

      const expectedState = sessionStorage.getItem('oauth_state')
      const codeVerifier = sessionStorage.getItem('code_verifier')

      if (code && (!returnedState || !expectedState || returnedState !== expectedState)) {
        router.replace('/account?mode=login&callback_error=1')
        return
      }

      if (!code && !idToken) {
        router.replace('/account?mode=login&success=shopify-auth')
        return
      }

      setMessage('Finalizing Shopify verification...')

      try {
        const res = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            code,
            codeVerifier,
            id_token: idToken,
          }),
        })

        if (!res.ok) {
          if (!aborted) {
            router.replace('/account?mode=login&callback_error=1')
          }
          return
        }

        sessionStorage.removeItem('oauth_state')
        sessionStorage.removeItem('code_verifier')

        if (!aborted) {
          router.replace('/account?mode=login&success=shopify-auth')
        }
      } catch {
        if (!aborted) {
          router.replace('/account?mode=login&callback_error=1')
        }
      }
    }

    void handleCallback()

    return () => {
      aborted = true
    }
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="text-[11px] tracking-wide-industrial uppercase text-muted-foreground">
        {message}
      </p>
    </main>
  )
}
