/**
 * Hoàn Kiếm core content: lake, landmarks, shops, quest givers, buildings, trees.
 * Everything is generated deterministically from the street graph so the world
 * is identical on client, server and in CI screenshots.
 */
import { districtAt, HOAN_KIEM_CENTER, isPhase1Tile, pointToTile, tileId } from '../grid'
import type { Building, Poi, PoiType, Street, TreeInstance } from '../types'
import { STREETS } from './streets'

export const LAKE = {
  cx: HOAN_KIEM_CENTER.x,
  cz: HOAN_KIEM_CENTER.z,
  rx: 110,
  rz: 350,
} as const

/** Player spawn hint: south-east shore; snapped to a free spot after the city is built. */
const SPAWN_HINT = { x: 2290, z: 1852 } as const

export const isInLake = (x: number, z: number, padding = 0): boolean => {
  const dx = (x - LAKE.cx) / (LAKE.rx + padding)
  const dz = (z - LAKE.cz) / (LAKE.rz + padding)
  return dx * dx + dz * dz <= 1
}

export const isInWorldCore = (x: number, z: number): boolean =>
  x > 1950 && x < 2950 && z > 700 && z < 2300

/* ---------------------------------- RNG ---------------------------------- */

const mulberry32 = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/* -------------------------------- POLYLINE ------------------------------- */

const segLength = (a: [number, number], b: [number, number]): number =>
  Math.hypot(b[0] - a[0], b[1] - a[1])

export const polylineLength = (points: Array<[number, number]>): number => {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += segLength(points[i - 1], points[i])
  return total
}

export const pointAlong = (
  street: Street,
  distance: number,
): { x: number; z: number; dx: number; dz: number } => {
  let remaining = Math.max(0, distance)
  for (let i = 1; i < street.points.length; i += 1) {
    const [ax, az] = street.points[i - 1]
    const [bx, bz] = street.points[i]
    const len = segLength([ax, az], [bx, bz])
    if (remaining <= len || i === street.points.length - 1) {
      const k = len === 0 ? 0 : Math.min(1, remaining / len)
      const dx = len === 0 ? 0 : (bx - ax) / len
      const dz = len === 0 ? 0 : (bz - az) / len
      return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, dx, dz }
    }
    remaining -= len
  }
  const [x, z] = street.points[0]
  return { x, z, dx: 1, dz: 0 }
}

/* ------------------------------- LANDMARKS ------------------------------- */

export const LANDMARKS: Array<{
  id: string
  name: string
  nameEn: string
  x: number
  z: number
  type: PoiType
  action?: string
  chapter: number
}> = [
  { id: 'lm-ho-guom', name: 'Hồ Gươm', nameEn: 'Hoan Kiem Lake', x: 2288, z: 1922, type: 'PHOTO_SPOT', action: 'photo:ho-guom', chapter: 1 },
  { id: 'lm-thap-rua', name: 'Tháp Rùa', nameEn: 'Turtle Tower', x: 2430, z: 1700, type: 'LANDMARK', chapter: 1 },
  { id: 'lm-ngoc-son', name: 'Đền Ngọc Sơn', nameEn: 'Ngoc Son Temple', x: 2400, z: 1315, type: 'SHRINE', action: 'shrine:ngoc-son', chapter: 1 },
  { id: 'lm-the-huc', name: 'Cầu Thế Húc', nameEn: 'The Huc Bridge', x: 2400, z: 1245, type: 'LANDMARK', chapter: 1 },
  { id: 'lm-nha-tho', name: 'Nhà thờ Lớn', nameEn: 'St Joseph Cathedral', x: 2145, z: 1490, type: 'LANDMARK', action: 'photo:nha-tho', chapter: 1 },
  { id: 'lm-duong-tau', name: 'Phố Đường Tàu', nameEn: 'Train Street', x: 2058, z: 1120, type: 'PHOTO_SPOT', action: 'photo:duong-tau', chapter: 1 },
  { id: 'lm-dong-xuan', name: 'Chợ Đồng Xuân', nameEn: 'Dong Xuan Market', x: 2500, z: 795, type: 'SHOP', action: 'market:dong-xuan', chapter: 1 },
  { id: 'lm-nha-hat', name: 'Nhà hát Lớn', nameEn: 'Opera House', x: 2815, z: 1875, type: 'LANDMARK', action: 'photo:nha-hat', chapter: 1 },
  { id: 'lm-van-mieu', name: 'Văn Miếu', nameEn: 'Temple of Literature', x: 1790, z: 2280, type: 'LANDMARK', action: 'photo:van-mieu', chapter: 1 },
  { id: 'lm-long-bien', name: 'Cầu Long Biên', nameEn: 'Long Bien Bridge', x: 2985, z: 1055, type: 'LANDMARK', action: 'photo:long-bien', chapter: 1 },
  { id: 'lm-lang-bac', name: 'Lăng Bác', nameEn: 'Ho Chi Minh Mausoleum', x: 1955, z: 790, type: 'LANDMARK', action: 'photo:lang-bac', chapter: 1 },
  { id: 'lm-hoang-thanh', name: 'Hoàng thành Thăng Long', nameEn: 'Imperial Citadel', x: 1985, z: 985, type: 'LANDMARK', action: 'photo:hoang-thanh', chapter: 1 },
]

