/**
 * Quest Service (Phase 4) — server-authoritative quest lifecycle + rewards.
 *
 * Roles:
 *   - quest record (state machine): LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED / FAILED
 *   - reward table is server-side (quests.ts client keeps its own *content*
 *     and dialogue; the *reward policy* lives here, so money decisions are never
 *     client-computed)
 *   - claims grant the reward through the ledger (idempotent) and any voucher
 *     spec through the voucher service
 *
 * Anti-abuse: quest claim budget per ICT day (Free=3 / Pro=6). A claim that
 * passes the budget check is recorded; a claim that fails leaves the record
 * unchanged.
 */
import {
  emptyQuestRecord,
  revealQuest,
  startQuest,
  completeQuest,
  claimQuest,
  expireQuest,
  canClaimQuest,
  QuestMachineError,
  type QuestRecord,
} from '@shared/quest-machine'
import { claimBudget } from '@shared/quest-engine'
import { issueVoucher, generateVoucherCode, redeemVoucher, type VoucherRecord } from '@shared/voucher'
import { MemoryStore } from '../repo/memory'
import { LedgerService } from './ledger'

export interface QuestReward {
  /** dong granted on claim (0 = none) */
  dong: number
  /** XP granted (client keeps its own copy; server records the grant) */
  xp: number
  /** vouchers issued on claim (Quest rewards ONLY vouchers, never paid out cash) */
  voucher?: {
    partnerId: string
    discountKind: 'percent' | 'fixed'
    discountValue: number
    validityDays: number
  }
}

/**
 * Server-authoritative reward policy for the known quests. Content (titles,
 * dialogue) lives in the client; money and rewards live here. Mirror of the
 * blueprint's P3-VoucherEngine contract.
 */
export const QUEST_REWARDS: Record<string, QuestReward> = {
  'q-pho': { dong: 0, xp: 45 },
  'q-photo': { dong: 120, xp: 60 },
  // The voucher quest — surfaces the full journey (start → complete → claim → voucher).
  'q-pho-thap': {
    dong: 40,
    xp: 60,
    voucher: { partnerId: 'pho-thap-rua', discountKind: 'percent', discountValue: 10, validityDays: 14 },
  },
}

export interface QuestService {
  get(userId: string, questId: string): QuestRecord | undefined
  start(userId: string, questId: string, opts?: { expiresAt?: string | null }): { record: QuestRecord; replayed: boolean }
  complete(userId: string, questId: string): { record: QuestRecord; replayed: boolean }
  claim(userId: string, questId: string, opts?: { pro?: boolean; nowICT?: string }): QuestClaimResult
}

export interface QuestClaimResult {
  record: QuestRecord
  replayed: boolean
  rewards: { dong: number; xp: number; voucher?: VoucherRecord }
  /** why the claim did not proceed (machine/expiry/budget) */
  reason: 'ok' | 'budget-exhausted' | 'expired' | 'not-complete' | 'already-claimed'
}

export class QuestServiceImpl implements QuestService {
  constructor(private readonly store: MemoryStore, private readonly ledger: LedgerService) {}

  private record(userId: string, questId: string): QuestRecord | undefined {
    return this.store.quests.get(this.store.questKey(userId, questId))
  }

  private save(userId: string, record: QuestRecord): QuestRecord {
    this.store.quests.set(this.store.questKey(userId, record.questId), record)
    return record
  }

  get(userId: string, questId: string): QuestRecord | undefined {
    const record = this.record(userId, questId)
    if (!record) return undefined
    // lazy expire on read — a stale ACTIVE record in front of the user should read as FAILED
    const expired = expireQuest(record, new Date().toISOString())
    if (expired.record !== record) this.save(userId, expired.record)
    return expired.record
  }

