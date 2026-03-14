'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { heroContainer, heroItem, luxuryReveal } from '@/lib/motion'

interface CollectionHeroProps {
  title: string
  subtitle: string
  description: string
  image: string
  productCount: number
}

export function CollectionHero({
  title,
  subtitle,
  description,
  productCount,
}: CollectionHeroProps) {
  return (
    <motion.section
      className="zara-px"
      variants={heroContainer}
      initial="hidden"
      animate="visible"
    >
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <motion.nav
        variants={luxuryReveal}
        className="flex items-center gap-2 pt-4 pb-5 md:pt-5 md:pb-6"
        aria-label="Breadcrumb"
      >
        <Link
          href="/"
          className="text-[9px] tracking-[0.16em] uppercase text-foreground/25 hover:text-foreground transition-colors duration-200"
        >
          Home
        </Link>
        <span className="text-[9px] text-foreground/15">/</span>
        <span className="text-[9px] tracking-[0.16em] uppercase text-foreground/50">
          {title}
        </span>
      </motion.nav>

      {/* ── Text header — full width ──────────────────────────────────────── */}
      <div className="pb-12 lg:pb-14">
        <motion.p
          variants={luxuryReveal}
          className="text-[9px] tracking-[0.22em] uppercase text-foreground/25 mb-4"
        >
          {subtitle}
        </motion.p>

        <motion.h1
          variants={heroItem}
          className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight uppercase leading-[0.9] mb-6"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            variants={luxuryReveal}
            className="text-[11px] text-foreground/35 tracking-[0.04em] leading-relaxed max-w-xl"
          >
            {description}
          </motion.p>
        )}

        {/* Divider + count */}
        <motion.div variants={luxuryReveal} className="mt-8 lg:mt-10">
          <div className="divider-line mb-4" />
          <p className="text-[9px] tracking-[0.18em] uppercase text-foreground/20 tabular-nums">
            {productCount > 0
              ? `${productCount} ${productCount === 1 ? 'piece' : 'pieces'}`
              : 'Explore Collection'}
          </p>
        </motion.div>
      </div>
    </motion.section>
  )
}
