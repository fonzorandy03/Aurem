'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/account/auth-context'
import { buildLoginRedirect } from '@/lib/auth/redirect'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    const query = searchParams.toString()
    const nextPath = query ? `${pathname}?${query}` : pathname
    router.replace(buildLoginRedirect(nextPath))
  }, [isAuthenticated, isLoading, pathname, router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
