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

    const paint = () => {
      document.querySelectorAll('[data-cosmic-embed]').forEach((node) => {
        const shadow = node.shadowRoot
        if (!shadow || shadow.querySelector('[data-marlow-chat]')) return
        const style = document.createElement('style')
        style.setAttribute('data-marlow-chat', '')
        style.textContent = [
          'button,a,.text-btn,.icon-btn,.launcher{cursor:pointer}',
          inline ? '.panel{border:0;box-shadow:none}' : '',
        ].join('')
        shadow.appendChild(style)
      })
    }
    const observer = new MutationObserver(paint)
    observer.observe(document.body, { childList: true, subtree: true })
    paint()

    return () => {
      observer.disconnect()
      script.remove()
      document.querySelectorAll('[data-cosmic-embed]').forEach((node) => node.remove())
    }
  }, [inline])

  return null
}
