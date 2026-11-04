'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cancelStay, createBooking, extendStay, setLateCheckout } from '@/lib/bookings'
import { offsetFromIso } from '@/lib/dates'
import { ensureGuests, verifyGuest } from '@/lib/guests'
import { clearCookie, currentGuest, sessionCookie } from '@/lib/session'

function safeNext(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return '/trips'
  return value
}

export async function signIn(formData: FormData) {
  const next = safeNext(String(formData.get('next') || '/trips'))
  await ensureGuests()
  const account = verifyGuest(String(formData.get('username') || ''), String(formData.get('password') || ''))
  if (!account) redirect(`/login?next=${encodeURIComponent(next)}&error=1`)
  const cookie = sessionCookie(account)
  const jar = await cookies()
  jar.set(cookie.name, cookie.value, cookie.options)
  redirect(next)
}

export async function signOut() {
  const cookie = clearCookie()
  const jar = await cookies()
  jar.set(cookie.name, cookie.value, cookie.options)
  redirect('/')
}

export async function reserve(formData: FormData) {
  const property = String(formData.get('property') || '')
  const checkIn = offsetFromIso(String(formData.get('checkIn') || ''))
  const nights = Number(formData.get('nights'))
  const guests = Number(formData.get('guests'))
  const pets = formData.get('pets') === 'yes'
  const back = `/stay/${property}?checkIn=${formData.get('checkIn')}&nights=${nights}`
  const account = await currentGuest()
  if (!account) redirect(`/login?next=${encodeURIComponent(back)}`)
  if (checkIn == null || !nights) redirect(`${back}&error=${encodeURIComponent('Choose dates first.')}`)
  const result = await createBooking({ account, property, checkInOffset: checkIn, nights, guests, pets })
  if ('error' in result && result.error) redirect(`${back}&error=${encodeURIComponent(result.error)}`)
  if (!('booking' in result) || !result.booking) redirect(back)
  redirect(`/trips/${result.booking.id}`)
}

export async function requestLateCheckout(formData: FormData) {
  const id = String(formData.get('id') || '')
  const account = await currentGuest()
  if (!account) redirect(`/login?next=${encodeURIComponent(`/trips/${id}`)}`)
  const result = await setLateCheckout(account, id)
  if ('error' in result && result.error) redirect(`/trips/${id}?error=${encodeURIComponent(result.error)}`)
  redirect(`/trips/${id}`)
}

export async function approveExtension(formData: FormData) {
  const id = String(formData.get('id') || '')
  const account = await currentGuest()
  if (!account) redirect(`/login?next=${encodeURIComponent(`/trips/${id}`)}`)
  const result = await extendStay(account, id)
  if ('error' in result && result.error) redirect(`/trips/${id}?error=${encodeURIComponent(result.error)}`)
  redirect(`/trips/${id}`)
}

export async function approveCancel(formData: FormData) {
  const id = String(formData.get('id') || '')
  const account = await currentGuest()
  if (!account) redirect(`/login?next=${encodeURIComponent(`/trips/${id}`)}`)
  const result = await cancelStay(account, id)
  if ('error' in result && !('refund' in result)) redirect(`/trips/${id}?error=${encodeURIComponent(result.error)}`)
  redirect(`/trips/${id}`)
}
