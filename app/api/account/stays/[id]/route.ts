import { accessFor, fail, ownStay, reply, stayView } from '@/lib/account'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await accessFor(request)
  if (!access) return fail(401, 'login_required', 'Log in to Marlow to see your stays.')
  const booking = await ownStay(access, (await params).id)
  if (!booking) return fail(404, 'not_found', 'That stay is not on this account.')
  return reply(access, await stayView(booking))
}
