export function money(centsOrDollars: number) {
  return `$${centsOrDollars.toFixed(2)}`
}

const WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
}

export function wordNumber(value: string) {
  const lower = value.toLowerCase()
  if (WORDS[lower]) return WORDS[lower]
  const parsed = Number(lower.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}
