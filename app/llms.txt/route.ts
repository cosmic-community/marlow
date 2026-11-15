export function GET() {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220').replace(/\/$/, '')
  const body = `# Marlow

Vacation rentals in Sonoma County. Public home pages list dates, amenities, fees, and cancellation rules. Arrival instructions and reservation changes belong to the signed-in guest.

- Stays: ${origin}/stays
- A home: ${origin}/stay/{slug}
- Every home with its nightly rate and open dates, as JSON: ${origin}/products.json
- Cancellation policy: ${origin}/cancellation-policy
- House rules: ${origin}/house-rules
- Guest stays: ${origin}/trips
- Agent card: ${origin}/agent.txt
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
