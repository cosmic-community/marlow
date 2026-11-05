import Link from 'next/link'
import { redirect } from 'next/navigation'
import { bookingsFor, ensureBookings } from '@/lib/bookings'
import { formatDate } from '@/lib/dates'
import { guestById } from '@/lib/guests'
import { money } from '@/lib/money'
import { propertyBySlug } from '@/lib/properties'
import { quoteStay } from '@/lib/quote'
import { currentGuest } from '@/lib/session'

export default async function TripsPage() {
  await ensureBookings()
  const account = await currentGuest()
  if (!account) redirect('/login?next=/trips')
  const guest = guestById(account)
  const bookings = bookingsFor(account)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl">Your stays</h1>
        <p className="mt-2 max-w-xl text-ink/75">{guest?.name}. Refresh this page after an assistant changes a reservation.</p>
      </div>
      {bookings.length === 0 ? <p>No stays yet.</p> : null}
      <ul className="space-y-4">
        {(
          await Promise.all(
            bookings.map(async (booking) => ({
              booking,
              property: await propertyBySlug(booking.property),
            }))
          )
        ).map(({ booking, property }) => {
          const quote = property ? quoteStay(property, booking.nights, booking.pets, booking.lateCheckout) : null
          const cancelled = booking.status === 'cancelled'
          return (
            <li key={booking.id} className="overflow-hidden rounded-2xl border border-line bg-card">
              <Link href={`/trips/${booking.id}`} className="grid no-underline sm:grid-cols-[16rem_1fr]">
                {property?.photos[0] ? (
                  <img src={property.photos[0]} alt="" className="aspect-[16/10] h-full w-full object-cover sm:aspect-auto sm:min-h-40" />
                ) : (
                  <div className="aspect-[16/10] bg-paper sm:aspect-auto sm:min-h-40" />
                )}
                <div className="flex flex-col justify-center gap-1 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-ink/60">{property?.town}</p>
                    <p className={`text-xs uppercase tracking-wide ${cancelled ? 'text-ink/40' : 'text-wine'}`}>{booking.status}</p>
                  </div>
                  <p className="font-serif text-2xl leading-tight">{property?.name || booking.property}</p>
                  <p className="text-sm text-ink/75">
                    {formatDate(booking.checkInOffset)} to {formatDate(booking.checkInOffset + booking.nights)}
                    {quote ? ` · ${money(quote.total)}` : ''}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
