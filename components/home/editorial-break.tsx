'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { fadeUp, textStaggerContainer, textReveal, viewportOnce } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface EditorialBreakProps {
  image: string
  alt: string
  title?: string
  subtitle?: string
  /** Position of overlay text */
  textAlign?: 'left' | 'center' | 'right'
}

export function EditorialBreak({
  image,
  alt,
  title = 'COLLECTION 26',
  subtitle = 'The Coat Society',
  textAlign = 'left',
}: EditorialBreakProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  const onError = useCallback(() => setError(true), [])

  return (
    <motion.section
      className="relative w-full bg-white"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {/* Full-width image with generous vertical ratio */}
      <div className="relative w-full aspect-[16/7] md:aspect-[16/6] lg:aspect-[16/5] overflow-hidden">
        {/* Skeleton */}
        {!error && (
          <div
            className={cn(
              'absolute inset-0 bg-neutral-100 transition-opacity duration-300 ease-out',
              loaded ? 'opacity-0' : 'opacity-100'
            )}
            aria-hidden="true"
          />
        )}
        {error ? (
          <div className="absolute inset-0 bg-neutral-100" aria-hidden="true" />
        ) : (
          <Image
            src={image}
            alt={alt}
            fill
            className={cn(
              'object-cover transition-opacity duration-[400ms] ease-out',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={onLoad}
            onError={onError}
          />
        )}
        {/* Subtle gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />

        {/* Text overlay — subtitle then headline via stagger */}
        <motion.div
          className={cn(
            'absolute bottom-0 left-0 right-0 zara-px pb-8 md:pb-10 lg:pb-14',
            textAlign === 'center' && 'text-center',
            textAlign === 'right' && 'text-right'
          )}
          variants={textStaggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.p
            className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-background/50 font-medium"
            variants={textReveal}
          >
            {subtitle}
          </motion.p>
          <motion.h2
            className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-[0.04em] uppercase text-background leading-none mt-2"
            variants={textReveal}
          >
            {title}
          </motion.h2>
        </motion.div>
      </div>
    </motion.section>
  )
}
