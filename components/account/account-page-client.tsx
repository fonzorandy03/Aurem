'use client'

/**
 * AccountPageClient — wrapper che smista tra login e dashboard
 * in base allo stato di autenticazione del cliente.
 */

import { useEffect } from 'react'
import { useAuth } from '@/components/account/auth-context'
import { LoginForm } from '@/components/account/login-form'
import { AccountDashboard } from '@/components/account/account-dashboard'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'

export function AccountPageClient() {
  const { customer, isLoading, refreshWithOrders } = useAuth()

  // Fetch orders only when on the account page and authenticated
  useEffect(() => {
    if (customer && customer.orders.length === 0) {
      refreshWithOrders()
    }
  }, [customer, refreshWithOrders])

  // Spinner lineare durante il caricamento sessione
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-wide-industrial uppercase text-muted-foreground animate-pulse">
          Loading...
        </span>
      </div>
    )
  }

  return (
    <motion.main
      className="pt-20 min-h-screen bg-background"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
    >
      {customer ? <AccountDashboard /> : <LoginForm />}
    </motion.main>
  )
}
