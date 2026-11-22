import { describe, expect, it } from 'vitest'
import {
  issueVoucher,
  claimVoucher,
  redeemVoucher,
  computePartnerPayout,
  dailyCapRemaining,
  generateVoucherCode,
} from '@shared/voucher'

const base = {
  id: 'vou-test-1',
  partnerId: 'pho-thap-rua',
  code: 'abc123',
  discountKind: 'percent' as const,
  discountValue: 10,
  validityDays: 14,
  questId: 'q-pho-thap',
}

describe('voucher — issue', () => {
  it('clamps validity to at least 1 day', () => {
    const v = issueVoucher({ ...base, validityDays: 0 })
    expect(v.validTo > v.validFrom).toBe(true)
  })

  it('uppercases the code', () => {
    expect(issueVoucher({ ...base, code: 'lowercase' }).code).toBe('LOWERCASE')
  })

  it('clamps validity to max 365 days', () => {
    const v = issueVoucher({ ...base, validityDays: 9999 })
    expect(v.validTo).toBeDefined()
  })
})

describe('voucher — claim', () => {
  it('issued → claimed on first claim', () => {
    const v = issueVoucher({ ...base, nowICT: '2026-11-22T08:00:00.000Z' })
    const result = claimVoucher(v, '2026-11-22T09:00:00.000Z')
    expect(result.reason).toBe('ok')
    expect(result.replayed).toBe(false)
    expect(result.voucher.status).toBe('claimed')
    expect(result.voucher.claimedAt).toBe('2026-11-22T09:00:00.000Z')
  })

  it('already-claimed replay is idempotent', () => {
    const v = issueVoucher({ ...base, nowICT: '2026-11-22T08:00:00.000Z' })
    const once = claimVoucher(v, '2026-11-22T09:00:00.000Z').voucher
    const again = claimVoucher(once, '2026-11-22T10:00:00.000Z')
    expect(again.replayed).toBe(true)
    expect(again.reason).toBe('already-claimed')
    expect(again.voucher.claimedAt).toBe('2026-11-22T09:00:00.000Z') // unchanged
  })

  it('expired vouchers cannot be claimed', () => {
    const v = issueVoucher({ ...base, validityDays: 1, nowICT: '2026-11-20T08:00:00.000Z' })
    const result = claimVoucher(v, '2026-11-23T08:00:00.000Z')
    expect(result.reason).toBe('expired')
    expect(result.voucher.status).toBe('expired')
  })
})

describe('voucher — redeem', () => {
  it('claimed → redeemed', () => {
    const v = issueVoucher({ ...base, nowICT: '2026-11-22T08:00:00.000Z' })
    const claimed = claimVoucher(v, '2026-11-22T09:00:00.000Z').voucher
    const redeemed = redeemVoucher(claimed, '2026-11-22T10:00:00.000Z')
    expect(redeemed.status).toBe('redeemed')
    expect(redeemed.redeemedAt).toBe('2026-11-22T10:00:00.000Z')
  })

  it('never downgrades a never-claimed voucher', () => {
    const v = issueVoucher({ ...base, nowICT: '2026-11-22T08:00:00.000Z' })
    const redeemed = redeemVoucher(v, '2026-11-22T09:00:00.000Z')
    expect(redeemed.status).toBe('issued')
  })
})

describe('voucher — payout', () => {
  it('computes net payout from redeemed vouchers', () => {
    const now = '2026-11-22T08:00:00.000Z'
    const v1 = claimVoucher(issueVoucher({ ...base, id: 'a', code: 'AAAA', nowICT: now }), now).voucher
    const v2 = claimVoucher(issueVoucher({ ...base, id: 'b', code: 'BBBB', discountKind: 'fixed', discountValue: 50, nowICT: now }), now).voucher
    const v3 = claimVoucher(issueVoucher({ ...base, id: 'c', code: 'CCCC', discountKind: 'percent', discountValue: 20, nowICT: now }), now).voucher
    const vouchers = [redeemVoucher(v1, now), redeemVoucher(v2, now), redeemVoucher(v3, now)]
    const result = computePartnerPayout(vouchers, 500)
    expect(result.period_redeemed).toBe(3)
    expect(result.netPayout).toBeGreaterThan(0)
  })
})

describe('voucher — daily cap + code gen', () => {
  it('free tier: 3 per day, Pro: 6', () => {
    expect(dailyCapRemaining(0, false).remaining).toBe(3)
    expect(dailyCapRemaining(3, false).exhausted).toBe(true)
    expect(dailyCapRemaining(3, true).exhausted).toBe(false)
  })

  it('generates deterministic code candidates', () => {
    expect(generateVoucherCode('seed', 1)).toBe(generateVoucherCode('seed', 1))
    expect(generateVoucherCode('a', 0)).not.toBe(generateVoucherCode('b', 0))
  })
})
