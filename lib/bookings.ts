import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { cosmicConfigured, insertObject, listObjects, patchObject, recordId } from './cosmic'
import { isoFromOffset, offsetFromIso } from './dates'
import { GUESTS } from './guests'
import { PROPERTIES, propertyBySlug, type Property } from './properties'
import { extraNight, quoteStay, refundFor } from './quote'

export type Booking = {
  id: string
  account: string
  property: string
  checkInOffset: number
  nights: number
  guests: number
  pets: boolean
  status: 'confirmed' | 'cancelled'
  lateCheckout: boolean
  refund: number | null
  arrival: string
}

type FileShape = { seededOn: string; bookings: Booking[] }

const filePath = () => process.env.BOOKINGS_PATH || path.join(process.cwd(), 'data', 'bookings.json')
const cosmicIds = new Map<string, string>()

function fileMode() {
  return Boolean(process.env.BOOKINGS_PATH) || !cosmicConfigured()
}

function catalogArrival(slug: string) {
  return PROPERTIES.find((property) => property.slug === slug)?.arrival || ''
}

function seed(): FileShape {
  return {
    seededOn: isoFromOffset(0),
    bookings: [
      {
        id: 'stay-maya',
        account: 'maya',
        property: 'orchard-house',
        checkInOffset: 18,
        nights: 3,
        guests: 2,
        pets: false,
        status: 'confirmed',
        lateCheckout: false,
        refund: null,
        arrival: catalogArrival('orchard-house'),
      },
      {
        id: 'stay-sam',
        account: 'sam',
        property: 'cliff-kitchen',
        checkInOffset: 5,
        nights: 3,
        guests: 2,
        pets: false,
        status: 'confirmed',
        lateCheckout: false,
        refund: null,
        arrival: catalogArrival('cliff-kitchen'),
      },
    ],
  }
}

export function demoBookings() {
  return seed().bookings
}

// Next loads this module more than once per server (pages, actions, route
// handlers), so the lock and the latest copy live on globalThis.
type Shared = { chain: Promise<unknown>; memory: FileShape | null; loading: Promise<FileShape> | null }
const shared: Shared = ((globalThis as { __marlowBookings?: Shared }).__marlowBookings ??= {
  chain: Promise.resolve(),
  memory: null,
  loading: null,
})

function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = shared.chain.then(fn, fn)
  shared.chain = run.then(
    () => undefined,
    () => undefined
  )
  return run
}

function choice(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'key' in value) return String((value as { key: unknown }).key || '')
  return ''
}

function amount(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function flag(value: unknown) {
  return value === true || value === 'true' || value === 'yes'
}

function titleFor(booking: Booking) {
  const guest = GUESTS.find((item) => item.id === booking.account)
  const property = PROPERTIES.find((item) => item.slug === booking.property)
  return `${guest?.name || booking.account} at ${property?.name || booking.property}`
}

function metadataFor(booking: Booking, seededOn: string) {
  return {
    account: booking.account,
    property: booking.property,
    check_in_offset: booking.checkInOffset,
    nights: booking.nights,
    guests: booking.guests,
    pets: booking.pets,
    status: booking.status,
    late_checkout: booking.lateCheckout,
    refund: booking.refund ?? '',
    seeded_on: seededOn,
    arrival: booking.arrival,
  }
}

function readDisk(): FileShape {
  const file = filePath()
  if (!existsSync(/*turbopackIgnore: true*/ file)) {
    const fresh = seed()
    mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true })
    writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(fresh, null, 2))
    return fresh
  }
  const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ file, 'utf8')) as FileShape
  const delta = offsetFromIso(parsed.seededOn) ?? 0
  if (delta !== 0) {
    parsed.bookings = parsed.bookings.map((booking) => ({
      ...booking,
      arrival: booking.arrival || catalogArrival(booking.property),
      checkInOffset: booking.checkInOffset + delta,
    }))
    parsed.seededOn = isoFromOffset(0)
    writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(parsed, null, 2))
  }
  parsed.bookings = parsed.bookings.map((booking) => ({
    ...booking,
    arrival: booking.arrival || catalogArrival(booking.property),
  }))
  return parsed
}

