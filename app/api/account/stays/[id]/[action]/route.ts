import { accessFor, fail, ownStay, reply, stayView } from '@/lib/account'
import { bookingById, setLateCheckout } from '@/lib/bookings'
import { getDoor } from '@/lib/door'
import { money } from '@/lib/money'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params
  const access = await accessFor(request)
  if (!access) return fail(401, 'login_required', 'Log in to Marlow to change your stay.')
  if (access.scope !== 'write') {
    return fail(403, 'write_required', 'This login can read the stay but not change it. Log in again and allow changes.')
  }
  const booking = await ownStay(access, id)
  if (!booking) return fail(404, 'not_found', 'That stay is not on this account.')
  const view = await stayView(booking)
  if (!view) return fail(404, 'not_found', 'That home is not in the catalog.')

  if (action === 'noon-checkout') {
    const result = await setLateCheckout(access.account, booking.id)
    if ('error' in result && result.error) return fail(409, 'not_available', result.error)
    const saved = bookingById(booking.id)
    const after = saved ? await stayView(saved) : null
    return reply(access, {
      done: true,
      message: result.already
        ? `Noon checkout was already on this stay.`
        : `Noon checkout is added. The fee is ${money(result.fee || 0)}.`,
      stay: after,
    })
  }

  if (action === 'extend' || action === 'cancel') {
    if (booking.status !== 'confirmed') return fail(409, 'not_available', 'That stay is cancelled.')
    let summary = ''
    let type = ''
    if (action === 'extend') {
      if (!view.extra_night.available) return fail(409, 'not_available', String(view.extra_night.reason))
      type = 'extend_booking'
      summary = `Extend ${view.house.name} by one night, to ${view.extra_night.new_check_out}. Additional charge ${money(view.extra_night.additional_charge || 0)}.`
    } else {
      const cancellation = view.cancellation as { refund: number }
      type = 'cancel_booking'
      summary = `Cancel ${view.house.name}, ${view.check_in} to ${view.check_out}. Refund ${money(cancellation.refund)} of ${money(view.price.total)}.`
    }
    const door = await getDoor()
    const held = await door.requestApproval(request, { summary, authorization_details: [{ type, booking: booking.id }] })
    if ('error' in held) return fail(403, held.error.code, held.error.message)
    return reply(access, {
      done: false,
      approval_needed: true,
      message: 'Nothing has changed yet. Give the guest this link. The change happens only after they approve it there.',
      confirmation: held.confirmation,
    })
  }

  return fail(404, 'not_found', `There is no ${action} action. Use noon-checkout, extend, or cancel.`)
}

export function GET() {
  return fail(405, 'method_not_allowed', 'Use POST.')
}
