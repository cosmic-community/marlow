export type Cancellation = 'free' | 'moderate' | 'strict'

export type Block = { start: number; end: number }

export type Property = {
  slug: string
  name: string
  town: string
  summary: string
  bedrooms: number
  bathrooms: number
  sleeps: number
  nightly: number
  cleaning: number
  petFee: number
  dogs: boolean
  hotTub: boolean
  checkIn: string
  checkOut: string
  lateCheckout: 'noon' | 'unavailable'
  lateCheckoutFee: number
  cancellation: Cancellation
  photos: string[]
  arrival: string
  blocked: Block[]
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`

export const PHOTO_CREDIT = 'Unsplash'
export const PHOTO_CREDIT_URL = 'https://unsplash.com/?utm_source=marlow&utm_medium=referral'

export const PROPERTIES: Property[] = [
  {
    slug: 'orchard-house',
    name: 'Orchard House',
    town: 'Glen Ellen',
    summary: 'A two-bedroom farmhouse above a fig orchard, with a cedar hot tub and a gravel pullout.',
    bedrooms: 2,
    bathrooms: 2,
    sleeps: 4,
    nightly: 240,
    cleaning: 140,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 45,
    cancellation: 'free',
    photos: [photo('1564013799919-ab600027ffc6'), photo('1502672260266-1c1ef2d93688')],
    arrival: 'The lockbox is on the left gate post. The code is 1842. Park in the gravel pullout, not on the lane. The hot tub cover lifts toward the fence.',
    blocked: [{ start: 40, end: 44 }],
  },
  {
    slug: 'lantern-cottage',
    name: 'Lantern Cottage',
    town: 'Healdsburg',
    summary: 'A cottage two blocks from the plaza, with a private hot tub and a fenced yard.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 250,
    cleaning: 135,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 45,
    cancellation: 'free',
    photos: [photo('1600596542815-ffad4c1539a9'), photo('1600210492486-724fe5c67fb0')],
    arrival: 'The key safe is behind the lantern by the side door. The code is 2290. Street parking is free after 6 pm.',
    blocked: [{ start: 30, end: 34 }],
  },
  {
    slug: 'pump-house',
    name: 'The Pump House',
    town: 'Guerneville',
    summary: 'A restored pump house on the river road, with a hot tub on the deck and room for a dog.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 210,
    cleaning: 100,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '3:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 35,
    cancellation: 'free',
    photos: [photo('1518780664697-55e3ad937233'), photo('1449158743715-0a90ebb6d2d8')],
    arrival: 'Use the driveway on the river side. The lockbox is on the deck rail. The code is 4417.',
    blocked: [{ start: 48, end: 52 }],
  },
  {
    slug: 'cinder-cabin',
    name: 'Cinder Cabin',
    town: 'Occidental',
    summary: 'A cabin under the redwoods with a hot tub. Dogs are welcome. Cancellation is moderate.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 230,
    cleaning: 120,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 40,
    cancellation: 'moderate',
    photos: [photo('1470770841072-f978cf4d019e'), photo('1449844908441-8829872d2607')],
    arrival: 'The cabin is the second drive on the left. The code is 7731. The hot tub takes about 20 minutes to heat.',
    blocked: [{ start: 26, end: 29 }],
  },
  {
    slug: 'fig-cottage',
    name: 'Fig Cottage',
    town: 'Glen Ellen',
    summary: 'A small cottage with a hot tub and a strict cancellation rule.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 220,
    cleaning: 110,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '11:00 am',
    lateCheckout: 'unavailable',
    lateCheckoutFee: 0,
    cancellation: 'strict',
    photos: [photo('1600585154340-be6161a56a0c'), photo('1493809842364-78817add7ffb')],
    arrival: 'The gate code is 1904. The cottage key is in the black box on the porch.',
    blocked: [{ start: 36, end: 40 }],
  },
  {
    slug: 'hill-barn',
    name: 'Hill Barn',
    town: 'Sonoma',
    summary: 'A barn conversion with a hot tub and a view of the valley. No dogs.',
    bedrooms: 2,
    bathrooms: 2,
    sleeps: 5,
    nightly: 255,
    cleaning: 150,
    petFee: 0,
    dogs: false,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 45,
    cancellation: 'free',
    photos: [photo('1613490493576-7fde63acd811'), photo('1600607687939-ce8a6c25118c')],
    arrival: 'Follow the gravel road to the barn. The lockbox code is 5528.',
    blocked: [{ start: 33, end: 37 }],
  },
  {
    slug: 'river-lookout',
    name: 'River Lookout',
    town: 'Healdsburg',
    summary: 'A three-bedroom house above the river, with a hot tub. The rate sits above a short-stay budget.',
    bedrooms: 3,
    bathrooms: 2,
    sleeps: 6,
    nightly: 310,
    cleaning: 180,
    petFee: 75,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'unavailable',
    lateCheckoutFee: 0,
    cancellation: 'strict',
    photos: [photo('1512917774080-9991f1c4c750'), photo('1600566753190-17f0baa2a6c3')],
    arrival: 'The lookout is at the end of the lane. The code is 8088.',
    blocked: [{ start: 22, end: 25 }],
  },
  {
    slug: 'vine-row',
    name: 'Vine Row',
    town: 'Healdsburg',
    summary: 'Three bedrooms between two vineyard rows, with a hot tub. A three-night total is over $1,200.',
    bedrooms: 3,
    bathrooms: 2,
    sleeps: 6,
    nightly: 290,
    cleaning: 160,
    petFee: 50,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 55,
    cancellation: 'moderate',
    photos: [photo('1600596542815-ffad4c1539a9'), photo('1582268611958-ebfd161ef9cf')],
    arrival: 'Park by the tank house. The door code is 6160.',
    blocked: [{ start: 50, end: 55 }],
  },
  {
    slug: 'meadow-house',
    name: 'Meadow House',
    town: 'Forestville',
    summary: 'A four-bedroom house for a larger group, with a hot tub and a high nightly rate.',
    bedrooms: 4,
    bathrooms: 3,
    sleeps: 8,
    nightly: 410,
    cleaning: 220,
    petFee: 75,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'unavailable',
    lateCheckoutFee: 0,
    cancellation: 'free',
    photos: [photo('1613490493576-7fde63acd811'), photo('1484154218962-a197022b5858')],
    arrival: 'The meadow gate code is 3002. The house is the white one past the oaks.',
    blocked: [{ start: 28, end: 32 }],
  },
  {
    slug: 'bodega-bluff',
    name: 'Bodega Bluff',
    town: 'Bodega Bay',
    summary: 'A bluff house with a hot tub and an ocean wind. No dogs, and a higher rate.',
    bedrooms: 2,
    bathrooms: 2,
    sleeps: 4,
    nightly: 320,
    cleaning: 200,
    petFee: 0,
    dogs: false,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'unavailable',
    lateCheckoutFee: 0,
    cancellation: 'strict',
    photos: [photo('1499793983690-e29da59ef1c2'), photo('1505693416388-ac5ce068fe85')],
    arrival: 'The bluff road is steep. The lockbox is on the garage. The code is 9091.',
    blocked: [{ start: 7, end: 12 }],
  },
  {
    slug: 'cliff-kitchen',
    name: 'Cliff Kitchen',
    town: 'Bodega Bay',
    summary: 'A kitchen house on the cliff road. Another guest arrives the morning a short stay ends.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 300,
    cleaning: 160,
    petFee: 0,
    dogs: false,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 40,
    cancellation: 'strict',
    photos: [photo('1520250497591-112f2f40a3f4'), photo('1566073771259-6a8506099945')],
    arrival: 'Collect the key from the blue box by the kitchen door. The code is 2744. Do not use the lower path after dark.',
    blocked: [{ start: 8, end: 11 }],
  },
  {
    slug: 'glass-porch',
    name: 'The Glass Porch',
    town: 'Sonoma',
    summary: 'One bedroom and a glass porch, with a hot tub. It sleeps two.',
    bedrooms: 1,
    bathrooms: 1,
    sleeps: 2,
    nightly: 195,
    cleaning: 90,
    petFee: 0,
    dogs: false,
    hotTub: true,
    checkIn: '3:00 pm',
    checkOut: '11:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 30,
    cancellation: 'free',
    photos: [photo('1600607687939-ce8a6c25118c'), photo('1616594039964-ae9021a400a0')],
    arrival: 'The porch key is under the left planter. There is no separate code.',
    blocked: [],
  },
  {
    slug: 'redwood-loft',
    name: 'Redwood Loft',
    town: 'Guerneville',
    summary: 'A loft under the redwoods. Dogs are welcome. There is no hot tub.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 190,
    cleaning: 95,
    petFee: 40,
    dogs: true,
    hotTub: false,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 30,
    cancellation: 'free',
    photos: [photo('1449844908441-8829872d2607'), photo('1518780664697-55e3ad937233')],
    arrival: 'The loft stair is on the north side. The code is 1180.',
    blocked: [{ start: 15, end: 18 }],
  },
  {
    slug: 'sunday-cottage',
    name: 'Sunday Cottage',
    town: 'Sonoma',
    summary: 'A cottage near the plaza. Two bedrooms, no hot tub, no dogs.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 4,
    nightly: 200,
    cleaning: 100,
    petFee: 0,
    dogs: false,
    hotTub: false,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 35,
    cancellation: 'free',
    photos: [photo('1493809842364-78817add7ffb'), photo('1416331108676-a22ccb276e35')],
    arrival: 'The cottage faces the side street. The lockbox code is 6402.',
    blocked: [],
  },
  {
    slug: 'dry-creek-studio',
    name: 'Dry Creek Studio',
    town: 'Healdsburg',
    summary: 'A studio for two, without a hot tub.',
    bedrooms: 1,
    bathrooms: 1,
    sleeps: 2,
    nightly: 160,
    cleaning: 70,
    petFee: 0,
    dogs: false,
    hotTub: false,
    checkIn: '3:00 pm',
    checkOut: '11:00 am',
    lateCheckout: 'unavailable',
    lateCheckoutFee: 0,
    cancellation: 'moderate',
    photos: [photo('1505693416388-ac5ce068fe85'), photo('1505691938895-1758d7feb511')],
    arrival: 'The studio is behind the main house. The code is 5155.',
    blocked: [{ start: 12, end: 14 }],
  },
  {
    slug: 'oak-annex',
    name: 'Oak Annex',
    town: 'Glen Ellen',
    summary: 'An annex that sleeps three, with a hot tub and room for a dog.',
    bedrooms: 2,
    bathrooms: 1,
    sleeps: 3,
    nightly: 205,
    cleaning: 90,
    petFee: 40,
    dogs: true,
    hotTub: true,
    checkIn: '4:00 pm',
    checkOut: '10:00 am',
    lateCheckout: 'noon',
    lateCheckoutFee: 35,
    cancellation: 'free',
    photos: [photo('1560185127-6ed189bf02f4'), photo('1590494165264-1ebe3602eb80')],
    arrival: 'The annex door is on the garden side. The code is 8821.',
    blocked: [{ start: 45, end: 48 }],
  },
]

let remote: Property[] | null = null

export async function loadProperties() {
  if (remote) return remote
  const slug = process.env.COSMIC_BUCKET_SLUG
  const readKey = process.env.COSMIC_READ_KEY
  if (!slug || !readKey) return PROPERTIES
  try {
    const query = encodeURIComponent(JSON.stringify({ type: 'properties' }))
    const response = await fetch(
      `https://api.cosmicjs.com/v3/buckets/${slug}/objects?read_key=${readKey}&query=${query}&limit=100`,
      { cache: 'no-store' }
    )
    if (!response.ok) return PROPERTIES
    const body = (await response.json()) as { objects?: CosmicObject[] }
    const list = (body.objects || []).map(fromCosmic).filter((property): property is Property => property != null)
    if (list.length) remote = list
  } catch {
    return PROPERTIES
  }
  return remote || PROPERTIES
}

