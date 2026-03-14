'use client'

import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/motion'
import { OrderDetail } from '@/components/account/order-detail'

export function OrderDetailClient() {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
    >
      <OrderDetail />
    </motion.div>
  )
}
