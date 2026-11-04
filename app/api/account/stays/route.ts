import { accessFor, fail, reply, staysFor } from '@/lib/account'
import { guestById } from '@/lib/guests'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const access = await accessFor(request)
  if (!access) return fail(401, 'login_required', 'Log in to Marlow to see your stays.')
  const guest = guestById(access.account)
  return reply(access, { guest: guest?.name || access.account, stays: await staysFor(access) })
}
