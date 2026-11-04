import { HouseCard } from '@/components/HouseCard'
import { SearchForm } from '@/components/SearchForm'
import { isoFromOffset } from '@/lib/dates'
import { loadProperties } from '@/lib/properties'

export default async function HomePage() {
  const checkIn = isoFromOffset(21)
  const houses = (await loadProperties()).slice(0, 6)
  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-wide text-wine">Vacation rentals and guest portal</p>
        <h1 className="text-5xl leading-tight">Houses in Sonoma County, with the stay in your account.</h1>
        <p className="text-lg text-ink/80">
          Search by dates, beds, and the total price. Sign in to see arrival instructions, ask for a later checkout, or change a reservation. Leo, the Cosmic support agent, answers in the chat and through the agent door.
        </p>
      </section>
      <SearchForm
        values={{
          checkIn,
          nights: '3',
          guests: '4',
          bedrooms: '2',
          hotTub: true,
          dogs: false,
          freeCancellation: false,
          maxTotal: '1200',
        }}
      />
      <section className="space-y-4">
        <h2 className="text-3xl">A few of the houses</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((property) => (
            <HouseCard key={property.slug} property={property} checkIn={checkIn} nights={3} />
          ))}
        </div>
      </section>
    </div>
  )
}
