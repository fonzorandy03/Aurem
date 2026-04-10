import { Resend } from 'resend'

type SendAccountWelcomeEmailResult =
  | { status: 'sent'; id?: string }
  | { status: 'skipped'; reason: string }

export async function sendAccountWelcomeEmail(email: string, firstName?: string | null): Promise<SendAccountWelcomeEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.AUTH_FROM_EMAIL ?? process.env.NEWSLETTER_FROM_EMAIL

  console.log('[sendAccountWelcomeEmail] config check', {
    hasResendKey: !!resendApiKey,
    hasFromEmail: !!fromEmail,
    fromEmail: fromEmail || 'NOT_SET',
    to: email,
  })

  if (!resendApiKey) {
    console.log('[sendAccountWelcomeEmail] skipped: RESEND_API_KEY not configured')
    return { status: 'skipped', reason: 'RESEND_API_KEY not configured' }
  }

  if (!fromEmail) {
    console.log('[sendAccountWelcomeEmail] skipped: AUTH_FROM_EMAIL / NEWSLETTER_FROM_EMAIL not configured')
    return { status: 'skipped', reason: 'AUTH_FROM_EMAIL / NEWSLETTER_FROM_EMAIL not configured' }
  }

  const resend = new Resend(resendApiKey)

  const safeName = firstName?.trim() || 'there'
  const subject = 'Welcome to AUREM'
  const text = [
    `Hello ${safeName},`,
    '',
    'Your account has been created successfully.',
    'You can now access your orders and manage your profile on AUREM.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">Welcome to AUREM</h1>
      <p style="font-size: 14px; margin: 0 0 12px;">Hello ${safeName},</p>
      <p style="font-size: 14px; margin: 0;">Your account has been created successfully. You can now access your orders and manage your profile.</p>
    </div>
  `

  console.log('[sendAccountWelcomeEmail] sending email...', { from: fromEmail, to: email, subject })

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject,
    text,
    html,
  })

  if (error) {
    console.error('[sendAccountWelcomeEmail] Resend error:', error)
    throw new Error(`Resend error: ${error.message}`)
  }

  console.log('[sendAccountWelcomeEmail] success', { id: data?.id, to: email })
  return { status: 'sent', id: data?.id }
}
