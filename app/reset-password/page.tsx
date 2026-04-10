'use client'

/**
 * Password Reset Page
 *
 * Riceve token di reset da Shopify via query param.
 * Mostra form per la nuova password.
 * Design AUREM: minimal, luxury, editorial.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ease } from '@/lib/motion'

type State = 'idle' | 'loading' | 'success' | 'error' | 'expired'

interface ValidationError {
  password?: string
  confirm?: string
  general?: string
}

const formVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: ease.luxury },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: ease.sharp },
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: ease.luxury,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease.luxury },
  },
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<State>('idle')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<ValidationError>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!token) {
      setState('expired')
    }
  }, [token])

  const validatePasswords = useCallback((): boolean => {
    const errs: ValidationError = {}

    if (!password.trim()) {
      errs.password = 'Password richiesta.'
    } else if (password.length < 8) {
      errs.password = 'Password minimo 8 caratteri.'
    } else if (!/(?=.*[a-z])/.test(password)) {
      errs.password = 'Deve contenere lettere minuscole.'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errs.password = 'Deve contenere lettere MAIUSCOLE.'
    } else if (!/(?=.*\d)/.test(password)) {
      errs.password = 'Deve contenere numeri.'
    }

    if (!confirmPassword.trim()) {
      errs.confirm = 'Conferma password richiesta.'
    } else if (password !== confirmPassword) {
      errs.confirm = 'Le password non corrispondono.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [password, confirmPassword])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validatePasswords()) {
        return
      }

      if (!token) {
        setState('expired')
        return
      }

      setState('loading')
      setErrors({})

      try {
        const res = await fetch('/api/auth/reset-password/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
          credentials: 'same-origin',
        })

        if (!res.ok) {
          const { error } = await res.json()

          if (error === 'EXPIRED_TOKEN') {
            setState('expired')
            setErrors({ general: 'Il link di reset è scaduto.' })
          } else if (error === 'INVALID_TOKEN') {
            setState('expired')
            setErrors({ general: 'Link non valido.' })
          } else {
            setState('error')
            setErrors({
              general:
                error ?? 'Errore durante il reset della password. Riprova.',
            })
          }
          return
        }

        setState('success')
        setTimeout(() => {
          router.push('/login?success=reset')
        }, 2000)
      } catch (err) {
        setState('error')
        setErrors({
          general:
            'Errore di connessione. Verifica la connessione ad internet e riprova.',
        })
      }
    },
    [validatePasswords, token, router],
  )

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-md w-full"
        >
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="font-serif italic text-3xl text-foreground mb-4">
              Link non valido
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Il link di reset password è assente o non valido. Richiedi un nuovo
              link di reset.
            </p>
            <button
              onClick={() => router.push('/login?mode=reset')}
              className="bg-foreground text-background px-8 py-3 text-xs font-sans tracking-wide uppercase hover:bg-foreground/90 transition-colors"
            >
              Richiedi nuovo link
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-md w-full text-center"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="font-serif italic text-3xl text-foreground mb-2">
              Password aggiornata
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              La tua password è stata resettata con successo. Verrai reindirizzato
              alla pagina di login.
            </p>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-md w-full text-center"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="font-serif italic text-3xl text-foreground mb-2">
              Link scaduto
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Il link di reset password è scaduto. I link rimangono validi per 24
              ore. Richiedi un nuovo link.
            </p>
            <button
              onClick={() => router.push('/login?mode=reset')}
              className="bg-foreground text-background px-8 py-3 text-xs font-sans tracking-wide uppercase hover:bg-foreground/90 transition-colors"
            >
              Richiedi nuovo link
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="font-serif italic text-3xl text-foreground mb-2">
            Reimposta password
          </h1>
          <p className="text-sm text-muted-foreground">
            Inserisci una nuova password. Deve contenere lettere maiuscole, minuscole
            e numeri.
          </p>
        </motion.div>

        {errors.general && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs tracking-wide"
          >
            {errors.general}
          </motion.div>
        )}

        <motion.form
          variants={formVariants}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-sans tracking-wide uppercase text-foreground block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci nuova password"
                disabled={state === 'loading'}
                className="w-full bg-transparent border border-border px-4 py-3 text-xs tracking-wide outline-none focus:border-foreground transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M15.171 13.576l1.379 1.379A10.020 10.020 0 0020 10.001c-1.274-4.057-5.064-7-9.542-7a9.926 9.926 0 00-5.007 1.338" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm"
              className="text-xs font-sans tracking-wide uppercase text-foreground block"
            >
              Conferma password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                disabled={state === 'loading'}
                className="w-full bg-transparent border border-border px-4 py-3 text-xs tracking-wide outline-none focus:border-foreground transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M15.171 13.576l1.379 1.379A10.020 10.020 0 0020 10.001c-1.274-4.057-5.064-7-9.542-7a9.926 9.926 0 00-5.007 1.338" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full bg-foreground text-background px-6 py-3 text-xs font-sans tracking-wide uppercase font-medium hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-8"
          >
            {state === 'loading' ? 'Aggiornamento...' : 'Aggiorna password'}
          </button>
        </motion.form>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Ricordi la tua password?{' '}
            <button
              onClick={() => router.push('/login')}
              className="underline hover:no-underline text-foreground font-medium"
            >
              Torna al login
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
