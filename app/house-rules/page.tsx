import type { Metadata } from 'next'
import Link from 'next/link'
import { money } from '@/lib/money'
import { loadProperties } from '@/lib/properties'

export const metadata: Metadata = {
  title: 'House rules',
  description: 'Check-in, checkout, guests, dogs, and fees at Marlow homes.',
}

export default async function HouseRulesPage() {
  const properties = await loadProperties()
  const dogHomes = properties.filter((property) => property.dogs)
  const fees = dogHomes.map((property) => property.petFee).filter((fee) => fee > 0)
  const lowFee = fees.length ? Math.min(...fees) : 0
  const highFee = fees.length ? Math.max(...fees) : 0
  return (
    <article className="max-w-2xl space-y-6">
      <h1 className="text-4xl">House rules</h1>
      <p>These rules apply at every Marlow home. A home&apos;s own page lists its exact times, fees, and amenities, and those details win if they differ.</p>
      <section className="space-y-2">
        <h2 className="text-2xl">Check-in and checkout</h2>
        <p>
          Check-in is from 3:00 pm or 4:00 pm, depending on the home. Checkout is by 10:00 am or 11:00 am. Some homes offer a noon checkout for a fee when the
          next night is open. Ask for it from Your stays or through Leo once you are signed in.
        </p>
        <p>Arrival instructions, including lockbox and gate codes, are shown only to the signed-in guest on the reservation.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl">Guests</h2>
        <p>
          The number of guests may not exceed what the home sleeps, which is shown on each home&apos;s page. A reservation cannot be made for more guests than
          that.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl">Dogs</h2>
        <p>
          Dogs are allowed only at homes marked &quot;Dogs allowed&quot;. A pet fee
          {fees.length ? ` of ${lowFee === highFee ? money(lowFee) : `${money(lowFee)} to ${money(highFee)}`}` : ''} is added once per stay. Add the dog when you
          reserve so the fee is in the quote.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-2xl">Fees and payment</h2>
        <p>
          A quote is the full price: lodging, cleaning, any pet fee, a 12% service fee, and 14% tax. Nothing else is added at checkout. Cancellations follow the{' '}
          <Link className="underline" href="/cancellation-policy">
            cancellation policy
          </Link>{' '}
          on the home.
        </p>
        <p className="text-sm text-ink/70">Marlow is a demo. Payments are simulated.</p>
      </section>
    </article>
  )
}
