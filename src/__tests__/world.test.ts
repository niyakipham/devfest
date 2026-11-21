import { describe, expect, it } from 'vitest'
import {
  COLS,
  ROWS,
  TILE_COUNT,
  WORLD_DEPTH,
  WORLD_WIDTH,
  districtAt,
  isPhase1Tile,
  neighbourhood,
  pointToTile,
  tileAt,
  tileCenter,
  tileId,
} from '@world/grid'
import { POIS, TILE_POI_COUNT, isInLake, nearestPoi } from '@world/data/hoanKiem'
import { STREETS } from '@world/data/streets'
import { roadTilesFromStreets, validateDensity } from '@world/density'
import { TileStreamer } from '@world/streamer'
import { isPathWalkable, isWalkable } from '@world/collision'
import { SPAWN } from '@world/data/hoanKiem'

describe('world grid', () => {
  it('is exactly 20 km² with 320 tiles', () => {
    expect(WORLD_WIDTH * WORLD_DEPTH).toBe(20_000_000)
    expect(COLS * ROWS).toBe(320)
    expect(TILE_COUNT).toBe(320)
  })

  it('maps points to tiles and back', () => {
    const tile = pointToTile(2400, 1600)
    expect(tileAt(2400, 1600)).toBe(tileId(tile.tx, tile.tz))
    const centre = tileCenter(tile.tx, tile.tz)
    expect(pointToTile(centre.x, centre.z)).toEqual(tile)
  })

  it('clamps out-of-bounds points instead of producing NaN tiles', () => {
    expect(pointToTile(-50, -50)).toEqual({ tx: 0, tz: 0 })
    expect(pointToTile(99_999, 99_999)).toEqual({ tx: COLS - 1, tz: ROWS - 1 })
  })

  it('returns 9 tiles for a radius-1 neighbourhood', () => {
    expect(neighbourhood(10, 10, 1)).toHaveLength(9)
    expect(neighbourhood(0, 0, 1)).toHaveLength(4)
  })

  it('always resolves a district', () => {
    expect(districtAt(2400, 1600)).toBe('HOAN_KIEM')
    expect(districtAt(10, 10)).toMatch(/^[A-Z_]+$/)
  })

  it('knows the phase 1 playable region', () => {
    expect(isPhase1Tile(9, 6)).toBe(true)
    expect(isPhase1Tile(0, 0)).toBe(false)
  })
})

describe('lake', () => {
  it('contains the tower island and not the spawn point', () => {
    expect(isInLake(2430, 1700)).toBe(true)
    expect(isInLake(2460, 2010)).toBe(false)
  })
})

describe('POI density gate (anti-failure F1)', () => {
  const roadTiles = roadTilesFromStreets(STREETS, isPhase1Tile, 250)

  it('has a healthy number of POIs', () => {
    expect(POIS.length).toBeGreaterThan(150)
  })

  it('never has two POIs with the same id', () => {
    const ids = new Set(POIS.map((p) => p.id))
    expect(ids.size).toBe(POIS.length)
  })

  it('passes tile and gap rules', () => {
    const report = validateDensity(POIS, STREETS, roadTiles)
    expect(report.tileViolations).toEqual([])
    expect(report.gapViolations).toEqual([])
    expect(report.ok).toBe(true)
    expect(report.medianGap).toBeLessThan(60)
  })

  it('every road tile also counts at least 4 POIs from the aggregate index', () => {
    for (const tile of roadTiles) {
      expect(TILE_POI_COUNT[tile] ?? 0).toBeGreaterThanOrEqual(4)
    }
  })

  it('fails loudly when POIs are removed', () => {
    const report = validateDensity(POIS.slice(0, 3), STREETS, roadTiles)
    expect(report.ok).toBe(false)
    expect(report.tileViolations.length).toBeGreaterThan(0)
    expect(report.gapViolations.length).toBeGreaterThan(0)
  })

  it('finds the nearest POI within interaction range', () => {
    const coHoa = POIS.find((p) => p.id === 'npc-co-hoa')!
    const poi = nearestPoi(coHoa.x, coHoa.z, 6)
    expect(poi?.id).toBe('npc-co-hoa')
    expect(nearestPoi(0, 0, 5)).toBeNull()
  })
})

describe('tile streamer', () => {
  it('loads the ring around the player and respects the budget', () => {
    const streamer = new TileStreamer({ radius: 2, unloadRadius: 3, budgetPerTick: 100 })
    streamer.update(2400, 1600)
    expect(streamer.loadedCount).toBe(25)
    expect(streamer.currentTile).toBe(tileAt(2400, 1600))
  })

  it('does not exceed the per-tick budget', () => {
    const streamer = new TileStreamer({ radius: 2, budgetPerTick: 4 })
    const first = streamer.update(2400, 1600)
    expect(first.loaded).toBe(4)
    streamer.flush(2400, 1600)
    expect(streamer.loadedCount).toBe(25)
  })

  it('unloads far tiles when the player moves away', () => {
    const streamer = new TileStreamer({ radius: 2, unloadRadius: 3, budgetPerTick: 50 })
    streamer.flush(2400, 1600)
    streamer.flush(3400, 2500)
    // hysteresis keeps a thin ring, but the old centre must be gone
    expect(streamer.tileState(tileId(9, 6))).toBeNull()
    expect(streamer.loadedCount).toBeLessThanOrEqual(49)
  })

  it('emits load events exactly once per tile', () => {
    const streamer = new TileStreamer({ radius: 1, budgetPerTick: 100 })
    const loaded: string[] = []
    streamer.subscribe({ onLoad: (t) => loaded.push(t.id) })
    streamer.update(2400, 1600)
    streamer.update(2400, 1600)
    expect(loaded).toHaveLength(new Set(loaded).size)
  })
})


describe('walkability (tutorial route must never be blocked)', () => {
  it('spawns on a walkable tile', () => {
    expect(isWalkable(SPAWN.x, SPAWN.z)).toBe(true)
  })

  it('treats the lake and buildings as solid', () => {
    expect(isWalkable(2400, 1600)).toBe(false)
    expect(isWalkable(0, 0)).toBe(false)
  })

  it('has a clear straight walk from spawn to Aunt Hoa', () => {
    const coHoa = POIS.find((p) => p.id === 'npc-co-hoa')!
    expect(isWalkable(coHoa.x, coHoa.z)).toBe(true)
    expect(isPathWalkable(SPAWN, { x: coHoa.x, z: coHoa.z })).toBe(true)
  })

  it('has a clear walk from spawn to the sunrise photo spot', () => {
    const spot = POIS.find((p) => p.id === 'lm-ho-guom')!
    expect(isPathWalkable(SPAWN, { x: spot.x, z: spot.z }, 4)).toBe(true)
  })
})
