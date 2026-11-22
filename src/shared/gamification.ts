/**
 * Gamification logic (HanoiDay Core Engine, P0-Gamification).
 *
 * The blueprint's three progression axes, kept explicit:
 *   1. Tay nghề (craft level) 1–20   — the exclusive class `@shared/formulas` handles
 *   2. Danh tiếng (reputation)      — five factions, -100..+100
 *   3. Pieces                        — 36 pieces, one per street
 *
 * Plus the leaderboard snapshot helper and the day-7 milestone constants.
 *
 * Reputation is *not* a power level: it only changes prices, NPC headlines,
 * and badge art. The UI is forbidden from exposing a "level 100 → stronger"
 * surface (never pay-to-win, never a climbable bar).
 */
import { z } from 'zod'

export const FACTIONS = ['resident', 'merchant', 'craftsman', 'youth', 'heritage'] as const
export type Faction = (typeof FACTIONS)[number]

export const FACTION_LABEL_VI: Record<Faction, string> = {
  resident: 'Cư dân',
  merchant: 'Tiểu thương',
  craftsman: 'Nghệ nhân',
  youth: 'Giới trẻ',
  heritage: 'Di sản',
}

export const FACTION_LABEL_EN: Record<Faction, string> = {
  resident: 'Residents',
  merchant: 'Merchants',
  craftsman: 'Craftsmen',
  youth: 'Youth',
  heritage: 'Heritage',
}

export const ReputationSchema = z.record(z.enum(FACTIONS), z.number().int().min(-100).max(100))
export type Reputation = z.infer<typeof ReputationSchema>

export const EMPTY_REPUTATION: Reputation = {
  resident: 0,
  merchant: 0,
  craftsman: 0,
  youth: 0,
  heritage: 0,
}

export const clampFaction = (v: number): number => Math.max(-100, Math.min(100, Math.round(v)))

/** Add a signed delta to one faction. Unknown factions are ignored (never throw). */
export const addFactionDelta = (
  standing: Reputation,
  faction: Faction,
  delta: number,
): Reputation => {
  const current = standing[faction] ?? 0
  return { ...standing, [faction]: clampFaction(current + delta) }
}

/** The sum of the five factions, for the character sheet. Not a power level. */
export const reputationSum = (standing: Reputation): number =>
  FACTIONS.reduce((sum, f) => sum + (standing[f] ?? 0), 0)

/** The top faction for the character sheet (first max on ties). */
export const topFaction = (standing: Reputation): Faction =>
  FACTIONS.reduce<Faction>((best, f) => ((standing[f] ?? 0) > (standing[best] ?? 0) ? f : best), 'resident')

/**
 * The weekly leaderboard snapshot. A snapshot is an immutable, sorted copy of
 * the week's standings — once the snapshot exists, the league only grows by
 * rank during the week, never by recounting.
 *
 * ISO ICT Sunday 00:00 → next Sunday is the reset boundary. The snapshot is
 * taken at that boundary; callers feed current standings in.
 */
export interface LeaderboardEntry {
  userId: string
  displayName: string
  score: number
}

export interface LeaderboardRow {
  rank: number
  userId: string
  displayName: string
  score: number
}

export const buildLeaderboardSnapshot = (
  entries: readonly LeaderboardEntry[],
  limit = 50,
): LeaderboardRow[] =>
  [...entries]
    .sort((a, b) => b.score - a.score || a.userId.localeCompare(b.userId))
    .slice(0, limit)
    .map((e, i) => ({ rank: i + 1, userId: e.userId, displayName: e.displayName, score: e.score }))

/**
 * The milestone streak reward — kept here so the UI never has to guess.
 * The single source of truth for the 120-point day-7 milestone is
 * `src/shared/streak.ts` (MILESTONE_BONUS_POINTS).
 */
export const MILESTONE_STREAK_POINTS = 120

/** Pieces: one per street (36 in the Content Bible). Collection is capped 36. */
export const MAX_PIECES = 36

/** A street unlocks its piece by being visited (any approach, not on foot only). */
export const pieceForStreet = (streetId: string | undefined | null): string | null => {
  if (!streetId) return null
  // stable, content-anchored id: piece-<street-slug>, e.g. piece-dat-chien-hoang
  return `piece-${streetId}`
}

/**
 * A zippy check — returns true iff `set` covers every piece key. Exported for
 * the journal "36 phố → 36 mảnh" completion.
 */
export const allPiecesCollected = (pieces: readonly string[]): boolean =>
  pieces.length >= MAX_PIECES
