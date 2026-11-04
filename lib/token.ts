import { createHmac, timingSafeEqual } from 'node:crypto'
import { guestById } from './guests'

const COOKIE = 'marlow_session'

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  // The fallback is public in this repo, so a deployed site that used it would accept forged logins.
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is not set')
  return 'marlow-demo-session'
}

export function signSession(account: string) {
  const body = Buffer.from(JSON.stringify({ account, exp: Date.now() + 14 * 86400000 })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function accountFromToken(token: string | undefined | null) {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString()) as { account?: string; exp?: number }
    if (!parsed.account || !parsed.exp || parsed.exp < Date.now()) return null
    return guestById(parsed.account)?.id || null
  } catch {
    return null
  }
}

export function accountFromCookieHeader(header: string | string[] | undefined) {
  const raw = Array.isArray(header) ? header.join(';') : header || ''
  const match = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
  if (!match) return null
  return accountFromToken(decodeURIComponent(match.slice(COOKIE.length + 1)))
}

export const SESSION_COOKIE = COOKIE
