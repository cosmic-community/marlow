import type { AnswerInput, AnswerResult } from '@conciergeprotocol/server'
import { bookFromMessage } from './booking-request'
import {
  cancelStay,
  createBooking,
  ensureBookings,
  extendStay,
  previewBook,
  previewCancel,
  previewExtend,
  primaryStay,
  setLateCheckout,
} from './bookings'
import { formatDate, isoFromOffset, offsetFromIso } from './dates'
import { ensureGuests, guestById, verifyGuest } from './guests'
import { askLeo } from './leo'
import { money } from './money'
import { cancellationText, propertyBySlug } from './properties'
import { quoteStay } from './quote'
import { filtersFromAsk, searchStays, type SearchFilters } from './search'
import { accountFromCookieHeader } from './token'

const origin = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220').replace(/\/$/, '')

const loginRequired = {
  error: { code: 'login_required', message: 'Log in to Marlow to see your stay.' },
}

const writeRequired = {
  error: {
    code: 'write_required',
    message: 'This login can read your stay but not change it. Log in again and allow changes.',
  },
}

function intent(message: string) {
  const text = message.toLowerCase()
  if (/\bcancel\b/.test(text) && /\b(my|booking|reservation|stay)\b/.test(text)) return 'cancel'
  if (/\bextend\b/.test(text)) return 'extend'
  if (/check out at noon|late checkout|checkout at noon/.test(text)) return 'late'
  if (/\b(my booking|my reservation|my stay|already booked|arrival instructions)\b/.test(text)) return 'account'
  if (/\barrival\b/.test(text) && /\b(my|i)\b/.test(text)) return 'account'
  if (/\bcheck-?in\b/.test(text) && /\bmy\b/.test(text)) return 'account'
  if (/\b(lockbox|arrival code|door code)\b/.test(text)) return 'account'
  if (bookFromMessage(message)) return 'book'
  return 'search'
}

function isStaySearch(message: string) {
  const text = message.toLowerCase()
  return /\b(people|guests|bedrooms?|hot tub|dogs?|nights?|under \$?\d|budget|free cancellation|which of those|which ones)\b/.test(text)
}

function filtersFrom(texts: string[]): SearchFilters {
  return filtersFromAsk(texts.join('\n'))
}

function describe(filters: SearchFilters) {
  const parts = [`${filters.nights} nights`]
  if (filters.guests) parts.push(`${filters.guests} guests`)
  if (filters.bedrooms) parts.push(`${filters.bedrooms} bedrooms`)
  if (filters.hotTub) parts.push('a hot tub')
  if (filters.dogs) parts.push('dogs allowed')
  if (filters.freeCancellation) parts.push('free cancellation')
  if (filters.maxTotal != null) parts.push(`a total under ${money(filters.maxTotal)}`)
  if (filters.town) parts.push(filters.town)
  return parts.join(', ')
}

async function searchReply(texts: string[]) {
  const filters = filtersFrom(texts)
  const matches = await searchStays(filters)
  if (!matches.length) {
    return `Nothing is open for ${describe(filters)} in Sonoma County. The total includes cleaning, a 12% service fee, and 14% tax.`
  }
  const lines = matches.slice(0, 8).map((match) => {
    const href = `${origin()}/stay/${match.property.slug}?checkIn=${isoFromOffset(match.start)}&nights=${match.nights}`
    const pet = match.price.pet ? `, ${money(match.price.pet)} pet` : ''
    return `- ${match.property.name}, ${match.property.town}. Sleeps ${match.property.sleeps}. ${match.property.hotTub ? 'Hot tub. ' : ''}${match.property.dogs ? 'Dogs allowed. ' : 'No dogs. '}${cancellationText(match.property.cancellation)} ${formatDate(match.start)} to ${formatDate(match.start + match.nights)}, ${money(match.price.total)} total (${money(match.price.lodging)} lodging, ${money(match.price.cleaning)} cleaning${pet}, ${money(match.price.service)} service, ${money(match.price.tax)} tax). ${href}`
  })
  const more = matches.length > 8 ? ` ${matches.length - 8} more are open.` : ''
  return `For ${describe(filters)} in Sonoma County, ${matches.length === 1 ? 'this house is open' : `these ${matches.length} houses are open`}.${more}\n${lines.join('\n')}`
}

