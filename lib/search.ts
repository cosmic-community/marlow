import { ensureBookings, firstWindow, windowOpen } from './bookings'
import { offsetFromIso, startOfToday } from './dates'
import { wordNumber } from './money'
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

const TOWNS = ['healdsburg', 'guerneville', 'glen ellen', 'bodega bay', 'occidental', 'forestville']

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

const COUNT = '(\\d+|one|two|three|four|five|six|seven|eight)'

function dateFromAsk(text: string) {
  const match = text.match(
    new RegExp(
      `\\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?\\s+(\\d{1,2})(?:\\s*(?:-|to)\\s*(\\d{1,2}))?`,
      'i'
    )
  )
  if (!match) return { checkIn: null as number | null, nights: null as number | null }
  const month = MONTHS[match[1].toLowerCase()]
  const day = Number(match[2])
  const end = match[3] ? Number(match[3]) : null
  if (month == null || day < 1 || day > 31) return { checkIn: null, nights: null }
  const today = startOfToday()
  let year = today.getFullYear()
  if (new Date(year, month, day).getTime() < today.getTime()) year += 1
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return {
    checkIn: offsetFromIso(iso),
    nights: end && end > day ? end - day : null,
  }
}

// The same reading the agent uses for a public house question.
export function filtersFromAsk(text: string): SearchFilters {
  const lower = text.toLowerCase()
  const guests =
    lower.match(new RegExp(`${COUNT}\\s+(?:people|guests)`)) ||
    lower.match(new RegExp(`\\bsleeps?\\s+${COUNT}`)) ||
    lower.match(new RegExp(`\\bfor\\s+${COUNT}(?!\\s+nights?\\b)`))
  const nights = lower.match(new RegExp(`${COUNT}\\s+nights?`))
  const bedrooms = lower.match(new RegExp(`${COUNT}\\s+bedrooms?`))
  const budget = lower.match(/under\s*\$?\s*([\d,]+)/)
  const dated = dateFromAsk(lower)
  return {
    checkIn: dated.checkIn,
    nights: (nights && wordNumber(nights[1])) || dated.nights || 3,
    guests: guests ? wordNumber(guests[1]) : null,
    bedrooms: bedrooms ? wordNumber(bedrooms[1]) : null,
    hotTub: /hot tub/.test(lower),
    dogs: /\bdogs?\b/.test(lower),
    freeCancellation: /free cancellation/.test(lower),
    maxTotal: budget ? wordNumber(budget[1]) : null,
    town: TOWNS.find((name) => lower.includes(name)) || null,
  }
}
