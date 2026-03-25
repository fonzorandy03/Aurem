import { NextResponse } from 'next/server'
import {
  consumeRateLimit,
  getClientIp,
  isValidEmail,
  normalizeEmail,
  tooManyRequestsResponse,
} from '@/lib/security/request-guard'
import { adminFetch } from '@/dao/core/admin-client'
import { sendNewsletterWelcomeEmail } from '@/lib/email/newsletter'

const FIND_CUSTOMER_BY_EMAIL_QUERY = /* gql */ `
  query FindCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          emailMarketingConsent {
            marketingState
          }
        }
      }
    }
  }
`

const CREATE_CUSTOMER_WITH_MARKETING_MUTATION = /* gql */ `
  mutation CreateCustomerWithMarketing($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const UPDATE_CUSTOMER_EMAIL_MARKETING_MUTATION = /* gql */ `
  mutation UpdateCustomerEmailMarketing($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalizedEmail = normalizeEmail(email)

    const ip = getClientIp(request)
    const limit = consumeRateLimit({
      bucket: 'newsletter-subscribe',
      key: `${ip}:${normalizedEmail || 'unknown-email'}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    })

    if (!limit.ok) {
      return tooManyRequestsResponse(limit.retryAfterSeconds)
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    // Upsert subscriber on Shopify and enforce email marketing consent.
    const { data: existingData } = await adminFetch<any>({
      query: FIND_CUSTOMER_BY_EMAIL_QUERY,
      variables: { query: `email:${normalizedEmail}` },
    })

    const existingCustomer = existingData?.customers?.edges?.[0]?.node
    const consentUpdatedAt = new Date().toISOString()

    if (existingCustomer?.emailMarketingConsent?.marketingState === 'SUBSCRIBED') {
      return NextResponse.json(
        { success: true, alreadySubscribed: true, message: 'Email gia iscritta' },
        { status: 200 }
      )
    }

    if (existingCustomer?.id) {
      const { data: updateData } = await adminFetch<any>({
        query: UPDATE_CUSTOMER_EMAIL_MARKETING_MUTATION,
        variables: {
          input: {
            customerId: existingCustomer.id,
            emailMarketingConsent: {
              marketingState: 'SUBSCRIBED',
              marketingOptInLevel: 'SINGLE_OPT_IN',
              consentUpdatedAt,
            },
          },
        },
      })

      const userErrors = updateData?.customerEmailMarketingConsentUpdate?.userErrors
      if (Array.isArray(userErrors) && userErrors.length > 0) {
        throw new Error(userErrors[0]?.message || 'Unable to update marketing consent')
      }
    } else {
      const { data: createData } = await adminFetch<any>({
        query: CREATE_CUSTOMER_WITH_MARKETING_MUTATION,
        variables: {
          input: {
            email: normalizedEmail,
            tags: ['newsletter'],
            emailMarketingConsent: {
              marketingState: 'SUBSCRIBED',
              marketingOptInLevel: 'SINGLE_OPT_IN',
              consentUpdatedAt,
            },
          },
        },
      })

      const userErrors = createData?.customerCreate?.userErrors
      if (Array.isArray(userErrors) && userErrors.length > 0) {
        const message = userErrors[0]?.message || 'Unable to create newsletter subscriber'
        if (/already|taken|exists/i.test(message)) {
          return NextResponse.json(
            { success: true, alreadySubscribed: true, message: 'Email gia iscritta' },
            { status: 200 }
          )
        }
        throw new Error(message)
      }
    }

    try {
      const emailResult = await sendNewsletterWelcomeEmail(normalizedEmail)
      if (emailResult.status === 'skipped' && process.env.NODE_ENV !== 'production') {
        console.warn('[newsletter/subscribe] welcome email skipped:', emailResult.reason)
      }
    } catch (emailError) {
      console.error('[newsletter/subscribe] welcome email failed', emailError)
    }

    return NextResponse.json(
      { success: true, message: 'Iscrizione ricevuta' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[newsletter/subscribe]', error)

    if (error instanceof Error && error.message.includes('Missing env vars')) {
      return NextResponse.json(
        { error: 'Configurazione Shopify incompleta sul server' },
        { status: 503 }
      )
    }

    if (error instanceof Error && error.message.includes('write_customers')) {
      return NextResponse.json(
        { error: 'Permessi Shopify insufficienti: abilita write_customers (e read_customers) per l\'app Admin API' },
        { status: 403 }
      )
    }

    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}
