const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  EUR: 'it-IT',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  NZD: 'en-NZ',
  JPY: 'ja-JP',
  CHF: 'de-CH',
}

type FormatMoneyOptions = {
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatMoney(
  amount: string | number,
  currencyCode: string,
  options: FormatMoneyOptions = {},
): string {
  const normalizedCurrency = String(currencyCode || 'EUR').toUpperCase()
  const locale = options.locale ?? CURRENCY_LOCALE_MAP[normalizedCurrency] ?? 'en-US'
  const parsedAmount =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount))

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  }).format(Number.isFinite(parsedAmount) ? parsedAmount : 0)
}
