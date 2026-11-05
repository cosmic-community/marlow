import Link from 'next/link'
import { signOut } from '@/app/actions'
import { currentGuest } from '@/lib/session'
import { ensureGuests, guestById } from '@/lib/guests'

export async function SiteHeader() {
  await ensureGuests()
  const account = await currentGuest()
  const guest = account ? guestById(account) : null
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-5">
        <Link href="/" className="no-underline">
          <p className="font-serif text-3xl leading-none">Marlow</p>
          <p className="mt-1 text-sm text-ink/70">Vacation rentals in Sonoma County</p>
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm" aria-label="Marlow">
          <Link className="underline decoration-line underline-offset-4" href="/stays">
            Houses
          </Link>
          <Link className="underline decoration-line underline-offset-4" href="/trips">
            Your stays
          </Link>
          <Link className="inline-flex items-center gap-2 underline decoration-line underline-offset-4" href="/chat">
            <img src="/leo.jpg" alt="" className="h-7 w-7 rounded-full object-cover" />
            Ask Leo
          </Link>
          <Link className="underline decoration-line underline-offset-4" href="/test">
            Agent door
          </Link>
          {guest ? (
            <>
              <span className="text-ink/70">{guest.name}</span>
              <form action={signOut}>
                <button className="underline decoration-line underline-offset-4" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link className="underline decoration-line underline-offset-4" href="/login">
              Sign in
            </Link>
          )}
        </nav>
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
      </div>
    </footer>
  )
}
