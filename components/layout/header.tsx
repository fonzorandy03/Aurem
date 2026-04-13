'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/components/cart/cart-context'
import { useAuth } from '@/components/account/auth-context'
import { motion, AnimatePresence } from 'framer-motion'
import { fade, menuSlideIn, staggerItem } from '@/lib/motion'
import { SearchBar } from '@/components/layout/search-bar'
import { buildLoginRedirect } from '@/lib/auth/redirect'

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface NavCategory {
  name: string
  href: string
  children?: { name: string; href: string }[]
}

const categories: NavCategory[] = [
  { name: 'Coats', href: '/collections/coats' },
  { name: 'Bags', href: '/bags' },
  { name: 'Jewelry', href: '/jewelry' },
]

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-[10px] tracking-[0.14em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-200 font-sans link-underline"
    >
      {children}
    </Link>
  )
}

function NavButton({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] tracking-[0.14em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-200 font-sans link-underline"
      aria-label={label}
    >
      {children}
    </button>
  )
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const { openCart, itemCount } = useCart()
  const { customer, isAuthenticated } = useAuth()

  const handleMyOrdersNavigation = () => {
    setMenuOpen(false)
    router.push(isAuthenticated ? '/my-orders' : buildLoginRedirect('/my-orders'))
  }

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    let lastY = window.scrollY
    const threshold = 80

    const handleScroll = () => {
      const currentY = window.scrollY
      if (menuOpen || searchOpen) {
        setHeaderVisible(true)
        lastY = currentY
        return
      }
      if (currentY > threshold && currentY > lastY) {
        setHeaderVisible(false)
      } else if (currentY < lastY) {
        setHeaderVisible(true)
      }
      lastY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [menuOpen, searchOpen])

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
      >
        {/* Top-left: Hamburger - refined thinner lines */}
        <motion.div
          className="absolute top-4 left-6 md:left-12 lg:left-[5vw] 2xl:left-[6vw] pointer-events-auto"
          animate={{ opacity: headerVisible ? 1 : 0, y: headerVisible ? 0 : -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: headerVisible ? 'auto' : 'none' }}
        >
          <button
            onClick={() => {
              setMenuOpen(!menuOpen)
              setSearchOpen(false)
            }}
            className="flex flex-col gap-[5px] group w-8"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span
              className={`block h-[1px] bg-foreground transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'w-7 translate-y-[5px] rotate-45' : 'w-7'
              }`}
            />
            <span
              className={`block h-[1px] bg-foreground transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'opacity-0 w-0' : 'w-4 group-hover:w-7'
              }`}
            />
            <span
              className={`block h-[1px] bg-foreground transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                menuOpen ? 'w-7 -translate-y-[5px] -rotate-45' : 'w-7'
              }`}
            />
          </button>
        </motion.div>

        {/* Right side nav: stacked vertically */}
        <motion.div
          className="fixed right-6 md:right-10 lg:right-[2.5vw] 2xl:right-[3vw] top-0 h-screen flex flex-col items-end justify-center gap-3.5 pointer-events-auto z-50"
          animate={{ opacity: headerVisible ? 1 : 0, x: headerVisible ? 0 : 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: headerVisible ? 'auto' : 'none' }}
        >
          <button
            onClick={() => {
              if (!isAuthenticated) {
                router.push(buildLoginRedirect('/cart'))
                return
              }
              openCart()
            }}
            className="flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase text-foreground/50 hover:text-foreground transition-colors duration-200 font-sans group"
            aria-label="Cart"
          >
            <span className="link-underline">CART</span>
            <span className="inline-flex items-center justify-center border border-foreground/30 group-hover:border-foreground w-[17px] h-[17px] transition-colors duration-200">
              <span className="text-[8px] tracking-normal font-medium text-foreground">{itemCount}</span>
            </span>
          </button>
          <NavButton onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false) }} label="Search">
            SEARCH
          </NavButton>
          <NavLink href="/account">
            {isAuthenticated && customer?.firstName ? customer.firstName.toUpperCase() : 'LOGIN'}
          </NavLink>
          <NavLink href="/about">OUR STORY</NavLink>
        </motion.div>

        {/* Search Bar */}
        <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
      </motion.header>

      {/* Fullscreen Category Menu */}
      <FullscreenMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        onMyOrdersClick={handleMyOrdersNavigation}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Fullscreen Menu — editorial navigation overlay                     */
/* ------------------------------------------------------------------ */

