import { createHash } from 'node:crypto'
import { deleteObject, findObject, insertObject, patchObject, recordId } from './cosmic'

const TYPE = 'cap-records'

// Keys hold token hashes and codes, so slugs and titles carry only a digest and the record kind.
const slugFor = (key: string) => `k-${createHash('sha256').update(key).digest('hex').slice(0, 40)}`

const ids = ((globalThis as { __marlowCapIds?: Map<string, string> }).__marlowCapIds ??= new Map())

async function idFor(slug: string) {
  const known = ids.get(slug)
  if (known) return known
  const found = await findObject(TYPE, slug)
  if (found) ids.set(slug, found.id)
  return found?.id || null
}

/** The door's logins, grants, messages, and approvals, kept as Cosmic objects. */
export const cosmicKv = {
  async get(key: string) {
    const slug = slugFor(key)
    const found = await findObject(TYPE, slug)
    if (!found) {
      ids.delete(slug)
      return null
    }
    ids.set(slug, found.id)
    return found.metadata?.value ?? null
  },
  async set(key: string, value: unknown) {
    const slug = slugFor(key)
    const metadata = { value }
    const id = await idFor(slug)
    if (id) {
      try {
        await patchObject(id, { metadata })
        return
      } catch (error) {
        // Another instance may have deleted it since this one cached the id.
        if (!String((error as Error).message).startsWith('404')) throw error
        ids.delete(slug)
      }
    }
    const data = await insertObject({ title: key.split(':')[0], type: TYPE, slug, metadata })
    ids.set(slug, recordId(data))
  },
  async delete(key: string) {
    const slug = slugFor(key)
    const id = await idFor(slug)
    ids.delete(slug)
    if (id) await deleteObject(id)
  },
}