async function stayReply(account: string) {
  const booking = primaryStay(account)
  if (!booking) return 'There is no upcoming stay on this account.'
  const property = await propertyBySlug(booking.property)
  if (!property) return 'That house is not in the catalog.'
  const guest = guestById(account)
  const quote = quoteStay(property, booking.nights, booking.pets, booking.lateCheckout)
  const late = booking.lateCheckout ? ` Noon checkout is on the stay, for ${money(property.lateCheckoutFee)}.` : ''
  const arrival = booking.arrival || property.arrival
  return `${guest?.name || 'This guest'} is booked at ${property.name} in ${property.town}, ${formatDate(booking.checkInOffset)} to ${formatDate(booking.checkInOffset + booking.nights)}. Check-in is ${property.checkIn}. Check-out is ${property.checkOut}. The total is ${money(quote.total)}.${late} Arrival: ${arrival} ${origin()}/trips/${booking.id}`
}

export async function answer({ message, history, account, scope }: AnswerInput): Promise<AnswerResult> {
  await ensureBookings()
  const kind = intent(message)
  if (kind !== 'search' && !account) return loginRequired

  if (kind === 'cancel') {
    if (scope !== 'write') return writeRequired
    const preview = await previewCancel(account as string)
    if (!('refund' in preview) || !preview.booking || !preview.property || !preview.quote) {
      return { reply: 'error' in preview ? preview.error : 'That stay was not found.' }
    }
    const { booking, property, quote, refund } = preview
    return {
      reply: `Cancel the stay at ${property.name}, ${formatDate(booking.checkInOffset)} to ${formatDate(booking.checkInOffset + booking.nights)}. ${refund.rule} Refund ${money(refund.refund)} of ${money(quote.total)}. This does not happen until you approve it.`,
      confirm: {
        summary: `Cancel ${property.name}, ${formatDate(booking.checkInOffset)} to ${formatDate(booking.checkInOffset + booking.nights)}. Refund ${money(refund.refund)} of ${money(quote.total)}.`,
        authorization_details: [{ type: 'cancel_booking', booking: booking.id }],
      },
    }
  }

  if (kind === 'extend') {
    if (scope !== 'write') return writeRequired
    const preview = await previewExtend(account as string)
    if (!('added' in preview) || !preview.booking || !preview.property || !preview.added) {
      return { reply: 'error' in preview ? preview.error : 'That stay was not found.' }
    }
    const { booking, property, added } = preview
    return {
      reply: `One more night at ${property.name} is open. The new checkout is ${formatDate(booking.checkInOffset + booking.nights + 1)}. The additional charge is ${money(added.total)}: ${money(added.lodging)} lodging, ${money(added.service)} service, ${money(added.tax)} tax. Cleaning is not charged again. This does not happen until you approve it.`,
      confirm: {
        summary: `Extend ${property.name} by one night, to ${formatDate(booking.checkInOffset + booking.nights + 1)}. Additional charge ${money(added.total)}.`,
        authorization_details: [{ type: 'extend_booking', booking: booking.id }],
      },
    }
  }

  if (kind === 'late') {
    if (scope !== 'write') return writeRequired
    const booking = primaryStay(account as string)
    if (!booking) return { reply: 'There is no upcoming stay on this account.' }
    const result = await setLateCheckout(account as string, booking.id)
    if ('error' in result && result.error) return { reply: result.error }
    const property = await propertyBySlug(booking.property)
    const quote = property ? quoteStay(property, booking.nights, booking.pets, true) : null
    return {
      reply: `Noon checkout is added at ${property?.name}. The fee is ${money(result.fee || 0)}.${quote ? ` The stay total is now ${money(quote.total)}.` : ''} ${origin()}/trips/${booking.id}`,
    }
  }

  if (kind === 'account') return { reply: await stayReply(account as string) }

  if (kind === 'book') {
    if (scope !== 'write') return writeRequired
    const request = bookFromMessage(message)
    if (!request) return { reply: 'Name the house and the nights, such as River Lookout, Nov 20 to 23.' }
    if ('error' in request) return { reply: request.error }
    const preview = await previewBook(request.input)
    if ('error' in preview && preview.error) return { reply: preview.error }
    if (!preview.property || !preview.quote) return { reply: 'That house is not available.' }
    const { property, quote } = preview
    const { checkInOffset, nights, guests, pets, guestsAssumed } = request.input
    const dog = pets ? ', with a dog' : ''
    const assumed = guestsAssumed ? ' I counted 2 guests because the request did not say.' : ''
    const stay = `${property.name}, ${formatDate(checkInOffset)} to ${formatDate(checkInOffset + nights)}, ${guests} guests${dog}`
    return {
      reply: `Book ${stay}. The total is ${money(quote.total)}: ${money(quote.lodging)} lodging, ${money(quote.cleaning)} cleaning${quote.pet ? `, ${money(quote.pet)} pet` : ''}, ${money(quote.service)} service, ${money(quote.tax)} tax.${assumed} This does not happen until you approve it.`,
      confirm: {
        summary: `Book ${stay}. Total ${money(quote.total)}.`,
        authorization_details: [{ type: 'create_booking', property: property.slug, check_in: isoFromOffset(checkInOffset), nights, guests, pets }],
      },
    }
  }

  const texts = [...history.map((turn) => turn.message), message]
  if (isStaySearch(message)) return { reply: await searchReply(texts) }
  const leo = await askLeo(history, message)
  if (leo) return { reply: leo }
  return { reply: await searchReply(texts) }
}

