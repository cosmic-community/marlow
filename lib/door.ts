import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { createCapHandler, createKvStore } from '@conciergeprotocol/server'
import { act, answer, currentAccount, login } from './answer'
import { cosmicKv } from './cap-store'
import { cosmicConfigured } from './cosmic'

// Serverless hosts have no lasting disk, so with a bucket the door's state lives in Cosmic.
function storeOptions() {
  if (cosmicConfigured() && !process.env.BOOKINGS_PATH) return { store: createKvStore(cosmicKv) }
  mkdirSync(path.join(process.cwd(), 'data'), { recursive: true })
  return { sqlitePath: path.join(process.cwd(), 'data', 'cap.sqlite') }
}

const origin = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3220').replace(/\/$/, '')

type Door = Awaited<ReturnType<typeof createCapHandler>>

const shared = ((globalThis as { __marlowDoor?: { pending: Promise<Door> | null } }).__marlowDoor ??= { pending: null })

export function getDoor() {
  if (!shared.pending) {
    shared.pending = createCapHandler({
      agent: {
        name: "Leo, Marlow's concierge",
        chat: `${origin()}/chat`,
      },
      answer,
      act,
      login,
      currentAccount,
      write: true,
      allowHttpClients: true,
      publicUrl: origin(),
      dailyLimit: 0,
      // A serverless function may stop once it responds, so answers finish inside the request.
      waitSeconds: 60,
      hint: 'Demo guests: maya / maya, and sam / sam. The password is the same as the name.',
      ...storeOptions(),
    }).catch((error) => {
      shared.pending = null
      throw error
    })
  }
  return shared.pending
}

export async function handleCap(request: Request) {
  const door = await getDoor()
  return door.handle(request)
}
