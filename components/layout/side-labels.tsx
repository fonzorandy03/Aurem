'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Fixed vertical side labels — luxury editorial detail.
 * Left: season label "SS 26" rotated vertically
 * Right: thin scroll-progress line
 */
export function SideLabels() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight <= 0) return
      setScrollProgress(Math.min(scrollTop / scrollHeight, 1))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return null

  return (
    <div className="hidden lg:contents">
      {/* Left — vertical season label */}
      <motion.div
        aria-hidden="true"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 1.0 }}
        style={{
          position: 'fixed',
          left: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        {/* Top tick */}
        <div style={{ width: 1, height: 28, background: 'rgba(15,15,15,0.12)' }} />
        {/* Rotated text */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'rgba(15,15,15,0.22)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            lineHeight: 1,
            fontFamily: "'Geist', system-ui, sans-serif",
          }}
        >
          SS 26
        </span>
        {/* Bottom tick */}
        <div style={{ width: 1, height: 28, background: 'rgba(15,15,15,0.12)' }} />
      </motion.div>

      {/* Right — scroll progress track + fill */}
      <motion.div
        aria-hidden="true"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
        style={{
          position: 'fixed',
          right: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Track */}
        <div
          style={{
            width: 1,
            height: 80,
            background: 'rgba(15,15,15,0.10)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${scrollProgress * 100}%`,
              background: 'rgba(15,15,15,0.45)',
              transition: 'height 80ms linear',
            }}
          />
        </div>

        {/* Percentage label */}
        <span
          style={{
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: 'rgba(15,15,15,0.20)',
            fontFamily: "'Geist', system-ui, sans-serif",
            lineHeight: 1,
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {String(Math.round(scrollProgress * 100)).padStart(2, '0')}
        </span>
      </motion.div>
    </div>
  )
}