/* ------------------------------ QUEST GIVERS ----------------------------- */

export const QUEST_GIVERS: Array<{
  id: string
  name: string
  nameEn: string
  x: number
  z: number
  dialogue: string
  street?: string
}> = [
  { id: 'npc-co-hoa', name: 'Cô Hoa bán phở', nameEn: 'Aunt Hoa, pho vendor', x: 2286, z: 1838, dialogue: 'co-hoa', street: 'dinh-tien-hoang' },
  { id: 'npc-chu-bay', name: 'Chú Bảy thợ bạc', nameEn: 'Uncle Bay, silversmith', x: 2360, z: 888, dialogue: 'chu-bay', street: 'hang-bac' },
  { id: 'npc-lan', name: 'Chị Lan nhiếp ảnh', nameEn: 'Lan, photographer', x: 2420, z: 1997, dialogue: 'chi-lan', street: 'hang-bai' },
  { id: 'npc-hung', name: 'Anh Hùng xích lô', nameEn: 'Hung, cyclo driver', x: 2258, z: 1902, dialogue: 'anh-hung', street: 'le-thai-to' },
]

/* --------------------------------- SHOPS --------------------------------- */

const SHOP_TYPES_BY_CRAFT: Record<string, PoiType> = {
  'Hồ Gươm': 'PHOTO_SPOT',
  'Cà phê': 'FOOD',
  'Lụa': 'SHOP',
  'Đồ gỗ': 'SHOP',
  'Bánh kẹo': 'FOOD',
  'Đồ giấy': 'SHOP',
  'Nhà cổ': 'LANDMARK',
  'Bia hơi': 'FOOD',
  'Bạc': 'WORKSHOP',
  'Đồ đồng': 'WORKSHOP',
  'Thuốc bắc': 'SHOP',
  'Chả cá': 'FOOD',
  'Chợ': 'SHOP',
  'Sách': 'SHOP',
  'Di sản': 'LANDMARK',
  'Thời trang': 'SHOP',
  'Kem': 'FOOD',
  'Đồ điện': 'SHOP',
  'Nhà hàng': 'FOOD',
  'Khách sạn': 'SHOP',
}

/**
 * Small shop-name parts, combined deterministically so two shops on the same
 * street are not clones. A real old-quarter sign is usually "noun + branch":
 * "Hiệu vàng Kim Ngân", "Quán phở Thìn", "Hiệu sách cũ số 12".
 */
const HOUSE_DETAILS = ['góc phố', 'trong ngõ', 'số lẻ', 'số chẵn', 'tầng hai', 'sát hồ', 'cuối phố'] as const
const VIEW_DETAILS = ['nhìn ra hồ', 'phía đông', 'phía tây', 'bóng cây', 'lúc sáng sớm', 'góc ngã tư'] as const

