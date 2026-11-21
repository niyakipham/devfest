import { describe, expect, it } from 'vitest'
import {
  addCraftXp,
  applyIncomeCap,
  clamp,
  dailyIncomeCap,
  decayNeeds,
  isTeleportSuspect,
  priceWithReputation,
  speedMultiplier,
  xpToNext,
} from '@shared/formulas'

describe('progression formulas', () => {
  it('xp curve grows monotonically and is stable at level 1', () => {
    expect(xpToNext(1)).toBe(120)
    for (let level = 1; level < 20; level += 1) {
      expect(xpToNext(level + 1)).toBeGreaterThan(xpToNext(level))
    }
  })

  it('levels up and carries the remainder', () => {
    const result = addCraftXp(1, 110, 40)
    expect(result.level).toBe(2)
    expect(result.xp).toBe(30)
    expect(result.leveledUp).toBe(true)
  })

  it('never exceeds level 20 and stops consuming xp', () => {
    const result = addCraftXp(20, 0, 999_999)
    expect(result.level).toBe(20)
    expect(result.xp).toBe(999_999)
  })
})

describe('needs', () => {
  const needs = { energy: 80, hunger: 80, mood: 80, hygiene: 80 }

  it('decays but never goes below zero', () => {
    const after = decayNeeds(needs, 10_000)
    expect(after.hunger).toBe(0)
    expect(after.mood).toBeGreaterThanOrEqual(0)
  })

  it('sleeping restores energy instead of draining it', () => {
    const after = decayNeeds(needs, 60, { sleeping: true })
    expect(after.energy).toBeGreaterThan(needs.energy)
  })

  it('rain makes mood decay faster', () => {
    const clear = decayNeeds(needs, 100)
    const rainy = decayNeeds(needs, 100, { raining: true })
    expect(rainy.mood).toBeLessThan(clear.mood)
  })

  it('low mood slows the player but never stops them', () => {
    expect(speedMultiplier({ ...needs, mood: 10 })).toBe(0.9)
    expect(speedMultiplier(needs)).toBe(1)
  })
})

describe('economy fairness', () => {
  it('reputation lowers price by at most 15%', () => {
    expect(priceWithReputation(100, 0)).toBe(100)
    expect(priceWithReputation(100, 50)).toBe(93)
    expect(priceWithReputation(100, 100)).toBe(85)
    expect(priceWithReputation(100, 999)).toBe(85)
  })

  it('income cap only discounts the overflow', () => {
    const cap = dailyIncomeCap(1)
    expect(cap).toBe(920)
    expect(applyIncomeCap(100, 0, cap)).toBe(100)
    expect(applyIncomeCap(2000, 0, cap)).toBe(Math.round(cap + (2000 - cap) * 0.2))
  })

  it('flags teleporting players', () => {
    expect(isTeleportSuspect(1, 1, false)).toBe(false)
    expect(isTeleportSuspect(500, 1, false)).toBe(true)
    expect(isTeleportSuspect(10, 1, true)).toBe(false)
    expect(isTeleportSuspect(10, 0, true)).toBe(false)
  })

  it('clamps helpers', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-5, 0, 3)).toBe(0)
  })
})
