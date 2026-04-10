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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/account/auth-context'
import {
  COUNTRY_OPTIONS,
  getCountryName,
  isPostalCodeRequired,
  isProvinceRequired,
  validateCustomerRegistrationInput,
} from '@/lib/customer-market'
import {
  filterOptions,
  findSubdivisionCode,
  getCities,
  getPostalLabel,
  getRegionLabel,
  getSubdivisions,
  suggestPostalCode,
} from '@/lib/address-intl'
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
  placeholder, required = false, autoComplete, minLength, onBlur,
}: {
  id: string; label: string; type?: string
  value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean
  autoComplete?: string; minLength?: number
  onBlur?: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[10px] tracking-wide-industrial uppercase font-bold text-foreground">
        {label}
      </label>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder} required={required}
        autoComplete={autoComplete} minLength={minLength}
        className="w-full bg-transparent border border-border px-4 py-3 text-[11px] tracking-industrial outline-none focus:border-foreground transition-colors duration-200 placeholder:text-muted-foreground"
      />
    </div>
  )
}

function SearchableField({
  id,
  label,
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  onBlur,
  hint,
  noResultsLabel,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  options: Array<{ code: string; name: string }>
  placeholder: string
  required?: boolean
  autoComplete?: string
  disabled?: boolean
  onBlur?: () => void
  hint?: string
  noResultsLabel?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const hasOptions = options.length > 0
  const showDropdown = isOpen && !disabled

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[10px] tracking-wide-industrial uppercase font-bold text-foreground">
        {label}
      </label>

      <div ref={containerRef} className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            if (!disabled) setIsOpen(true)
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true)
          }}
          onBlur={() => {
            onBlur?.()
          }}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full bg-transparent border border-border px-4 py-3 text-[11px] tracking-industrial outline-none focus:border-foreground transition-colors duration-200 placeholder:text-muted-foreground disabled:opacity-60"
        />

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 border border-border bg-background max-h-52 overflow-y-auto">
            {hasOptions ? (
              options.map((option) => (
                <button
                  key={`${id}-${option.code}-${option.name}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect(option.name)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-[11px] tracking-industrial hover:bg-foreground/5 transition-colors duration-150"
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-[10px] tracking-industrial text-muted-foreground">
                {noResultsLabel ?? 'No matches found'}
              </div>
            )}
          </div>
        )}
      </div>

      {hint && (
        <span className="text-[10px] tracking-industrial text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[10px] tracking-wide-industrial uppercase font-bold text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full bg-transparent border border-border px-4 py-3 text-[11px] tracking-industrial outline-none focus:border-foreground transition-colors duration-200"
      >
        <option value="" className="bg-background text-muted-foreground">
          {placeholder}
        </option>
        {COUNTRY_OPTIONS.map((country) => (
          <option key={country.code} value={country.code} className="bg-background text-foreground">
            {country.name}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export function LoginForm() {
  const { login, register, resetPassword } = useAuth()
  const searchParams = useSearchParams()
  const postalLookupAbortRef = useRef<AbortController | null>(null)

  const [mode, setMode]             = useState<Mode>('login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [address1, setAddress1]     = useState('')
  const [address2, setAddress2]     = useState('')
  const [city, setCity]             = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [province, setProvince]     = useState('')
  const [autoPostalCode, setAutoPostalCode] = useState<string | null>(null)
  const [newsletter, setNewsletter] = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  // Handle password reset success redirect
  useEffect(() => {
    if (searchParams.get('success') === 'reset') {
      setMode('login')
      setSuccess('Password successfully reset. You can now sign in with your new password.')
    }
    // Handle mode parameter
    const modeParam = searchParams.get('mode')
    if (modeParam === 'reset' || modeParam === 'register') {
      setMode(modeParam as Mode)
    }
  }, [searchParams])

  const subdivisions = useMemo(() => getSubdivisions(countryCode), [countryCode])
  const filteredSubdivisions = useMemo(
    () => filterOptions(subdivisions, province),
    [subdivisions, province],
  )

  const selectedSubdivisionCode = useMemo(
    () => findSubdivisionCode(countryCode, province),
    [countryCode, province],
  )

  const countryHasSubdivisionData = subdivisions.length > 0
  const canSearchCity = Boolean(
    countryCode && (!countryHasSubdivisionData || province.trim().length > 0),
  )

  const cities = useMemo(
    () => getCities(countryCode, selectedSubdivisionCode),
    [countryCode, selectedSubdivisionCode],
  )

  const filteredCities = useMemo(
    () => filterOptions(cities, city),
    [cities, city],
  )

  const regionLabel = useMemo(() => getRegionLabel(countryCode), [countryCode])
  const postalLabel = useMemo(() => getPostalLabel(countryCode), [countryCode])

  useEffect(() => {
    setProvince('')
    setCity('')
    setPostalCode('')
    setAutoPostalCode(null)
  }, [countryCode])

  const onProvinceChange = useCallback((nextProvince: string) => {
    setProvince(nextProvince)
    setCity('')
    setPostalCode('')
    setAutoPostalCode(null)
  }, [])

  const tryAutofillPostalCode = useCallback(async () => {
    const countryName = getCountryName(countryCode)
    const cityValue = city.trim()

    if (!countryName || !cityValue) return

    postalLookupAbortRef.current?.abort()
    const controller = new AbortController()
    postalLookupAbortRef.current = controller

    try {
      const suggested = await suggestPostalCode({
        countryCode,
        countryName,
        city: cityValue,
        region: province,
        signal: controller.signal,
      })

      if (!suggested) return

      const current = postalCode.trim()
      if (!current || (autoPostalCode && current === autoPostalCode)) {
        setPostalCode(suggested)
        setAutoPostalCode(suggested)
      }
    } catch {
      // Keep manual postal code workflow when lookup fails.
    }
  }, [autoPostalCode, city, countryCode, postalCode, province])

  useEffect(() => {
    return () => {
      postalLookupAbortRef.current?.abort()
    }
  }, [])

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
        const validation = validateCustomerRegistrationInput({
          email,
          password,
          firstName,
          lastName,
          acceptsMarketing: newsletter,
          countryCode,
          address1,
          address2,
          city,
          postalCode,
          province,
        })

        if (validation.error || !validation.data) {
          throw new Error(validation.error ?? 'Registration data is invalid.')
        }

        await register(validation.data)
      } else {
        // Reset password — resetPassword now returns success message
        const successMsg = await resetPassword(email)
        setSuccess(successMsg)
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field id="firstName" label="First Name" value={firstName} onChange={setFirstName} placeholder="Marco" required autoComplete="given-name" />
                  <Field id="lastName"  label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Rossi" required autoComplete="family-name" />
                </div>
              )}

              {mode === 'register' && (
                <SelectField
                  id="countryCode"
                  label="Shipping Country"
                  value={countryCode}
                  onChange={setCountryCode}
                  required
                  placeholder="Select country"
                />
              )}

              {mode === 'register' && (
                <SearchableField
                  id="province"
                  label={regionLabel}
                  value={province}
                  onChange={onProvinceChange}
                  onSelect={onProvinceChange}
                  options={filteredSubdivisions}
                  placeholder={`Enter ${regionLabel.toLowerCase()}`}
                  required={isProvinceRequired(countryCode)}
                  autoComplete="address-level1"
                  disabled={!countryCode}
                  hint={!countryCode
                    ? 'Select country first'
                    : countryHasSubdivisionData
                      ? undefined
                      : `No predefined ${regionLabel.toLowerCase()} list for this country. Manual entry is allowed.`}
                  noResultsLabel={`No ${regionLabel.toLowerCase()} found`}
                />
              )}

              {mode === 'register' && (
                <SearchableField
                  id="city"
                  label="City"
                  value={city}
                  onChange={setCity}
                  onSelect={(selectedCity) => {
                    setCity(selectedCity)
                    void tryAutofillPostalCode()
                  }}
                  options={filteredCities}
                  placeholder="Enter city"
                  required
                  autoComplete="address-level2"
                  disabled={!canSearchCity}
                  onBlur={() => {
                    void tryAutofillPostalCode()
                  }}
                  hint={!countryCode
                    ? 'Select country first'
                    : !canSearchCity
                      ? `Select ${regionLabel.toLowerCase()} first`
                      : undefined}
                  noResultsLabel="No city found"
                />
              )}

              {mode === 'register' && (
                <Field
                  id="postalCode"
                  label={postalLabel}
                  value={postalCode}
                  onChange={(value) => {
                    setPostalCode(value)
                    if (autoPostalCode && value !== autoPostalCode) {
                      setAutoPostalCode(null)
                    }
                  }}
                  placeholder="Enter postal code"
                  required={isPostalCodeRequired(countryCode)}
                  autoComplete="postal-code"
                />
              )}

              {mode === 'register' && (
                <Field
                  id="address1"
                  label="Address Line 1"
                  value={address1}
                  onChange={setAddress1}
                  placeholder="Street address"
                  required
                  autoComplete="address-line1"
                />
              )}

              {mode === 'register' && (
                <Field
                  id="address2"
                  label="Address Line 2"
                  value={address2}
                  onChange={setAddress2}
                  placeholder="Apartment, suite, company"
                  autoComplete="address-line2"
                />
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
