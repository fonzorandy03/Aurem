'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { heroContainer, heroItem, luxuryReveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  MoodboardImage                                                     */
/*  Fade-in on load. Crop via object-fit: cover + object-position.    */
/* ------------------------------------------------------------------ */

function MoodboardImage({
  src,
  alt,
  objectPosition = 'center',
}: {
  src: string
  alt: string
  objectPosition?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  const onError = useCallback(() => setError(true), [])

  return (
    <>
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
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 80vw, 420px"
          className={cn(
            'object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ objectPosition }}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Editorial Moodboard Section                                        */
/*                                                                     */
/*  Structure (matches reference "3.jpeg" exactly):                    */
/*    - Single narrow centered column (max-w-[420px])                 */
/*    - 3 images stacked vertically with equal gaps                   */
/*    - Large top padding (first section on page, clears header)      */
/*    - "MOODBOARD FOR TODAY" label right side of last image          */
/*    - No frames, no shadows, no borders, no hover transforms        */
/*                                                                     */
/*  Images (top to bottom):                                            */
/*    1. Accessory / bag — landscape ~5:4                             */
/*    2. Model portrait — square 1:1                                  */
/*    3. Detail / boots — square 1:1 with text overlay                */
/* ------------------------------------------------------------------ */

export function MoodboardSection() {
  // Respect prefers-reduced-motion: skip to final state instantly
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="bg-white pt-20 pb-16 lg:pb-24"
      variants={heroContainer}
      initial={reduce ? 'visible' : 'hidden'}
      animate="visible"
    >
      <div className="zara-px">

        {/* Grid: large left + stacked right */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-[3fr_2fr] gap-6 md:gap-8">

          {/* IMAGE 1 — Large hero portrait */}
          <motion.div
            className="relative overflow-hidden"
            style={{ aspectRatio: '2/3' }}
            variants={heroItem}
          >
            <MoodboardImage
              src="/images/runway-7.jpg"
              alt="AUREM Collection 26 — editorial look 1"
              objectPosition="center top"
            />
          </motion.div>

          {/* Right column: two stacked images */}
          <div className="flex flex-col gap-6 md:gap-8">
            <motion.div
              className="relative overflow-hidden"
              style={{ aspectRatio: '3/4' }}
              variants={heroItem}
            >
              <MoodboardImage
                src="/images/category-jewelry.jpg"
                alt="AUREM Collection 26 — editorial look 2"
                objectPosition="center top"
              />
            </motion.div>

            <motion.div
              className="relative overflow-hidden"
              style={{ aspectRatio: '3/4' }}
              variants={heroItem}
            >
              <MoodboardImage
                src="/images/moodboard-3.jpg"
                alt="AUREM Collection 26 — editorial look 3"
                objectPosition="center top"
              />
              {/* Label overlay */}
              <div className="absolute bottom-4 left-4 z-10">
                <p className="text-[8px] font-bold tracking-[0.18em] uppercase text-white/70 leading-relaxed">
                  Moodboard<br />For Today
                </p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.section>
  )
}
