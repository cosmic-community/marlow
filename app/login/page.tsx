import { signIn } from '@/app/actions'
import { GUESTS } from '@/lib/guests'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const next = Array.isArray(raw.next) ? raw.next[0] : raw.next || '/trips'
  const error = raw.error
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-4xl">Sign in</h1>
      <p className="text-ink/75">Two demo guests are already booked. The password is the same as the username.</p>
      {error ? <p className="rounded bg-wine/10 px-3 py-2 text-sm">That username and password did not match.</p> : null}
      <form action={signIn} className="space-y-3 rounded-lg border border-line bg-card p-4">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          Username
          <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" name="username" autoComplete="username" required />
        </label>
        <label className="block text-sm">
          Password
          <input className="mt-1 w-full rounded border border-line bg-paper px-2 py-2" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="rounded bg-wine px-4 py-2 text-sm text-paper" type="submit">
          Continue
        </button>
      </form>
      <div className="space-y-2">
        {GUESTS.map((guest) => (
          <form key={guest.id} action={signIn}>
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="username" value={guest.id} />
            <input type="hidden" name="password" value={guest.password} />
            <button className="w-full rounded border border-line bg-card px-4 py-3 text-left text-sm" type="submit">
              Continue as {guest.name}
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