export async function act({
  account,
  authorization_details,
}: {
  account: string
  authorization_details: unknown
  caller: string
}) {
  const details = Array.isArray(authorization_details) ? authorization_details : []
  const action = details[0] as { type?: string; booking?: string; property?: string; check_in?: string; nights?: number; guests?: number; pets?: boolean } | undefined
  if (action?.type === 'create_booking') {
    const checkInOffset = offsetFromIso(action.check_in || '')
    if (checkInOffset == null || !action.property || !action.nights) return { error: { message: 'That booking is missing its dates.' } }
    const result = await createBooking({
      account,
      property: action.property,
      checkInOffset,
      nights: action.nights,
      guests: action.guests || 2,
      pets: Boolean(action.pets),
    })
    if ('error' in result && result.error) return { error: { message: result.error } }
    if (!result.booking) return { error: { message: 'That booking could not be saved.' } }
    const property = await propertyBySlug(result.booking.property)
    return {
      message: `${property?.name || 'The house'} is booked, ${formatDate(result.booking.checkInOffset)} to ${formatDate(result.booking.checkInOffset + result.booking.nights)}. ${origin()}/trips/${result.booking.id}`,
    }
  }
  if (!action?.booking) return { error: { message: 'That change is not available.' } }
  if (action.type === 'cancel_booking') {
    const result = await cancelStay(account, action.booking)
    if (!('refund' in result) || !result.property || !result.refund) {
      return { error: { message: 'error' in result ? result.error : 'That change is not available.' } }
    }
    return {
      message: `${result.property.name} is cancelled. ${result.refund.rule} The refund is ${money(result.refund.refund)}.`,
    }
  }
  if (action.type === 'extend_booking') {
    const result = await extendStay(account, action.booking)
    if ('error' in result && result.error) return { error: { message: result.error } }
    if (!result.booking || !result.property || !result.added) return { error: { message: 'That change is not available.' } }
    return {
      message: `${result.property.name} now checks out on ${formatDate(result.booking.checkInOffset + result.booking.nights)}. The additional charge is ${money(result.added.total)}.`,
    }
  }
  return { error: { message: 'That change is not available.' } }
}

export async function login({ username, password }: { username: string; password: string }) {
  await ensureGuests()
  return verifyGuest(username, password)
}

export async function currentAccount({ headers }: { headers: Record<string, string | string[] | undefined> }) {
  return accountFromCookieHeader(headers.cookie)
}