async function readCosmic(): Promise<FileShape> {
  const today = isoFromOffset(0)
  const objects = await listObjects('bookings')
  const bookings: Booking[] = []
  const dirty: Booking[] = []
  for (const object of objects) {
    if (!object.id || !object.slug) continue
    const metadata = object.metadata || {}
    const seededOn = String(metadata.seeded_on || today)
    const delta = offsetFromIso(seededOn) ?? 0
    const status = choice(metadata.status) === 'cancelled' ? 'cancelled' : 'confirmed'
    const refund = metadata.refund === '' || metadata.refund == null ? null : amount(metadata.refund)
    const booking: Booking = {
      id: object.slug,
      account: String(metadata.account || ''),
      property: String(metadata.property || ''),
      checkInOffset: amount(metadata.check_in_offset) + delta,
      nights: amount(metadata.nights, 1),
      guests: amount(metadata.guests, 1),
      pets: flag(metadata.pets),
      status,
      lateCheckout: flag(metadata.late_checkout),
      refund,
      arrival: String(metadata.arrival || catalogArrival(String(metadata.property || ''))),
    }
    cosmicIds.set(booking.id, object.id)
    bookings.push(booking)
    if (delta !== 0) dirty.push(booking)
  }
  if (!bookings.length) {
    const fresh = seed()
    for (const booking of fresh.bookings) await saveRemote(booking, fresh.seededOn)
    return fresh
  }
  for (const booking of dirty) await saveRemote(booking, today)
  return { seededOn: today, bookings }
}

/** Reads the current records. Every request calls this, so no copy goes stale. */
export function ensureBookings() {
  if (fileMode()) {
    shared.memory = readDisk()
    return Promise.resolve(shared.memory)
  }
  if (!shared.loading) {
    shared.loading = readCosmic()
      .then((data) => {
        shared.memory = data
        return data
      })
      .finally(() => {
        shared.loading = null
      })
  }
  return shared.loading
}

function readFile(): FileShape {
  if (shared.memory) return shared.memory
  if (fileMode()) {
    shared.memory = readDisk()
    return shared.memory
  }
  throw new Error('Bookings are not loaded')
}

function writeDisk(data: FileShape) {
  const file = filePath()
  mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true })
  writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(data, null, 2))
}

async function saveRemote(booking: Booking, seededOn: string) {
  const body = { title: titleFor(booking), metadata: metadataFor(booking, seededOn) }
  const existing = cosmicIds.get(booking.id)
  if (existing) {
    await patchObject(existing, body)
    return
  }
  const created = await insertObject({ ...body, type: 'bookings', slug: booking.id })
  cosmicIds.set(booking.id, recordId(created))
}

async function commit(data: FileShape, booking?: Booking) {
  shared.memory = data
  if (fileMode()) {
    writeDisk(data)
    return
  }
  if (booking) await saveRemote(booking, data.seededOn)
}

export function listBookings() {
  return readFile().bookings
}

export function bookingsFor(account: string) {
  return listBookings()
    .filter((booking) => booking.account === account)
    .sort((a, b) => a.checkInOffset - b.checkInOffset)
}

export function upcomingFor(account: string) {
  return bookingsFor(account).filter((booking) => booking.status === 'confirmed' && booking.checkInOffset + booking.nights >= 0)
}

export function primaryStay(account: string) {
  return upcomingFor(account)[0] || null
}

export function bookingById(id: string) {
  return listBookings().find((booking) => booking.id === id) || null
}

export function nightTaken(property: Property, offset: number, ignoreId?: string) {
  if (property.blocked.some((block) => offset >= block.start && offset < block.end)) return true
  return listBookings().some(
    (booking) =>
      booking.status === 'confirmed' &&
      booking.property === property.slug &&
      booking.id !== ignoreId &&
      offset >= booking.checkInOffset &&
      offset < booking.checkInOffset + booking.nights
  )
}

export function windowOpen(property: Property, start: number, nights: number, ignoreId?: string) {
  for (let index = 0; index < nights; index += 1) {
    if (nightTaken(property, start + index, ignoreId)) return false
  }
  return true
}

export function firstWindow(property: Property, nights: number, from = 21, until = 75) {
  for (let start = from; start <= until - nights; start += 1) {
    if (windowOpen(property, start, nights)) return start
  }
  return null
}

export function arrivalOn(property: Property, offset: number, ignoreId?: string) {
  if (property.blocked.some((block) => block.start === offset)) return true
  return listBookings().some(
    (booking) =>
      booking.status === 'confirmed' &&
      booking.property === property.slug &&
      booking.id !== ignoreId &&
      booking.checkInOffset === offset
  )
}

async function mutate(id: string, account: string, change: (booking: Booking) => void) {
  const data = readFile()
  const booking = data.bookings.find((item) => item.id === id && item.account === account)
  if (!booking) return null
  change(booking)
  await commit(data, booking)
  return booking
}

export async function previewBook(input: {
  property: string
  checkInOffset: number
  nights: number
  guests: number
  pets: boolean
}) {
  await ensureBookings()
  const property = await propertyBySlug(input.property)
  if (!property) return { error: 'That home is not in the catalog.' }
  if (input.nights < 1) return { error: 'Say how many nights the stay is.' }
  if (input.guests > property.sleeps) return { error: `${property.name} sleeps ${property.sleeps}.` }
  if (input.pets && !property.dogs) return { error: `${property.name} does not allow dogs.` }
  if (!windowOpen(property, input.checkInOffset, input.nights)) return { error: 'Those nights are already booked.' }
  return { property, quote: quoteStay(property, input.nights, input.pets, false) }
}

