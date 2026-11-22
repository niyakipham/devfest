import { describe, expect, it } from 'vitest'
import {
  REGISTRY,
  REGISTRY_ORDER,
  districtRegistry,
  districtSummary,
  isPhase1Complete,
  PHASE1_SUMMARY,
  regionForPoint,
} from '@world/registry'
import { STREETS } from '@world/data/streets'

describe('registry — district coverage', () => {
  it('every district has an entry with consistent counts', () => {
    for (const id of REGISTRY_ORDER) {
      const e = REGISTRY[id]
      expect(e).toBeDefined()
      expect(e.id).toBe(id)
      expect(e.poiCount).toBeGreaterThanOrEqual(0)
      expect(e.questGiverCount).toBeGreaterThanOrEqual(0)
      expect(e.playRatio).toBeGreaterThanOrEqual(0)
      expect(e.playRatio).toBeLessThanOrEqual(1)
    }
  })

  it('Hoàn Kiếm is the only Phase 1 playable district', () => {
    expect(districtRegistry('HOAN_KIEM').playableNow).toBe(true)
    const others = REGISTRY_ORDER.filter((id) => id !== 'HOAN_KIEM')
    for (const id of others) {
      expect(districtRegistry(id).playableNow).toBe(false)
    }
  })

  it('districtSummary includes every field used by the banner', () => {
    const s = districtSummary('HOAN_KIEM')
    expect(s.id).toBe('HOAN_KIEM')
    expect(s.playable).toBe(true)
    expect(s.streetCount).toBeGreaterThan(0)
    expect(s.poiCount).toBeGreaterThan(0)
  })

  it('unknown districts never throw — they return an honest empty entry', () => {
    const d = districtRegistry('NOT_A_DISTRICT')
    expect(d.playableNow).toBe(false)
    expect(d.streets).toEqual([])
    expect(d.poiCount).toBe(0)
  })
})

describe('registry — regionForPoint', () => {
  it('resolves the lake-side point to Hoàn Kiếm', () => {
    const entry = regionForPoint(2288, 1600)
    expect(entry.id).toBe('HOAN_KIEM')
    expect(entry.playableNow).toBe(true)
  })
})

describe('registry — phase-1 completion report', () => {
  it('computes the completion state from street geometry', () => {
    const result = isPhase1Complete()
    expect(result.totalStreets).toBe(STREETS.length)
    expect(result.playableStreets).toBeGreaterThanOrEqual(0)
    expect(result.missingStreetIds.length).toBe(result.totalStreets - result.playableStreets)
  })

  it('PHASE1_SUMMARY mirrors the completion report', () => {
    const summary = PHASE1_SUMMARY()
    const result = isPhase1Complete()
    expect(summary.totalStreets).toBe(result.totalStreets)
    expect(summary.phase1Streets).toBe(result.playableStreets)
  })
})