const CRAFT_SHOP_NAMES: Record<string, string[]> = {
  'Cà phê': ['Cà phê trứng', 'Cà phê sữa đá', 'Quán cà phê ban công', 'Cà phê vỉa hè'],
  'Lụa': ['Tiệm lụa Hà Đông', 'Cửa hàng áo dài', 'Khăn lụa tơ tằm'],
  'Bánh kẹo': ['Bánh cốm', 'Kẹo lạc', 'Bánh đậu xanh'],
  'Đồ giấy': ['Hàng mã đồ giấy', 'Đèn lồng Trung Thu', 'Tiệm vàng mã'],
  'Bia hơi': ['Bia hơi vỉa hè', 'Quán nhậu Tạ Hiện', 'Mồi nướng'],
  'Bạc': ['Tiệm bạc Hàng Bạc', 'Xưởng chạm bạc', 'Trang sức thủ công'],
  'Đồ đồng': ['Đồ đồng Cầu Gỗ', 'Lư hương đồng', 'Xưởng đúc đồng'],
  'Thuốc bắc': ['Thuốc bắc Lãn Ông', 'Tiệm thuốc cổ truyền'],
  'Chả cá': ['Chả cá Lã Vọng', 'Chả cá nướng'],
  'Sách': ['Hiệu sách cũ', 'Nhà sách Tràng Tiền', 'Sạp báo'],
  'Kem': ['Kem Tràng Tiền', 'Kem dừa'],
  'Thời trang': ['Áo dài may đo', 'Tiệm quần áo', 'Giày da'],
  'Đồ điện': ['Đồ điện Phố Huế', 'Sửa chữa điện tử'],
  'Nhà hàng': ['Bún chả Hàng Mành', 'Bún đậu mắm tôm'],
  'Khách sạn': ['Khách sạn nhỏ phố cổ'],
  'Đồ gỗ': ['Đồ gỗ mỹ nghệ', 'Tủ chè'],
  'Chợ': ['Sạp chợ Đồng Xuân', 'Hàng khô'],
}

/* ---------------------------------- POIs --------------------------------- */

const buildStreetPois = (): Poi[] => {
  const pois: Poi[] = []
  const rng = mulberry32(20261121)

  for (const street of STREETS) {
    const length = polylineLength(street.points)
    const spacing = 52
    let index = 0
    for (let d = 22; d < length; d += spacing) {
      const p = pointAlong(street, d)
      const side = index % 2 === 0 ? 1 : -1
      const px = p.x + -p.dz * side * (street.width / 2 + 4)
      const pz = p.z + p.dx * side * (street.width / 2 + 4)
      index += 1
      if (isInLake(px, pz, 4)) continue
      if (!isInWorldCore(px, pz)) continue

      const type = SHOP_TYPES_BY_CRAFT[street.craft] ?? 'SHOP'
      const names = CRAFT_SHOP_NAMES[street.craft] ?? [street.craft]
      // F7: 311 POIs used to share 64 names, so half the old quarter was called
      // "Cà phê trứng". Qualifying with the street raises distinct names to
      // ~200 without inventing a new content pipeline.
      const base = names[Math.floor(rng() * names.length)]
      // Only a shop has an address. A photo spot has a *view*, a landmark has a
      // side of the street — "Hồ Gươm · số lẻ" was nonsense the density gate
      // could not see.
      const qualifier =
        type === 'SHOP' || type === 'WORKSHOP'
          ? HOUSE_DETAILS[Math.floor(rng() * HOUSE_DETAILS.length)]
          : VIEW_DETAILS[Math.floor(rng() * VIEW_DETAILS.length)]
      const name = `${base} · ${qualifier} ${street.name}`
      const { tx, tz } = pointToTile(px, pz)
      pois.push({
        id: `poi-${street.id}-${index}`,
        type,
        name,
        nameEn: `${street.nameEn} ${type.toLowerCase()}`,
        x: Math.round(px * 10) / 10,
        z: Math.round(pz * 10) / 10,
        radius: type === 'PHOTO_SPOT' ? 8 : 4.5,
        tileId: tileId(tx, tz),
        district: districtAt(px, pz),
        street: street.id,
        craft: street.craft,
        hours: type === 'FOOD' ? [300, 1380] : [420, 1320],
        action: type === 'FOOD' ? 'food' : type === 'WORKSHOP' ? 'workshop' : 'shop',
        payload: { price: 20 + Math.floor(rng() * 6) * 10 },
      })
    }
  }

  for (const lm of LANDMARKS) {
    const { tx, tz } = pointToTile(lm.x, lm.z)
    pois.push({
      id: lm.id,
      type: lm.type,
      name: lm.name,
      nameEn: lm.nameEn,
      x: lm.x,
      z: lm.z,
      radius: lm.type === 'PHOTO_SPOT' ? 10 : 6,
      tileId: tileId(tx, tz),
      district: districtAt(lm.x, lm.z),
      action: lm.action ?? 'landmark',
      payload: { chapter: lm.chapter },
    })
  }

  for (const npc of QUEST_GIVERS) {
    const { tx, tz } = pointToTile(npc.x, npc.z)
    pois.push({
      id: npc.id,
      type: 'QUEST_GIVER',
      name: npc.name,
      nameEn: npc.nameEn,
      x: npc.x,
      z: npc.z,
      radius: 4.5,
      tileId: tileId(tx, tz),
      district: districtAt(npc.x, npc.z),
      street: npc.street,
      action: `dialogue:${npc.dialogue}`,
    })
  }

  return pois
}

