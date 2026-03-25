import { Resend } from 'resend'

type SendWelcomeEmailResult =
  | { status: 'sent'; id?: string }
  | { status: 'skipped'; reason: string }

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.NEWSLETTER_FROM_EMAIL

const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendNewsletterWelcomeEmail(email: string): Promise<SendWelcomeEmailResult> {
  if (!resend) {
    return { status: 'skipped', reason: 'RESEND_API_KEY not configured' }
  }

  if (!fromEmail) {
    return { status: 'skipped', reason: 'NEWSLETTER_FROM_EMAIL not configured' }
  }

  const subject = 'Welcome to AUREM newsletter'
  const text = [
    'Thank you for subscribing to AUREM.',
    '',
    'You will receive updates on new collections, exclusive events and special offers.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 22px; margin-bottom: 8px;">Welcome to AUREM</h1>
      <p style="font-size: 14px; margin: 0 0 12px;">Thank you for subscribing to our newsletter.</p>
      <p style="font-size: 14px; margin: 0;">You will receive updates on new collections, exclusive events and special offers.</p>
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