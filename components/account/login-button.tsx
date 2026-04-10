'use client'

import { useState } from 'react'
import { startLogin } from '@/utils/auth'

export function LoginButton({
  onError,
}: {
  onError?: (message: string) => void
}) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)
    onError?.('')
    try {
      await startLogin()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start Shopify login flow.'
      onError?.(message)
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full border border-foreground text-foreground py-4 text-[11px] tracking-wide-industrial uppercase hover:bg-foreground hover:text-background transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? 'Redirecting...' : 'Continue with Shopify'}
    </button>
  )
}
