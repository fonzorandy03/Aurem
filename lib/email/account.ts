import { Resend } from 'resend'

type SendAccountWelcomeEmailResult =
  | { status: 'sent'; id?: string }
  | { status: 'skipped'; reason: string }

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.AUTH_FROM_EMAIL ?? process.env.NEWSLETTER_FROM_EMAIL

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendAccountWelcomeEmail(email: string, firstName?: string | null): Promise<SendAccountWelcomeEmailResult> {
  if (!resend) {
    return { status: 'skipped', reason: 'RESEND_API_KEY not configured' }
  }

  if (!fromEmail) {
    return { status: 'skipped', reason: 'AUTH_FROM_EMAIL / NEWSLETTER_FROM_EMAIL not configured' }
  }

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

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject,
    text,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return { status: 'sent', id: data?.id }
}
