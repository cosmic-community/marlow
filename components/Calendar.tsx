import { ensureBookings, nightTaken } from '@/lib/bookings'
import { formatShort, weekday } from '@/lib/dates'
import { propertyBySlug } from '@/lib/properties'

export async function Calendar({ slug }: { slug: string }) {
  await ensureBookings()
  const property = await propertyBySlug(slug)
  if (!property) return null
  const days = Array.from({ length: 42 }, (_, index) => index)
  return (
    <div>
      <h2 className="text-2xl">Next six weeks</h2>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((offset) => {
          const taken = nightTaken(property, offset)
          return (
            <div key={offset} className={`rounded px-1 py-2 ${taken ? 'bg-wine/10 text-ink/50' : 'bg-card'}`}>
              <div>{weekday(offset)}</div>
              <div className="tabular-nums">{formatShort(offset)}</div>
              <div>{taken ? 'Booked' : 'Open'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
