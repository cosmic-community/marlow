import type { AnswerResult } from '@conciergeprotocol/server'
import { isoFromOffset } from './dates'
import type { Property } from './properties'
import type { Quote } from './quote'

const HOURS = 12 * 60 * 60 * 1000

export type ListingInput = {
  property: Property
  start: number
  nights: number
  price: Quote
  pets?: boolean
  ref: number
  origin: string
}

// The installed server types predate items. The fields are returned anyway,
// and a server that knows the extension passes them through.
type WithItems = { reply: string; items?: Record<string, unknown>[]; as_of?: string }

export function withItems(reply: string, items: Record<string, unknown>[]): AnswerResult {
  if (!items.length) return { reply }
  return { reply, items, as_of: new Date().toISOString() } as WithItems as AnswerResult
}

export function listingItem({ property, start, nights, price, pets = false, ref, origin }: ListingInput) {
  const checkIn = isoFromOffset(start)
  const checkOut = isoFromOffset(start + nights)
  const until = new Date(Date.now() + HOURS).toISOString()
  const pet = pets && price.pet ? ', pet fee' : ''
  return {
    type: 'listing',
    ref,
    id: property.slug,
    title: property.name,
    url: `${origin}/stay/${property.slug}?checkIn=${checkIn}&nights=${nights}`,
    image: property.photos[0],
    summary: property.summary,
    price: { amount: price.total.toFixed(2), currency: 'USD' },
    price_note: `total for ${nights} nights, including cleaning${pet}, service fee, and tax`,
    availability: 'available',
    valid_until: until,
    start: `${checkIn}T16:00:00Z`,
    end: `${checkOut}T17:00:00Z`,
    location: { name: property.name, locality: property.town, region: 'CA', country: 'US' },
    capacity: property.sleeps,
    schema: 'https://schema.org/Accommodation',
  }
}
