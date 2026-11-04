import { rmSync } from 'node:fs'
import path from 'node:path'
import { demoBookings } from '../lib/bookings'
import { cosmicConfigured, listObjects, patchObject } from '../lib/cosmic'
import { isoFromOffset } from '../lib/dates'

rmSync(path.join(process.cwd(), 'data', 'bookings.json'), { force: true })

if (!cosmicConfigured()) {
  console.log('local stays reset')
  process.exit(0)
}

const objects = await listObjects('bookings')
for (const booking of demoBookings()) {
  const object = objects.find((item) => item.slug === booking.id)
  if (!object) {
    console.log(`${booking.id} is missing. Run bun run seed.`)
    continue
  }
  await patchObject(object.id, {
    metadata: {
      account: booking.account,
      property: booking.property,
      check_in_offset: booking.checkInOffset,
      nights: booking.nights,
      guests: booking.guests,
      pets: booking.pets,
      status: 'confirmed',
      late_checkout: false,
      refund: '',
      seeded_on: isoFromOffset(0),
      arrival: booking.arrival,
    },
  })
  console.log(`${booking.id} reset`)
}
