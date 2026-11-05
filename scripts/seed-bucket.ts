import { readFileSync } from 'node:fs'
import { isoFromOffset } from '../lib/dates'
import { GUESTS } from '../lib/guests'
import { PROPERTIES, cancellationText } from '../lib/properties'

function envValue(name: string) {
  if (process.env[name]) return process.env[name] as string
  const file = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  const line = file.split('\n').find((item) => item.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim() : ''
}

const slug = envValue('COSMIC_BUCKET_SLUG')
const readKey = envValue('COSMIC_READ_KEY')
const writeKey = envValue('COSMIC_WRITE_KEY')
if (!slug || !readKey || !writeKey) throw new Error('The bucket slug, read key, and write key are required.')

const api = `https://api.cosmicjs.com/v3/buckets/${slug}`
const origin = (envValue('NEXT_PUBLIC_SITE_URL') || 'http://localhost:3220').replace(/\/$/, '')
const housePage = (propertySlug: string) => `${origin}/stay/${propertySlug}`

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${writeKey}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) {
    const message = String(data.message || text).replaceAll(writeKey, '[write key]').replaceAll(readKey, '[read key]')
    throw new Error(`${method} ${path} ${response.status}: ${message.slice(0, 240)}`)
  }
  return data
}

async function read(path: string) {
  const response = await fetch(`${api}${path}${path.includes('?') ? '&' : '?'}read_key=${readKey}`)
  if (response.status === 404) return null
  const data = await response.json()
  if (!response.ok) throw new Error(`GET ${path} ${response.status}: ${data.message || 'failed'}`)
  return data
}

const choice = (key: string, title: string, options: string[]) => ({
  key,
  title,
  type: 'select-dropdown',
  value: '',
  options: options.map((value) => ({ key: value, value })),
})

const text = (key: string, title: string) => ({ key, title, type: 'text', value: '' })
const area = (key: string, title: string) => ({ key, title, type: 'textarea', value: '' })
const json = (key: string, title: string) => ({ key, title, type: 'json', value: null })
const number = (key: string, title: string) => ({ key, title, type: 'number', value: '' })
const yesNo = (key: string, title: string) => ({ key, title, type: 'switch', value: false, options: 'true,false' })

const types = [
  {
    title: 'Properties',
    slug: 'properties',
    singular: 'Property',
    emoji: '🏡',
    metafields: [
      text('town', 'Town'),
      area('summary', 'Summary'),
      number('bedrooms', 'Bedrooms'),
      number('bathrooms', 'Bathrooms'),
      number('sleeps', 'Sleeps'),
      number('nightly', 'Nightly rate'),
      number('cleaning', 'Cleaning fee'),
      number('pet_fee', 'Pet fee'),
      yesNo('dogs', 'Dogs allowed'),
      yesNo('hot_tub', 'Hot tub'),
      text('check_in', 'Check-in'),
      text('check_out', 'Check-out'),
      choice('late_checkout', 'Late checkout', ['noon', 'unavailable']),
      number('late_checkout_fee', 'Noon checkout fee'),
      choice('cancellation', 'Cancellation', ['free', 'moderate', 'strict']),
      area('photos', 'Photo URLs'),
      area('arrival', 'Arrival instructions'),
      area('blocked', 'Blocked night offsets'),
      area('details', 'Details'),
    ],
  },
  {
    title: 'Pages',
    slug: 'pages',
    singular: 'Page',
    emoji: '📄',
    metafields: [area('body', 'Body')],
  },
  {
    title: 'Guests',
    slug: 'guests',
    singular: 'Guest',
    emoji: '👤',
    metafields: [text('passcode', 'Passcode')],
  },
  {
    title: 'Bookings',
    slug: 'bookings',
    singular: 'Booking',
    emoji: '📅',
    metafields: [
      text('account', 'Account'),
      text('property', 'Property'),
      number('check_in_offset', 'Check-in offset'),
      number('nights', 'Nights'),
      number('guests', 'Guests'),
      yesNo('pets', 'Pets'),
      text('status', 'Status'),
      yesNo('late_checkout', 'Noon checkout'),
      text('refund', 'Refund'),
      text('seeded_on', 'Seeded on'),
      area('arrival', 'Arrival instructions'),
    ],
  },
  {
    title: 'CAP records',
    slug: 'cap-records',
    singular: 'CAP record',
    emoji: '🔑',
    metafields: [json('value', 'Value')],
  },
]

