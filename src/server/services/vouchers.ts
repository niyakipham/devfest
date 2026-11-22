/**
 * Voucher Service (Phase 4) — claims for quest-issued vouchers.
 *
 * Voucher claim is idempotent and throttled by the same per-ICT-day budget the
 * quests use (Free=3 / Pro=6). The engine that decides "may this claim proceed"
 * lives in `@shared/voucher` — the service is a thin storage+budget wrapper.
 */
import { claimVoucher as claimVoucherLogic } from '@shared/voucher'
import type { VoucherRecord } from '@shared/voucher'
import { claimBudget } from '@shared/quest-engine'
import { MemoryStore } from '../repo/memory'

export interface VoucherClaimOutcome {
  voucher: VoucherRecord
  replayed: boolean
  reason: 'ok' | 'already-claimed' | 'already-redeemed' | 'expired' | 'budget-exhausted'
}

export class VoucherService {
  constructor(private readonly store: MemoryStore) {}

  list(userId: string): VoucherRecord[] {
    const out: VoucherRecord[] = []
    const prefix = `${userId}:`
    for (const [key, v] of this.store.vouchers) {
      if (key.startsWith(prefix)) out.push(v)
    }
    // newest first — refresh after issue
    return out.sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))
  }

  claim(userId: string, voucherId: string, opts: { pro?: boolean; nowICT?: string } = {}): VoucherClaimOutcome | null {
    const key = this.store.voucherKey(userId, voucherId)
    const existing = this.store.vouchers.get(key)
    if (!existing) return null
    const now = opts.nowICT ?? new Date().toISOString()

    // idempotent already-claimed — voucher is already yours, no budget is consumed
    if (existing.status === 'claimed') {
      return { voucher: existing, replayed: true, reason: 'already-claimed' }
    }
    if (existing.status === 'redeemed') {
      return { voucher: existing, replayed: true, reason: 'already-redeemed' }
    }
    if (now > existing.validTo) {
      const expired = { ...existing, status: 'expired' as const }
      this.store.vouchers.set(key, expired)
      return { voucher: expired, replayed: false, reason: 'expired' }
    }

    const ictDay = now.slice(0, 10)
    const budget = claimBudget(this.store.questClaimsToday.get(this.store.claimKey(userId, ictDay)) ?? 0, opts.pro ?? false)
    if (budget.exhausted) {
      return { voucher: existing, replayed: false, reason: 'budget-exhausted' }
    }

    const result = claimVoucherLogic(existing, now)
    if (result.reason !== 'ok') {
      return { voucher: result.voucher, replayed: false, reason: result.reason === 'expired' ? 'expired' : 'already-claimed' }
    }
    this.store.vouchers.set(key, result.voucher)
    const counterKey = this.store.claimKey(userId, ictDay)
    this.store.questClaimsToday.set(counterKey, (this.store.questClaimsToday.get(counterKey) ?? 0) + 1)
    return { voucher: result.voucher, replayed: result.replayed, reason: 'ok' }
  }
}
