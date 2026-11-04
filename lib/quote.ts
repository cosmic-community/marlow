import type { Property } from './properties'

export type Quote = {
  nights: number
  lodging: number
  cleaning: number
  pet: number
  service: number
  tax: number
  lateCheckout: number
  total: number
}

const SERVICE = 0.12
const TAX = 0.14

export function quoteStay(property: Property, nights: number, pets: boolean, lateCheckout = false): Quote {
  const lodging = property.nightly * nights
  const cleaning = property.cleaning
  const pet = pets && property.dogs ? property.petFee : 0
  const service = Math.round((lodging + cleaning) * SERVICE)
  const tax = Math.round((lodging + cleaning + pet) * TAX)
  const late = lateCheckout ? property.lateCheckoutFee : 0
  return {
    nights,
    lodging,
    cleaning,
    pet,
    service,
    tax,
    lateCheckout: late,
    total: lodging + cleaning + pet + service + tax + late,
  }
}

export function extraNight(property: Property, nights: number, pets: boolean) {
  const before = quoteStay(property, nights, pets, false)
  const after = quoteStay(property, nights + 1, pets, false)
  return {
    lodging: after.lodging - before.lodging,
    service: after.service - before.service,
    tax: after.tax - before.tax,
    total: after.total - before.total,
  }
}

export type Refund = {
  lodgingKept: number
  refund: number
  kept: number
  rule: string
}

export function refundFor(property: Property, nights: number, pets: boolean, lateCheckout: boolean, daysUntilCheckIn: number): Refund {
  const quote = quoteStay(property, nights, pets, lateCheckout)
  let lodgingKept = 0
  let rule = ''
  if (property.cancellation === 'free') {
    if (daysUntilCheckIn >= 7) {
      lodgingKept = 0
      rule = 'Free cancellation applies, because check-in is 7 or more days away.'
    } else {
      lodgingKept = property.nightly
      rule = 'Inside 7 days, the first night is kept.'
    }
  } else if (property.cancellation === 'moderate') {
    if (daysUntilCheckIn >= 14) {
      lodgingKept = 0
      rule = 'The moderate policy refunds the lodging 14 or more days before check-in.'
    } else {
      lodgingKept = Math.round(quote.lodging / 2)
      rule = 'Inside 14 days, the moderate policy keeps half the lodging.'
    }
  } else if (daysUntilCheckIn >= 14) {
    lodgingKept = Math.round(quote.lodging / 2)
    rule = 'The strict policy refunds half the lodging 14 or more days before check-in.'
  } else {
    lodgingKept = quote.lodging
    rule = 'Inside 14 days, the strict policy does not refund the lodging.'
  }
  const lodgingRefund = quote.lodging - lodgingKept
  const pretax = lodgingRefund + quote.cleaning + quote.pet
  const taxRefund = Math.round(pretax * TAX)
  const serviceRefund = lodgingKept === 0 && property.cancellation === 'free' ? quote.service : 0
  const lateRefund = quote.lateCheckout
  const refund = pretax + taxRefund + serviceRefund + lateRefund
  return { lodgingKept, refund, kept: quote.total - refund, rule }
}
