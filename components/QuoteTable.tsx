import { money } from '@/lib/money'
import type { Quote } from '@/lib/quote'

export function QuoteTable({ quote, title = 'Price for this stay' }: { quote: Quote; title?: string }) {
  const rows = [
    [`Lodging, ${quote.nights} nights`, money(quote.lodging)],
    ['Cleaning', money(quote.cleaning)],
    quote.pet ? ['Pet fee', money(quote.pet)] : null,
    ['Service fee, 12%', money(quote.service)],
    ['Tax, 14%', money(quote.tax)],
    quote.lateCheckout ? ['Noon checkout', money(quote.lateCheckout)] : null,
  ].filter((row): row is [string, string] => row != null)
  return (
    <table className="w-full text-left text-sm">
      <caption className="mb-2 text-left font-serif text-2xl">{title}</caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th className="py-1 pr-4 font-normal">{label}</th>
            <td className="py-1 text-right tabular-nums">{value}</td>
          </tr>
        ))}
        <tr>
          <th className="border-t border-line py-2 pr-4 font-medium">Total</th>
          <td className="border-t border-line py-2 text-right font-medium tabular-nums">{money(quote.total)}</td>
        </tr>
      </tbody>
    </table>
  )
}