for (const type of types) {
  const existing = await read(`/object-types/${type.slug}`)
  if (existing) {
    const fields = (existing.object_type?.metafields || []) as { key: string; type: string }[]
    const changed = type.metafields.some((field) => fields.find((item) => item.key === field.key)?.type !== field.type)
    if (!changed) {
      console.log(`type ${type.slug} already exists`)
      continue
    }
    await call('PATCH', `/object-types/${type.slug}`, { metafields: type.metafields })
    console.log(`type ${type.slug} fields updated`)
    continue
  }
  await call('POST', '/object-types', type)
  console.log(`type ${type.slug}`)
}

function details(property: (typeof PROPERTIES)[number]) {
  return [
    `${property.name} is in ${property.town}.`,
    property.summary,
    `${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, sleeps ${property.sleeps}.`,
    property.hotTub ? 'It has a hot tub.' : 'It does not have a hot tub.',
    property.dogs ? `Dogs are allowed. The pet fee is $${property.petFee}.` : 'Dogs are not allowed.',
    `The nightly rate is $${property.nightly}. Cleaning is $${property.cleaning}.`,
    `Check-in is ${property.checkIn}. Check-out is ${property.checkOut}.`,
    property.lateCheckout === 'noon'
      ? `Noon checkout is $${property.lateCheckoutFee} when the next night is open.`
      : 'Noon checkout is not offered.',
    cancellationText(property.cancellation),
    `Home page: ${housePage(property.slug)}`,
  ].join(' ')
}

async function existingSlugs(type: string) {
  const query = encodeURIComponent(JSON.stringify({ type }))
  const data = await read(`/objects?query=${query}&limit=100&props=slug`)
  return new Set(((data?.objects || []) as { slug: string }[]).map((object) => object.slug))
}

const propertySlugs = await existingSlugs('properties')
for (const property of PROPERTIES) {
  if (propertySlugs.has(property.slug)) {
    console.log(`property ${property.slug} already exists`)
    continue
  }
  await call('POST', '/objects', {
    title: property.name,
    type: 'properties',
    slug: property.slug,
    metadata: {
      town: property.town,
      summary: property.summary,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sleeps: property.sleeps,
      nightly: property.nightly,
      cleaning: property.cleaning,
      pet_fee: property.petFee,
      dogs: property.dogs,
      hot_tub: property.hotTub,
      check_in: property.checkIn,
      check_out: property.checkOut,
      late_checkout: property.lateCheckout,
      late_checkout_fee: property.lateCheckoutFee,
      cancellation: property.cancellation,
      photos: JSON.stringify(property.photos),
      arrival: '',
      blocked: JSON.stringify(property.blocked),
      details: details(property),
    },
  })
  console.log(`property ${property.slug}`)
}

const pages = [
  {
    title: 'Fees',
    slug: 'fees',
    metadata: {
      body: 'A stay total is the nightly rate times the nights, plus the cleaning fee. Dogs add the pet fee only when the home allows them. The service fee is 12% of lodging plus cleaning. Tax is 14% of lodging, cleaning, and the pet fee. Noon checkout, when the home offers it and the next night is open, is a separate fee. One extra night adds one night of lodging, service, and tax. Cleaning and the pet fee are not charged again.',
    },
  },
  {
    title: 'Cancellation',
    slug: 'cancellation',
    metadata: {
      body: 'Free cancellation refunds the stay when check-in is 7 or more days away. Inside 7 days, the first night is kept. The moderate policy refunds lodging 14 or more days before check-in, and keeps half the lodging after that. The strict policy refunds half the lodging 14 or more days before check-in, and does not refund lodging after that. Cleaning is refunded. A cancellation is not final until the guest approves it in the guest portal.',
    },
  },
]

function threeNights(property: (typeof PROPERTIES)[number], dog: boolean) {
  const lodging = property.nightly * 3
  const pet = dog && property.dogs ? property.petFee : 0
  const service = Math.round((lodging + property.cleaning) * 0.12)
  const tax = Math.round((lodging + property.cleaning + pet) * 0.14)
  return lodging + property.cleaning + pet + service + tax
}

const guideRows = [...PROPERTIES]
  .sort((a, b) => threeNights(a, false) - threeNights(b, false))
  .map((property) =>
    [
      `${property.name} (${property.town})`,
      `${property.bedrooms} bedrooms, sleeps ${property.sleeps}`,
      property.hotTub ? 'hot tub' : 'no hot tub',
      property.dogs ? 'dogs allowed' : 'no dogs',
      `${property.cancellation} cancellation`,
      `three nights $${threeNights(property, false)}`,
      property.dogs ? `with a dog $${threeNights(property, true)}` : '',
      housePage(property.slug),
    ]
      .filter(Boolean)
      .join(', ')
  )

