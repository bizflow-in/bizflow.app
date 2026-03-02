import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'BizFlow — Smart Business OS for Indian MSMEs',
  description: 'Manage orders, inventory, payments, GST, and vendors — powered by WhatsApp automation',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '15px' },
          }}
        />
      </body>
    </html>
  )
}
