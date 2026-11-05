'use client'

import { useEffect, useState } from 'react'

export function ChatFrame() {
  const [failed, setFailed] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    const timer = window.setTimeout(() => {
      const host = document.getElementById('leo-chat')
      if (!host?.querySelector('[data-cosmic-embed]')) setFailed(true)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-xl space-y-4">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-4xl">Ask Leo</h1>
        <p className="text-ink/75">
          Leo is Marlow's concierge. The chat on this page and a request to the agent door are the same agent.
        </p>
      </div>
      {failed ? (
        <p className="rounded-lg border border-line bg-card px-4 py-3 text-sm">
          Leo refused this website. Add {origin || 'this origin'} to his allowed websites, then reload.
        </p>
      ) : null}
      <div id="leo-chat" className="h-[min(40rem,calc(100svh-12rem))] overflow-hidden" />
    </div>
  )
}
