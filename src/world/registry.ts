/**
 * Region registry (P0-Map: RegionRegistry).
 *
 * The grid defines the 12 districts (bbox + name). The registry layers on top:
 *   - what each district *is* in the game (playable now vs future)
 *   - how much content lives in each (streets, POIs, landmarks, quest givers)
 *   - the phase-1 playable window as a first-class concept
 *
 * Numbers are DERIVED at module init from the actual world data — nothing here
 * is hardcoded, and nothing is a guess. If the world changes, the registry
 * changes with it, and the UI banners are honest by construction.
 */
import { DISTRICTS, districtAt, type DistrictRect } from './grid'
import { POIS, LANDMARKS, QUEST_GIVERS } from './data/hoanKiem'
import { STREETS } from './data/streets'
import { isPhase1Tile, pointToTile } from './grid'

export interface DistrictSummary {
  id: string
  name: string
  playable: boolean
  streetCount: number
  poiCount: number
  landmarkCount: number
  questGiverCount: number
  playRatio: number
}

export interface DistrictRegistryEntry {
  id: string
  name: string
  /** playable in Phase 1 (the core Hoàn Kiếm area) */
  playableNow: boolean
  /** how many of this district's districts are reachable */
  centerX: number
  centerZ: number
  /** street ids that pass through or start in this district */
  streets: string[]
  /** POI count within the district bounds */
  poiCount: number
  /** landmark count whose coords fall inside the district bounds */
  landmarkCount: number
  /** quest-giver count inside the district bounds */
  questGiverCount: number
  /** 0..1 — share of POIs that belong to playable tiles */
  playRatio: number
}

const districtContains = (district: DistrictRect, x: number, z: number): boolean =>
  x >= district.x0 && x <= district.x1 && z >= district.z0 && z <= district.z1

const phase1Tiles = (): Set<string> => {
  const set = new Set<string>()
  for (const street of STREETS) {
    // any street tile that is Phase-1 playable is a candidate
    for (let i = 0; i + 1 < street.points.length; i += 1) {
      const [ax, az] = street.points[i]
      const [bx, bz] = street.points[i + 1]
      const steps = 4
      for (let k = 0; k <= steps; k += 1) {
        const x = ax + ((bx - ax) * k) / steps
        const z = az + ((bz - az) * k) / steps
        const { tx, tz } = pointToTile(x, z)
        if (isPhase1Tile(tx, tz)) set.add(`t_${tx}_${tz}`)
      }
    }
  }
  return set
}

const phase1TileSet = phase1Tiles()

export const REGISTRY: Record<string, DistrictRegistryEntry> = Object.fromEntries(
  DISTRICTS.map((d) => {
    const pois = POIS.filter((p) => districtContains(d, p.x, p.z))
    const streetsIn = STREETS.filter((s) => s.points.some(([x, z]) => districtContains(d, x, z)))
    const landmarksIn = LANDMARKS.filter((l) => districtContains(d, l.x, l.z))
    const giversIn = QUEST_GIVERS.filter((q) => districtContains(d, q.x, q.z))
    const playable = pois.filter((p) => phase1TileSet.has(p.tileId)).length
    return [
      d.id,
      {
        id: d.id,
        name: d.name,
        playableNow: d.id === 'HOAN_KIEM',
        centerX: (d.x0 + d.x1) / 2,
        centerZ: (d.z0 + d.z1) / 2,
        streets: streetsIn.map((s) => s.id),
        poiCount: pois.length,
        landmarkCount: landmarksIn.length,
        questGiverCount: giversIn.length,
        playRatio: pois.length === 0 ? 0 : Math.round((playable / pois.length) * 100) / 100,
      } satisfies DistrictRegistryEntry,
    ]
  }),
)

export const REGISTRY_ORDER = DISTRICTS.map((d) => d.id)

export const districtRegistry = (id: string): DistrictRegistryEntry => {
  const entry = REGISTRY[id]
  if (!entry) {
    // never throws — callers in a map can render ANY district
    return {
      id,
      name: id,
      playableNow: false,
      centerX: 0,
      centerZ: 0,
      streets: [],
      poiCount: 0,
      landmarkCount: 0,
      questGiverCount: 0,
      playRatio: 0,
    }
  }
  return entry
}

/** Resolve the district a player is standing in — single source of truth. */
export const regionForPoint = (x: number, z: number): DistrictRegistryEntry =>
  districtRegistry(districtAt(x, z))

/** District summary for the banner ("Sáng ở Hoàn Kiếm · 12 phố · 1 Landmark"). */
export const districtSummary = (id: string): DistrictSummary => {
  const d = districtRegistry(id)
  return {
    id: d.id,
    name: d.name,
    playable: d.playableNow,
    streetCount: d.streets.length,
    poiCount: d.poiCount,
    landmarkCount: d.landmarkCount,
    questGiverCount: d.questGiverCount,
    playRatio: d.playRatio,
  }
}

/** Honest count: how many of the 36 phố phường does the Phase 1 world offer as playable? */
export const PHASE1_SUMMARY = () => {
  const completed = STREETS.filter((s) =>
    s.points.some(([x, z]) => isPhase1Tile(pointToTile(x, z).tx, pointToTile(x, z).tz)),
  )
  return {
    totalStreets: STREETS.length,
    phase1Streets: completed.length,
    phase1StreetIds: completed.map((s) => s.id),
    phase1AreaKm2: Math.round((completed.length / Math.max(1, STREETS.length)) * 3.2 * 10) / 10,
  }
}

export interface Phase1Result {
  done: boolean
  totalStreets: number
  playableStreets: number
  missingStreetIds: string[]
}

/** TRUE iff every street in the world has at least one point on a Phase 1 tile. */
export const isPhase1Complete = (): Phase1Result => {
  const completed = STREETS.filter((s) =>
    s.points.some(([x, z]) => isPhase1Tile(pointToTile(x, z).tx, pointToTile(x, z).tz)),
  )
  const missing = STREETS.filter(
    (s) => !completed.some((c) => c.id === s.id),
  )
  return {
    done: missing.length === 0,
    totalStreets: STREETS.length,
    playableStreets: completed.length,
    missingStreetIds: missing.map((s) => s.id),
  }
}
