/** Costanti di sessione condivise tra API routes e client hooks. */

/** Nome del cookie HTTP-only che contiene il token Shopify */
export const CUSTOMER_TOKEN_COOKIE = 'aurem_customer_token'

/** Cookie (non HTTP-only) con country ISO-2 del cliente per pricing market-aware */
export const CUSTOMER_COUNTRY_COOKIE = 'aurem_country_code'

/** Durata del cookie in secondi — 24 ore (aligned with Shopify token default expiry) */
export const COOKIE_MAX_AGE = 60 * 60 * 24

/** Durata country cookie in secondi — 30 giorni */
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
