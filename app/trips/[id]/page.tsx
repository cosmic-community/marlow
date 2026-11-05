import { notFound, redirect } from 'next/navigation'
import { approveCancel, approveExtension, requestLateCheckout, signOut } from '@/app/actions'
import { QuoteTable } from '@/components/QuoteTable'
import { arrivalOn, bookingById, ensureBookings, windowOpen } from '@/lib/bookings'
import { formatDate } from '@/lib/dates'
import { money } from '@/lib/money'
import { PHOTO_CREDIT, PHOTO_CREDIT_URL, propertyBySlug } from '@/lib/properties'
import { extraNight, quoteStay, refundFor } from '@/lib/quote'
import { currentGuest } from '@/lib/session'

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  await ensureBookings()
  const booking = bookingById(id)
  if (!booking) notFound()
  const account = await currentGuest()
  if (!account) redirect(`/login?next=/trips/${id}`)
  if (account !== booking.account) {
    return (
      <div className="space-y-3">
        <h1 className="text-4xl">Another guest&apos;s stay</h1>
        <p>Sign in as the guest who booked it to see arrival instructions.</p>
      </div>
    )
  }
  const property = await propertyBySlug(booking.property)
  if (!property) notFound()
  const error = one((await searchParams).error)
  const quote = quoteStay(property, booking.nights, booking.pets, booking.lateCheckout)
  const refund = refundFor(property, booking.nights, booking.pets, booking.lateCheckout, booking.checkInOffset)
  const checkout = booking.checkInOffset + booking.nights
  const canExtend = booking.status === 'confirmed' && windowOpen(property, checkout, 1, booking.id)
  const added = canExtend ? extraNight(property, booking.nights, booking.pets) : null
  const lateBlocked = arrivalOn(property, checkout, booking.id)
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <img src={property.photos[0]} alt={property.name} className="aspect-[16/10] w-full rounded-2xl object-cover" />
        <p className="text-xs text-ink/50">
          Photo:{' '}
          <a className="underline" href={PHOTO_CREDIT_URL}>
            {PHOTO_CREDIT}
          </a>
        </p>
        <p className="text-sm uppercase tracking-wide text-ink/60">{booking.status}</p>
        <h1 className="text-5xl">{property.name}</h1>
        <p>
          {formatDate(booking.checkInOffset)} to {formatDate(checkout)}. {property.town}. Check-in {property.checkIn}. Check-out{' '}
          {booking.lateCheckout ? '12:00 pm' : property.checkOut}.
        </p>
        {booking.status === 'confirmed' ? (
          <div className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-2xl">Arrival</h2>
            <p className="mt-2">{booking.arrival || property.arrival}</p>
          </div>
        ) : (
          <p>This stay is cancelled.{booking.refund != null ? ` The refund is ${money(booking.refund)}.` : ''}</p>
        )}
        {error ? <p className="rounded bg-wine/10 px-3 py-2 text-sm">{error}</p> : null}
        <p className="text-sm text-ink/70">Refresh this page after a change. A signed-in guest, or Leo after the guest logs in, changes this same reservation.</p>
        <form action={signOut}>
          <button className="text-sm underline" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <aside className="space-y-6">
        <div className="rounded-lg border border-line bg-card p-5">
          <QuoteTable quote={quote} />
        </div>
        {booking.status === 'confirmed' ? (
          <div className="space-y-4 rounded-lg border border-line bg-card p-5 text-sm">
            <h2 className="text-2xl">Noon checkout</h2>
            {booking.lateCheckout ? (
              <p>Noon checkout is already on this stay.</p>
            ) : property.lateCheckout !== 'noon' ? (
              <p>{property.name} does not offer a noon checkout.</p>
            ) : lateBlocked ? (
              <p>Another guest arrives the day you leave, so noon checkout is not available.</p>
            ) : (
              <form action={requestLateCheckout} className="space-y-2">
                <p>The fee is {money(property.lateCheckoutFee)}. The next night is open.</p>
                <input type="hidden" name="id" value={booking.id} />
                <button className="rounded bg-wine px-3 py-2 text-paper" type="submit">
                  Add noon checkout
                </button>
              </form>
            )}
            <h2 className="pt-2 text-2xl">One more night</h2>
            {added ? (
              <form action={approveExtension} className="space-y-2">
                <p>
                  Checkout would move to {formatDate(checkout + 1)}. Additional charge {money(added.total)}: {money(added.lodging)} lodging,{' '}
                  {money(added.service)} service, {money(added.tax)} tax.
                </p>
                <input type="hidden" name="id" value={booking.id} />
                <button className="rounded bg-wine px-3 py-2 text-paper" type="submit">
                  Add the night
                </button>
              </form>
            ) : (
              <p>{property.name} is booked the night after you leave.</p>
            )}
            <h2 className="pt-2 text-2xl">Cancel</h2>
            <form action={approveCancel} className="space-y-2">
              <p>
                {refund.rule} Refund {money(refund.refund)} of {money(quote.total)}.
              </p>
              <input type="hidden" name="id" value={booking.id} />
              <button className="rounded border border-wine px-3 py-2 text-wine" type="submit">
                Cancel this stay
              </button>
            </form>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