  start(userId: string, questId: string, opts: { expiresAt?: string | null } = {}) {
    const existing = this.record(userId, questId)
    if (existing) {
      const replayed = revealQuest(existing, new Date().toISOString())
      const started = startQuest(replayed.record, new Date().toISOString())
      const saved = this.save(userId, started.record)
      return { record: saved, replayed: started.replayed }
    }
    const created = emptyQuestRecord(questId, opts.expiresAt ?? null)
    const revealed = revealQuest(created, new Date().toISOString()).record
    const started = startQuest(revealed, new Date().toISOString()).record
    return { record: this.save(userId, started), replayed: false }
  }

  complete(userId: string, questId: string) {
    const existing = this.record(userId, questId)
    if (!existing) throw new QuestMachineError('quest not found', 'NOT_COMPLETE')
    const completed = completeQuest(existing, new Date().toISOString())
    return { record: this.save(userId, completed.record), replayed: completed.replayed }
  }

  claim(userId: string, questId: string, opts: { pro?: boolean; nowICT?: string } = {}): QuestClaimResult {
    const record = this.record(userId, questId)
    if (!record) throw new QuestMachineError(`quest ${questId} not started`, 'NOT_COMPLETE')
    const now = opts.nowICT ?? new Date().toISOString()
    const ictDay = now.slice(0, 10) // YYYY-MM-DD (ICT in a deploy; ISO here)
    const budget = claimBudget(this.store.questClaimsToday.get(this.store.claimKey(userId, ictDay)) ?? 0, opts.pro ?? false)
    if (budget.exhausted) {
      return { record, replayed: false, rewards: { dong: 0, xp: 0 }, reason: 'budget-exhausted' }
    }

    const gate = canClaimQuest(record, now)
    if (!gate.allowed) {
      if (gate.reason === 'already-claimed') {
        return {
          record: gate.state,
          replayed: true,
          rewards: { dong: 0, xp: 0 },
          reason: 'already-claimed',
        }
      }
      if (gate.reason === 'expired') {
        const saved = this.save(userId, gate.state)
        return { record: saved, replayed: false, rewards: { dong: 0, xp: 0 }, reason: 'expired' }
      }
      return { record: gate.state, replayed: false, rewards: { dong: 0, xp: 0 }, reason: 'not-complete' }
    }

    const claimed = claimQuest(gate.state, now)
    const saved = this.save(userId, claimed.record)

    // Bonus reward on claim — dong via ledger, voucher via store, both idempotent.
    const reward = QUEST_REWARDS[questId]
    let issuedVoucher: VoucherRecord | undefined
    if (reward?.dong) {
      this.ledger.grant(userId, reward.dong, `quest:${questId}`, `quest:${userId}:${questId}:claim`)
    }
    if (reward?.voucher) {
      const voucherId = `vou-${questId}-${userId}-${Date.now().toString(36).slice(-6)}`
      issuedVoucher = issueVoucher({
        id: voucherId,
        partnerId: reward.voucher.partnerId,
        code: generateVoucherCode(`${questId}|${userId}`),
        discountKind: reward.voucher.discountKind,
        discountValue: reward.voucher.discountValue,
        validityDays: reward.voucher.validityDays,
        questId,
        nowICT: now,
      })
      this.store.vouchers.set(this.store.voucherKey(userId, issuedVoucher.id), issuedVoucher)
    }

    const counterKey = this.store.claimKey(userId, ictDay)
    this.store.questClaimsToday.set(counterKey, (this.store.questClaimsToday.get(counterKey) ?? 0) + 1)

    return {
      record: saved,
      replayed: claimed.replayed,
      rewards: { dong: reward?.dong ?? 0, xp: reward?.xp ?? 0, voucher: issuedVoucher },
      reason: 'ok',
    }
  }
}

export const redeemQuestVoucher = (
  store: MemoryStore,
  userId: string,
  voucherId: string,
  nowICT: string,
): { voucher: VoucherRecord; redeemed: boolean } | null => {
  const key = store.voucherKey(userId, voucherId)
  const existing = store.vouchers.get(key)
  if (!existing) return null
  const redeemed = redeemVoucher(existing, nowICT)
  store.vouchers.set(key, redeemed)
  return { voucher: redeemed, redeemed: redeemed.status === 'redeemed' }
}
