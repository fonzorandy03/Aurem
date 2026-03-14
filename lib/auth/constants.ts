/** Costanti di sessione condivise tra API routes e client hooks. */

/** Nome del cookie HTTP-only che contiene il token Shopify */
export const CUSTOMER_TOKEN_COOKIE = 'aurem_customer_token'

/** Durata del cookie in secondi — 24 ore (aligned with Shopify token default expiry) */
export const COOKIE_MAX_AGE = 60 * 60 * 24
