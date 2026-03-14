'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '@/lib/motion'

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <footer className="bg-background relative z-40">
      {/* Newsletter */}
      <motion.div
        className="border-t border-foreground/10 py-14 lg:py-18 zara-px"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.18em] uppercase mb-2.5 text-foreground">
              Newsletter
            </h3>
            <p className="text-[10px] text-foreground/35 tracking-[0.08em] max-w-md leading-relaxed">
              Subscribe to receive updates on new collections, exclusive events, and special offers.
            </p>
          </div>
          {subscribed ? (
            <p className="text-[10px] tracking-[0.16em] uppercase text-foreground">
              Thank you for subscribing
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center gap-0 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="bg-transparent border border-foreground/15 focus:border-foreground/50 px-4 py-3 text-[10px] tracking-[0.08em] outline-none placeholder:text-foreground/25 w-full md:w-72 transition-colors duration-200"
              />
              <button
                type="submit"
                className="bg-foreground text-background px-6 py-3 text-[10px] tracking-[0.16em] uppercase border border-foreground hover:bg-transparent hover:text-foreground transition-all duration-200 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </motion.div>

      {/* Links */}
      <div className="border-t border-foreground/10 py-12 zara-px">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-14">
          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-bold tracking-[0.18em] uppercase mb-1 text-foreground">Collections</h4>
            <Link href="/collections/coats" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Coats</Link>
            <Link href="/collections/accessories" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Accessories</Link>
            <Link href="/collections/jewelry" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Jewelry</Link>
            <Link href="/collections/bags" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Bags</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-bold tracking-[0.18em] uppercase mb-1 text-foreground">About</h4>
            <Link href="/about" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Our Story</Link>
            <Link href="/sustainability" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Sustainability</Link>
            <Link href="/contact" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Contact</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-bold tracking-[0.18em] uppercase mb-1 text-foreground">Support</h4>
            <Link href="/shipping" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Shipping</Link>
            <Link href="/returns" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Returns</Link>
            <Link href="/account/orders" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">My Orders</Link>
            <Link href="/payments" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">Secure Payments</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-bold tracking-[0.18em] uppercase mb-1 text-foreground">Social</h4>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">
              Instagram
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">
              TikTok
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-foreground/35 tracking-[0.08em] hover:text-foreground transition-colors duration-200 link-underline">
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar with runway thumbnails */}
      <div className="border-t border-foreground/10 py-7 zara-px">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-6">
            <Link href="/shipping" className="text-[9px] tracking-[0.16em] uppercase text-foreground/25 hover:text-foreground transition-colors duration-200">
              Shipping
            </Link>
            <Link href="/returns" className="text-[9px] tracking-[0.16em] uppercase text-foreground/25 hover:text-foreground transition-colors duration-200">
              Returns
            </Link>
            <Link href="/terms" className="text-[9px] tracking-[0.16em] uppercase text-foreground/25 hover:text-foreground transition-colors duration-200">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-[9px] tracking-[0.16em] uppercase text-foreground/25 hover:text-foreground transition-colors duration-200">
              Privacy Policy
            </Link>
          </div>

        </div>
      </div>

      {/* Giant Brand Name Footer */}
      <div className="overflow-x-clip bg-foreground text-background pt-8 pb-6 zara-px">
        <p className="text-[13vw] tracking-[0.06em] uppercase leading-[0.82] whitespace-nowrap select-none" style={{ fontFamily: "'Xanh Mono', monospace", fontWeight: 400 }}>
          AUREM
        </p>
      </div>
    </footer>
  )
}
