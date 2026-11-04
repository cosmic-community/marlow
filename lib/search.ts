import { ensureBookings, firstWindow, windowOpen } from './bookings'
import { offsetFromIso } from './dates'
import { loadProperties, type Property } from './properties'
import { quoteStay, type Quote } from './quote'

export type SearchFilters = {
  checkIn: number | null
  nights: number
  guests: number | null
  bedrooms: number | null
  hotTub: boolean
  dogs: boolean
  freeCancellation: boolean
  maxTotal: number | null
  town: string | null
}

export type StayMatch = {
  property: Property
  start: number
  nights: number
  price: Quote
}

export async function searchStays(filters: SearchFilters): Promise<StayMatch[]> {
  await ensureBookings()
  const nights = filters.nights > 0 ? filters.nights : 3
  const matches: StayMatch[] = []
  for (const property of await loadProperties()) {
    if (filters.guests && property.sleeps < filters.guests) continue
    if (filters.bedrooms && property.bedrooms < filters.bedrooms) continue
    if (filters.hotTub && !property.hotTub) continue
    if (filters.dogs && !property.dogs) continue
    if (filters.freeCancellation && property.cancellation !== 'free') continue
    if (filters.town && property.town.toLowerCase() !== filters.town.toLowerCase()) continue
    const start = filters.checkIn ?? firstWindow(property, nights)
    if (start == null) continue
    if (filters.checkIn != null && !windowOpen(property, filters.checkIn, nights)) continue
    const price = quoteStay(property, nights, filters.dogs)
    if (filters.maxTotal != null && price.total > filters.maxTotal) continue
    matches.push({ property, start, nights, price })
  }
  return matches.sort((a, b) => a.price.total - b.price.total || a.property.name.localeCompare(b.property.name))
}

export function filtersFromQuery(query: Record<string, string | undefined>): SearchFilters {
  const guests = Number(query.guests)
  const bedrooms = Number(query.bedrooms)
  const maxTotal = Number(query.maxTotal)
  return {
    checkIn: query.checkIn ? offsetFromIso(query.checkIn) : null,
    nights: Number(query.nights) || 3,
    guests: Number.isFinite(guests) && guests > 0 ? guests : null,
    bedrooms: Number.isFinite(bedrooms) && bedrooms > 0 ? bedrooms : null,
    hotTub: query.hotTub === 'yes',
    dogs: query.dogs === 'yes',
    freeCancellation: query.freeCancellation === 'yes',
    maxTotal: Number.isFinite(maxTotal) && maxTotal > 0 ? maxTotal : null,
    town: query.town || null,
  }
}
