import { offsetFromIso } from './dates'
import { wordNumber } from './money'
import { PROPERTIES } from './properties'

const MONTH = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'
const DAY = '(\\d{1,2})(?:st|nd|rd|th)?'
const YEAR = '(?:,?\\s*(\\d{4}))?'
const RANGE = new RegExp(`(${MONTH})\\s+${DAY}${YEAR}\\s*(?:to|through|-)\\s*(?:(${MONTH})\\s+)?${DAY}${YEAR}`, 'i')
const ONE_DATE = new RegExp(`(${MONTH})\\s+${DAY}${YEAR}`, 'i')

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

export type BookInput = {
  property: string
  checkInOffset: number
  nights: number
  guests: number
  pets: boolean
  guestsAssumed: boolean
}

function monthIndex(name: string) {
  return MONTHS[name.toLowerCase().slice(0, 3)]
}

function offsetFor(year: number | null, month: number, day: number) {
  const today = new Date()
  const resolved = year ?? today.getFullYear() + (new Date(today.getFullYear(), month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ? 1 : 0)
  return offsetFromIso(`${resolved}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
}

export function houseNamed(message: string) {
  const text = message.toLowerCase().replaceAll('-', ' ')
  return (
    [...PROPERTIES]
      .sort((a, b) => b.name.length - a.name.length)
      .find((property) => {
        const name = property.name.toLowerCase().replace(/^the /, '')
        return text.includes(name) || text.includes(property.slug.replaceAll('-', ' '))
      }) || null
  )
}

function nightsSaid(message: string) {
  const match = message.match(/(\d+|one|two|three|four|five|six|seven)\s+nights?/i)
  return match ? wordNumber(match[1]) : null
}

function datesFrom(message: string) {
  const iso = [...message.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((match) => offsetFromIso(match[0]))
  if (iso[0] != null && iso[1] != null && iso[1] > iso[0]) return { checkInOffset: iso[0], nights: iso[1] - iso[0] }
  const said = nightsSaid(message)
  if (iso[0] != null && said) return { checkInOffset: iso[0], nights: said }

  const range = RANGE.exec(message)
  if (range) {
    const startMonth = monthIndex(range[1])
    const endMonth = range[4] ? monthIndex(range[4]) : startMonth
    const start = offsetFor(range[3] ? Number(range[3]) : null, startMonth, Number(range[2]))
    const end = offsetFor(range[6] ? Number(range[6]) : range[3] ? Number(range[3]) : null, endMonth, Number(range[5]))
    if (start != null && end != null && end > start) return { checkInOffset: start, nights: end - start }
  }

  const one = ONE_DATE.exec(message)
  if (one && said) {
    const start = offsetFor(one[3] ? Number(one[3]) : null, monthIndex(one[1]), Number(one[2]))
    if (start != null) return { checkInOffset: start, nights: said }
  }
  return null
}

/** A request to reserve a named house. Null when the message is a search instead. */
export function bookFromMessage(message: string): { input: BookInput } | { error: string } | null {
  if (!/\b(book|reserve)\b/i.test(message) || /\b(my booking|my reservation|already booked|cancel)\b/i.test(message)) return null
  const house = houseNamed(message)
  if (!house) return null
  const dates = datesFrom(message)
  if (!dates) return { error: `Which nights at ${house.name}? Give a check-in and check-out, such as Nov 20 to 23.` }
  const guestsMatch = message.match(/(\d+|two|three|four|five|six|seven|eight)\s+(?:people|guests)/i)
  const guests = guestsMatch ? wordNumber(guestsMatch[1]) : null
  return {
    input: {
      property: house.slug,
      checkInOffset: dates.checkInOffset,
      nights: dates.nights,
      guests: guests || 2,
      pets: /\bdogs?\b/i.test(message) && !/\bno dogs?\b/i.test(message),
      guestsAssumed: !guests,
    },
  }
}

export function bookFromBody(body: unknown): { input: BookInput } | { error: string } {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const house = houseNamed(String(raw.property || raw.house || ''))
  const checkIn = offsetFromIso(String(raw.check_in || ''))
  const checkOut = offsetFromIso(String(raw.check_out || ''))
  const nights = Number(raw.nights) || (checkIn != null && checkOut != null ? checkOut - checkIn : 0)
  const guests = Number(raw.guests)
  if (!house) return { error: 'Name the home, such as River Lookout.' }
  if (checkIn == null || nights < 1) return { error: 'Send check_in as YYYY-MM-DD and nights as a number.' }
  return {
    input: {
      property: house.slug,
      checkInOffset: checkIn,
      nights,
      guests: guests || 2,
      pets: raw.dogs === true || raw.pets === true,
      guestsAssumed: !guests,
    },
  }
}
