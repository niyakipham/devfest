/**
 * 20 km² world grid: 5,000 m × 4,000 m, tiles of 250 m → 20 × 16 = 320 tiles.
 * Origin (0,0) is the south-west corner; Hoàn Kiếm lake sits near (2400, 1600).
 */
import type { Tile } from './types'

export const WORLD_WIDTH = 5000
export const WORLD_DEPTH = 4000
export const TILE_SIZE = 250
export const COLS = WORLD_WIDTH / TILE_SIZE // 20
export const ROWS = WORLD_DEPTH / TILE_SIZE // 16
export const TILE_COUNT = COLS * ROWS // 320

export const HOAN_KIEM_CENTER = { x: 2400, z: 1600 } as const

export const tileId = (tx: number, tz: number): string => `t_${tx}_${tz}`

export const parseTileId = (id: string): { tx: number; tz: number } => {
  const [, tx, tz] = id.split('_')
  return { tx: Number(tx), tz: Number(tz) }
}

export const pointToTile = (x: number, z: number): { tx: number; tz: number } => ({
  tx: Math.min(COLS - 1, Math.max(0, Math.floor(x / TILE_SIZE))),
  tz: Math.min(ROWS - 1, Math.max(0, Math.floor(z / TILE_SIZE))),
})

export const tileAt = (x: number, z: number): string => {
  const { tx, tz } = pointToTile(x, z)
  return tileId(tx, tz)
}

export const tileCenter = (tx: number, tz: number): { x: number; z: number } => ({
  x: tx * TILE_SIZE + TILE_SIZE / 2,
  z: tz * TILE_SIZE + TILE_SIZE / 2,
})

export const inWorld = (x: number, z: number): boolean =>
  x >= 0 && x < WORLD_WIDTH && z >= 0 && z < WORLD_DEPTH

export const tileBounds = (tx: number, tz: number): Omit<Tile, 'id' | 'district' | 'hasRoad'> => ({
  tx,
  tz,
  x0: tx * TILE_SIZE,
  z0: tz * TILE_SIZE,
  x1: (tx + 1) * TILE_SIZE,
  z1: (tz + 1) * TILE_SIZE,
})

/** 8 neighbours + self, used by the streamer's ring preload. */
export const neighbourhood = (tx: number, tz: number, radius = 1): Array<[number, number]> => {
  const out: Array<[number, number]> = []
  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const nx = tx + dx
      const nz = tz + dz
      if (nx >= 0 && nx < COLS && nz >= 0 && nz < ROWS) out.push([nx, nz])
    }
  }
  return out
}

export const distance2D = (ax: number, az: number, bx: number, bz: number): number =>
  Math.hypot(ax - bx, az - bz)

interface DistrictRect {
  id: string
  name: string
  x0: number
  z0: number
  x1: number
  z1: number
}

/** Simplified district layout (real Hanoi proportions, stylised). */
export const DISTRICTS: DistrictRect[] = [
  { id: 'HOAN_KIEM', name: 'Hoàn Kiếm', x0: 2100, z0: 1100, x1: 2720, z1: 2050 },
  { id: 'BA_DINH', name: 'Ba Đình', x0: 1500, z0: 300, x1: 2300, z1: 1200 },
  { id: 'DONG_DA', name: 'Đống Đa', x0: 1500, z0: 1350, x1: 2300, z1: 2200 },
  { id: 'HAI_BA_TRUNG', name: 'Hai Bà Trưng', x0: 2720, z0: 1150, x1: 3600, z1: 2100 },
  { id: 'TAY_HO', name: 'Tây Hồ', x0: 900, z0: 150, x1: 2000, z1: 900 },
  { id: 'CAU_GIAY', name: 'Cầu Giấy', x0: 700, z0: 900, x1: 1600, z1: 1600 },
  { id: 'LONG_BIEN', name: 'Long Biên', x0: 3600, z0: 200, x1: 5000, z1: 1500 },
  { id: 'HOANG_MAI', name: 'Hoàng Mai', x0: 2700, z0: 2100, x1: 3800, z1: 3200 },
  { id: 'THANH_XUAN', name: 'Thanh Xuân', x0: 1500, z0: 2200, x1: 2400, z1: 2900 },
  { id: 'NAM_TU_LIEM', name: 'Nam Từ Liêm', x0: 700, z0: 2600, x1: 1600, z1: 3600 },
  { id: 'BAC_TU_LIEM', name: 'Bắc Từ Liêm', x0: 1200, z0: 100, x1: 2200, z1: 300 },
  { id: 'HA_DONG', name: 'Hà Đông', x0: 400, z0: 3000, x1: 1500, z1: 3900 },
]

export const districtAt = (x: number, z: number): string => {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d.id
  }
  // nearest district centre fallback — never "unknown"
  let best = DISTRICTS[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const d of DISTRICTS) {
    const cx = (d.x0 + d.x1) / 2
    const cz = (d.z0 + d.z1) / 2
    const dd = distance2D(x, z, cx, cz)
    if (dd < bestD) {
      bestD = dd
      best = d
    }
  }
  return best.id
}

export const districtName = (id: string): string =>
  DISTRICTS.find((d) => d.id === id)?.name ?? id

/** Region playable in Phase 1: Hoàn Kiếm + edge of the Old Quarter. */
export const PHASE1_TILE_RANGE = { minX: 7, maxX: 12, minZ: 3, maxZ: 10 } as const

export const isPhase1Tile = (tx: number, tz: number): boolean =>
  tx >= PHASE1_TILE_RANGE.minX &&
  tx <= PHASE1_TILE_RANGE.maxX &&
  tz >= PHASE1_TILE_RANGE.minZ &&
  tz <= PHASE1_TILE_RANGE.maxZ

export const phase1TileIds = (): string[] => {
  const ids: string[] = []
  for (let tz = PHASE1_TILE_RANGE.minZ; tz <= PHASE1_TILE_RANGE.maxZ; tz += 1) {
    for (let tx = PHASE1_TILE_RANGE.minX; tx <= PHASE1_TILE_RANGE.maxX; tx += 1) {
      ids.push(tileId(tx, tz))
    }
  }
  return ids
}
