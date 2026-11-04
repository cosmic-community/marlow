import { isoFromOffset } from '@/lib/dates'

export function SearchForm({
  values,
}: {
  values: {
    checkIn: string
    nights: string
    guests: string
    bedrooms: string
    hotTub: boolean
    dogs: boolean
    freeCancellation: boolean
    maxTotal: string
  }
}) {
  return (
    <form action="/stays" className="grid gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">
        Check-in
        <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="date" name="checkIn" defaultValue={values.checkIn || isoFromOffset(21)} />
      </label>
      <label className="text-sm">
        Nights
        <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="number" min={1} name="nights" defaultValue={values.nights || '3'} />
      </label>
      <label className="text-sm">
        Guests
        <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="number" min={1} name="guests" defaultValue={values.guests || '4'} />
      </label>
      <label className="text-sm">
        Bedrooms
        <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="number" min={0} name="bedrooms" defaultValue={values.bedrooms || '2'} />
      </label>
      <label className="text-sm">
        Total under
        <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" type="number" min={0} name="maxTotal" placeholder="1200" defaultValue={values.maxTotal} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="hotTub" value="yes" defaultChecked={values.hotTub} /> Hot tub
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="dogs" value="yes" defaultChecked={values.dogs} /> Dogs
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="freeCancellation" value="yes" defaultChecked={values.freeCancellation} /> Free cancellation
      </label>
      <button className="rounded bg-wine px-4 py-2 text-sm text-paper sm:col-span-2 lg:col-span-4" type="submit">
        Find a house
      </button>
    </form>
  )
}
