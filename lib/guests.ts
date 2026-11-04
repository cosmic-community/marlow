import { cosmicConfigured, listObjects } from './cosmic'

export type Guest = {
  id: string
  name: string
  password: string
}

export const GUESTS: Guest[] = [
  { id: 'maya', name: 'Maya Ellis', password: 'maya' },
  { id: 'sam', name: 'Sam Patel', password: 'sam' },
]

let cache: Guest[] | null = null

function choice(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'key' in value) return String((value as { key: unknown }).key || '')
  return ''
}

export async function ensureGuests() {
  if (cache) return cache
  if (process.env.BOOKINGS_PATH || !cosmicConfigured()) {
    cache = GUESTS
    return cache
  }
  try {
    const objects = await listObjects('guests')
    const loaded = objects
      .map((object) => {
        const password = choice(object.metadata?.passcode)
        if (!object.slug || !object.title || !password) return null
        return { id: object.slug, name: object.title, password }
      })
      .filter((guest): guest is Guest => guest != null)
    cache = loaded.length ? loaded : GUESTS
  } catch {
    cache = GUESTS
  }
  return cache
}

export function guestById(id: string) {
  return (cache || GUESTS).find((guest) => guest.id === id) || null
}

export function verifyGuest(username: string, password: string) {
  const guest = (cache || GUESTS).find((item) => item.id === username.trim().toLowerCase() && item.password === password)
  return guest?.id || null
}
