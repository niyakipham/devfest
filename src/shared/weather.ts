/**
 * Atmosphere — deterministic, offline-first weather simulation (P0-Atmosphere).
 *
 * The blueprint is explicit: the world must feel alive while never pretending
 * to be a live meteorological feed. What we ship is a *simulation*: the same
 * date always yields the same weather, so CI, screenshots and players see a
 * consistent world (hard rule from the blueprint: identical on client, server
 * and in tests).
 *
 * Inputs: the game date (in-game or real) + the raw hour of day.
 * Outputs: condition, temperature, rain visibility and the quest
 * availability rule that drives the day's quest banner.
 *
 * Design notes:
 *  - Every value is derived from the date, not from Math.random() — never a
 *    random roll; two consecutive players looking at the same world must
 *    agree on what the sky looks like.
 *  - The cache is a tiny TTL map (one entry per (date, hour) pair); in a real
 *    deployment this becomes a server response, but the shape does not change.
 */
import { z } from 'zod'

export const WEATHER_CONDITIONS = ['sunny', 'partly-cloudy', 'cloudy', 'light-rain', 'rain'] as const
export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number]

export const WeatherSnapshotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(23),
  condition: z.enum(WEATHER_CONDITIONS),
  temperatureC: z.number(),
  rainMmPerHour: z.number().min(0),
  /** 0–100: how many quests are blocked by weather */
  blocked: z.number().int().min(0).max(100),
})
export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>

/** The four game seasons and their dominant conditions (by day of year). */
const SEASON_CONDITIONS: Record<'XUAN' | 'HA' | 'THU' | 'DONG', WeatherCondition[]> = {
  // XUAN (Jan–Feb): dry and cool
  XUAN: ['sunny', 'partly-cloudy', 'sunny', 'cloudy'],
  // HA (Mar–May): warm with showers
  HA: ['sunny', 'partly-cloudy', 'light-rain', 'partly-cloudy'],
  // THU (Jun–Sep): humid monsoon
  THU: ['partly-cloudy', 'light-rain', 'rain', 'light-rain'],
  // DONG (Oct–Dec): dry, clearing sky
  DONG: ['sunny', 'sunny', 'partly-cloudy', 'cloudy'],
}

const SEASON_TEMP: Record<'XUAN' | 'HA' | 'THU' | 'DONG', { min: number; max: number }> = {
  XUAN: { min: 14, max: 21 },
  HA: { min: 21, max: 30 },
  THU: { min: 26, max: 34 },
  DONG: { min: 18, max: 26 },
}

/** Seeded PRNG — mulberry32. Returns a deterministic 0..1 per (date, hour). */
const seededRand = (seed: number): number => {
  let s = seed | 0
  s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const seasonFor = (date: Date): 'XUAN' | 'HA' | 'THU' | 'DONG' => {
  const m = date.getMonth() + 1
  if (m <= 2) return 'XUAN'
  if (m <= 5) return 'HA'
  if (m <= 8) return 'THU'
  return 'DONG'
}

const dateSeed = (isoDate: string, hour: number): number => {
  // stable hash of YYYY-MM-DD + hour
  let h = 0x2d1e1b
  for (const ch of `${isoDate}|${hour}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x9e3779b1) | 0
  return h >>> 0
}

const conditionRaininess = (condition: WeatherCondition): { rainMmPerHour: number; blocked: number } => {
  switch (condition) {
    case 'sunny': return { rainMmPerHour: 0, blocked: 0 }
    case 'partly-cloudy': return { rainMmPerHour: 0, blocked: 5 }
    case 'cloudy': return { rainMmPerHour: 0.2, blocked: 10 }
    case 'light-rain': return { rainMmPerHour: 4, blocked: 25 }
    case 'rain': return { rainMmPerHour: 14, blocked: 60 }
  }
}

/**
 * Build a deterministic weather snapshot for `date` at `hour` (0..23).
 * In-game the hour is usually 0..24; the first quest hour of the day is 5-6.
 */
export const weatherFor = (date: Date, hour: number): WeatherSnapshot => {
  const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  const h = Math.min(23, Math.max(0, Math.round(hour)))
  const seed = dateSeed(iso, h)
  const season = seasonFor(date)
  const rand = seededRand(seed)
  const conditions = SEASON_CONDITIONS[season]
  const condition = conditions[Math.floor(rand * conditions.length)]
  const tempRange = SEASON_TEMP[season]
  const temperatureC = Math.round((tempRange.min + seededRand(seed ^ 0x32) * (tempRange.max - tempRange.min)) * 10) / 10
  const { rainMmPerHour, blocked } = conditionRaininess(condition)
  // midday is marginally hotter — one honest, deterministic tilt
  const middayBoost = Math.max(0, 1 - Math.abs(h - 14) / 10) * 2
  return {
    date: iso,
    hour: h,
    condition,
    temperatureC: Math.round((temperatureC + middayBoost) * 10) / 10,
    rainMmPerHour,
    blocked: Math.min(100, Math.round(blocked + bestVisibilityTilt(condition))),
  }
}

const bestVisibilityTilt = (condition: WeatherCondition): number => {
  // sky haze during rain reduces visibility slightly more than predicted by condition alone
  return condition === 'rain' ? 8 : 0
}

/** Photo/clear-sky quests are hidden during real rain. */
export const blocksQuest = (condition: WeatherCondition, questCategory: string): boolean => {
  if (condition === 'sunny' || condition === 'partly-cloudy') return false
  if (condition === 'cloudy' && questCategory === 'photo') return false
  return questCategory === 'photo' || questCategory === 'photo-sunrise'
}

/**
 * Tiny in-memory TTL cache — one entry per (date, hour). The real deployment
 * calls a server weather API; the shape (and the cache) stays the same.
 */
export class WeatherCache {
  private entries = new Map<string, { value: WeatherSnapshot; expiresAt: number }>()

  constructor(
    private readonly ttlMs: number = 60_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get(date: Date, hour: number): WeatherSnapshot {
    const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
    const key = `${iso}|${hour}`
    const hit = this.entries.get(key)
    if (hit && hit.expiresAt > this.now()) return hit.value
    const value = weatherFor(date, hour)
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs })
    return value
  }

  clear(): void {
    this.entries.clear()
  }

  get size(): number {
    return this.entries.size
  }
}
