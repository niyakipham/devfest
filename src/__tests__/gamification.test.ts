import { describe, expect, it } from 'vitest'
import {
  EMPTY_REPUTATION,
  FACTIONS,
  MAX_PIECES,
  addFactionDelta,
  buildLeaderboardSnapshot,
  clampFaction,
  pieceForStreet,
  reputationSum,
  topFaction,
} from '@shared/gamification'

describe('gamification — faction reputation', () => {
  it('five factions, all starting at 0', () => {
    expect(FACTIONS).toHaveLength(5)
    expect(EMPTY_REPUTATION.resident).toBe(0)
  })

  it('clamps to [-100, 100]', () => {
    expect(clampFaction(250)).toBe(100)
    expect(clampFaction(-250)).toBe(-100)
    expect(clampFaction(7)).toBe(7)
  })

  it('addFactionDelta mutates only the one faction', () => {
    const standing = addFactionDelta(addFactionDelta(EMPTY_REPUTATION, 'merchant', 5), 'merchant', 3)
    expect(standing.merchant).toBe(8)
    expect(standing.craftsman).toBe(0)
  })

  it('reputationSum sums the factions', () => {
    expect(reputationSum({ resident: 10, merchant: 20, craftsman: -5, youth: 0, heritage: 30 })).toBe(55)
  })

  it('topFaction picks the max standing (first on tie)', () => {
    expect(topFaction({ resident: 50, merchant: 20, craftsman: 0, youth: 99, heritage: 0 })).toBe('youth')
    expect(topFaction(EMPTY_REPUTATION)).toBe('resident')
  })
})

describe('gamification — pieces', () => {
  it('one piece per street, stable ids', () => {
    expect(pieceForStreet('dinh-tien-hoang')).toBe('piece-dinh-tien-hoang')
    expect(pieceForStreet(undefined)).toBeNull()
    expect(pieceForStreet('')).toBeNull()
  })

  it('36 pieces max', () => {
    expect(MAX_PIECES).toBe(36)
  })
})

describe('gamification — leaderboard snapshot', () => {
  it('sorts by score desc and assigns ranks', () => {
    const rows = buildLeaderboardSnapshot([
      { userId: 'b', displayName: 'B', score: 12 },
      { userId: 'a', displayName: 'A', score: 40 },
      { userId: 'c', displayName: 'C', score: 25 },
    ])
    expect(rows.map((r) => r.userId)).toEqual(['a', 'c', 'b'])
    expect(rows[0].rank).toBe(1)
    expect(rows[2].rank).toBe(3)
  })

  it('breaks score ties by userId for a stable order', () => {
    const rows = buildLeaderboardSnapshot([
      { userId: 'zeta', displayName: 'Z', score: 40 },
      { userId: 'alpha', displayName: 'A', score: 40 },
    ])
    expect(rows.map((r) => r.userId)).toEqual(['alpha', 'zeta'])
  })

  it('caps the snapshot at the limit', () => {
    const rows = buildLeaderboardSnapshot(
      Array.from({ length: 60 }, (_, i) => ({ userId: `u${i}`, displayName: `U${i}`, score: 100 - i })),
      10,
    )
    expect(rows).toHaveLength(10)
  })
})
