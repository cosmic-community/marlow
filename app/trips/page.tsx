import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import { bookingsFor, ensureBookings } from '@/lib/bookings'
import { formatDate } from '@/lib/dates'
import { guestById } from '@/lib/guests'
import { propertyBySlug } from '@/lib/properties'
import { quoteStay } from '@/lib/quote'
import { currentGuest } from '@/lib/session'
import { money } from '@/lib/money'

export default async function TripsPage() {
  await ensureBookings()
  const account = await currentGuest()
  if (!account) redirect('/login?next=/trips')
  const guest = guestById(account)
  const bookings = bookingsFor(account)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Your stays</h1>
          <p className="mt-2 text-ink/75">{guest?.name}. Refresh this page after an assistant changes a reservation.</p>
        </div>
        <form action={signOut}>
          <button className="text-sm underline" type="submit">
            Sign out
          </button>
        </form>
      </div>
      {bookings.length === 0 ? <p>No stays yet.</p> : null}
      <ul className="space-y-3">
        {(
          await Promise.all(
            bookings.map(async (booking) => ({
              booking,
              property: await propertyBySlug(booking.property),
            }))
          )
        ).map(({ booking, property }) => {
          const quote = property ? quoteStay(property, booking.nights, booking.pets, booking.lateCheckout) : null
          return (
            <li key={booking.id} className="rounded-lg border border-line bg-card p-4">
              <Link href={`/trips/${booking.id}`} className="no-underline">
                <p className="font-serif text-2xl">{property?.name || booking.property}</p>
                <p className="text-sm text-ink/75">
                  {formatDate(booking.checkInOffset)} to {formatDate(booking.checkInOffset + booking.nights)} · {booking.status}
                  {quote ? ` · ${money(quote.total)}` : ''}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
