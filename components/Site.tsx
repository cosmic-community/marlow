import Link from 'next/link'
import type { ReactNode } from 'react'
import { signOut } from '@/app/actions'
import { currentGuest } from '@/lib/session'
import { ensureGuests, guestById } from '@/lib/guests'

const navItem =
  'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium leading-none text-ink/80 no-underline transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine'

function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className={navItem}>
      {icon}
      {children}
    </Link>
  )
}

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="block size-4 shrink-0 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

function MarlowMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
      <rect width="32" height="32" rx="9" className="fill-wine" />
      <path fill="#fffaf4" d="M16 7.2 6.8 15h2.1v9.2h5.1v-5.4h4v5.4h5.1V15h2.1L16 7.2Z" />
    </svg>
  )
}

function StaysMark() {
  return (
    <Mark>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.8V20h11V9.8" />
      <path d="M10 20v-5.5h4V20" />
    </Mark>
  )
}

function LeoMark() {
  return (
    <Mark>
      <path d="M5 6.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3.5V16.5H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
    </Mark>
  )
}

function DoorMark() {
  return (
    <Mark>
      <path d="M7 20.5V5.5A1 1 0 0 1 8 4.5h8a1 1 0 0 1 1 1v15" />
      <path d="M5.5 20.5h13" />
      <circle cx="14.2" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
    </Mark>
  )
}

function TripsMark() {
  return (
    <Mark>
      <rect x="4" y="5.5" width="16" height="14" rx="1.5" />
      <path d="M8 4v3.5M16 4v3.5M4 10h16" />
    </Mark>
  )
}

function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="block size-4 shrink-0 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

export async function SiteHeader() {
  await ensureGuests()
  const account = await currentGuest()
  const guest = account ? guestById(account) : null
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/95 shadow-[0_1px_2px_rgba(36,28,24,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-5">
        <Link href="/" className="inline-flex items-center gap-2 no-underline">
          <MarlowMark />
          <span className="font-serif text-[1.7rem] leading-none tracking-tight">Marlow</span>
          <span className="sr-only">Vacation rentals in Sonoma County</span>
        </Link>
        <nav className="order-last flex w-full items-center gap-0.5 sm:order-none sm:w-auto" aria-label="Marlow">
          <NavLink href="/stays" icon={<StaysMark />}>
            Stays
          </NavLink>
          <NavLink href="/chat" icon={<LeoMark />}>
            Ask Leo
          </NavLink>
          <NavLink href="/test" icon={<DoorMark />}>
            Agent door
          </NavLink>
          {guest ? (
            <NavLink href="/trips" icon={<TripsMark />}>
              Your stays
            </NavLink>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a className={navItem} href="https://github.com/cosmic-community/marlow" aria-label="GitHub">
            <GithubMark />
            <span className="hidden lg:inline">GitHub</span>
          </a>
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          {guest ? (
            <>
              <span className="hidden max-w-36 truncate px-2 text-sm text-ink/70 md:inline">{guest.name}</span>
              <form action={signOut}>
                <button className={`${navItem} border-0 bg-transparent`} type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full bg-wine px-4 text-sm font-medium leading-none !text-white no-underline shadow-[0_1px_2px_rgba(36,28,24,0.16)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-ink/70">
        <p>
          Marlow is a demo rental company. The chat and the{' '}
          <a className="underline" href="/agent.txt">
            agent door
          </a>{' '}
          are Leo, the Cosmic support agent. After a guest logs in, Leo reads and changes the same reservations as this site.
        </p>
        <p>
          Photos are from{' '}
          <a className="underline" href="https://unsplash.com/?utm_source=marlow&utm_medium=referral">
            Unsplash
          </a>
          . Payments are simulated.
        </p>
        <p>
          Source is on{' '}
          <a className="underline" href="https://github.com/cosmic-community/marlow">
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
