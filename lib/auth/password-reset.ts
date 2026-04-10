/**
 * Password reset token validation utilities
 *
 * Shopify reset token è un URL di reset di account Shopify.
 * Validazione di base per:
 * - URL ben formata
 * - Dominio Shopify
 * - Presenza del token
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN

export interface ParsedResetToken {
  valid: boolean
  url?: string
  error?: string
}

export function parseResetToken(token: string): ParsedResetToken {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Token non fornito o non valido.',
    }
  }

  try {
    const url = new URL(token)

    // Valida che sia un URL di Shopify
    if (!url.hostname.includes('myshopify.com')) {
      return {
        valid: false,
        error: 'Token non proveniente da Shopify.',
      }
    }

    // Valida che contenga il percorso di reset
    if (!url.pathname.includes('/account/reset/')) {
      return {
        valid: false,
        error: 'Formato token di reset non valido.',
      }
    }

    return {
      valid: true,
      url: token,
    }
  } catch {
    return {
      valid: false,
      error: 'Token non è un URL valido.',
    }
  }
}

export function isResetTokenExpired(
  createdAt: Date,
  expirationHours: number = 24,
): boolean {
  const now = new Date()
  const expirationMs = expirationHours * 60 * 60 * 1000
  return now.getTime() - createdAt.getTime() > expirationMs
}
