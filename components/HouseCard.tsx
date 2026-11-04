import Link from 'next/link'
import { isoFromOffset } from '@/lib/dates'
import { money } from '@/lib/money'
import { PHOTO_CREDIT, PHOTO_CREDIT_URL, type Property } from '@/lib/properties'
import type { Quote } from '@/lib/quote'

export function HouseCard({
  property,
  price,
  checkIn,
  nights,
}: {
  property: Property
  price?: Quote
  checkIn?: string
  nights?: number
}) {
  const query = checkIn ? `?checkIn=${checkIn}&nights=${nights || price?.nights || 3}` : `?checkIn=${isoFromOffset(21)}&nights=3`
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-card">
      <Link href={`/stay/${property.slug}${query}`} className="no-underline">
        <img src={property.photos[0]} alt={property.name} className="aspect-[4/3] w-full object-cover" />
        <div className="space-y-1 p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">{property.town}</p>
          <h2 className="text-2xl">{property.name}</h2>
          <p className="text-sm text-ink/75">
            {property.bedrooms} bedrooms · sleeps {property.sleeps}
            {property.hotTub ? ' · hot tub' : ''}
            {property.dogs ? ' · dogs' : ''}
          </p>
          <p className="pt-2 text-sm tabular-nums">
            {price ? <span className="font-medium">{money(price.total)} total</span> : <span>{money(property.nightly)} a night</span>}
          </p>
        </div>
      </Link>
      <p className="px-4 pb-3 text-xs text-ink/50">
        Photo:{' '}
        <a className="underline" href={PHOTO_CREDIT_URL}>
          {PHOTO_CREDIT}
        </a>
      </p>
    </article>
  )
}
