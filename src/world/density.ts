/**
 * Anti-failure gate F1: "20 km² but empty".
 * CI fails when a road tile has too few interactables or when any point of a
 * street has no POI within MAX_GAP metres.
 */
import { pointAlong, polylineLength } from './data/hoanKiem'
import type { Poi, Street } from './types'

export const DENSITY_RULES = {
  minPerRoadTile: 4,
  maxGapMeters: 150,
  sampleStepMeters: 50,
} as const

export interface TileViolation {
  tileId: string
  count: number
  required: number
}

export interface GapViolation {
  streetId: string
  streetName: string
  distance: number
  x: number
  z: number
  nearest: number
}

export interface DensityReport {
  ok: boolean
  totalPois: number
  roadTiles: number
  tileViolations: TileViolation[]
  gapViolations: GapViolation[]
  medianGap: number
  maxGap: number
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const nearestDistance = (pois: Poi[], x: number, z: number): number => {
  let best = Number.POSITIVE_INFINITY
  for (const poi of pois) {
    const d = Math.hypot(poi.x - x, poi.z - z)
    if (d < best) best = d
  }
  return best
}

export const validateDensity = (
  pois: Poi[],
  streets: Street[],
  roadTileIds: string[],
  rules = DENSITY_RULES,
): DensityReport => {
  const counts = new Map<string, number>()
  for (const poi of pois) counts.set(poi.tileId, (counts.get(poi.tileId) ?? 0) + 1)

  const tileViolations: TileViolation[] = []
  for (const tileId of roadTileIds) {
    const count = counts.get(tileId) ?? 0
    if (count < rules.minPerRoadTile) {
      tileViolations.push({ tileId, count, required: rules.minPerRoadTile })
    }
  }

  const gapViolations: GapViolation[] = []
  const gaps: number[] = []
  for (const street of streets) {
    const length = polylineLength(street.points)
    for (let d = 0; d <= length; d += rules.sampleStepMeters) {
      const p = pointAlong(street, d)
      const gap = nearestDistance(pois, p.x, p.z)
      gaps.push(gap)
      if (gap > rules.maxGapMeters) {
        gapViolations.push({
          streetId: street.id,
          streetName: street.name,
          distance: Math.round(d),
          x: Math.round(p.x),
          z: Math.round(p.z),
          nearest: Math.round(gap),
        })
      }
    }
  }

  return {
    ok: tileViolations.length === 0 && gapViolations.length === 0,
    totalPois: pois.length,
    roadTiles: roadTileIds.length,
    tileViolations,
    gapViolations,
    medianGap: Math.round(median(gaps)),
    maxGap: Math.round(gaps.reduce((m, v) => Math.max(m, v), 0)),
  }
}

/** Tiles in the Phase 1 region that actually carry a street (parks/water exempt). */
export const roadTilesFromStreets = (
  streets: Street[],
  isPlayable: (tx: number, tz: number) => boolean,
  tileSize: number,
): string[] => {
  const ids = new Set<string>()
  for (const street of streets) {
    const length = polylineLength(street.points)
    for (let d = 0; d <= length; d += 25) {
      const p = pointAlong(street, d)
      const tx = Math.floor(p.x / tileSize)
      const tz = Math.floor(p.z / tileSize)
      if (isPlayable(tx, tz)) ids.add(`t_${tx}_${tz}`)
    }
  }
  return [...ids].sort()
}
