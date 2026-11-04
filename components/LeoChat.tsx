'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const key = process.env.NEXT_PUBLIC_CHAT_EMBED_KEY || 'pk_811f5c30d0b0e75acc5d4d78130d8d31'
const api = (process.env.NEXT_PUBLIC_AGENT_API || 'https://dapi.cosmicjs.com/v3').replace(/\/$/, '')

export function LeoChat() {
  const pathname = usePathname()
  const inline = pathname === '/chat'

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `https://www.cosmicjs.com/agent.js?mount=${inline ? 'page' : 'corner'}`
    script.async = true
    script.setAttribute('data-key', key)
    script.setAttribute('data-api', api)
    script.setAttribute('data-theme', 'light')
    if (inline) script.setAttribute('data-target', '#leo-chat')
    document.body.appendChild(script)
    return () => {
      script.remove()
      document.querySelectorAll('[data-cosmic-embed]').forEach((node) => node.remove())
    }
  }, [inline])

  return null
}
