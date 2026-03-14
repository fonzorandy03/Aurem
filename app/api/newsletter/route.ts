import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    // In production, this would subscribe via Shopify Customer API
    // or a newsletter service like Klaviyo / Mailchimp
    // For now, we log and return success
    console.log(`Newsletter subscription: ${email}`)

    return NextResponse.json(
      { success: true, message: 'Iscrizione completata' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    )
  }
}
