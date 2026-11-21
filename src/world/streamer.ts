/**
 * Tile streamer: priority queue + budget per tick + unload ring.
 * In Phase 1 only the logical tiles stream (POIs, nav, ambience descriptors);
 * Phase 5 plugs the same events into the 3D loader — the contract does not change.
 */
import { TILE_SIZE, tileAt, tileId, tileCenter } from './grid'

export type TileState = 'QUEUED' | 'LOADING' | 'LOADED' | 'UNLOADING'

export interface StreamedTile {
  id: string
  tx: number
  tz: number
  state: TileState
  distance: number
  loadedAt: number
}

export interface StreamerOptions {
  /** tiles kept around the player (radius 2 → 5×5 = 25 tiles) */
  radius?: number
  /** tiles unloaded beyond radius + hysteresis */
  unloadRadius?: number
  /** max tiles started per update */
  budgetPerTick?: number
  now?: () => number
}

export interface StreamerEvents {
  onLoad?: (tile: StreamedTile) => void
  onUnload?: (tile: StreamedTile) => void
}

export class TileStreamer {
  private readonly radius: number
  private readonly unloadRadius: number
  private readonly budget: number
  private readonly now: () => number
  private events: StreamerEvents = {}
  private tiles = new Map<string, StreamedTile>()
  private currentTileId: string | null = null

  constructor(options: StreamerOptions = {}) {
    this.radius = options.radius ?? 2
    this.unloadRadius = options.unloadRadius ?? 3
    this.budget = options.budgetPerTick ?? 2
    this.now = options.now ?? (() => Date.now())
  }

  subscribe(events: StreamerEvents): void {
    this.events = events
  }

  /** Called every frame with the player's world position. */
  update(x: number, z: number): { loaded: number; unloaded: number } {
    const tileIdAtPlayer = tileAt(x, z)
    const { tx, tz } = this.parse(tileIdAtPlayer)
    let loaded = 0
    let unloaded = 0

    if (this.currentTileId !== tileIdAtPlayer) {
      this.currentTileId = tileIdAtPlayer
      const wanted: Array<{ id: string; tx: number; tz: number; distance: number }> = []
      for (let dz = -this.radius; dz <= this.radius; dz += 1) {
        for (let dx = -this.radius; dx <= this.radius; dx += 1) {
          const nx = tx + dx
          const nz = tz + dz
          if (nx < 0 || nz < 0) continue
          const centre = tileCenter(nx, nz)
          wanted.push({
            id: tileId(nx, nz),
            tx: nx,
            tz: nz,
            distance: Math.hypot(centre.x - x, centre.z - z),
          })
        }
      }
      wanted.sort((a, b) => a.distance - b.distance)

      for (const w of wanted) {
        if (this.tiles.has(w.id)) continue
        this.tiles.set(w.id, {
          id: w.id,
          tx: w.tx,
          tz: w.tz,
          state: 'QUEUED',
          distance: w.distance,
          loadedAt: 0,
        })
      }

      for (const [id, tile] of this.tiles) {
        const d = Math.max(Math.abs(tile.tx - tx), Math.abs(tile.tz - tz))
        if (d > this.unloadRadius) {
          this.tiles.delete(id)
          unloaded += 1
          this.events.onUnload?.(tile)
        }
      }
    }

    // Budgeted load runs on every update, not only when the player changes tile.
    const queued = [...this.tiles.values()]
      .filter((t) => t.state === 'QUEUED')
      .sort((a, b) => a.distance - b.distance)
    for (const tile of queued) {
      if (loaded >= this.budget) break
      tile.state = 'LOADED'
      tile.loadedAt = this.now()
      loaded += 1
      this.events.onLoad?.(tile)
    }

    return { loaded, unloaded }
  }

  /** Flush the queue synchronously (used on spawn / fast travel). */
  flush(x: number, z: number): number {
    let guard = 0
    let total = 0
    while (guard < 64) {
      const res = this.update(x, z)
      total += res.loaded
      if (res.loaded === 0) break
      guard += 1
    }
    return total
  }

  get loadedTiles(): StreamedTile[] {
    return [...this.tiles.values()].filter((t) => t.state === 'LOADED')
  }

  get loadedCount(): number {
    return this.loadedTiles.length
  }

  get currentTile(): string | null {
    return this.currentTileId
  }

  tileState(id: string): TileState | null {
    return this.tiles.get(id)?.state ?? null
  }

  reset(): void {
    this.tiles.clear()
    this.currentTileId = null
  }

  private parse(id: string): { tx: number; tz: number } {
    const [, tx, tz] = id.split('_')
    return { tx: Number(tx), tz: Number(tz) }
  }
}

export const tileMeters = TILE_SIZE
