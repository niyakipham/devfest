/**
 * Scale contract — "Scale-contract" (v3 §1.4, blueprint P0-Map).
 *
 * The Phase 1 world was laid out as a coded prototype: landmarks sit 2–3x
 * closer together than the real city. Honest measurement first, then a
 * tolerance band — we don't rewrite Phase 1's layout in one day, we make the
 * distortion *visible and testable* so the day it is fixed, the test is what
 * tells us the fix worked.
 *
 * Reference distances are the street-km values from a rough city map (not a
 * survey): within ±30% is honest enough for a cozy game. The contract does NOT
 * move any coordinates — it reports per-pair ratios.
 */

export interface LandmarkPoint {
  id: string
  name: string
  x: number
  z: number
}

export interface ReferenceLeg {
  /** snapshot: e.g. ['lm-ho-guom', 'lm-nha-tho'] */
  from: string
  to: string
  /** real-world street distance in metres (approximate) */
  realMetres: number
  why: string
}

/**
 * Reference legs, ordered by importance. Ratios are computed by
 * `validateScale` — every entry is a pair the player can actually see on the map.
 */
export const REFERENCE_LEGS: readonly ReferenceLeg[] = [
  {
    from: 'lm-ho-guom',
    to: 'lm-nha-tho',
    realMetres: 1200,
    why: 'Hồ Gươm (center of the lake) → Nhà thờ Lớn (St Joseph’s Church) — the class of “walk to the landmark” quest',
  },
  {
    from: 'lm-ho-guom',
    to: 'lm-nha-hat',
    realMetres: 450,
    why: 'Hồ Gươm → Nhà hát Lớn (Opera House) — the nearest "icon" pair, should be a short stroll',
  },
  {
    from: 'lm-ho-guom',
    to: 'lm-long-bien',
    realMetres: 2300,
    why: 'Hồ Gươm → Cầu Long Biên (Long Bien bridge) — the signature far landmark of Hanoi',
  },
  {
    from: 'lm-ho-guom',
    to: 'lm-van-mieu',
    realMetres: 750,
    why: 'Hồ Gươm → Văn Miếu (Temple of Literature) — the cultural walk',
  },
  {
    from: 'lm-ho-guom',
    to: 'lm-lang-bac',
    realMetres: 1100,
    why: 'Hồ Gươm → Lăng Bác (Ho Chi Minh Mausoleum) — the wide-centre walk',
  },
] as const

export interface LegScale {
  from: string
  to: string
  realMetres: number
  gameMetres: number
  /** realMetres / gameMetres — e.g. 2.6 means the game is 2.6x compressed */
  compressionRatio: number
  /** true if within the allowed band */
  withinBand: boolean
}

export interface ScaleReport {
  legs: LegScale[]
  /** true when every leg sits inside the allowed band */
  ok: boolean
}

/** The accepted band for the Phase 1 compressed layout. Adjust when the real city is restored. */
export const MAX_ALLOWED_COMPRESSION = 4
export const MIN_ALLOWED_COMPRESSION = 0.5

/**
 * Measure each reference leg against the world's landmark coordinates.
 * Distances are straight-line (metres) — street distance is an OSM pipeline job.
 */
export const validateScale = (landmarks: readonly LandmarkPoint[]): ScaleReport => {
  const byId = new Map(landmarks.map((l) => [l.id, l]))
  const legs: LegScale[] = []
  for (const leg of REFERENCE_LEGS) {
    const a = byId.get(leg.from)
    const b = byId.get(leg.to)
    if (!a || !b) continue
    const gameMetres = Math.hypot(b.x - a.x, b.z - a.z)
    const ratio = leg.realMetres / gameMetres
    legs.push({
      from: leg.from,
      to: leg.to,
      realMetres: leg.realMetres,
      gameMetres: Math.round(gameMetres),
      compressionRatio: Math.round(ratio * 100) / 100,
      withinBand: ratio >= MIN_ALLOWED_COMPRESSION && ratio <= MAX_ALLOWED_COMPRESSION,
    })
  }
  return { legs, ok: legs.every((l) => l.withinBand) }
}

/** The one place that prints a human-readable per-pair audit (used by CI). */
export const formatScaleReport = (report: ScaleReport): string => {
  const rows = report.legs
    .map(
      (l) =>
        `  ${l.from} → ${l.to}: real ${l.realMetres} m vs game ${l.gameMetres} m · ratio ${l.compressionRatio}x · ${l.withinBand ? 'ok' : 'OUT OF BAND'}`,
    )
    .join('\n')
  return `SCALE CONTRACT — ${report.legs.length} legs\n${rows}\n  ok: ${report.ok}`
}
