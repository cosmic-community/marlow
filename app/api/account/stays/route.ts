import { bookFromBody } from '@/lib/booking-request'
import { accessFor, fail, reply, staysFor } from '@/lib/account'
import { previewBook } from '@/lib/bookings'
import { formatDate, isoFromOffset } from '@/lib/dates'
import { getDoor } from '@/lib/door'
import { guestById } from '@/lib/guests'
import { money } from '@/lib/money'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const access = await accessFor(request)
  if (!access) return fail(401, 'login_required', 'Log in to Marlow to book a stay.')
  if (access.scope !== 'write') {
    return fail(403, 'write_required', 'This login can read stays but not book one. Log in again and allow changes.')
  }
  const requestBody = await request.json().catch(() => null)
  const booking = bookFromBody(requestBody)
  if ('error' in booking) return fail(400, 'invalid_request', booking.error)
  const preview = await previewBook(booking.input)
  if ('error' in preview && preview.error) return fail(409, 'not_available', preview.error)
  if (!preview.property || !preview.quote) return fail(409, 'not_available', 'That home is not available.')
  const { property, quote } = preview
  const { checkInOffset, nights, guests, pets } = booking.input
  const dog = pets ? ', with a dog' : ''
  const summary = `Book ${property.name}, ${formatDate(checkInOffset)} to ${formatDate(checkInOffset + nights)}, ${guests} guests${dog}. Total ${money(quote.total)}.`
  const door = await getDoor()
  const held = await door.requestApproval(request, {
    summary,
    authorization_details: [{ type: 'create_booking', property: property.slug, check_in: isoFromOffset(checkInOffset), nights, guests, pets }],
  })
  if ('error' in held) return fail(403, held.error.code, held.error.message)
  return reply(access, {
    done: false,
    approval_needed: true,
    message: 'Nothing is reserved yet. Give the guest this link. The booking happens only after they approve it there.',
    quote: { total: quote.total },
    confirmation: held.confirmation,
  })
}

export async function GET(request: Request) {
  const access = await accessFor(request)
  if (!access) return fail(401, 'login_required', 'Log in to Marlow to see your stays.')
  const guest = guestById(access.account)
  return reply(access, { guest: guest?.name || access.account, stays: await staysFor(access) })
}
