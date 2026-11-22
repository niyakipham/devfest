/**
 * Companion engine (HanoiDay Core Engine, P0-Companion).
 *
 * The companion is the emotional anchor of the cozy core loop — a small Hanoi
 * spirit the player keeps on the map. It never dies: every care value floors at
 * 5, exactly like the player needs (RP-03 rule), so a missing day costs a bad
 * mood, never the companion.
 *
 * Four species, one per neighborhood story (Content Bible):
 *   ho-guom-crane  — the egret of Ho Guom (the lake)
 *   ho-tay-bird    — the hanging bird of Ho Tay
 *   pho-co-cat     — the old-quarter cat
 *   bat-trang-potter — the potter's bauble of Bat Trang (the wheel)
 *
 * Status is derived, never stored:
 *   resting — energy below 30 (needs sleep — a cozy prompt, not punishment)
 *   work    — mood above 60, energy above 55
 *   play    — everything else
 *
 * Emotion is mood-driven: >=70 happy, >=40 calm, else sad.
 *
 * The engine is pure: callers pass the care action and the ICT date; nothing
 * reads storage or the wall clock. Exactly one care action is applied per
 * companion per day (see `careCompanion`); calling again in the same day is a
 * no-op so a retry cannot double-count care.
 */
import { z } from 'zod'

export const COMPANION_SPECIES = [
  { code: 'ho-guom-crane', viName: 'Cò Hồ Gươm', enName: 'Ho Guom Crane', icon: '🕊️', habitat: 'Hồ Gươm' },
  { code: 'ho-tay-bird', viName: 'Yến Hồ Tây', enName: 'Ho Tay Bird', icon: '🐦', habitat: 'Hồ Tây' },
  { code: 'pho-co-cat', viName: 'Mèo Phố Cổ', enName: 'Old-Quarter Cat', icon: '🐱', habitat: 'Phố Cổ' },
  { code: 'bat-trang-potter', viName: 'Con Rùa Gốm', enName: 'Bat Trang Pot-Baby', icon: '🏺', habitat: 'Bát Tràng' },
] as const

export type CompanionSpeciesCode = (typeof COMPANION_SPECIES)[number]['code']

export const COMPANION_SPECIES_BY_CODE = new Map(COMPANION_SPECIES.map((s) => [s.code, s]))

export const COMPANION_CARE_FLOOR = 5
export const MAX_COMPANION_LEVEL = 20
const XP_BASE = 60
const XP_EXPONENT = 1.3

export interface CareDelta {
  hunger?: number
  mood?: number
  energy?: number
}

/** What each care action grants. Exactly one is applied per day. */
export const CARE_FEED: CareDelta = { hunger: 40, mood: 6 }
export const CARE_GROOM: CareDelta = { mood: 12, energy: 8 }
export const CARE_WALK: CareDelta = { energy: 28, mood: 5 }

/** XP per care action. */
export const CARE_XP = { feed: 8, groom: 6, walk: 10 } as const

export const companionXpToNext = (level: number): number =>
  Math.round(XP_BASE * Math.pow(Math.max(1, Math.min(MAX_COMPANION_LEVEL, Math.round(level))), XP_EXPONENT))

const clampCare = (v: number): number => Math.min(100, Math.max(COMPANION_CARE_FLOOR, v))

export const companionCareSchema = z.object({
  hunger: z.number().min(COMPANION_CARE_FLOOR).max(100),
  mood: z.number().min(COMPANION_CARE_FLOOR).max(100),
  energy: z.number().min(COMPANION_CARE_FLOOR).max(100),
})
export type CompanionCare = z.infer<typeof companionCareSchema>

export const CompanionStateSchema = z.object({
  speciesCode: z.string(),
  level: z.number().int().min(1).max(MAX_COMPANION_LEVEL),
  xp: z.number().int().min(0),
  care: companionCareSchema,
  /** ICT date (YYYY-MM-DD) of the last care action, or null if none yet */
  lastCareDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  /** total care actions this companion has logged */
  totalCare: z.number().int().min(0).default(0),
})
export type CompanionState = z.infer<typeof CompanionStateSchema>

export const newCompanion = (speciesCode: CompanionSpeciesCode): CompanionState => ({
  speciesCode,
  level: 1,
  xp: 0,
  care: { hunger: 70, mood: 70, energy: 70 },
  lastCareDate: null,
  totalCare: 0,
})

export type CareAction = 'feed' | 'groom' | 'walk'

export interface CompanionStatus {
  status: 'resting' | 'work' | 'play'
  emotion: 'happy' | 'calm' | 'sad'
  /** one-line reason for the HUD ("đang mệt", "cười tươi") */
  note: string
}

export const deriveCompanion = (care: CompanionCare): CompanionStatus => {
  const emotion: CompanionStatus['emotion'] = care.mood >= 70 ? 'happy' : care.mood >= 40 ? 'calm' : 'sad'
  const status: CompanionStatus['status'] =
    care.energy < 30 ? 'resting' : care.mood >= 60 && care.energy >= 55 ? 'work' : 'play'
  const note =
    status === 'resting'
      ? 'đang cần ngủ'
      : emotion === 'happy'
        ? 'cười tươi hết cả mảnh đất'
        : emotion === 'calm'
          ? 'bình tĩnh, thả mình'
          : 'buồn, muốn được cưng'
  return { status, emotion, note }
}

export interface CareResult {
  state: CompanionState
  leveledUp: boolean
  xpGained: number
}

/**
 * Apply one care action for `todayICT`. Idempotent per day: the same action
 * (or a different one) on the same ICT day is a no-op, so a retried tap can
 * never double-count care or XP.
 */
export const careCompanion = (
  state: CompanionState,
  action: CareAction,
  todayICT: string,
): CareResult => {
  if (state.lastCareDate === todayICT) {
    return { state: { ...state }, leveledUp: false, xpGained: 0 }
  }
  const delta = action === 'feed' ? CARE_FEED : action === 'groom' ? CARE_GROOM : CARE_WALK
  const xpGained = CARE_XP[action]
  let level = state.level
  let xp = state.xp + xpGained
  let leveledUp = false
  while (level < MAX_COMPANION_LEVEL && xp >= companionXpToNext(level)) {
    xp -= companionXpToNext(level)
    level += 1
    leveledUp = true
  }
  const care: CompanionCare = {
    hunger: clampCare(state.care.hunger + (delta.hunger ?? 0)),
    mood: clampCare(state.care.mood + (delta.mood ?? 0)),
    energy: clampCare(state.care.energy + (delta.energy ?? 0)),
  }
  const next: CompanionState = {
    ...state,
    level,
    xp,
    care,
    lastCareDate: todayICT,
    totalCare: state.totalCare + 1,
  }
  return { state: next, leveledUp, xpGained }
}

/** Daily decay applied when the companion is not cared for. */
export const decayCare = (care: CompanionCare, days: number): CompanionCare => {
  if (days <= 0) return { ...care }
  return {
    hunger: clampCare(care.hunger - days * 18),
    mood: clampCare(care.mood - days * 6),
    energy: clampCare(care.energy - days * 8),
  }
}

/** The companion asks for care when it is tired or unhappy. */
export const needsCare = (care: CompanionCare): boolean => care.energy < 30 || care.mood < 40

/** Apply daily decay to a whole companion state. Never produces death. */
export const applyDailyDecay = (state: CompanionState, days: number): CompanionState => ({
  ...state,
  care: decayCare(state.care, days),
})
