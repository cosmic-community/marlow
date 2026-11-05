'use client'

import { useEffect, useState } from 'react'

const PROJECT = 'https://www.cosmicjs.com/community/projects/marlow'

export function CosmicBadge() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('cosmic-badge-dismissed')) return
    const timer = setTimeout(() => setVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed right-5 bottom-24 z-40 lg:bottom-5">
      <button
        type="button"
        className="absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full border-0 bg-gray-100 text-sm font-bold text-gray-800 hover:bg-gray-200"
        aria-label="Dismiss badge"
        onClick={() => {
          setVisible(false)
          localStorage.setItem('cosmic-badge-dismissed', 'true')
        }}
      >
        ×
      </button>
      <a
        href={PROJECT}
        target="_blank"
        rel="noreferrer"
        className="flex w-[180px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium !text-gray-800 no-underline shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-gray-50"
      >
        <img
          src="https://cdn.cosmicjs.com/b67de7d0-c810-11ed-b01d-23d7b265c299-logo508x500.svg"
          alt=""
          className="size-5"
        />
        Built with Cosmic
      </a>
    </div>
  )
}
