type Turn = { message: string; reply: string | null }

type CapBody = { id?: string; status?: string; reply?: string }

function root() {
  const key = process.env.CAP_PUBLIC_KEY
  if (!key || process.env.BOOKINGS_PATH) return ''
  const base = (process.env.CAP_API_URL || 'https://dapi.cosmicjs.com').replace(/\/$/, '')
  return `${base}/cap/v1/${key}`
}

async function readBody(response: Response) {
  const text = await response.text()
  const body = text ? (JSON.parse(text) as CapBody) : {}
  return { status: response.status, retryAfter: Number(response.headers.get('retry-after') || 1), body }
}

export async function askLeo(history: Turn[], message: string) {
  const endpoint = root()
  if (!endpoint) return null
  const prior = history
    .filter((turn) => turn.message)
    .map((turn) => `Guest: ${turn.message}${turn.reply ? `\nAssistant: ${turn.reply}` : ''}`)
    .join('\n\n')
  const text = prior ? `${prior}\n\nGuest: ${message}` : message
  const headers = {
    'content-type': 'application/json',
    'CAP-Version': '1.0',
    'CAP-From': 'agent:marlow-site',
  }
  try {
    let response = await readBody(
      await fetch(`${endpoint}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text }),
      })
    )
    const started = Date.now()
    while (response.status === 202 || response.body.status === 'working') {
      if (!response.body.id || Date.now() - started > 45000) return null
      await new Promise((resolve) => setTimeout(resolve, Math.max(response.retryAfter, 1) * 1000))
      response = await readBody(await fetch(`${endpoint}/messages/${response.body.id}`, { headers }))
    }
    if (response.body.status === 'done' && response.body.reply) return response.body.reply
    return null
  } catch {
    return null
  }
}
