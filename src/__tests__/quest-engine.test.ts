import { describe, expect, it } from 'vitest'
import {
  claimBudget,
  canClaim,
  isQuestExpired,
  selectDailyQuests,
  scoreCandidate,
  DAILY_CLAIM_LIMIT_FREE,
  DAILY_CLAIM_LIMIT_PRO,
  type QuestCandidate,
} from '@shared/quest-engine'

const candidate = (overrides: Partial<QuestCandidate> & { key: string }): QuestCandidate => ({
  title: 'T',
  district: 'hoan-kiem',
  distanceM: 300,
  difficulty: 1,
  ...overrides,
})

describe('quest-engine — daily selection', () => {
  const pool: QuestCandidate[] = [
    candidate({ key: 'q-near-easy', distanceM: 120, difficulty: 1 }),
    candidate({ key: 'q-far-hard', distanceM: 1500, difficulty: 3 }),
    candidate({ key: 'q-mid-easy-other-district', district: 'tay-ho', distanceM: 300, difficulty: 1 }),
    candidate({ key: 'q-mid-easy-same-district', district: 'hoan-kiem', distanceM: 500, difficulty: 2 }),
  ]

  it('returns at most `limit` quests, best-scoring first', () => {
    const selected = selectDailyQuests(pool, { playerDistrict: 'hoan-kiem', limit: 2 })
    expect(selected).toHaveLength(2)
    expect(selected[0].key).toBe('q-near-easy')
  })

  it('never returns already-claimed quests', () => {
    const selected = selectDailyQuests(pool, {
      playerDistrict: 'hoan-kiem',
      claimedKeys: ['q-near-easy'],
    })
    expect(selected.map((q) => q.key)).not.toContain('q-near-easy')
  })

  it('respects the proximity radius', () => {
    const selected = selectDailyQuests(pool, { playerDistrict: 'hoan-kiem', radiusM: 200 })
    expect(selected.every((q) => q.distanceM <= 200)).toBe(true)
  })

  it('score is higher for same-district candidates', () => {
    const same = scoreCandidate(candidate({ key: 'a', district: 'hoan-kiem', distanceM: 300 }), 'hoan-kiem')
    const other = scoreCandidate(candidate({ key: 'b', district: 'tay-ho', distanceM: 100 }), 'hoan-kiem')
    expect(same).toBeGreaterThan(other)
  })
})

describe('quest-engine — claim budget', () => {
  it('free tier allows 3 claims per day, Pro allows 6', () => {
    expect(claimBudget(0, false).limit).toBe(DAILY_CLAIM_LIMIT_FREE)
    expect(claimBudget(0, true).limit).toBe(DAILY_CLAIM_LIMIT_PRO)
    expect(claimBudget(3, false).exhausted).toBe(true)
    expect(claimBudget(2, false).remaining).toBe(1)
    expect(claimBudget(6, true).exhausted).toBe(true)
  })

  it('claimedToday is clamped, never negative', () => {
    expect(claimBudget(-10, false).remaining).toBe(DAILY_CLAIM_LIMIT_FREE)
  })
})

describe('quest-engine — expiry & can-claim', () => {
  it('timed quests expire before their deadline', () => {
    expect(isQuestExpired(candidate({ key: 'q', expiresAt: '2026-11-20T10:00' }), '2026-11-20T12:00')).toBe(true)
    expect(isQuestExpired(candidate({ key: 'q', expiresAt: '2026-11-20T12:00' }), '2026-11-20T12:00')).toBe(false)
    expect(isQuestExpired(candidate({ key: 'q', expiresAt: '2026-11-25T08:00' }), '2026-11-20T12:00')).toBe(false)
  })

  it('untimed quests never expire', () => {
    expect(isQuestExpired(candidate({ key: 'q' }), '2026-11-20T12:00')).toBe(false)
  })

  it('canClaim refuses expired or over-budget claims', () => {
    const expired = candidate({ key: 'q', expiresAt: '2026-11-20T10:00' })
    expect(canClaim(expired, { claimedToday: 0, pro: false, nowICT: '2026-11-20T12:00' }).reason).toBe('expired')

    const ok = candidate({ key: 'q' })
    expect(canClaim(ok, { claimedToday: 2, pro: false, nowICT: '2026-11-20T12:00' }).allowed).toBe(true)

    const over = canClaim(ok, { claimedToday: 3, pro: false, nowICT: '2026-11-20T12:00' })
    expect(over.allowed).toBe(false)
    expect(over.reason).toBe('budget-exhausted')
  })
})
