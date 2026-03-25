import { adminFetch } from '@/dao/core/admin-client'
import {
  CustomerMarket,
  CustomerRegistrationInput,
  getCountryName,
} from '@/lib/customer-market'
import { storefrontFetch } from '@/lib/shopify/storefront-client'

const ADDRESS_CREATE_MUTATION = /* gql */ `
  mutation CustomerAddressCreate(
    $customerAccessToken: String!
    $address: MailingAddressInput!
  ) {
    customerAddressCreate(
      customerAccessToken: $customerAccessToken
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

const DEFAULT_ADDRESS_UPDATE_MUTATION = /* gql */ `
  mutation CustomerDefaultAddressUpdate(
    $customerAccessToken: String!
    $addressId: ID!
  ) {
    customerDefaultAddressUpdate(
      customerAccessToken: $customerAccessToken
      addressId: $addressId
    ) {
      customer {
        id
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`

const SAVE_MARKET_METAFIELDS_MUTATION = /* gql */ `
  mutation SaveCustomerMarketMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`

const SAVE_MARKET_TAGS_MUTATION = /* gql */ `
  mutation SaveCustomerMarketTags($customerId: ID!, $tags: [String!]!) {
    tagsAdd(id: $customerId, tags: $tags) {
      userErrors {
        field
        message
      }
    }
  }
`

const CUSTOMER_MARKET_QUERY = /* gql */ `
  query GetCustomerMarketAssignment($customerId: ID!) {
    customer(id: $customerId) {
      id
      tags
      marketMetafield: metafield(namespace: "aurem", key: "market") {
        value
      }
      countryMetafield: metafield(namespace: "aurem", key: "registration_country_code") {
        value
      }
    }
  }
`

export interface CustomerMarketAssignment {
  market: CustomerMarket
  countryCode: string
  tag: string
  source: 'metafield+tag' | 'tag'
}

function getFirstUserError(errors: Array<{ message?: string | null }> | undefined): string | null {
  if (!errors?.length) return null
  return errors.find((error) => error?.message)?.message ?? 'Shopify returned an unknown error.'
}

export async function createCustomerDefaultAddress(
  customerAccessToken: string,
  input: CustomerRegistrationInput,
): Promise<void> {
  const country = getCountryName(input.countryCode)

  if (!country) {
    throw new Error('Cannot create customer address without a valid country.')
  }

  const { data: addressData } = await storefrontFetch<any>({
    query: ADDRESS_CREATE_MUTATION,
    variables: {
      customerAccessToken,
      address: {
        firstName: input.firstName,
        lastName: input.lastName,
        address1: input.address1,
        address2: input.address2 ?? null,
        city: input.city,
        province: input.province ?? null,
        zip: input.postalCode,
        country,
      },
    },
  })

  const addressPayload = addressData?.customerAddressCreate
  const addressError = getFirstUserError(addressPayload?.customerUserErrors)

  if (addressError) {
    throw new Error(addressError)
  }

  const addressId = addressPayload?.customerAddress?.id

  if (!addressId) {
    throw new Error('Shopify did not return a customer address id.')
  }

  const { data: defaultData } = await storefrontFetch<any>({
    query: DEFAULT_ADDRESS_UPDATE_MUTATION,
    variables: {
      customerAccessToken,
      addressId,
    },
  })

  const defaultPayload = defaultData?.customerDefaultAddressUpdate
  const defaultError = getFirstUserError(defaultPayload?.customerUserErrors)

  if (defaultError) {
    throw new Error(defaultError)
  }
}

export async function saveCustomerMarketAssignment(input: {
  customerId: string
  market: CustomerMarket
  countryCode: string
}): Promise<CustomerMarketAssignment> {
  const countryCode = input.countryCode.toUpperCase()
  const tag = `market:${input.market}`
  let source: CustomerMarketAssignment['source'] = 'tag'

  const { data: tagsData } = await adminFetch<any>({
    query: SAVE_MARKET_TAGS_MUTATION,
    variables: {
      customerId: input.customerId,
      tags: [tag],
    },
  })

  const tagError = getFirstUserError(tagsData?.tagsAdd?.userErrors)
  if (tagError) {
    throw new Error(tagError)
  }

  try {
    const { data: metafieldData } = await adminFetch<any>({
      query: SAVE_MARKET_METAFIELDS_MUTATION,
      variables: {
        metafields: [
          {
            ownerId: input.customerId,
            namespace: 'aurem',
            key: 'market',
            type: 'single_line_text_field',
            value: input.market,
          },
          {
            ownerId: input.customerId,
            namespace: 'aurem',
            key: 'registration_country_code',
            type: 'single_line_text_field',
            value: countryCode,
          },
        ],
      },
    })

    const metafieldError = getFirstUserError(metafieldData?.metafieldsSet?.userErrors)
    if (metafieldError) {
      throw new Error(metafieldError)
    }

    source = 'metafield+tag'
  } catch (error) {
    console.warn('[customer-registration] metafield persistence skipped; using tag fallback', error)
  }

  return {
    market: input.market,
    countryCode,
    tag,
    source,
  }
}

export async function getCustomerMarketAssignment(
  customerId: string,
): Promise<CustomerMarketAssignment | null> {
  const { data } = await adminFetch<any>({
    query: CUSTOMER_MARKET_QUERY,
    variables: { customerId },
  })

  const customer = data?.customer
  const marketValue = customer?.marketMetafield?.value
  const countryCode = customer?.countryMetafield?.value

  if (marketValue !== 'EU' && marketValue !== 'INTERNATIONAL') {
    const fallbackTag = Array.isArray(customer?.tags)
      ? customer.tags.find((tag: string) => tag === 'market:EU' || tag === 'market:INTERNATIONAL')
      : null

    if (!fallbackTag) {
      return null
    }

    const fallbackMarket = fallbackTag === 'market:EU' ? 'EU' : 'INTERNATIONAL'

    return {
      market: fallbackMarket,
      countryCode: typeof countryCode === 'string' ? countryCode : '',
      tag: fallbackTag,
      source: 'tag',
    }
  }

  return {
    market: marketValue,
    countryCode: typeof countryCode === 'string' ? countryCode : '',
    tag: `market:${marketValue}`,
    source: 'metafield+tag',
  }
}