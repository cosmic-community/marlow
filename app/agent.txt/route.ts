import { handleCap } from '@/lib/door'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(request: Request) {
  return handleCap(request)
}
