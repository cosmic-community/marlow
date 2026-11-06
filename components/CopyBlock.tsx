'use client'

import { useState } from 'react'

export function CopyBlock({ code, wrap = false }: { code: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-lg bg-ink text-paper">
      <div className="flex justify-end px-2.5 pt-2.5">
        <button
          type="button"
          onClick={onCopy}
          aria-live="polite"
          className="rounded-md bg-paper/10 px-2.5 py-1 text-xs font-medium text-paper transition-colors hover:bg-paper/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`overflow-x-auto px-4 pb-4 text-sm ${wrap ? 'whitespace-pre-wrap' : ''}`}>{code}</pre>
    </div>
  )
}
