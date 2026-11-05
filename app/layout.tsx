import type { Metadata } from 'next'
import { CosmicBadge } from '@/components/CosmicBadge'
import { LeoChat } from '@/components/LeoChat'
import { SiteFooter, SiteHeader } from '@/components/Site'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Marlow', template: '%s · Marlow' },
  description: 'Vacation rentals in Sonoma County, with a guest portal and an agent door on the same reservations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        <SiteFooter />
        <CosmicBadge />
        <LeoChat />
      </body>
    </html>
  )
}
