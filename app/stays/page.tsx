import { HouseCard } from '@/components/HouseCard'
import { SearchForm } from '@/components/SearchForm'
import { isoFromOffset } from '@/lib/dates'
import { filtersFromQuery, searchStays } from '@/lib/search'

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const query = {
    checkIn: one(raw.checkIn),
    nights: one(raw.nights),
    guests: one(raw.guests),
    bedrooms: one(raw.bedrooms),
    hotTub: one(raw.hotTub),
    dogs: one(raw.dogs),
    freeCancellation: one(raw.freeCancellation),
    maxTotal: one(raw.maxTotal),
    town: one(raw.town),
  }
  const filters = filtersFromQuery(query)
  const matches = await searchStays(filters)
  const checkIn = query.checkIn || isoFromOffset(filters.checkIn ?? 21)
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl">Houses</h1>
        <p className="text-ink/75">
          {matches.length === 0 ? 'Nothing is open for those dates and filters.' : `${matches.length} open.`} The total includes cleaning, a 12% service fee, and 14% tax.
          {filters.dogs ? ' The pet fee is included.' : ''}
        </p>
      </div>
      <SearchForm
        values={{
          checkIn,
          nights: String(filters.nights),
          guests: filters.guests != null ? String(filters.guests) : '',
          bedrooms: filters.bedrooms != null ? String(filters.bedrooms) : '',
          hotTub: filters.hotTub,
          dogs: filters.dogs,
          freeCancellation: filters.freeCancellation,
          maxTotal: filters.maxTotal != null ? String(filters.maxTotal) : '',
        }}
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <HouseCard
            key={match.property.slug}
            property={match.property}
            price={match.price}
            checkIn={isoFromOffset(match.start)}
            nights={match.nights}
          />
        ))}
      </div>
    </div>
  )
}
