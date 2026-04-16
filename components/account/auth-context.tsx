'use client'

/**
 * AuthContext — gestione sessione cliente lato client.
 *
 * Flusso:
 * 1. Al mount chiama GET /api/auth/me per leggere il cookie HTTP-only.
 * 2. Espone login(), register(), reset(), logout().
 * 3. Dopo login/register reindirizza a /account o alla pagina richiesta.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { sanitizeNextPath } from '@/lib/auth/redirect'

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface ShopifyAddress {
  id: string
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
}

export interface ShopifyOrderLineItem {
  title: string
  quantity: number
  originalTotalPrice: { amount: string; currencyCode: string } | null
  variant: {
    title: string
    price: { amount: string; currencyCode: string } | null
    image: { url: string; altText: string | null } | null
    selectedOptions: { name: string; value: string }[] | null
  } | null
}

export interface ShopifyFulfillment {
  trackingCompany: string | null
  trackingInfo: { number: string; url: string | null }[]
}

export interface ShopifyDiscountApplication {
  code?: string
  applicable?: boolean
  value: { amount?: string; currencyCode?: string; percentage?: number }
}

export interface ShopifyOrderAddress {
  firstName: string | null
  lastName: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
}

export interface ShopifyOrder {
  id: string
  orderNumber: number
  name: string
  processedAt: string
  financialStatus: string
  fulfillmentStatus: string
  currentTotalPrice: { amount: string; currencyCode: string }
  subtotalPrice: { amount: string; currencyCode: string } | null
  totalShippingPrice: { amount: string; currencyCode: string } | null
  totalTax: { amount: string; currencyCode: string } | null
  shippingAddress: ShopifyOrderAddress | null
  lineItems: ShopifyOrderLineItem[]
  successfulFulfillments: ShopifyFulfillment[]
  discountApplications: ShopifyDiscountApplication[]
}

export interface CustomerProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  acceptsMarketing: boolean
  createdAt: string
  orders: ShopifyOrder[]
  defaultAddress: ShopifyAddress | null
  marketAssignment?: {
    market: 'EU' | 'INTERNATIONAL'
    countryCode: string
    tag: string
    source: 'metafield+tag' | 'tag'
  } | null
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  acceptsMarketing?: boolean
  countryCode: string
  address1: string
  address2?: string
  city: string
  postalCode: string
  province?: string
}

export interface UpdateDefaultAddressInput {
  addressId: string
  address1: string
  address2?: string
  city: string
  province?: string
  zip: string
  country: string
  phone?: string
  firstName?: string
  lastName?: string
}

interface AuthState {
  customer: CustomerProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  updateDefaultAddress: (input: UpdateDefaultAddressInput) => Promise<void>
  resetPassword: (email: string) => Promise<string>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  refreshWithOrders: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const CART_ID_KEY = 'aurem_cart_id'

/** Associate current cart with the logged-in customer (buyer identity) */
async function associateCartWithCustomer() {
  try {
    const cartId = typeof window !== 'undefined'
      ? window.localStorage.getItem(CART_ID_KEY)
      : null
    if (!cartId) return
    await fetch('/api/cart/associate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId }),
      credentials: 'same-origin',
    })
  } catch {
    // Non-critical — don't block the login flow
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    customer: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Carica il profilo dal cookie corrente (lightweight — no orders)
  const refresh = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
      const { customer: raw } = await res.json()
      const customer = raw ? {
        ...raw,
        orders: Array.isArray(raw.orders) ? raw.orders : [],
      } : null
      setState({
        customer: customer ?? null,
        isAuthenticated: !!customer,
        isLoading: false,
      })
    } catch {
      setState({ customer: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  // Full refresh including orders — call only from account pages
  const refreshWithOrders = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const res = await fetch('/api/auth/me?include=orders', { credentials: 'same-origin' })
      const { customer: raw } = await res.json()
      const customer = raw ? {
        ...raw,
        orders: Array.isArray(raw.orders)
          ? raw.orders
          : (raw.orders?.edges ?? []).map((e: any) => ({
              ...e.node,
              lineItems: Array.isArray(e.node?.lineItems)
                ? e.node.lineItems
                : (e.node?.lineItems?.edges ?? []).map((li: any) => li.node),
              successfulFulfillments: e.node?.successfulFulfillments ?? [],
              discountApplications: Array.isArray(e.node?.discountApplications)
                ? e.node.discountApplications
                : (e.node?.discountApplications?.edges ?? []).map((d: any) => d.node),
            })),
      } : null
      setState({
        customer: customer ?? null,
        isAuthenticated: !!customer,
        isLoading: false,
      })
    } catch {
      setState({ customer: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getPostAuthRedirectPath = useCallback(() => {
    if (typeof window === 'undefined') return '/account'
    const nextParam = new URLSearchParams(window.location.search).get('next')
    const safeNext = sanitizeNextPath(nextParam)
    return safeNext ?? '/account'
  }, [])

  // ─── Login ──────────────────────────────────────────────────────────────

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Login non riuscito.')
      }

      await refresh()
      await associateCartWithCustomer()
      router.push(getPostAuthRedirectPath())
    },
    [getPostAuthRedirectPath, refresh, router],
  )

  // ─── Register ───────────────────────────────────────────────────────────

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Registrazione non riuscita.')
      }

      await refresh()
      await associateCartWithCustomer()
      router.push(getPostAuthRedirectPath())
    },
    [getPostAuthRedirectPath, refresh, router],
  )

  const updateDefaultAddress = useCallback(
    async (input: UpdateDefaultAddressInput) => {
      const res = await fetch('/api/auth/address/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'same-origin',
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }))
        throw new Error(error ?? 'Unable to update default address.')
      }

      await refreshWithOrders()
    },
    [refreshWithOrders],
  )

  // ─── Reset password ─────────────────────────────────────────────────────

  const resetPassword = useCallback(async (email: string): Promise<string> => {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'same-origin',
    })

    if (!res.ok) {
      const { error, message } = await res.json()
      throw new Error(message ?? error ?? 'Errore durante l\'invio del link di reset.')
    }

    const { message } = await res.json()
    return message ?? 'Email inviata. Controlla la inbox.'
  }, [])

  // ─── Logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })
    setState({ customer: null, isAuthenticated: false, isLoading: false })
    router.push('/')
  }, [router])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, updateDefaultAddress, resetPassword, logout, refresh, refreshWithOrders }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  }
  return ctx
}
