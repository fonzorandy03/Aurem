'use client'

import { useState, useCallback } from 'react'
import Image, { type ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface AnimatedImageProps extends Omit<ImageProps, 'onLoad'> {
  wrapperClassName?: string
  /** Enable subtle blur-up effect on load */
  blurUp?: boolean
}

export function AnimatedImage({ wrapperClassName, className, alt, blurUp = false, ...props }: AnimatedImageProps) {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(() => setLoaded(true), [])

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)}>
      {/* Neutral skeleton placeholder */}
      <div
        className={cn(
          'absolute inset-0 bg-secondary transition-opacity duration-300 ease-out',
          loaded ? 'opacity-0' : 'opacity-100'
        )}
        aria-hidden="true"
      />
      {/* Image with fade-in + optional blur-up */}
      <Image
        {...props}
        alt={alt}
        className={cn(
          className,
          'transition-all duration-[320ms] ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
          blurUp && !loaded ? 'scale-[1.02] blur-[4px]' : 'scale-100 blur-0'
        )}
        onLoad={handleLoad}
      />
    </div>
  )
}
