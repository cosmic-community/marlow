import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { AnswerInput, AnswerResult } from '@conciergeprotocol/server'

const dir = mkdtempSync(path.join(tmpdir(), 'marlow-'))
process.env.BOOKINGS_PATH = path.join(dir, 'bookings.json')

function fail(message: string): never {
  throw new Error(message)
}

function replyOf(result: AnswerResult) {
  if (typeof result === 'string') return result
  if ('reply' in result && result.reply) return result.reply
  if ('error' in result) return result.error.message
  return ''
}

function confirmOf(result: AnswerResult) {
  if (typeof result === 'string' || !('confirm' in result)) return null
  return result.confirm
}

function itemsOf(result: AnswerResult) {
  if (typeof result === 'string' || !('items' in result) || !Array.isArray(result.items)) return []
  return result.items as Array<Record<string, unknown>>
}

const caller = 'agent:marlow-check'
const empty = { context: {}, history: [], caller, accept: ['items'] } satisfies Pick<AnswerInput, 'context' | 'history' | 'caller' | 'accept'>

const FIND = 'We are four people visiting Sonoma for three nights. We need two bedrooms, a hot tub, and a total under $1,200.'
const REFINE = 'Which of those allows a dog and has free cancellation?'

try {
  const { searchStays } = await import('../lib/search')
  const { answer, act } = await import('../lib/answer')
  const { bookingById } = await import('../lib/bookings')
  const { propertyBySlug } = await import('../lib/properties')
  const { extraNight, quoteStay, refundFor } = await import('../lib/quote')
  const { formatDate } = await import('../lib/dates')
  const { bookingsFor } = await import('../lib/bookings')

  const open = await searchStays({
    checkIn: null,
    nights: 3,
    guests: 4,
    bedrooms: 2,
    hotTub: true,
    dogs: false,
    freeCancellation: false,
    maxTotal: 1200,
    town: null,
  })
  const slugs = open.map((match) => match.property.slug).sort()
  const expected = ['cinder-cabin', 'fig-cottage', 'hill-barn', 'lantern-cottage', 'orchard-house', 'pump-house']
  if (slugs.join() !== expected.join()) fail(`search returned ${slugs.join(', ')}`)
  if (open.some((match) => match.price.total > 1200 || match.price.pet !== 0)) fail('first search included a pet fee or went over budget')

  const refined = await searchStays({
    checkIn: null,
    nights: 3,
    guests: 4,
    bedrooms: 2,
    hotTub: true,
    dogs: true,
    freeCancellation: true,
    maxTotal: 1200,
    town: null,
  })
  const refinedSlugs = refined.map((match) => match.property.slug).sort()
  if (refinedSlugs.join() !== ['lantern-cottage', 'orchard-house', 'pump-house'].join()) {
    fail(`refine returned ${refinedSlugs.join(', ')}`)
  }
  if (refined.some((match) => match.price.total > 1200 || match.price.pet <= 0)) fail('refine dropped the pet fee or went over budget')

  const found = await answer({ ...empty, message: FIND, account: null, scope: null })
  if (!replyOf(found).includes('Orchard House') || replyOf(found).includes('1842')) fail('public search leaked an arrival code or missed Orchard House')
  const foundItems = itemsOf(found)
  if (foundItems.length !== open.length || foundItems.some((item) => item.type !== 'listing')) fail('search did not return a listing per home')
  const orchardItem = foundItems.find((item) => item.id === 'orchard-house')
  const orchardPrice = orchardItem?.price as { amount?: string } | undefined
  if (!orchardItem || orchardPrice?.amount !== open.find((match) => match.property.slug === 'orchard-house')?.price.total.toFixed(2)) {
    fail('Orchard House item price did not match the quote')
  }
  if (JSON.stringify(foundItems).includes('1842')) fail('a listing item included an arrival code')
  const follow = await answer({
    message: REFINE,
    context: {},
    caller,
    accept: ['items'],
    account: null,
    scope: null,
    history: [{ message: FIND, context: {}, reply: replyOf(found) }],
  })
  const followText = replyOf(follow)
  if (!followText.includes('Orchard House') || !followText.includes('Lantern Cottage') || !followText.includes('Pump House')) {
    fail('follow-up missed a dog-friendly free-cancellation house')
  }
  if (followText.includes('Hill Barn') || followText.includes('Cinder Cabin')) fail('follow-up kept a house that fails dogs or free cancellation')

  const locked = await answer({ ...empty, message: 'I already booked. What are my arrival instructions?', account: null, scope: null })
  if (typeof locked === 'string' || !('error' in locked) || locked.error.code !== 'login_required') fail('account question did not require login')

  const maya = await answer({ ...empty, message: 'I already booked. What are my arrival instructions?', account: 'maya', scope: 'read' })
  if (!replyOf(maya).includes('1842') || !replyOf(maya).includes('Orchard House')) fail('Maya did not get her arrival instructions')
  const mayaItems = itemsOf(maya)
  if (mayaItems.length !== 1 || mayaItems[0]?.id !== 'orchard-house') fail('Maya stay did not return her listing')
  if (JSON.stringify(mayaItems).includes('1842')) fail('Maya listing item included the arrival code')

  const sam = await answer({ ...empty, message: 'What are my arrival instructions?', account: 'sam', scope: 'read' })
  if (replyOf(sam).includes('1842') || !replyOf(sam).includes('2744')) fail('Sam saw the wrong stay')

  const mayaExtend = await answer({ ...empty, message: 'Can I extend my stay by one night?', account: 'maya', scope: 'write' })
  const mayaConfirm = confirmOf(mayaExtend)
  const orchard = await propertyBySlug('orchard-house')
  if (!orchard || !mayaConfirm) fail('Maya extension did not ask for approval')
  const added = extraNight(orchard, 3, false)
  if (!mayaConfirm.summary.includes(added.total.toFixed(2))) fail(`extension quote was not ${added.total}`)
  const extended = await act({ account: 'maya', authorization_details: mayaConfirm.authorization_details, caller })
  if (!('message' in extended)) fail('extension did not complete')
  const mayaStay = bookingById('stay-maya')
  if (!mayaStay || mayaStay.nights !== 4) fail('extension did not add a night')

  const samExtend = await answer({ ...empty, message: 'Can I extend my stay by one night?', account: 'sam', scope: 'write' })
  if (confirmOf(samExtend) || !replyOf(samExtend).includes('booked the night after')) fail('Sam was offered an extension')

  const mayaLate = await answer({ ...empty, message: 'Can we check out at noon?', account: 'maya', scope: 'write' })
  if (!replyOf(mayaLate).includes('45.00')) fail('Maya noon checkout did not include the fee')
  if (!bookingById('stay-maya')?.lateCheckout) fail('noon checkout was not saved')

  const samLate = await answer({ ...empty, message: 'Can we check out at noon?', account: 'sam', scope: 'write' })
  if (!replyOf(samLate).includes('Another guest arrives')) fail('Sam noon checkout was not refused')

  const readWrite = await answer({ ...empty, message: 'Cancel my booking.', account: 'maya', scope: 'read' })
  if (typeof readWrite === 'string' || !('error' in readWrite) || readWrite.error.code !== 'write_required') fail('a read login was allowed to cancel')

  const mayaCancel = await answer({ ...empty, message: 'Cancel my booking.', account: 'maya', scope: 'write' })
  const cancelConfirm = confirmOf(mayaCancel)
  if (!cancelConfirm) fail('cancel did not ask for approval')
  const before = bookingById('stay-maya')
  if (!before || before.status !== 'confirmed') fail('cancel changed the stay before approval')
  const quote = quoteStay(orchard, before.nights, before.pets, true)
  const refund = refundFor(orchard, before.nights, before.pets, true, before.checkInOffset)
  if (refund.refund !== quote.total) fail(`full refund ${refund.refund} did not match total ${quote.total}`)
  if (!cancelConfirm.summary.includes(refund.refund.toFixed(2))) fail('cancel summary omitted the refund')
  const cancelled = await act({ account: 'maya', authorization_details: cancelConfirm.authorization_details, caller })
  if (!('message' in cancelled) || bookingById('stay-maya')?.status !== 'cancelled') fail('approved cancel did not update the stay')
  if (bookingById('stay-maya')?.refund !== refund.refund) fail('saved refund did not match the quote')

  const cliff = await propertyBySlug('cliff-kitchen')
  const samStay = bookingById('stay-sam')
  if (!cliff || !samStay) fail('Sam stay missing')
  const samQuote = quoteStay(cliff, samStay.nights, false, false)
  const samRefund = refundFor(cliff, samStay.nights, false, false, samStay.checkInOffset)
  if (samRefund.lodgingKept !== samQuote.lodging || samRefund.refund >= samQuote.total) fail('strict refund returned the lodging')
  const samCancel = await answer({ ...empty, message: 'Cancel my booking.', account: 'sam', scope: 'write' })
  const samConfirm = confirmOf(samCancel)
  if (!samConfirm || !samConfirm.summary.includes(samRefund.refund.toFixed(2))) fail('Sam cancel summary omitted the partial refund')

  const stayStart = 40
  const bookMessage = `Book River Lookout, ${formatDate(stayStart)} to ${formatDate(stayStart + 3)}, with a dog.`
  const unsigned = await answer({ ...empty, message: bookMessage, account: null, scope: null })
  if (typeof unsigned === 'string' || !('error' in unsigned) || unsigned.error.code !== 'login_required') fail('booking did not require login')

  const noDogs = await answer({
    ...empty,
    message: `Book Hill Barn, ${formatDate(stayStart)} to ${formatDate(stayStart + 3)}, with a dog.`,
    account: 'sam',
    scope: 'write',
  })
  if (confirmOf(noDogs) || !replyOf(noDogs).includes('does not allow dogs')) fail('a dog was booked at Hill Barn')

  const held = await answer({ ...empty, message: bookMessage, account: 'sam', scope: 'write' })
  const bookConfirm = confirmOf(held)
  if (!bookConfirm || !bookConfirm.summary.includes('River Lookout')) fail('booking did not ask for approval')
  if (bookingsFor('sam').some((booking) => booking.property === 'river-lookout')) fail('booking was saved before approval')
  const booked = await act({ account: 'sam', authorization_details: bookConfirm.authorization_details, caller })
  if (!('message' in booked)) fail('approved booking did not complete')
  const created = bookingsFor('sam').find((booking) => booking.property === 'river-lookout')
  if (!created || created.nights !== 3 || !created.pets || created.guests !== 2) fail('booked stay was not saved for 2 guests and a dog')
  const again = await answer({ ...empty, message: bookMessage, account: 'sam', scope: 'write' })
  if (confirmOf(again) || !replyOf(again).includes('already booked')) fail('the same nights were offered twice')

  console.log('marlow check passed')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
