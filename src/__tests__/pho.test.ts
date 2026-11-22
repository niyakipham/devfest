/**
 * Nghề phở — the first repeatable profession (RP-04).
 *
 * The economy rules these tests defend:
 *  - quality is a deterministic function of timing; no randomness, no gacha
 *  - a perfect bowl pays roughly 2.4× a ruined one, so skill matters
 *  - even a ruined bowl pays something: cozy games never zero a day's work
 *  - a fresh L1 player can level up within one in-game day (the Phase 1 blocker:
 *    105 XP of content vs 120 XP needed)
 */
import { describe, expect, it } from 'vitest'
import {
  GARNISH_ORDER,
  PHO_BASE_PAYOUT,
  PHO_STAGES,
  RUINED_FLOOR,
  bowlMargin,
  bowlsPerDay,
  brewBowl,
  gradeGarnish,
  gradeStop,
  ingredientCost,
  minutesPerBowl,
  needleStart,
  timingWindow,
} from '@rp/craft/pho'
import { addCraftXp, dailyIncomeCap, xpToNext } from '@shared/formulas'

const PERFECT = [0, 0, 0] as const
const RUINED = [99_000, 99_000, 99_000] as const

describe('timing windows', () => {
  it('shrinks gently with level instead of punishing investment', () => {
    const l1 = timingWindow('broth', 1)
    const l20 = timingWindow('broth', 20)
    expect(l20.good).toBeLessThan(l1.good)
    // never more than ~25% tighter across the whole progression
    expect(l20.good / l1.good).toBeGreaterThan(0.75)
    expect(l20.perfect).toBeGreaterThan(0)
  })

  it('keeps the perfect band a constant share of the good band', () => {
    for (const level of [1, 5, 12, 20]) {
      const w = timingWindow('noodle', level)
      expect(w.perfect / w.good).toBeCloseTo(0.34, 2)
    }
  })

  it('grades inside the perfect band as full marks', () => {
    const w = timingWindow('broth', 1)
    expect(gradeStop('broth', w.perfect - 1, 1)).toBe(1)
    expect(gradeStop('broth', -w.perfect + 1, 1)).toBe(1)
  })

  it('falls off smoothly and reaches zero past the good band', () => {
    const w = timingWindow('broth', 1)
    const mid = gradeStop('broth', (w.perfect + w.good) / 2, 1)
    expect(mid).toBeGreaterThan(0.5)
    expect(mid).toBeLessThan(1)
    expect(gradeStop('broth', w.good + 1, 1)).toBe(0)
  })

  it('never produces a negative or >1 score', () => {
    for (const offset of [-99_999, 0, 500, 5_000, 99_999]) {
      const score = gradeStop('garnish', offset, 3)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    }
  })

  it('gives each stage a distinct start position so bowls feel different', () => {
    const starts = PHO_STAGES.map((s) => needleStart(s, 7))
    expect(new Set(starts.map((v) => v.toFixed(3))).size).toBe(PHO_STAGES.length)
    for (const v of starts) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('garnish order', () => {
  it('rewards the canonical order', () => {
    expect(gradeGarnish(GARNISH_ORDER)).toBe(1)
  })

  it('penalises each misplaced item but never to zero', () => {
    const swapped = ['beef', 'herbs', 'broth'] as const
    const score = gradeGarnish(swapped)
    expect(score).toBeLessThan(1)
    expect(score).toBeGreaterThan(0)
  })

  it('returns 0 for an incomplete bowl', () => {
    expect(gradeGarnish(['herbs'])).toBe(0)
    expect(gradeGarnish([])).toBe(0)
  })
})

describe('brewing a bowl', () => {
  it('is deterministic — same inputs, same bowl', () => {
    const input = { craftLevel: 3, offsets: [40, 10, 25] as const, garnish: GARNISH_ORDER }
    expect(brewBowl(input)).toEqual(brewBowl(input))
  })

  it('pays a perfect bowl more than any other outcome', () => {
    const perfect = brewBowl({ craftLevel: 5, offsets: PERFECT, garnish: GARNISH_ORDER })
    const good = brewBowl({ craftLevel: 5, offsets: [300, 200, 200], garnish: GARNISH_ORDER })
    const ruined = brewBowl({ craftLevel: 5, offsets: RUINED, garnish: GARNISH_ORDER })

    expect(perfect.perfect).toBe(true)
    expect(perfect.payout).toBeGreaterThan(good.payout)
    expect(good.payout).toBeGreaterThan(ruined.payout)
  })

  it('pays something even for a ruined bowl', () => {
    const ruined = brewBowl({ craftLevel: 1, offsets: RUINED, garnish: [] })
    expect(ruined.quality).toBeLessThan(0.15)
    expect(ruined.payout).toBeGreaterThan(0)
    expect(ruined.xp).toBeGreaterThan(0)
    expect(ruined.verdict).toContain('bị lỡ tay')
  })

  it('keeps a perfect bowl inside a sane money band', () => {
    const perfect = brewBowl({ craftLevel: 20, offsets: PERFECT, garnish: GARNISH_ORDER, equipment: 1 })
    expect(perfect.payout).toBeLessThanOrEqual(PHO_BASE_PAYOUT * 2)
    // the bowl must beat the ingredient cost, or the profession is a trap
    expect(bowlMargin(perfect.quality)).toBeGreaterThan(0)
  })

  it('equipment lifts a sloppy bowl without turning it perfect', () => {
    const sloppy = { craftLevel: 4, offsets: [500, 300, 300] as const, garnish: GARNISH_ORDER }
    const bare = brewBowl(sloppy)
    const goodPot = brewBowl({ ...sloppy, equipment: 1 })
    expect(goodPot.quality).toBeGreaterThan(bare.quality)
    expect(goodPot.perfect).toBe(false)
  })

  it('reports per-stage scores so the UI can teach the player', () => {
    const result = brewBowl({ craftLevel: 2, offsets: [0, 400, 0], garnish: GARNISH_ORDER })
    expect(result.stages).toHaveLength(3)
    expect(result.stages[0].score).toBe(1)
    expect(result.stages[1].score).toBeLessThan(1)
    expect(result.stages.map((s) => s.stage)).toEqual([...PHO_STAGES])
  })
})

describe('daily shape and progression', () => {
  it('caps bowls per day so the session has an end', () => {
    expect(bowlsPerDay(1)).toBe(6)
    expect(bowlsPerDay(20)).toBe(12)
    expect(bowlsPerDay(20)).toBeLessThanOrEqual(12)
    expect(minutesPerBowl).toBeGreaterThan(0)
  })

  it('lets a fresh player level up inside one day (the Phase 1 blocker)', () => {
    const bowls = bowlsPerDay(1)
    const perfectXp = brewBowl({ craftLevel: 1, offsets: PERFECT, garnish: GARNISH_ORDER }).xp
    // 6 bowls × 26 XP = 156 ≥ 120 needed for L1→L2
    expect(bowls * perfectXp).toBeGreaterThan(xpToNext(1))
    const after = addCraftXp(1, 0, bowls * perfectXp)
    expect(after.level).toBeGreaterThanOrEqual(2)
    expect(after.leveledUp).toBe(true)
  })

  it('keeps a perfect day under the anti-inflation cap', () => {
    const cap = dailyIncomeCap(1)
    const bowls = bowlsPerDay(1)
    const dayEarnings = brewBowl({ craftLevel: 1, offsets: PERFECT, garnish: GARNISH_ORDER }).payout * bowls
    // the cap exists to stop farming, not to punish one honest shift
    expect(dayEarnings).toBeLessThanOrEqual(cap)
  })

  it('keeps the worst bowl profitable so a bad day is never punished', () => {
    const cost = ingredientCost()
    const worst = brewBowl({ craftLevel: 1, offsets: RUINED, garnish: [] })
    expect(cost).toBe(11)
    // regression: this was 8đ against 11đ of ingredients — a net loss
    expect(worst.payout).toBeGreaterThan(cost)
    expect(RUINED_FLOOR).toBeGreaterThan(cost)
  })
})
