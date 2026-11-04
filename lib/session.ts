import { cookies } from 'next/headers'
import { accountFromToken, SESSION_COOKIE, signSession } from './token'

export async function currentGuest() {
  const jar = await cookies()
  return accountFromToken(jar.get(SESSION_COOKIE)?.value)
}

export function sessionCookie(account: string) {
  return {
    name: SESSION_COOKIE,
    value: signSession(account),
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 14 * 24 * 60 * 60,
    },
  }
}

export function clearCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    options: { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 0 },
  }
}