/** Ambient props guarantee the "7 seconds / 150 metres" rule in every road tile. */
const fillAmbient = (pois: Poi[]): Poi[] => {
  const rng = mulberry32(778899)
  const byTile = new Map<string, Poi[]>()
  for (const p of pois) {
    const list = byTile.get(p.tileId) ?? []
    list.push(p)
    byTile.set(p.tileId, list)
  }

  const ambientNames: Array<{ type: PoiType; name: string; nameEn: string; action: string }> = [
    { type: 'BENCH', name: 'Ghế đá ven hồ', nameEn: 'Stone bench', action: 'rest' },
    { type: 'SHRINE', name: 'Miếu nhỏ', nameEn: 'Street shrine', action: 'worship' },
    { type: 'FOOD', name: 'Hàng trà đá vỉa hè', nameEn: 'Iced tea stall', action: 'food' },
    { type: 'BENCH', name: 'Gốc cây bóng mát', nameEn: 'Shady tree', action: 'rest' },
    // RP-03: hygiene decays, so the world must offer a way to restore it.
    { type: 'SHOP', name: 'Vòi nước công cộng', nameEn: 'Public tap', action: 'wash' },
  ]

  const out = [...pois]
  const tiles = new Set<string>()
  for (let tz = 3; tz <= 10; tz += 1) {
    for (let tx = 7; tx <= 12; tx += 1) {
      if (isPhase1Tile(tx, tz)) tiles.add(tileId(tx, tz))
    }
  }

  for (const tile of tiles) {
    let list = byTile.get(tile) ?? []
    let guard = 0
    while (list.length < 5 && guard < 12) {
      guard += 1
      const tz = Number(tile.split('_')[2])
      const tx = Number(tile.split('_')[1])
      const x = tx * 250 + 40 + rng() * 170
      const z = tz * 250 + 40 + rng() * 170
      if (isInLake(x, z, 12)) continue
      const template = ambientNames[Math.floor(rng() * ambientNames.length)]
      const poi: Poi = {
        id: `amb-${tile}-${list.length}`,
        type: template.type,
        name: template.name,
        nameEn: template.nameEn,
        x: Math.round(x),
        z: Math.round(z),
        radius: 4,
        tileId: tile,
        district: districtAt(x, z),
        action: template.action,
        payload: template.type === 'FOOD' ? { price: 10 } : {},
      }
      list = [...list, poi]
      out.push(poi)
    }
    byTile.set(tile, list)
  }

  return out
}

export const POIS: Poi[] = fillAmbient(buildStreetPois())

export const TILE_POI_COUNT: Record<string, number> = POIS.reduce<Record<string, number>>((acc, p) => {
  acc[p.tileId] = (acc[p.tileId] ?? 0) + 1
  return acc
}, {})

export const nearestPoi = (x: number, z: number, maxDistance = 6): Poi | null => {
  let best: Poi | null = null
  let bestD = maxDistance
  for (const poi of POIS) {
    const d = Math.hypot(poi.x - x, poi.z - z)
    if (d < bestD) {
      bestD = d
      best = poi
    }
  }
  return best
}

