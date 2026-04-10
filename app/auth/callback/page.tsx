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
      const idToken = params.get('id_token')

      if (!code && !idToken) {
        router.replace('/account?mode=login&success=shopify-auth')
        return
      }

      setMessage('Finalizing Shopify verification...')

      try {
        const res = await fetch('/api/auth/customer-account/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ code, id_token: idToken }),
        })

        if (!res.ok) {
          if (!aborted) {
            router.replace('/account?mode=login&callback_error=1')
          }
          return
        }

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
