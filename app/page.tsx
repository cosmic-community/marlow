import Link from 'next/link'
import { HouseCard } from '@/components/HouseCard'
import { SearchForm } from '@/components/SearchForm'
import { isoFromOffset } from '@/lib/dates'
import { PHOTO_CREDIT, PHOTO_CREDIT_URL, loadProperties, type Property } from '@/lib/properties'

const featuredSlugs = ['orchard-house', 'cinder-cabin', 'bodega-bluff']

function featuredHouses(all: Property[]) {
  const picked = featuredSlugs
    .map((slug) => all.find((house) => house.slug === slug))
    .filter((house): house is Property => Boolean(house))
  return picked.length === featuredSlugs.length ? picked : all.slice(0, 3)
}

export default async function HomePage() {
  const checkIn = isoFromOffset(21)
  const all = await loadProperties()
  const houses = all.slice(0, 6)
  const featured = featuredHouses(all)
  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-wine">Sonoma County</p>
          <h1 className="text-5xl leading-[1.05] tracking-tight sm:text-6xl">Homes in Sonoma County.</h1>
          <p className="max-w-md text-lg leading-relaxed text-ink/75">
            River, vineyard, and the coast. Leo helps you book a stay, then change the dates, the checkout, or the arrival plans.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-2 items-stretch gap-3">
            {featured[0] ? <HeroHouse house={featured[0]} checkIn={checkIn} tall /> : null}
            <div className="grid h-full grid-rows-2 gap-3">
              {featured.slice(1).map((house) => (
                <HeroHouse key={house.slug} house={house} checkIn={checkIn} />
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-ink/50">
            Photos:{' '}
            <a className="underline" href={PHOTO_CREDIT_URL}>
              {PHOTO_CREDIT}
            </a>
          </p>
        </div>
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
        <h2 className="text-3xl">A few of the homes</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((property) => (
            <HouseCard key={property.slug} property={property} checkIn={checkIn} nights={3} />
          ))}
        </div>
      </section>
    </div>
  )
}

function HeroHouse({ house, checkIn, tall }: { house: Property; checkIn: string; tall?: boolean }) {
  return (
    <Link href={`/stay/${house.slug}?checkIn=${checkIn}&nights=3`} className="group relative block h-full overflow-hidden rounded-2xl no-underline">
      <img
        src={house.photos[0]}
        alt=""
        className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${tall ? 'min-h-72 sm:min-h-[28rem]' : 'min-h-36'}`}
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pt-12 pb-3">
        <span className="block text-[0.7rem] font-medium uppercase tracking-wide !text-white/80">{house.town}</span>
        <span className="font-serif text-xl leading-tight !text-white">{house.name}</span>
      </span>
    </Link>
  )
}
