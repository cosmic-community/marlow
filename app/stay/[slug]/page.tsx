import { Calendar } from '@/components/Calendar'
import { QuoteTable } from '@/components/QuoteTable'
import { reserve } from '@/app/actions'
import { ensureBookings, windowOpen } from '@/lib/bookings'
import { formatDate, isoFromOffset, offsetFromIso } from '@/lib/dates'
import { money } from '@/lib/money'
import { cancellationText, PHOTO_CREDIT, PHOTO_CREDIT_URL, propertyBySlug } from '@/lib/properties'
import { quoteStay } from '@/lib/quote'
import { notFound } from 'next/navigation'

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function StayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const property = await propertyBySlug(slug)
  if (!property) notFound()
  await ensureBookings()
  const raw = await searchParams
  const checkInIso = one(raw.checkIn) || isoFromOffset(21)
  const checkIn = offsetFromIso(checkInIso) ?? 21
  const nights = Number(one(raw.nights)) || 3
  const guests = Number(one(raw.guests)) || Math.min(4, property.sleeps)
  const pets = one(raw.dogs) === 'yes'
  const error = one(raw.error)
  const open = windowOpen(property, checkIn, nights)
  const quote = quoteStay(property, nights, pets)
  return (
    <article className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-6">
        <p className="text-sm uppercase tracking-wide text-ink/60">{property.town}</p>
        <h1 className="text-5xl">{property.name}</h1>
        <p className="max-w-2xl text-lg text-ink/80">{property.summary}</p>
        <img src={property.photos[0]} alt={property.name} className="aspect-[16/10] w-full rounded-lg object-cover" />
        <p className="text-xs text-ink/50">
          Photo:{' '}
          <a className="underline" href={PHOTO_CREDIT_URL}>
            {PHOTO_CREDIT}
          </a>
          . It is a stock photograph, not a picture of this house.
        </p>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li>{property.bedrooms} bedrooms</li>
          <li>{property.bathrooms} bathrooms</li>
          <li>Sleeps {property.sleeps}</li>
          <li>{property.hotTub ? 'Hot tub' : 'No hot tub'}</li>
          <li>{property.dogs ? `Dogs allowed, ${money(property.petFee)} pet fee` : 'No dogs'}</li>
          <li>Check-in {property.checkIn}</li>
          <li>Check-out {property.checkOut}</li>
          <li>
            {property.lateCheckout === 'noon'
              ? `Noon checkout is ${money(property.lateCheckoutFee)} when the next night is open`
              : 'Noon checkout is not offered'}
          </li>
        </ul>
        <p className="text-sm">{cancellationText(property.cancellation)}</p>
        <Calendar slug={property.slug} />
      </div>
      <aside className="h-fit space-y-4 rounded-lg border border-line bg-card p-5">
        <QuoteTable quote={quote} title={`${formatDate(checkIn)} to ${formatDate(checkIn + nights)}`} />
        {error ? <p className="rounded bg-wine/10 px-3 py-2 text-sm">{error}</p> : null}
        {open ? (
          <form action={reserve} className="space-y-3 text-sm">
            <input type="hidden" name="property" value={property.slug} />
            <input type="hidden" name="checkIn" value={isoFromOffset(checkIn)} />
            <input type="hidden" name="nights" value={nights} />
            <label className="block">
              Guests
              <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="number" name="guests" min={1} max={property.sleeps} defaultValue={guests} />
            </label>
            {property.dogs ? (
              <label className="flex items-center gap-2">
                <input type="checkbox" name="pets" value="yes" defaultChecked={pets} /> Bring a dog
              </label>
            ) : null}
            <button className="w-full rounded bg-wine px-4 py-2 text-paper" type="submit">
              Reserve, card on file
            </button>
            <p className="text-xs text-ink/60">The charge is simulated. Sign in as a demo guest to keep the reservation.</p>
          </form>
        ) : (
          <p className="text-sm">Those nights are booked. Pick an open stretch on the calendar.</p>
        )}
      </aside>
    </article>
  )
}