/* -------------------------------- BUILDINGS ------------------------------ */

const FACADE_PALETTES = ['#E8D3A9', '#D9C7A7', '#E7BFA6', '#CFD8B8', '#E3DCE0', '#C9D6D8'] as const

export const BUILDINGS: Building[] = (() => {
  const rng = mulberry32(424242)
  const buildings: Building[] = []
  for (const street of STREETS) {
    const length = polylineLength(street.points)
    const step = 24
    let i = 0
    for (let d = 10; d < length; d += step) {
      const p = pointAlong(street, d)
      for (const side of [1, -1]) {
        const depth = 10 + rng() * 8
        const offset = street.width / 2 + depth / 2 + 6
        const bx = p.x + -p.dz * side * offset
        const bz = p.z + p.dx * side * offset
        if (isInLake(bx, bz, 14)) continue
        if (!isInWorldCore(bx, bz)) continue
        const w = 7 + rng() * 6
        const floors = 3 + Math.floor(rng() * 3)
        buildings.push({
          id: `b-${street.id}-${i}-${side}`,
          x: bx,
          z: bz,
          w,
          d: depth,
          h: floors * 4 + 1,
          rotY: (Math.atan2(p.dx, p.dz) * 180) / Math.PI,
          palette: Math.floor(rng() * FACADE_PALETTES.length),
          street: street.id,
        })
        i += 1
      }
    }
  }
  return buildings
})()

const insideBuilding = (x: number, z: number): boolean => {
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.x) > 26 || Math.abs(z - b.z) > 26) continue
    const a = (b.rotY * Math.PI) / 180
    const dx = x - b.x
    const dz = z - b.z
    const lx = dx * Math.cos(a) - dz * Math.sin(a)
    const lz = dx * Math.sin(a) + dz * Math.cos(a)
    if (Math.abs(lx) < b.w / 2 + 1.2 && Math.abs(lz) < b.d / 2 + 1.2) return true
  }
  return false
}

/** Deterministic spiral search: spawn is always walkable, never inside a wall or the lake. */
export const SPAWN = (() => {
  for (let ring = 0; ring < 60; ring += 1) {
    for (let step = 0; step < Math.max(1, ring * 8); step += 1) {
      const a = (step / Math.max(1, ring * 8)) * Math.PI * 2
      const x = SPAWN_HINT.x + Math.cos(a) * ring * 4
      const z = SPAWN_HINT.z + Math.sin(a) * ring * 4
      if (ring === 0) {
        if (!isInLake(x, z, 8) && !insideBuilding(x, z)) return { x, y: 0, z }
        continue
      }
      if (!isInLake(x, z, 8) && !insideBuilding(x, z)) return { x, y: 0, z }
    }
  }
  return { x: SPAWN_HINT.x, y: 0, z: SPAWN_HINT.z }
})()

export const facadeColor = (palette: number): string =>
  FACADE_PALETTES[palette % FACADE_PALETTES.length]

/* ---------------------------------- TREES -------------------------------- */

export const TREES: TreeInstance[] = (() => {
  const rng = mulberry32(13579)
  const trees: TreeInstance[] = []
  // ring around the lake
  const ringCount = 46
  for (let i = 0; i < ringCount; i += 1) {
    const a = (i / ringCount) * Math.PI * 2
    const x = LAKE.cx + Math.cos(a) * (LAKE.rx + 26 + rng() * 8)
    const z = LAKE.cz + Math.sin(a) * (LAKE.rz + 24 + rng() * 8)
    trees.push({ x, z, scale: 0.9 + rng() * 0.5, hue: rng() })
  }
  // blocks between the streets
  for (let i = 0; i < 90; i += 1) {
    const x = 2000 + rng() * 850
    const z = 780 + rng() * 1420
    if (isInLake(x, z, 24)) continue
    trees.push({ x, z, scale: 0.8 + rng() * 0.7, hue: rng() })
  }
  return trees
})()

export const LAKE_CENTER = { x: LAKE.cx, z: LAKE.cz }
