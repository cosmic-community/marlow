export function startOfToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

export function dateFromOffset(offset: number) {
  const date = startOfToday()
  date.setDate(date.getDate() + offset)
  return date
}

export function isoFromOffset(offset: number) {
  const date = dateFromOffset(offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function offsetFromIso(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Math.round((target.getTime() - startOfToday().getTime()) / 86400000)
}

export function formatDate(offset: number) {
  return dateFromOffset(offset).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShort(offset: number) {
  return dateFromOffset(offset).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function weekday(offset: number) {
  return dateFromOffset(offset).toLocaleDateString('en-US', { weekday: 'short' })
}
