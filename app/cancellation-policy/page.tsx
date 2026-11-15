import type { Metadata } from 'next'
import Link from 'next/link'
import { cancellationText, loadProperties, type Cancellation } from '@/lib/properties'

export const metadata: Metadata = {
  title: 'Cancellation policy',
  description: 'How refunds work when a Marlow stay is cancelled.',
}

const tiers: { kind: Cancellation; name: string }[] = [
  { kind: 'free', name: 'Free' },
  { kind: 'moderate', name: 'Moderate' },
  { kind: 'strict', name: 'Strict' },
]

export default async function CancellationPolicyPage() {
  const properties = await loadProperties()
  return (
    <article className="max-w-2xl space-y-6">
      <h1 className="text-4xl">Cancellation policy</h1>
      <p>
        Every Marlow home has one of three cancellation rules. The rule is shown on the home&apos;s page and in each quote, and it is fixed when the stay is
        booked. The rule decides how much lodging is kept. Cleaning, the pet fee, and a noon checkout are always refunded, and tax is refunded on everything
        that comes back. The 12% service fee is refunded only when a free-cancellation stay is cancelled 7 or more days before check-in.
      </p>
      {tiers.map((tier) => {
        const homes = properties.filter((property) => property.cancellation === tier.kind)
        return (
          <section key={tier.kind} className="space-y-2">
            <h2 className="text-2xl">{tier.name}</h2>
            <p>{cancellationText(tier.kind)}</p>
            {homes.length ? (
              <p className="text-sm text-ink/70">
                Homes with this rule:{' '}
                {homes.map((property, index) => (
                  <span key={property.slug}>
                    {index ? ', ' : ''}
                    <Link className="underline" href={`/stay/${property.slug}`}>
                      {property.name}
                    </Link>
                  </span>
                ))}
                .
              </p>
            ) : null}
          </section>
        )
      })}
      <section className="space-y-2">
        <h2 className="text-2xl">How to cancel</h2>
        <p>
          Sign in and open <Link className="underline" href="/trips">Your stays</Link>, or ask Leo in the chat after you sign in. Leo shows the refund before
          anything changes, and the stay is cancelled only after you confirm.
        </p>
        <p className="text-sm text-ink/70">Marlow is a demo. Payments and refunds are simulated.</p>
      </section>
    </article>
  )
}