function FullscreenMenu({
  menuOpen,
  setMenuOpen,
  pathname,
  isAuthenticated,
  onMyOrdersClick,
}: {
  menuOpen: boolean
  setMenuOpen: (v: boolean) => void
  pathname: string
  isAuthenticated: boolean
  onMyOrdersClick: () => void
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [accessoriOpen, setAccessoriOpen] = useState(false)

  /* Reset child state when menu closes */
  useEffect(() => {
    if (!menuOpen) {
      setHoveredIndex(null)
      setAccessoriOpen(false)
    }
  }, [menuOpen])

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-background"
          variants={menuSlideIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* AUREM Logo — anchored top-center with refined spacing */}
          <motion.div
            className="absolute top-5 md:top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easing, delay: 0.08 }}
          >
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center group"
            >
              <span className="text-[6.5px] tracking-[0.38em] uppercase text-foreground/30 leading-none">
                Made in Italy
              </span>
              <span className="text-[20px] md:text-[24px] font-bold tracking-[0.20em] uppercase text-foreground leading-none mt-1.5">
                AUREM
              </span>
              <span className="text-[5.5px] tracking-[0.32em] uppercase text-foreground/20 leading-none mt-1.5">
                The Coat Society
              </span>
            </Link>
          </motion.div>

          {/* Navigation grid */}
          <div className="h-full flex flex-col justify-center zara-px">
            <nav
              className="flex flex-col"
              onMouseLeave={() => {
                setHoveredIndex(null)
                setAccessoriOpen(false)
              }}
            >
              {categories.map((cat, i) => {
                const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                const hasChildren = cat.children && cat.children.length > 0
                const isHovered = hoveredIndex === i
                const somethingHovered = hoveredIndex !== null
                const isAccessori = hasChildren

                return (
                  <div key={cat.name}>
                    {/* Primary category row */}
                    <motion.div
                      variants={staggerItem}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: i * 0.05 }}
                      onMouseEnter={() => {
                        setHoveredIndex(i)
                        if (isAccessori) {
                          setAccessoriOpen(true)
                        } else {
                          setAccessoriOpen(false)
                        }
                      }}
                    >
                      <Link
                        href={cat.href}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-baseline gap-5 md:gap-6 py-3 md:py-4"
                      >
                        {/* Number — refined tracking, hover opacity lift */}
                        <motion.span
                          className="text-[10px] md:text-[11px] tracking-[0.22em] tabular-nums font-medium leading-none w-6"
                          animate={{
                            opacity: isHovered ? 0.7 : isActive ? 0.5 : somethingHovered ? 0.12 : 0.22,
                          }}
                          transition={{ duration: 0.25, ease: easing }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </motion.span>

                        {/* Category name — horizontal shift on hover, dimming of siblings */}
                        <motion.span
                          className="relative"
                          animate={{
                            x: isHovered ? 6 : 0,
                            opacity: somethingHovered
                              ? isHovered ? 1 : 0.2
                              : isActive ? 1 : 0.85,
                          }}
                          transition={{ duration: 0.3, ease: easing }}
                        >
                          <span
                            className={`text-3xl md:text-5xl lg:text-[3.8rem] font-bold tracking-[0.02em] uppercase transition-colors duration-200 ${
                              isActive ? 'text-foreground' : 'text-foreground'
                            }`}
                          >
                            {cat.name}
                          </span>
                          {/* Active indicator — minimal underline */}
                          {isActive && (
                            <motion.span
                              className="absolute left-0 -bottom-1.5 h-[1.5px] bg-foreground"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.3, ease: easing, delay: 0.15 }}
                            />
                          )}
                        </motion.span>
                      </Link>
                    </motion.div>

                    {/* Child categories — ACCESSORI subcategories */}
                    {hasChildren && (
                      <AnimatePresence>
                        {accessoriOpen && (
                          <motion.div
                            className="overflow-hidden"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: easing }}
                          >
                            <div className="flex flex-col pb-1">
                              {cat.children!.map((child, ci) => {
                                const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
                                return (
                                  <motion.div
                                    key={child.name}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.25, ease: easing, delay: ci * 0.04 }}
                                  >
                                    <Link
                                      href={child.href}
                                      onClick={() => setMenuOpen(false)}
                                      className="group flex items-baseline gap-5 md:gap-6 py-1.5 md:py-2 ml-11 md:ml-[3.2rem]"
                                    >
                                      {/* Child number — indented, lighter weight */}
                                      <span className="text-[8px] md:text-[9px] tracking-[0.20em] tabular-nums font-medium text-foreground/15 leading-none w-5">
                                        {String(i + 1).padStart(2, '0')}.{ci + 1}
                                      </span>
                                      {/* Child name — smaller scale, reduced opacity */}
                                      <span
                                        className={`text-lg md:text-2xl lg:text-[1.7rem] font-bold tracking-[0.03em] uppercase transition-all duration-250 ${
                                          childActive
                                            ? 'text-foreground'
                                            : 'text-foreground/40 group-hover:text-foreground/70 group-hover:translate-x-1'
                                        }`}
                                        style={{ transition: 'color 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)' }}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Bottom links — refined spacing and alignment */}
            <motion.div
              className="mt-14 md:mt-16 pt-5 border-t border-foreground/8 flex flex-wrap gap-8 md:gap-10"
              variants={fade}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`text-[10px] tracking-[0.18em] uppercase link-underline transition-colors duration-200 ${
                  pathname === '/' ? 'text-foreground font-bold' : 'text-foreground/35 hover:text-foreground'
                }`}
              >
                Home
              </Link>
              {isAuthenticated && (
                <button
                  onClick={onMyOrdersClick}
                  className="text-[10px] tracking-[0.18em] uppercase text-foreground/35 hover:text-foreground transition-colors duration-200 link-underline"
                >
                  My Orders
                </button>
              )}
              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className="text-[10px] tracking-[0.18em] uppercase text-foreground/35 hover:text-foreground transition-colors duration-200 link-underline"
              >
                Our Story
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