export function createBooking(input: {
  account: string
  property: string
  checkInOffset: number
  nights: number
  guests: number
  pets: boolean
}) {
  return exclusive(async () => {
    await ensureBookings()
    const property = await propertyBySlug(input.property)
    if (!property) return { error: 'That home is not in the catalog.' }
    if (input.guests > property.sleeps) return { error: `${property.name} sleeps ${property.sleeps}.` }
    if (input.pets && !property.dogs) return { error: `${property.name} does not allow dogs.` }
    if (!windowOpen(property, input.checkInOffset, input.nights)) return { error: 'Those nights are already booked.' }
    const data = readFile()
    const booking: Booking = {
      id: `stay-${Date.now().toString(36)}`,
      account: input.account,
      property: property.slug,
      checkInOffset: input.checkInOffset,
      nights: input.nights,
      guests: input.guests,
      pets: input.pets,
      status: 'confirmed',
      lateCheckout: false,
      refund: null,
      arrival: catalogArrival(property.slug),
    }
    data.bookings.push(booking)
    await commit(data, booking)
    return { booking }
  })
}

export function setLateCheckout(account: string, id: string) {
  return exclusive(async () => {
    await ensureBookings()
    const current = bookingById(id)
    if (!current || current.account !== account) return { error: 'That stay was not found.' }
    if (current.status !== 'confirmed') return { error: 'That stay is cancelled.' }
    const property = await propertyBySlug(current.property)
    if (!property) return { error: 'That home is not in the catalog.' }
    const checkout = current.checkInOffset + current.nights
    if (property.lateCheckout !== 'noon') {
      return { error: `${property.name} does not offer a noon checkout.` }
    }
    if (arrivalOn(property, checkout, current.id)) {
      return { error: 'Another guest arrives the day you leave, so noon checkout is not available.' }
    }
    if (current.lateCheckout) {
      return { booking: current, fee: property.lateCheckoutFee, already: true }
    }
    const booking = await mutate(id, account, (item) => {
      item.lateCheckout = true
    })
    return { booking, fee: property.lateCheckoutFee, already: false }
  })
}

export function extendStay(account: string, id: string) {
  return exclusive(async () => {
    await ensureBookings()
    const current = bookingById(id)
    if (!current || current.account !== account) return { error: 'That stay was not found.' }
    if (current.status !== 'confirmed') return { error: 'That stay is cancelled.' }
    const property = await propertyBySlug(current.property)
    if (!property) return { error: 'That home is not in the catalog.' }
    const checkout = current.checkInOffset + current.nights
    if (!windowOpen(property, checkout, 1, current.id)) {
      return { error: `${property.name} is booked the night after you leave, so the stay cannot be extended.` }
    }
    const added = extraNight(property, current.nights, current.pets)
    const booking = await mutate(id, account, (item) => {
      item.nights += 1
    })
    return { booking, added, property }
  })
}

export function cancelStay(account: string, id: string) {
  return exclusive(async () => {
    await ensureBookings()
    const current = bookingById(id)
    if (!current || current.account !== account) return { error: 'That stay was not found.' }
    const property = await propertyBySlug(current.property)
    if (!property) return { error: 'That home is not in the catalog.' }
    const quote = quoteStay(property, current.nights, current.pets, current.lateCheckout)
    const refund = refundFor(property, current.nights, current.pets, current.lateCheckout, current.checkInOffset)
    if (current.status === 'cancelled') return { booking: current, refund, property, quote }
    const booking = await mutate(id, account, (item) => {
      item.status = 'cancelled'
      item.refund = refund.refund
    })
    if (!booking) return { error: 'That stay was not found.' }
    return { booking, refund, property, quote }
  })
}

export async function previewExtend(account: string) {
  await ensureBookings()
  const booking = primaryStay(account)
  if (!booking) return { error: 'There is no upcoming stay on this account.' }
  const property = await propertyBySlug(booking.property)
  if (!property) return { error: 'That home is not in the catalog.' }
  const checkout = booking.checkInOffset + booking.nights
  if (!windowOpen(property, checkout, 1, booking.id)) {
    return { error: `${property.name} is booked the night after you leave, so the stay cannot be extended.`, booking, property }
  }
  return { booking, property, added: extraNight(property, booking.nights, booking.pets) }
}

export async function previewCancel(account: string) {
  await ensureBookings()
  const booking = primaryStay(account)
  if (!booking) return { error: 'There is no upcoming stay on this account.' }
  const property = await propertyBySlug(booking.property)
  if (!property) return { error: 'That home is not in the catalog.' }
  const quote = quoteStay(property, booking.nights, booking.pets, booking.lateCheckout)
  const refund = refundFor(property, booking.nights, booking.pets, booking.lateCheckout, booking.checkInOffset)
  return { booking, property, quote, refund }
}
