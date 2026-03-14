'use client'

/**
 * LoginForm — componente di autenticazione AUREM
 *
 * Design: layout editoriale split-panel (sinistra brand / destra form)
 * coerente con il resto del sito. Font, spaziatura e colori identici
 * al sistema di design globale.
 *
 * Modalità: login | register | reset
 * Integrazione: Shopify Storefront API via AuthContext
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/account/auth-context'
import { ease } from '@/lib/motion'

type Mode = 'login' | 'register' | 'reset'

// ─── Varianti animazione ──────────────────────────────────────────────────────

const formVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.42, ease: ease.luxury } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: ease.sharp } },
}

const panelVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: ease.luxury, staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const lineReveal = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.7, ease: ease.luxury } },
}

// ─── Testi per ogni modalità ──────────────────────────────────────────────────

const COPY = {
  login: {
    title:    'LOGIN',
    subtitle: 'Enter your credentials to access your AUREM profile.',
    cta:      'Sign In',
  },
  register: {
    title:    'Create Account',
    subtitle: 'Register to manage your orders, preferences and wishlist.',
    cta:      'Create Account',
  },
  reset: {
    title:    'Reset Password',
    subtitle: 'Enter the email associated with your account and we will send you a reset link.',
    cta:      'Send Link',
  },
} as const

// ─── Field riutilizzabile ─────────────────────────────────────────────────────

function Field({
  id, label, type = 'text', value, onChange,
  placeholder, required = false, autoComplete, minLength,
}: {
  id: string; label: string; type?: string
  value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean
  autoComplete?: string; minLength?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[10px] tracking-wide-industrial uppercase font-bold text-foreground">
        {label}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        autoComplete={autoComplete} minLength={minLength}
        className="w-full bg-transparent border border-border px-4 py-3 text-[11px] tracking-industrial outline-none focus:border-foreground transition-colors duration-200 placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function LoginForm() {
  const { login, register, resetPassword } = useAuth()

  const [mode, setMode]             = useState<Mode>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const switchMode = (next: Mode) => { setMode(next); setError(''); setSuccess('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'login') {
        await login({ email, password })
      } else if (mode === 'register') {
        await register({ email, password, firstName, lastName, acceptsMarketing: newsletter })
      } else {
        await resetPassword(email)
        setSuccess('Email sent. Please check your inbox.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="flex justify-center px-6 pt-16 pb-16"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Form centrato ── */}
      <div className="w-full max-w-[500px]">

        {/* Thin top rule — editorial accent */}
        <motion.div
          className="w-8 h-px bg-foreground mb-10 origin-left"
          variants={lineReveal}
        />

          {/* Titolo + sottotitolo animati */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`copy-${mode}`}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none mb-4">
                {COPY[mode].title}
              </h1>
              <p className="text-[11px] text-muted-foreground tracking-industrial mb-12 leading-relaxed max-w-[420px]">
                {COPY[mode].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form animato */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={`form-${mode}`}
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Campi nome — solo registrazione */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <Field id="firstName" label="First Name" value={firstName} onChange={setFirstName} placeholder="Marco" required autoComplete="given-name" />
                  <Field id="lastName"  label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Rossi" required autoComplete="family-name" />
                </div>
              )}

              <Field
                id="email" label="Email" type="email"
                value={email} onChange={setEmail}
                placeholder="name@email.com" required autoComplete="email"
              />

              {mode !== 'reset' && (
                <Field
                  id="password" label="Password" type="password"
                  value={password} onChange={setPassword}
                  placeholder="Min. 8 characters" required minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              )}

              {/* Newsletter — solo registrazione */}
              {mode === 'register' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <span
                    role="checkbox"
                    aria-checked={newsletter}
                    tabIndex={0}
                    onKeyDown={e => e.key === ' ' && setNewsletter(n => !n)}
                    onClick={() => setNewsletter(n => !n)}
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 border transition-colors duration-150 ${newsletter ? 'bg-foreground border-foreground' : 'bg-transparent border-border'}`}
                  />
                  <span className="text-[10px] tracking-industrial text-muted-foreground leading-relaxed">
                    I would like to receive updates on new collections and exclusive offers.
                  </span>
                </label>
              )}

              {/* Errore */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] tracking-industrial text-destructive bg-destructive/5 px-4 py-3 border-l-2 border-destructive"
                >
                  {error}
                </motion.p>
              )}

              {/* Successo */}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] tracking-industrial text-foreground bg-secondary px-4 py-3"
                >
                  {success}
                </motion.p>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-background py-4 text-[11px] tracking-wide-industrial uppercase hover:bg-foreground/90 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 border border-background/40 border-t-background/90 rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : COPY[mode].cta}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Navigazione tra modalità */}
          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => switchMode('register')}
                  className="text-[11px] tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors text-left link-underline self-start">
                  No account? Register
                </button>
                <button type="button" onClick={() => switchMode('reset')}
                  className="text-[11px] tracking-industrial text-muted-foreground hover:text-foreground transition-colors text-left link-underline self-start">
                  Forgot password?
                </button>
              </>
            )}
            {mode === 'register' && (
              <button type="button" onClick={() => switchMode('login')}
                className="text-[11px] tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors text-left link-underline self-start">
                Already have an account? Sign In
              </button>
            )}
            {mode === 'reset' && (
              <button type="button" onClick={() => switchMode('login')}
                className="text-[11px] tracking-wide-industrial uppercase text-foreground hover:text-muted-foreground transition-colors text-left link-underline self-start">
                ← Back to Login
              </button>
            )}
          </div>

      </div>
    </motion.div>
  )
}
