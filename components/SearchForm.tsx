import Link from 'next/link'
import type { ReactNode } from 'react'

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
    <div className="space-y-3">
      <Link
        href="/chat"
        className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2.5 no-underline shadow-[0_1px_2px_rgba(36,28,24,0.04)] transition hover:border-wine/40"
      >
        <img
          src="https://imgix.cosmicjs.com/f55cd680-d8ad-11f1-8619-91dc934323b3-leo-marlow.jpg?w=160&h=160&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.42&fp-z=1.55&auto=format,compress"
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <span className="min-w-0 flex-1 text-sm leading-snug text-ink/80">
          Use the filters below, or have <span className="font-medium text-ink">Leo</span> help find the perfect stay.
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0 fill-none stroke-wine" strokeWidth="1.8">
          <path d="M5 6.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3.5V16.5H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
        </svg>
      </Link>
      <form action="/stays" className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(36,28,24,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <Field label="Check-in">
            <input className="w-full bg-transparent text-sm outline-none" type="date" name="checkIn" defaultValue={values.checkIn} />
          </Field>
          <Field label="Nights" divided>
            <input className="w-full bg-transparent text-sm outline-none" type="number" min={1} name="nights" defaultValue={values.nights || '3'} />
          </Field>
          <Field label="Guests" divided>
            <input className="w-full bg-transparent text-sm outline-none" type="number" min={1} name="guests" defaultValue={values.guests} />
          </Field>
          <Field label="Bedrooms" divided>
            <input className="w-full bg-transparent text-sm outline-none" type="number" min={0} name="bedrooms" defaultValue={values.bedrooms} />
          </Field>
          <div className="flex items-center border-t border-line p-3 lg:border-t-0 lg:border-l lg:p-2">
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-wine px-5 text-sm font-medium !text-white lg:w-auto" type="submit">
              <SearchMark />
              Search
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-3">
          <label className="mr-1 flex items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-ink/50">Total under</span>
            <input
              className="w-24 rounded-full border border-line bg-paper px-3 py-1.5 text-sm outline-none"
              type="number"
              min={0}
              name="maxTotal"
              placeholder="1200"
              defaultValue={values.maxTotal}
            />
          </label>
          <Chip name="hotTub" checked={values.hotTub}>
            Hot tub
          </Chip>
          <Chip name="dogs" checked={values.dogs}>
            Dogs
          </Chip>
          <Chip name="freeCancellation" checked={values.freeCancellation}>
            Free cancellation
          </Chip>
        </div>
      </form>
    </div>
  )
}

function Field({ label, divided, children }: { label: string; divided?: boolean; children: ReactNode }) {
  return (
    <label className={`block min-w-0 flex-1 px-4 py-3 ${divided ? 'border-t border-line lg:border-t-0 lg:border-l' : ''}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-ink/50">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

function Chip({ name, checked, children }: { name: string; checked: boolean; children: ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input className="peer sr-only" type="checkbox" name={name} value="yes" defaultChecked={checked} />
      <span className="inline-flex rounded-full border border-line px-3 py-1.5 text-sm text-ink/80 peer-checked:border-wine peer-checked:bg-wine/10 peer-checked:text-wine peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wine">
        {children}
      </span>
    </label>
  )
}

function SearchMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
