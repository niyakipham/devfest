/**
 * Nhật ký tự sinh (RP-08).
 *
 * The blueprint asks for a journal that writes itself from events ("tự sinh từ
 * event") plus lifetime statistics ("km đã đi, bát phở đã ăn, NPC đã gặp"). Phase 1
 * shipped only a static quest list, so the journal was a to-do list, not a memory.
 *
 * Design rules:
 *  - entries are append-only and capped, so localStorage stays small (60 entries,
 *    ~9 kB) and the save contract never grows without migration
 *  - a `kind` lets the UI group entries (walk / eat / craft / meet / photo / earnt)
 *  - statistics are derived from the same events, so they can never disagree with
 *    the diary the player is reading
 *  - nothing here is money: the ledger stays the only source of truth for đồng
 */

export type JournalKind = 'walk' | 'eat' | 'craft' | 'meet' | 'photo' | 'earn' | 'day'

export interface JournalEntry {
  id: string
  /** in-game day when it happened */
  day: number
  /** in-game minute (0–1439) */
  minute: number
  kind: JournalKind
  /** one short Vietnamese sentence, already written for display */
  text: string
}

export interface JournalStats {
  /** metres walked, rounded to whole metres at read time */
  metresWalked: number
  bowlsEaten: number
  bowlsBrewed: number
  npcsMet: number
  photosTaken: number
  /** đồng earned from work and quests (never purchases) */
  dongEarned: number
  /** distinct tiles visited, as "x_z" */
  tilesSeen: string[]
}

export const EMPTY_STATS: JournalStats = {
  metresWalked: 0,
  bowlsEaten: 0,
  bowlsBrewed: 0,
  npcsMet: 0,
  photosTaken: 0,
  dongEarned: 0,
  tilesSeen: [],
}

export const JOURNAL_LIMIT = 60

const pad = (n: number): string => String(n).padStart(2, '0')

export const formatEntryTime = (entry: JournalEntry): string => {
  const h = Math.floor(entry.minute / 60)
  const m = entry.minute % 60
  return `Ngày ${entry.day} · ${pad(h)}:${pad(m)}`
}

/** Newest first, capped. Pure so it is trivial to test. */
export const appendEntry = (entries: readonly JournalEntry[], entry: JournalEntry): JournalEntry[] =>
  [entry, ...entries].slice(0, JOURNAL_LIMIT)

export interface WalkInput {
  metres: number
  day: number
  minute: number
  tile: string
  /** a landmark name if the player just arrived somewhere worth naming */
  atLandmark?: string
}

/**
 * Walking is the most common event, so it must not spam the log: only a landmark
 * arrival or a new tile is written, and only once per tile.
 */
export const walkEntry = (
  stats: JournalStats,
  input: WalkInput,
  makeId: (seed: string) => string,
): { entry: JournalEntry | null; stats: JournalStats } => {
  const nextStats: JournalStats = {
    ...stats,
    metresWalked: stats.metresWalked + Math.max(0, input.metres),
    tilesSeen: stats.tilesSeen.includes(input.tile) ? stats.tilesSeen : [...stats.tilesSeen, input.tile],
  }
  const isNewTile = !stats.tilesSeen.includes(input.tile)
  if (!input.atLandmark && !isNewTile) return { entry: null, stats: nextStats }

  const text = input.atLandmark
    ? `Đi bộ tới ${input.atLandmark}.`
    : 'Một góc phố mới, chưa từng qua.'

  return {
    entry: {
      id: makeId(`walk-${input.tile}-${input.day}`),
      day: input.day,
      minute: input.minute,
      kind: 'walk',
      text,
    },
    stats: nextStats,
  }
}

export interface EatInput {
  dish: string
  price: number
  day: number
  minute: number
}

export const eatEntry = (
  stats: JournalStats,
  input: EatInput,
  makeId: (seed: string) => string,
): { entry: JournalEntry; stats: JournalStats } => ({
  entry: {
    id: makeId(`eat-${input.dish}-${input.day}-${stats.bowlsEaten}`),
    day: input.day,
    minute: input.minute,
    kind: 'eat',
    text: `Ăn ${input.dish} (${input.price}đ).`,
  },
  stats: { ...stats, bowlsEaten: stats.bowlsEaten + 1 },
})

export interface BrewInput {
  verdict: string
  quality: number
  dong: number
  day: number
  minute: number
}

export const brewEntry = (
  stats: JournalStats,
  input: BrewInput,
  makeId: (seed: string) => string,
): { entry: JournalEntry; stats: JournalStats } => ({
  entry: {
    id: makeId(`brew-${input.day}-${stats.bowlsBrewed}`),
    day: input.day,
    minute: input.minute,
    kind: 'craft',
    text: `Nấu một bát phở (${Math.round(input.quality * 100)}%). ${input.verdict}`,
  },
  stats: {
    ...stats,
    bowlsBrewed: stats.bowlsBrewed + 1,
    dongEarned: stats.dongEarned + Math.max(0, input.dong),
  },
})

export interface MeetInput {
  name: string
  district: string
  day: number
  minute: number
}

/** NPCs are remembered once each; meeting them again is not a new entry. */
export const meetEntry = (
  stats: JournalStats,
  metNpcs: readonly string[],
  input: MeetInput,
  makeId: (seed: string) => string,
): { entry: JournalEntry | null; stats: JournalStats; metNpcs: string[] } => {
  if (metNpcs.includes(input.name)) {
    return { entry: null, stats, metNpcs: [...metNpcs] }
  }
  return {
    entry: {
      id: makeId(`meet-${input.name}`),
      day: input.day,
      minute: input.minute,
      kind: 'meet',
      text: `Gặp ${input.name} ở ${input.district}.`,
    },
    stats: { ...stats, npcsMet: stats.npcsMet + 1 },
    metNpcs: [...metNpcs, input.name],
  }
}

export interface PhotoInput {
  subject: string
  day: number
  minute: number
}

export const photoEntry = (
  stats: JournalStats,
  input: PhotoInput,
  makeId: (seed: string) => string,
): { entry: JournalEntry; stats: JournalStats } => ({
  entry: {
    id: makeId(`photo-${input.subject}-${stats.photosTaken}`),
    day: input.day,
    minute: input.minute,
    kind: 'photo',
    text: `Chụp ${input.subject}.`,
  },
  stats: { ...stats, photosTaken: stats.photosTaken + 1 },
})

export const earnEntry = (
  stats: JournalStats,
  input: { reason: string; dong: number; day: number; minute: number },
  makeId: (seed: string) => string,
): { entry: JournalEntry; stats: JournalStats } => ({
  entry: {
    id: makeId(`earn-${input.day}-${stats.dongEarned}-${input.dong}`),
    day: input.day,
    minute: input.minute,
    kind: 'earn',
    text: `${input.reason} · +${input.dong}đ.`,
  },
  stats: { ...stats, dongEarned: stats.dongEarned + Math.max(0, input.dong) },
})

/** New day banner, written once per rollover. */
export const dayEntry = (
  day: number,
  makeId: (seed: string) => string,
): JournalEntry => ({
  id: makeId(`day-${day}`),
  day,
  minute: 0,
  kind: 'day',
  text: `Ngày ${day} ở Hà Nội bắt đầu.`,
})

/** Human summary for the stats block: "3,4 km đã đi". */
export const formatKm = (metres: number): string => {
  const km = metres / 1000
  return `${km.toFixed(1).replace('.', ',')} km`
}

/** Deterministic id so React keys survive a reload. */
export const makeEntryId = (seed: string): string => `j-${seed.replace(/\s+/g, '-').toLowerCase()}`