export async function propertyBySlug(slug: string) {
  const list = await loadProperties()
  return list.find((property) => property.slug === slug) || null
}

type CosmicObject = { title?: string; slug?: string; metadata?: Record<string, unknown> }

function choice(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'key' in value) return String((value as { key: unknown }).key || '')
  return ''
}

function amount(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function flag(value: unknown) {
  return value === true || value === 'true' || value === 'yes'
}

function fromCosmic(object: CosmicObject): Property | null {
  const slug = object.slug || ''
  const metadata = object.metadata || {}
  if (!slug || !object.title) return null
  const cancellation = choice(metadata.cancellation)
  const late = choice(metadata.late_checkout)
  let photos: string[] = []
  let blocked: Block[] = []
  try {
    const parsed = JSON.parse(String(metadata.photos || '[]'))
    if (Array.isArray(parsed)) photos = parsed.filter((item) => typeof item === 'string')
  } catch {
    photos = []
  }
  try {
    const parsed = JSON.parse(String(metadata.blocked || '[]'))
    if (Array.isArray(parsed)) {
      blocked = parsed.filter((item) => item && typeof item.start === 'number' && typeof item.end === 'number')
    }
  } catch {
    blocked = []
  }
  if (cancellation !== 'free' && cancellation !== 'moderate' && cancellation !== 'strict') return null
  return {
    slug,
    name: object.title,
    town: String(metadata.town || ''),
    summary: String(metadata.summary || ''),
    bedrooms: amount(metadata.bedrooms),
    bathrooms: amount(metadata.bathrooms),
    sleeps: amount(metadata.sleeps),
    nightly: amount(metadata.nightly),
    cleaning: amount(metadata.cleaning),
    petFee: amount(metadata.pet_fee),
    dogs: flag(metadata.dogs),
    hotTub: flag(metadata.hot_tub),
    checkIn: String(metadata.check_in || ''),
    checkOut: String(metadata.check_out || ''),
    lateCheckout: late === 'noon' ? 'noon' : 'unavailable',
    lateCheckoutFee: amount(metadata.late_checkout_fee),
    cancellation,
    photos,
    arrival: String(metadata.arrival || ''),
    blocked,
  }
}

export function cancellationText(kind: Cancellation) {
  if (kind === 'free') return 'Free cancellation up to 7 days before check-in. Inside 7 days, the first night is kept.'
  if (kind === 'moderate') return 'Full lodging refund 14 days before check-in. After that, half the lodging is kept.'
  return 'Half the lodging is refunded 14 days before check-in. After that, the lodging is not refunded.'
}
