import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/cart/cart-context'
import { AuthProvider } from '@/components/account/auth-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { SideLabels } from '@/components/layout/side-labels'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'AUREM | The Coat Society - Made in Italy',
  description: 'AUREM - The Coat Society. Contemporary fashion brand Made in Italy. Explore our collections of coats, accessories, jewelry and bags.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/favicon-32x32.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f5f5f0',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/futura-std-4"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Xanh+Mono:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <SideLabels />
              {children}
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster
          position="bottom-left"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: 'bg-foreground text-background px-6 py-4 flex items-center gap-3 font-sans shadow-[0_4px_16px_rgba(0,0,0,0.12)]',
              title: 'text-[10px] tracking-[0.14em] uppercase font-medium',
              description: 'text-[9px] tracking-[0.1em] text-background/50 mt-0.5',
            },
            duration: 2500,
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
