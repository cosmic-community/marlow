export function GET() {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220').replace(/\/$/, '')
  const body = `# Marlow

Vacation rentals in Sonoma County. Public house pages list dates, amenities, fees, and cancellation rules. Arrival instructions and reservation changes belong to the signed-in guest.

- Houses: ${origin}/stays
- A house: ${origin}/stay/{slug}
- Guest stays: ${origin}/trips
- Agent card: ${origin}/agent.txt
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
