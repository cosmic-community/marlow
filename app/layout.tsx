import type { Metadata } from 'next'
import { LeoChat } from '@/components/LeoChat'
import { SiteFooter, SiteHeader } from '@/components/Site'
import './globals.css'

export const dynamic = 'force-dynamic'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://marlow.cosmic.site').replace(/\/$/, '')
const description = 'Vacation rentals in Sonoma County, with a guest portal and an agent door on the same reservations.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Marlow', template: '%s · Marlow' },
  description,
  applicationName: 'Marlow',
  openGraph: {
    type: 'website',
    siteName: 'Marlow',
    locale: 'en_US',
    title: 'Marlow',
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marlow',
    description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        <SiteFooter />
        <LeoChat />
      </body>
    </html>
  )
}
