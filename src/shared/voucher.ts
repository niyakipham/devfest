/**
 * Voucher engine (P3-Monetization, blueprint).
 *
 * A voucher is a claimable, partner-backed offer the player receives from a
 * quest (or a daily goal). The engine is pure:
 *   - issue: create a fresh voucher record (never free money — it is a reward)
 *   - claim: flip status to 'claimed' or 'redeemed', with idempotent semantics
 *   - payout: compute what the partner should be paid for the redemptions
 *
 * The engine deliberately does NOT debit any wallet. The ledger (`@server/services/ledger`)
 * stays the only place money moves. A voucher only moves a status.
 */
import { z } from 'zod'
import { addMinutes } from './quest-machine'

export const VoucherStatusSchema = z.enum(['issued', 'claimed', 'redeemed', 'expired'])
export type VoucherStatus = z.infer<typeof VoucherStatusSchema>

export const VoucherRecordSchema = z.object({
  id: z.string(),
  code: z.string().min(4).max(32),
  /** the partner business this voucher belongs to (e.g. "phong-bach") */
  partnerId: z.string(),
  /** discount type and value, e.g. kind:'percent', value:10 */
  discountKind: z.enum(['percent', 'fixed']),
  discountValue: z.number().int().positive(),
  /** ICT ISO timestamps — voucher is only claimable between these */
  validFrom: z.string(),
  validTo: z.string(),
  /** null when tied to a quest claim */
  questId: z.string().nullable(),
  status: VoucherStatusSchema,
  issuedAt: z.string(),
  claimedAt: z.string().nullable(),
  redeemedAt: z.string().nullable(),
})
export type VoucherRecord = z.infer<typeof VoucherRecordSchema>

/** Voucher-level constants — the anti-abuse rule from the blueprint. */
export const VOUCHER_MIN_DAYS = 1 // fresh vouchers are valid at least this long
export const VOUCHER_MAX_DAYS = 365
export const VOUCHER_DAILY_CAP_FREE = 3 // per-user daily claims (quest-engine claimBudget)
export const VOUCHER_DAILY_CAP_PRO = 6

export interface IssueInput {
  id: string
  partnerId: string
  code: string
  discountKind: 'percent' | 'fixed'
  discountValue: number
  /** how many days the voucher is valid */
  validityDays?: number
  /** quest that granted it (null for daily-issued vouchers) */
  questId?: string | null
  /** ICT ISO timestamp of issue (defaults to now) */
  nowICT?: string
}

export const issueVoucher = (input: IssueInput): VoucherRecord => {
  const nowICT = input.nowICT ?? new Date().toISOString()
  const validityDays = Math.min(VOUCHER_MAX_DAYS, Math.max(VOUCHER_MIN_DAYS, input.validityDays ?? 14))
  return {
    id: input.id,
    code: input.code.toUpperCase(),
    partnerId: input.partnerId,
    discountKind: input.discountKind,
    discountValue: input.discountValue,
    validFrom: nowICT,
    validTo: addMinutes(nowICT, validityDays * 24 * 60),
    questId: input.questId ?? null,
    status: 'issued',
    issuedAt: nowICT,
    claimedAt: null,
    redeemedAt: null,
  }
}

/**
 * Claim a voucher. Idempotent: claiming an already-claimed voucher is a
 * no-op that returns the same record and `replayed: true`.
 * Expired vouchers cannot be claimed.
 */
export interface ClaimResult {
  voucher: VoucherRecord
  replayed: boolean
  /** why the claim did not proceed */
  reason: 'ok' | 'already-claimed' | 'expired' | 'already-redeemed'
}

export const claimVoucher = (
  voucher: VoucherRecord,
  nowICT: string,
): ClaimResult => {
  if (voucher.status === 'redeemed') {
    return { voucher, replayed: true, reason: 'already-redeemed' }
  }
  if (voucher.status === 'claimed') {
    // replay of the same claim — idempotent
    return { voucher, replayed: true, reason: 'already-claimed' }
  }
  if (nowICT > voucher.validTo) {
    return { voucher: { ...voucher, status: 'expired' }, replayed: false, reason: 'expired' }
  }
  return {
    voucher: { ...voucher, status: 'claimed', claimedAt: nowICT },
    replayed: false,
    reason: 'ok',
  }
}

/** Once the partner actually honors the voucher (a receipt in the partner view). */
export const redeemVoucher = (voucher: VoucherRecord, nowICT: string): VoucherRecord => {
  if (voucher.status !== 'claimed') {
    // never downgrade a voucher that was never claimed
    return voucher
  }
  return { ...voucher, status: 'redeemed', redeemedAt: nowICT }
}

/**
 * Partner payout for a period: sum of "redeemed" vouchers × margin.
 * Margin is expressed in basis points (10_000 = 100%). Default margin 3–8%
 * from the blueprint (3% = 300 bps).
 */
export const computePartnerPayout = (
  vouchers: readonly VoucherRecord[],
  marginBps = 500,
): { period_redeemed: number; amountGross: number; marginBps: number; netPayout: number } => {
  const redeemed = vouchers.filter((v) => v.status === 'redeemed')
  // fixed-value vouchers pay value; percent vouchers pay a fixed nominal amount
  // (the partner decides what to grant — this engine only counts)
  const amountGross = redeemed.reduce((sum, v) => {
    if (v.discountKind === 'fixed') return sum + v.discountValue
    return sum + v.discountValue * 50 // nominal 50đ equivalent per percent point
  }, 0)
  const netPayout = Math.round(amountGross * (marginBps / 10_000))
  return { period_redeemed: redeemed.length, amountGross, marginBps, netPayout }
}

/** Daily voucher claim cap per user — sourced from the same anti-abuse contract. */
export const dailyCapRemaining = (
  claimedToday: number,
  pro: boolean,
): { remaining: number; exhausted: boolean; limit: number } => {
  const limit = pro ? VOUCHER_DAILY_CAP_PRO : VOUCHER_DAILY_CAP_FREE
  const remaining = Math.max(0, limit - Math.max(0, claimedToday))
  return { remaining, exhausted: remaining === 0, limit }
}

/**
 * Voucher code generator — deterministic seed so tests are reproducible.
 * Real deployment: server-side randomness (crypto-strong).
 */
export const generateVoucherCode = (seed: string, salt = 0): string => {
  let h = 2166136261 ^ Math.max(0, salt)
  for (const ch of `${seed}|${salt}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return `HV${(h >>> 0).toString(36).toUpperCase().slice(0, 10)}`
}
