import { withAcceptItems } from '@/lib/agent-card'
import { handleCap } from '@/lib/door'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const response = await handleCap(request)
  const card = withAcceptItems(await response.text())
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(card, { status: response.status, headers })
}
