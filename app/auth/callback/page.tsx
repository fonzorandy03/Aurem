'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  const target = useMemo(() => {
    if (typeof window === 'undefined') {
      return '/account?mode=login'
    }

    const params = new URLSearchParams(window.location.search)
    const hasError = params.has('error') || params.has('error_description')

    if (hasError) {
      return '/account?mode=login&callback_error=1'
    }

    return '/account?mode=login&success=shopify-auth'
  }, [])

  useEffect(() => {
    router.replace(target)
  }, [router, target])

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="text-[11px] tracking-wide-industrial uppercase text-muted-foreground">
        Completing secure sign-in...
      </p>
    </main>
  )
}
