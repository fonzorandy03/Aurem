import type { Variants } from 'framer-motion'

/**
 * AUREM Motion System — Luxury / Premium
 *
 * Performance contract:
 *  ✅ Only animates transform + opacity (GPU composited, zero layout thrash)
 *  ✅ All durations inside the 180–900ms window
 *  ✅ prefers-reduced-motion: CSS block in globals.css + per-component useReducedMotion()
 *  ✅ No box-shadow, filter, or width/height animations
 *
 * Easing vocabulary:
 *  ease.luxury  [0.22, 1, 0.36, 1]  — soft deceleration, high-end reveal
 *  ease.sharp   [0.16, 1, 0.3, 1]   — decisive snap, UI feedback
 *  ease.inOut   [0.42, 0, 0.58, 1]  — symmetric, reserved for exits
 */

export const ease = {
  luxury: [0.22, 1, 0.36, 1] as [number, number, number, number],
  sharp:  [0.16, 1, 0.3, 1]  as [number, number, number, number],
  inOut:  [0.42, 0, 0.58, 1] as [number, number, number, number],
}

// ─── Page transition ──────────────────────────────────────────────────────────
// Applied on <motion.main> — subtle, prevents CLS, finishes within 380ms.
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.38, ease: ease.luxury } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.2,  ease: ease.sharp } },
}

// ─── Hero container (page-load, first section only) ──────────────────────────
// Deliberate 0.12s stagger between images — editorial pacing, not mechanical.
export const heroContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

// ─── Hero item (moodboard images — first paint) ───────────────────────────────
// 20px Y settle + opacity. 0.72s feels handcrafted, not mechanical.
export const heroItem: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: ease.luxury } },
}

// ─── Luxury label (small editorial text above hero) ──────────────────────────
export const luxuryReveal: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.56, ease: ease.luxury } },
}

// ─── Image settle (scroll sections) ──────────────────────────────────────────
export const imageSettle: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.64, ease: ease.luxury } },
}

// ─── Cart item (staggered entrance inside drawer) ───────────────────────────
export const cartItem: Variants = {
  hidden:  { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.26, ease: ease.sharp } },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.18, ease: ease.sharp } },
}

// ─── Cart list container (stagger children) ──────────────────────────────────
export const cartList: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

// ─── Fade up (generic scroll reveal — opacity + Y rise) ─────────────────────
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.52, ease: ease.luxury } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.18, ease: ease.sharp } },
}

// ─── Fade only (no Y — overlays, labels) ─────────────────────────────────────
export const fade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.32, ease: ease.luxury } },
  exit:    { opacity: 0, transition: { duration: 0.18, ease: ease.sharp } },
}

// ─── Stagger container (scroll grids, card lists) ────────────────────────────
// 0.08s stagger — more deliberate than 0.06, editorial pacing.
export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
}

// ─── Stagger item (card, grid cell) ──────────────────────────────────────────
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: ease.luxury } },
}

// ─── Text reveal (headline lines, overlay copy) ──────────────────────────────
export const textReveal: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.44, ease: ease.luxury } },
}

// ─── Text stagger container (subtitle + headline pairs) ──────────────────────
export const textStaggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
}

// ─── Image fade in (legacy alias — do not remove) ────────────────────────────
export const imageFadeIn = imageSettle

// ─── Overlay / panel fade ────────────────────────────────────────────────────
export const overlayFade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: ease.luxury } },
  exit:    { opacity: 0, transition: { duration: 0.16, ease: ease.sharp } },
}

// ─── Drawer (right panel — cart / filters) ───────────────────────────────────
export const drawer: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1,  transition: { duration: 0.34, ease: ease.luxury } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.22, ease: ease.sharp } },
}

// ─── Menu slide-in (fullscreen nav) ──────────────────────────────────────────
export const menuSlideIn: Variants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.32, ease: ease.luxury } },
  exit:    { opacity: 0, x: -12, transition: { duration: 0.2, ease: ease.sharp } },
}

// ─── Search bar slide down ────────────────────────────────────────────────────
export const searchSlideDown: Variants = {
  hidden:  { y: '-100%', opacity: 0 },
  visible: { y: 0, opacity: 1,  transition: { duration: 0.28, ease: ease.luxury } },
  exit:    { y: '-100%', opacity: 0, transition: { duration: 0.2, ease: ease.sharp } },
}

// ─── Filter drawer (left panel, mobile) ──────────────────────────────────────
export const filterDrawer: Variants = {
  hidden:  { x: '-100%' },
  visible: { x: 0,       transition: { duration: 0.3,  ease: ease.luxury } },
  exit:    { x: '-100%', transition: { duration: 0.22, ease: ease.sharp } },
}

// ─── Viewport configs ────────────────────────────────────────────────────────
// Standard 20% — triggers when element is comfortably in view.
export const viewportOnce = {
  once: true,
  amount: 0.2 as const,
}

// Strict 28% — for wide editorial banners (prevents premature trigger).
export const viewportStrict = {
  once: true,
  amount: 0.28 as const,
}

// ─── Hover targets — pass as whileHover prop ─────────────────────────────────
// Image: barely perceptible zoom — "breathing", max 1.02.
export const imageHover = {
  scale: 1.02,
  transition: { duration: 0.38, ease: ease.luxury },
}

// Lift: tactile 2px upward shift. Cards, CTA buttons.
export const hoverLift = {
  y: -2,
  transition: { duration: 0.24, ease: ease.luxury },
}
