import { describe, expect, it } from 'vitest'
import {
  REFERENCE_LEGS,
  validateScale,
  formatScaleReport,
  MAX_ALLOWED_COMPRESSION,
  type LandmarkPoint,
} from '@world/scale'
import { LANDMARKS } from '@world/data/hoanKiem'

const landmarks = LANDMARKS.map((l) => ({ id: l.id, name: l.name, x: l.x, z: l.z }))

describe('scale contract — validateScale', () => {
  it('measures every reference leg from landmark coordinates', () => {
    const report = validateScale(landmarks)
    expect(report.legs).toHaveLength(REFERENCE_LEGS.length)
    for (const leg of report.legs) {
      expect(leg.gameMetres).toBeGreaterThan(0)
      expect(leg.compressionRatio).toBeGreaterThan(0)
    }
  })

  it('keeps the Phase 1 compressed layout inside the allowed band', () => {
    const report = validateScale(landmarks)
    // The Phase 1 world intentionally compresses the city (see docs) — every
    // leg must still be within 4x for the contract to be honest.
    for (const leg of report.legs) {
      expect(leg.compressionRatio).toBeLessThanOrEqual(MAX_ALLOWED_COMPRESSION)
    }
    expect(report.ok).toBe(true)
  })

  it('flags an out-of-band pair as not ok', () => {
    const broken: LandmarkPoint[] = [
      { id: 'lm-ho-guom', name: 'Lake', x: 0, z: 0 },
      { id: 'lm-nha-tho', name: 'Church', x: 10, z: 0 }, // 10m apart vs 1200m real
    ]
    const report = validateScale(broken)
    const cathedral = report.legs.find((l) => l.from === 'lm-ho-guom' && l.to === 'lm-nha-tho')
    expect(cathedral?.withinBand).toBe(false)
    expect(report.ok).toBe(false)
  })

  it('is pure — the same landmarks always give the same report', () => {
    const a = validateScale(landmarks)
    const b = validateScale(landmarks)
    expect(a).toEqual(b)
  })
})

describe('scale contract — formatScaleReport', () => {
  it('produces a human-readable report with all legs', () => {
    const report = validateScale(landmarks)
    const text = formatScaleReport(report)
    expect(text).toContain('SCALE CONTRACT')
    expect(text).toContain('lm-ho-guom')
    expect(text).toContain('lm-long-bien')
  })
})
