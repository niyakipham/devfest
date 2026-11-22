/**
 * Streak logic — Anti-Churn rule A4 / "1.3 L5" of the HanoiDay blueprint.
 *
 * A streak counts consecutive ICT days (UTC+7) with a completed check-in.
 * Every 7th day of a streak grants a bonus milestone; the streak keeps
 * growing past 7, so players chase a goal instead of hitting a wall.
 *
 * Exactly one "freeze" is available per ICT week (Sunday 00:00 → Saturday
 * 24:00). A freeze auto-eats when exactly ONE day is missed, so a single
 * absence never breaks the streak. Free tier starts with zero freezes; the
 * freeze is a Pro perk. Two or more missed days = the streak is gone.
 *
 * Rules, deliberately simple and deterministic:
 *  - same calendar day as the last claim → no-op (never double-count)
 *  - claim dated in the future → no-op (returns the state unchanged)
 *  - day after the last claim → consecutive: count grows
 *  - exactly one missed day → freeze eaten (Pro) or streak resets to 1 (free)
 *  - two or more missed days → streak resets to 1 (freeze cannot jump 2)
 *  - day-7 milestone → one bonus per 7-day cycle, tracked by lastMilestoneCount
 *
 * Dates are ICT calendar dates "YYYY-MM-DD". Nothing here reads storage or
 * the wall clock — callers pass `today` explicitly, which keeps this file
 * trivially unit-testable.
 */
import { z } from 'zod'

export const MILESTONE_EVERY_DAYS = 7
export const WEEKLY_FREEZE = 1
/** Bonus points granted the day the streak hits a multiple of 7. */
export const MILESTONE_BONUS_POINTS = 120

export const StreakStateSchema = z.object({
  /** consecutive completed ICT days, grows past 7 every milestone */
  count: z.number().int().min(0),
  /** freezes currently available for this ICT week */
  freeze: z.number().int().min(0).max(WEEKLY_FREEZE),
  /** ICT date (YYYY-MM-DD) of the last completed day, or null if none yet */
  lastClaimDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  /** ICT Sunday (YYYY-MM-DD) of the current week cycle */
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  /** consecutive-day count that earned the last milestone bonus */
  lastMilestoneCount: z.number().int().min(0).default(0),
})
export type StreakState = z.infer<typeof StreakStateSchema>

export const EMPTY_STREAK: StreakState = {
  count: 0,
  freeze: 0,
  lastClaimDate: null,
  weekStart: null,
  lastMilestoneCount: 0,
}

/** Today in ICT (Asia/Ho_Chi_Minh, UTC+7) as YYYY-MM-DD. */
export const ictNow = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** The ICT Sunday that owns `dateICT` (Sunday = 0). Pure string math. */
export const weekStartOf = (dateICT: string): string => {
  const [y, m, d] = dateICT.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d))
  const day = utc.getUTCDay()
  utc.setUTCDate(utc.getUTCDate() - day)
  const yy = utc.getUTCFullYear()
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(utc.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Signed difference in ICT calendar days between `a` and `b` (b − a). */
export const dayGap = (a: string, b: string): number => {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

export type StreakReason =
  | 'same-day'
  | 'future-date'
  | 'consecutive'
  | 'milestone'
  | 'freeze-eaten'
  | 'reset-to-fresh-streak'

export interface StreakEval {
  state: StreakState
  /** whether a reward was applied today */
  awarded: boolean
  /** reason code — useful for toasts and logs */
  reason: StreakReason
  /** bonus points the caller should grant today (milestone only) */
  bonusPoints: number
}

export interface StreakOptions {
  /** Pro tier: week starts each new ICT week with one freeze. */
  pro?: boolean
}

/**
 * Evaluate a claim for `today` and fold it into the previous state.
 * Non-destructive — the input `prev` is never mutated.
 */
export const evaluateStreakClaim = (
  prev: StreakState,
  today: string,
  opts: StreakOptions = {},
): StreakEval => {
  const pro = opts.pro === true
  const weekStart = weekStartOf(today)

  if (prev.lastClaimDate === today) {
    return { state: prev, awarded: false, reason: 'same-day', bonusPoints: 0 }
  }
  if (prev.lastClaimDate && dayGap(prev.lastClaimDate, today) < 0) {
    return { state: prev, awarded: false, reason: 'future-date', bonusPoints: 0 }
  }

  // Refill the freeze when the ICT week cycle rolls over.
  // (Pro weeks start with one freeze; free weeks never have one.)
  const weekRollover = prev.weekStart !== weekStart
  const freeze = weekRollover ? (pro ? WEEKLY_FREEZE : 0) : prev.freeze

  // No claim yet — a fresh streak starts at 1.
  if (!prev.lastClaimDate) {
    return {
      state: {
        count: 1,
        freeze,
        lastClaimDate: today,
        weekStart,
        lastMilestoneCount: 0,
      },
      awarded: true,
      reason: 'reset-to-fresh-streak',
      bonusPoints: 0,
    }
  }

  const gap = dayGap(prev.lastClaimDate, today)

  // Consecutive day → grow the streak.
  if (gap === 1) {
    const nextCount = prev.count + 1
    const isMilestone = nextCount % MILESTONE_EVERY_DAYS === 0 && prev.lastMilestoneCount < nextCount
    const bonus = isMilestone ? MILESTONE_BONUS_POINTS : 0
    return {
      state: {
        ...prev,
        count: nextCount,
        freeze,
        lastClaimDate: today,
        weekStart,
        lastMilestoneCount: isMilestone ? nextCount : prev.lastMilestoneCount,
      },
      awarded: true,
      reason: isMilestone ? 'milestone' : 'consecutive',
      bonusPoints: bonus,
    }
  }

  // Exactly one missed day → eat a freeze (Pro only) or reset to 1.
  if (gap === 2) {
    if (freeze > 0) {
      return {
        state: {
          ...prev,
          count: prev.count,
          freeze: freeze - 1,
          lastClaimDate: today,
          weekStart,
        },
        awarded: true,
        reason: 'freeze-eaten',
        bonusPoints: 0,
      }
    }
    return {
      state: {
        count: 1,
        freeze: 0,
        lastClaimDate: today,
        weekStart,
        lastMilestoneCount: 0,
      },
      awarded: true,
      reason: 'reset-to-fresh-streak',
      bonusPoints: 0,
    }
  }

  // Two or more missed days → the streak is gone.
  return {
    state: {
      count: 1,
      freeze,
      lastClaimDate: today,
      weekStart,
      lastMilestoneCount: 0,
    },
    awarded: true,
    reason: 'reset-to-fresh-streak',
    bonusPoints: 0,
  }
}

/**
 * Friendly reward tier — kept for toasts/UI ("7 túi phở"). The milestone
 * bonus itself is decided by evaluateStreakClaim; this is illustrative only.
 */
export const streakPointsFor = (count: number): number => {
  if (count >= MILESTONE_EVERY_DAYS) return MILESTONE_BONUS_POINTS
  if (count >= 3) return 40
  return 10
}
