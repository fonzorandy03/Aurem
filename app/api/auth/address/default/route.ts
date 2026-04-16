import { NextRequest, NextResponse } from 'next/server'
import { storefrontFetch } from '@/lib/shopify/storefront-client'
import { CUSTOMER_TOKEN_COOKIE } from '@/lib/auth/constants'

const UPDATE_DEFAULT_ADDRESS_MUTATION = /* gql */ `
  mutation UpdateDefaultAddress(
    $customerAccessToken: String!
    $id: ID!
    $address: MailingAddressInput!
  ) {
    customerAddressUpdate(
      customerAccessToken: $customerAccessToken
      id: $id
      address: $address
    ) {
      customerAddress {
        id
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_TOKEN_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json().catch(() => null)
    const addressId = getString(payload?.addressId)
    const address1 = getString(payload?.address1)
    const city = getString(payload?.city)
    const zip = getString(payload?.zip)
    const country = getString(payload?.country)

    if (!addressId || !address1 || !city || !zip || !country) {
      return NextResponse.json(
        { error: 'Address id, address1, city, zip and country are required.' },
        { status: 400 },
      )
    }

    const { data } = await storefrontFetch<any>({
      query: UPDATE_DEFAULT_ADDRESS_MUTATION,
      variables: {
        customerAccessToken: token,
        id: addressId,
        address: {
          firstName: getString(payload?.firstName) || undefined,
          lastName: getString(payload?.lastName) || undefined,
          address1,
          address2: getString(payload?.address2) || undefined,
          city,
          province: getString(payload?.province) || undefined,
          zip,
          country,
          phone: getString(payload?.phone) || undefined,
        },
      },
    })

    const userErrors = data?.customerAddressUpdate?.customerUserErrors ?? []

    if (userErrors.length > 0) {
      const firstError = userErrors.find((item: any) => item?.message)?.message ?? 'Shopify address update failed.'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth/address/default][PUT]', error)
    return NextResponse.json({ error: 'Unable to update address right now.' }, { status: 500 })
  }
}
