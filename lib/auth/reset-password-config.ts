/**
 * Environment configuration for password reset flow
 *
 * Required environment variables for password reset to work:
 * - SHOPIFY_STORE_DOMAIN - Shopify store domain (e.g., mystore.myshopify.com)
 * - SHOPIFY_STOREFRONT_ACCESS_TOKEN - Shopify Storefront API token
 * - NEXT_PUBLIC_STOREFRONT_DOMAIN - External domain for password reset link (e.g., aurem.com)
 *
 * The following must be set in your .env.local:
 */

// Example .env.local configuration:
/*

# Shopify configuration (shared with existing setup)
SHOPIFY_STORE_DOMAIN=mystore.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-token
SHOPIFY_STORE_DOMAIN=2025-07

# Password reset external domain
NEXT_PUBLIC_STOREFRONT_DOMAIN=https://aurem.com

*/

export const STOREFRONT_DOMAIN =
  process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN ?? 'https://localhost:3000'

export const PASSWORD_RESET_URL = `${STOREFRONT_DOMAIN}/reset-password`

/**
 * Constructs the password reset callback URL for Shopify email template
 * This should match the email template variable: {{ customer.reset_password_url }}
 *
 * Usage: Update Shopify email template with:
 * {%- assign reset_link = "DOMAIN/reset-password?token=" | append: customer.reset_password_url -%}
 */
export function getPasswordResetCallbackUrl(
  resetToken: string,
): string {
  return `${PASSWORD_RESET_URL}?token=${encodeURIComponent(resetToken)}`
}
