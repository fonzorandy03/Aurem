'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Global fixed AUREM text — always visible in foreground at bottom.
 *
 * - position: fixed; bottom: 0; full-width centered
 * - z-index: 30 (in foreground, above page content z-10, pointer-events: none)
 * - Font stretches across full viewport width
 * - Gradient text: dark/opaque at top → lighter/transparent gray at bottom
 * - Fully visible text — never cropped or cut off
 * - Disappears only when scrolling near the footer (IntersectionObserver)
 */
export function AuremFixedLayer() {
  const [visible, setVisible] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    const sentinel = document.getElementById('aurem-sentinel')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '0px 0px 200px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        pointerEvents: 'none' as const,
        userSelect: 'none' as const,
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <motion.p
        initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
        style={{
          fontFamily: "'Xanh Mono', monospace",
          fontWeight: 400,
          /*
           * Use vw-based sizing so the word "AUREM" stretches
           * across most of the viewport width, fully visible.
           */
          fontSize: 'clamp(80px, 17vw, 340px)',
          lineHeight: 0.82,
          letterSpacing: '0.18em',
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
          margin: 0,
          padding: 0,
          /*
           * Gradient text: solid dark at top, fading to a lighter
           * semi-transparent gray at the bottom — matching reference.
           */
          background:
            'linear-gradient(to bottom, rgba(30,30,30,0.92) 0%, rgba(30,30,30,0.72) 50%, rgba(30,30,30,0.38) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        AUREM
      </motion.p>
    </div>
  )
}
