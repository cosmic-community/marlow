import { ensureBookings, firstWindow } from '@/lib/bookings'
import { isoFromOffset } from '@/lib/dates'
import { cancellationText, loadProperties } from '@/lib/properties'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const [properties] = await Promise.all([loadProperties(), ensureBookings()])
  const products = properties.map((property) => {
    const open = firstWindow(property, 2, 1, 90)
    return {
      title: property.name,
      handle: property.slug,
      url: `${origin}/stay/${property.slug}`,
      product_type: 'Vacation rental',
      vendor: 'Marlow',
      body: property.summary,
      town: property.town,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sleeps: property.sleeps,
      hot_tub: property.hotTub,
      dogs: property.dogs,
      check_in: property.checkIn,
      check_out: property.checkOut,
      cancellation: cancellationText(property.cancellation),
      images: property.photos.map((src) => ({ src })),
      variants: [
        {
          title: 'Nightly rate',
          price: property.nightly.toFixed(2),
          currency: 'USD',
          available: open != null,
          first_open_night: open == null ? null : isoFromOffset(open),
          cleaning_fee: property.cleaning.toFixed(2),
          pet_fee: property.dogs ? property.petFee.toFixed(2) : null,
        },
      ],
    }
  })
  return Response.json({ products }, { headers: { 'cache-control': 'public, max-age=300' } })
}
