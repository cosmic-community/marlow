import { arrivalOn, bookingById, bookingsFor, ensureBookings, windowOpen, type Booking } from './bookings'
import { formatDate } from './dates'
import { getDoor } from './door'
import { ensureGuests, guestById } from './guests'
import { propertyBySlug } from './properties'
import { extraNight, quoteStay, refundFor } from './quote'

const origin = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220').replace(/\/$/, '')

export type Access = { account: string; scope: 'read' | 'write'; caller: string }

export function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status })
}

export async function accessFor(request: Request) {
  const door = await getDoor()
  const access = (await door.accountFor(request)) as Access | null
  if (!access) return null
  await ensureGuests()
  await ensureBookings()
  return access
}

export function reply(access: Access, body: unknown, status = 200) {
  const guest = guestById(access.account)
  return Response.json(body, {
    status,
    headers: guest ? { 'CAP-Account': guest.name } : {},
  })
}

export async function stayView(booking: Booking) {
  const property = await propertyBySlug(booking.property)
  if (!property) return null
  const checkout = booking.checkInOffset + booking.nights
  const quote = quoteStay(property, booking.nights, booking.pets, booking.lateCheckout)
  const refund = refundFor(property, booking.nights, booking.pets, booking.lateCheckout, booking.checkInOffset)
  const confirmed = booking.status === 'confirmed'
  const nextArrival = arrivalOn(property, checkout, booking.id)
  const nextNightOpen = windowOpen(property, checkout, 1, booking.id)
  const added = extraNight(property, booking.nights, booking.pets)

  let noonReason = ''
  if (property.lateCheckout !== 'noon') noonReason = `${property.name} does not offer a noon checkout.`
  else if (nextArrival) noonReason = 'Another guest arrives the day this stay ends.'

  return {
    id: booking.id,
    status: booking.status,
    house: {
      name: property.name,
      town: property.town,
      page: `${origin()}/stay/${property.slug}`,
    },
    check_in: formatDate(booking.checkInOffset),
    check_out: formatDate(checkout),
    check_in_time: property.checkIn,
    check_out_time: booking.lateCheckout ? '12:00 pm' : property.checkOut,
    days_until_check_in: booking.checkInOffset,
    nights: booking.nights,
    guests: booking.guests,
    dogs: booking.pets,
    price: {
      lodging: quote.lodging,
      cleaning: quote.cleaning,
      pet_fee: quote.pet,
      service_fee: quote.service,
      tax: quote.tax,
      noon_checkout_fee: quote.lateCheckout,
      total: quote.total,
    },
    arrival_instructions: confirmed ? booking.arrival || property.arrival : null,
    noon_checkout: {
      on_this_stay: booking.lateCheckout,
      fee: property.lateCheckoutFee,
      available: confirmed && !booking.lateCheckout && !noonReason,
      reason: noonReason || null,
    },
    extra_night: confirmed && nextNightOpen
      ? {
          available: true,
          new_check_out: formatDate(checkout + 1),
          lodging: added.lodging,
          service_fee: added.service,
          tax: added.tax,
          additional_charge: added.total,
          note: 'Cleaning and the pet fee are not charged again.',
        }
      : { available: false, reason: confirmed ? `${property.name} is booked the night after this stay.` : 'The stay is cancelled.' },
    cancellation: confirmed
      ? { policy: property.cancellation, rule: refund.rule, refund: refund.refund, kept: refund.kept }
      : { refunded: booking.refund },
    manage: `${origin()}/trips/${booking.id}`,
  }
}

export async function ownStay(access: Access, id: string) {
  const booking = bookingById(id)
  if (!booking || booking.account !== access.account) return null
  return booking
}

export async function staysFor(access: Access) {
  const views = await Promise.all(bookingsFor(access.account).map(stayView))
  return views.filter((view) => view != null)
}
