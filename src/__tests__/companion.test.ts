import { describe, expect, it } from 'vitest'
import {
  COMPANION_SPECIES,
  COMPANION_CARE_FLOOR,
  MAX_COMPANION_LEVEL,
  applyDailyDecay,
  careCompanion,
  companionXpToNext,
  decayCare,
  deriveCompanion,
  needsCare,
  newCompanion,
  type CompanionState,
} from '@shared/companion'

describe('companion engine — species & leveling', () => {
  it('defines exactly four species, one per neighborhood story', () => {
    expect(COMPANION_SPECIES).toHaveLength(4)
    const codes = COMPANION_SPECIES.map((s) => s.code)
    expect(codes).toEqual(['ho-guom-crane', 'ho-tay-bird', 'pho-co-cat', 'bat-trang-potter'])
  })

  it('companion xp curve matches craft-level-inspired scaling', () => {
    expect(companionXpToNext(1)).toBe(60) // base, level 1
    expect(companionXpToNext(20)).toBeGreaterThan(companionXpToNext(19))
  })

  it('never drops care below the cozy floor', () => {
    expect(decayCare({ hunger: COMPANION_CARE_FLOOR, mood: 40, energy: 40 }, 100).hunger).toBe(COMPANION_CARE_FLOOR)
    expect(decayCare({ hunger: 40, mood: 40, energy: 40 }, 100).mood).toBe(COMPANION_CARE_FLOOR)
  })
})

describe('companion engine — care actions', () => {
  it('feed on the same day is a no-op (idempotent)', () => {
    const s = newCompanion('pho-co-cat')
    const first = careCompanion(s, 'feed', '2026-11-22')
    expect(first.state.totalCare).toBe(1)
    expect(first.state.care.hunger).toBeGreaterThan(s.care.hunger)

    const second = careCompanion(first.state, 'groom', '2026-11-22')
    expect(second.leveledUp).toBe(false)
    expect(second.xpGained).toBe(0)
    expect(second.state.totalCare).toBe(1) // not doubled
  })

  it('groom raises mood and energy', () => {
    const s = newCompanion('bat-trang-potter')
    const result = careCompanion(s, 'groom', '2026-11-22')
    expect(result.state.care.mood).toBeGreaterThan(s.care.mood)
    expect(result.state.care.energy).toBeGreaterThan(s.care.energy)
  })

  it('walk restores energy', () => {
    const s = newCompanion('ho-tay-bird')
    const result = careCompanion(s, 'walk', '2026-11-22')
    expect(result.state.care.energy).toBeGreaterThan(s.care.energy)
  })

  it('level-up eventually happens and is capped', () => {
    let s: CompanionState = newCompanion('ho-guom-crane')
    let d = new Date('2026-10-01T00:00:00Z')
    for (let i = 0; i < 40; i += 1) {
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      s = careCompanion(s, 'walk', iso).state
      d = new Date(d.getTime() + 86_400_000)
    }
    expect(s.level).toBeGreaterThan(1)
    expect(s.level).toBeLessThanOrEqual(MAX_COMPANION_LEVEL)
  })

  it('applyDailyDecay never moves values below the floor', () => {
    let s = newCompanion('pho-co-cat')
    s = applyDailyDecay(applyDailyDecay(s, 30), 30) // 60 days uncared for
    expect(s.care.hunger).toBeGreaterThanOrEqual(COMPANION_CARE_FLOOR)
    expect(s.care.mood).toBeGreaterThanOrEqual(COMPANION_CARE_FLOOR)
    expect(s.care.energy).toBeGreaterThanOrEqual(COMPANION_CARE_FLOOR)
  })
})

describe('companion engine — status & emotion', () => {
  it('resting below 30 energy, work above 60 mood + 55 energy, else play', () => {
    expect(deriveCompanion({ hunger: 60, mood: 50, energy: 20 }).status).toBe('resting')
    expect(deriveCompanion({ hunger: 60, mood: 61, energy: 60 }).status).toBe('work')
    expect(deriveCompanion({ hunger: 60, mood: 50, energy: 50 }).status).toBe('play')
  })

  it('emotion follows mood bands', () => {
    expect(deriveCompanion({ hunger: 60, mood: 75, energy: 60 }).emotion).toBe('happy')
    expect(deriveCompanion({ hunger: 60, mood: 50, energy: 60 }).emotion).toBe('calm')
    expect(deriveCompanion({ hunger: 60, mood: 30, energy: 60 }).emotion).toBe('sad')
  })

  it('needsCare is true when tired or sad', () => {
    expect(needsCare({ hunger: 60, mood: 30, energy: 60 })).toBe(true)
    expect(needsCare({ hunger: 60, mood: 60, energy: 20 })).toBe(true)
    expect(needsCare({ hunger: 60, mood: 60, energy: 60 })).toBe(false)
  })
})
