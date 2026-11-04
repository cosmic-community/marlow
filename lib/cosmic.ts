export type CosmicRecord = {
  id: string
  slug: string
  title: string
  metadata: Record<string, unknown>
}

function bucket() {
  const slug = process.env.COSMIC_BUCKET_SLUG
  if (!slug) throw new Error('COSMIC_BUCKET_SLUG is not set')
  return `https://api.cosmicjs.com/v3/buckets/${slug}`
}

function redact(message: string) {
  let text = message
  for (const name of ['COSMIC_READ_KEY', 'COSMIC_WRITE_KEY']) {
    const secret = process.env[name]
    if (secret) text = text.replaceAll(secret, '[key]')
  }
  return text.slice(0, 300)
}

async function parse(response: Response) {
  const text = await response.text()
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : text
    throw new Error(redact(`${response.status}: ${message}`))
  }
  return data
}

export function cosmicConfigured() {
  return Boolean(process.env.COSMIC_BUCKET_SLUG && process.env.COSMIC_READ_KEY && process.env.COSMIC_WRITE_KEY)
}

export async function listObjects(type: string) {
  const query = encodeURIComponent(JSON.stringify({ type }))
  const response = await fetch(`${bucket()}/objects?query=${query}&limit=100&read_key=${process.env.COSMIC_READ_KEY}`, {
    cache: 'no-store',
  })
  const data = await parse(response)
  const objects = Array.isArray(data.objects) ? data.objects : []
  return objects as CosmicRecord[]
}

export async function findObject(type: string, slug: string) {
  const query = encodeURIComponent(JSON.stringify({ type, slug }))
  const response = await fetch(
    `${bucket()}/objects?query=${query}&props=id,slug,title,metadata&status=any&limit=1&read_key=${process.env.COSMIC_READ_KEY}`,
    { cache: 'no-store' },
  )
  if (response.status === 404) return null
  const data = await parse(response)
  const objects = Array.isArray(data.objects) ? (data.objects as CosmicRecord[]) : []
  return objects[0] || null
}

export async function deleteObject(id: string) {
  const response = await fetch(`${bucket()}/objects/${id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${process.env.COSMIC_WRITE_KEY}` },
  })
  if (response.status !== 404) await parse(response)
}

export async function insertObject(body: unknown) {
  const response = await fetch(`${bucket()}/objects`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.COSMIC_WRITE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return parse(response)
}

export async function patchObject(id: string, body: unknown) {
  const response = await fetch(`${bucket()}/objects/${id}`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${process.env.COSMIC_WRITE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return parse(response)
}

export function recordId(data: Record<string, unknown>) {
  const object = data.object as { id?: string } | undefined
  const id = object?.id || (typeof data.id === 'string' ? data.id : '')
  if (!id) throw new Error('Cosmic did not return an object id')
  return id
}
