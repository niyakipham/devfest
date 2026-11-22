/**
 * Quest engine (HanoiDay Core Engine, P0-Quest).
 *
 * Pure logic extracted from the blueprint's P0-Quest/Campaign Engine:
 *  - selectDailyQuests: pick the 3 quests a player sees today, from candidates
 *    the game provides. Same district, closer, and easier = higher score.
 *    Claimed/failed quests never appear twice.
 *  - claimBudget: the daily voucher/claim cap (free = 3, Pro = 6).
 *  - isQuestExpired: timed quests that a failed player can no longer succeed at.
 *
 * Everything here is pure and deterministic — the caller owns persistence.
 */
import { z } from 'zod'

export const QuestCandidateSchema = z.object({
  /** stable id — the quest key, e.g. "q-pho" */
  key: z.string(),
  /** human title for the banner */
  title: z.string(),
  /** neighborhood this quest belongs to (e.g. "hoan-kiem") */
  district: z.string(),
  /** distance to the player in metres */
  distanceM: z.number().nonnegative(),
  /** 1 = easy, 2 = medium, 3 = hard */
  difficulty: z.number().int().min(1).max(3).default(1),
  /** optional expiry (ICT YYYY-MM-DDTHH:MM) — timed quests */
  expiresAt: z.string().optional(),
})
export type QuestCandidate = z.infer<typeof QuestCandidateSchema>

export interface SelectionOptions {
  /** the district the player is currently in */
  playerDistrict: string
  /** quest keys already claimed today (or ever — callers decide) */
  claimedKeys?: Set<string> | string[]
  /** how many to recommend (default 3 — "one per local hour-of-day") */
  limit?: number
  /** only candidates inside this radius are shown (metres) */
  radiusM?: number
}

const toSet = (keys?: Set<string> | string[]): Set<string> =>
  keys instanceof Set ? keys : new Set(keys ?? [])

/**
 * Score candidates: same district (+0.45), distance (+0.40 — closer wins),
 * easy (+0.05). Ties break alphabetically by key so the order is stable.
 */
export const scoreCandidate = (c: QuestCandidate, playerDistrict: string): number => {
  const same = c.district === playerDistrict ? 0.45 : 0
  const distance = 0.4 * (1 - Math.min(1, c.distanceM / 2000))
  const easy = c.difficulty === 1 ? 0.05 : c.difficulty === 2 ? 0.02 : 0
  return same + distance + easy
}

export const selectDailyQuests = (
  candidates: readonly QuestCandidate[],
  opts: SelectionOptions,
): QuestCandidate[] => {
  const claimed = toSet(opts.claimedKeys)
  const radius = opts.radiusM ?? 2000
  const limit = opts.limit ?? 3
  const available = candidates.filter((c) => !claimed.has(c.key) && c.distanceM <= radius)
  return available
    .map((c) => ({ c, score: scoreCandidate(c, opts.playerDistrict) }))
    .sort((a, b) => b.score - a.score || a.c.key.localeCompare(b.c.key))
    .slice(0, limit)
    .map((x) => x.c)
}

/** Free tier lets a player claim 3 vouchers a day; Pro lets 6. */
export const DAILY_CLAIM_LIMIT_FREE = 3
export const DAILY_CLAIM_LIMIT_PRO = 6

export interface ClaimBudget {
  remaining: number
  exhausted: boolean
  limit: number
}

/**
 * Returns the remaining daily claim budget and whether it is exhausted.
 * The cap is per ICT day, so `claimedToday` must be the count for that day.
 */
export const claimBudget = (claimedToday: number, pro: boolean): ClaimBudget => {
  const limit = pro ? DAILY_CLAIM_LIMIT_PRO : DAILY_CLAIM_LIMIT_FREE
  const remaining = Math.max(0, limit - Math.max(0, claimedToday))
  return { remaining, exhausted: remaining === 0, limit }
}

/**
 * Timed quests that expired in the past are no longer claimable. A null or
 * undefined expiry means the quest is untimed and cannot expire.
 */
export const isQuestExpired = (candidate: QuestCandidate, nowICT: string): boolean => {
  if (!candidate.expiresAt) return false
  return candidate.expiresAt < nowICT
}

/** Can the player claim this candidate right now? (purity-safe) */
export const canClaim = (
  candidate: QuestCandidate,
  opts: { claimedToday: number; pro: boolean; nowICT: string },
): { allowed: boolean; reason: 'ok' | 'expired' | 'budget-exhausted' } => {
  if (isQuestExpired(candidate, opts.nowICT)) return { allowed: false, reason: 'expired' }
  if (claimBudget(opts.claimedToday, opts.pro).exhausted) return { allowed: false, reason: 'budget-exhausted' }
  return { allowed: true, reason: 'ok' }
}