pages.push({
  title: 'Home guide',
  slug: 'house-guide',
  metadata: {
    body: [
      'Every Marlow home is in Sonoma County. When a guest says Sonoma, they mean the whole county, not only the town of Sonoma. Check every home below against every requirement and list all that match, cheapest first.',
      'Three-night totals include lodging, cleaning, the 12% service fee, and 14% tax. With a dog, the pet fee and its tax are added. Totals for other lengths follow the fees page. Open dates are on each home page.',
      ...guideRows,
    ].join('\n'),
  },
})

const pageSlugs = await existingSlugs('pages')
for (const page of pages) {
  if (pageSlugs.has(page.slug)) {
    console.log(`page ${page.slug} already exists`)
    continue
  }
  await call('POST', '/objects', { ...page, type: 'pages' })
  console.log(`page ${page.slug}`)
}

const guestSlugs = await existingSlugs('guests')
for (const guest of GUESTS) {
  if (guestSlugs.has(guest.id)) {
    console.log(`guest ${guest.id} already exists`)
    continue
  }
  await call('POST', '/objects', {
    title: guest.name,
    type: 'guests',
    slug: guest.id,
    metadata: { passcode: guest.password },
  })
  console.log(`guest ${guest.id}`)
}

const stays = [
  { id: 'stay-maya', account: 'maya', property: 'orchard-house', checkInOffset: 18, nights: 3, guests: 2 },
  { id: 'stay-sam', account: 'sam', property: 'cliff-kitchen', checkInOffset: 5, nights: 3, guests: 2 },
]

const bookingSlugs = await existingSlugs('bookings')
for (const stay of stays) {
  const property = PROPERTIES.find((item) => item.slug === stay.property)
  const guest = GUESTS.find((item) => item.id === stay.account)
  if (!property || !guest) throw new Error(`Missing catalog row for ${stay.id}`)
  if (bookingSlugs.has(stay.id)) {
    console.log(`booking ${stay.id} already exists`)
    continue
  }
  await call('POST', '/objects', {
    title: `${guest.name} at ${property.name}`,
    type: 'bookings',
    slug: stay.id,
    metadata: {
      account: stay.account,
      property: stay.property,
      check_in_offset: stay.checkInOffset,
      nights: stay.nights,
      guests: stay.guests,
      pets: false,
      status: 'confirmed',
      late_checkout: false,
      refund: '',
      seeded_on: isoFromOffset(0),
      arrival: property.arrival,
    },
  })
  console.log(`booking ${stay.id}`)
}

function plain(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'key' in value) return (value as { key: unknown }).key
  return value
}

const propertyQuery = encodeURIComponent(JSON.stringify({ type: 'properties' }))
const propertyObjects = await read(`/objects?query=${propertyQuery}&limit=100`)
for (const object of (propertyObjects?.objects || []) as { id: string; slug: string; metadata?: Record<string, unknown> }[]) {
  const metadata = object.metadata || {}
  const arrival = String(metadata.arrival || '')
  const detailsText = String(metadata.details || '')
  const catalog = PROPERTIES.find((item) => item.slug === object.slug)
  const wanted = catalog ? details(catalog) : ''
  const staleLink = Boolean(wanted) && detailsText !== wanted && /https?:\/\/\S+\/stay\//.test(detailsText)
  if (!arrival && !/code is \d+/.test(detailsText) && !staleLink) continue
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) next[key] = plain(value)
  next.arrival = ''
  if (wanted && (staleLink || /code is \d+/.test(detailsText))) next.details = wanted
  await call('PATCH', `/objects/${object.id}`, { metadata: next })
  console.log(`updated ${object.slug}`)
}

const pageQuery = encodeURIComponent(JSON.stringify({ type: 'pages' }))
const pageObjects = await read(`/objects?query=${pageQuery}&limit=100`)
for (const object of (pageObjects?.objects || []) as { id: string; slug: string; metadata?: Record<string, unknown> }[]) {
  const wanted = pages.find((page) => page.slug === object.slug)
  const body = String(object.metadata?.body || '')
  if (!wanted || body === wanted.metadata.body || !/https?:\/\/\S+\/stay\//.test(body)) continue
  await call('PATCH', `/objects/${object.id}`, { metadata: { body: wanted.metadata.body } })
  console.log(`updated page ${object.slug}`)
}

console.log(`bucket ${slug} is seeded`)
