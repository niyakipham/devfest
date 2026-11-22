/**
 * Nghề nấu phở — mini-game "timing + thứ tự" (RP-04, blueprint §2.5).
 *
 * Design intent
 * ------------
 * The Phase 1 audit found the whole content base grants 105 XP while L1→L2 needs
 * 120, so a player can never level up. A repeatable profession fixes the curve
 * only if it is *fair*, *legible* and *not a slot machine*: every brew is decided
 * by timing the player can see, and the outcome is a deterministic function of the
 * inputs. There is no random roll anywhere in this file.
 *
 * The three systems of phở (the dish is a cultural artefact — see Content Bible):
 *   1. NƯỚC DÙNG  (broth)  — long, high-stakes: burn it and the bowl is ruined
 *   2. BÁNH PHỞ  (noodles) — short window, forgiving
 *   3. XẾP BÁT    (garnish) — order matters: herbs before beef, beef before broth
 *
 * A "brew" is one bowl. `perfectBowl` pays the most; `ruinedBowl` still pays a
 * little, because a cozy game never takes the day's income back (RP-03 rule).
 */

export const PHO_STAGES = ['broth', 'noodle', 'garnish'] as const
export type PhoStage = (typeof PHO_STAGES)[number]

/** Timing windows in milliseconds, per craft level band. */
export interface TimingWindow {
  /** the sweet spot — full quality */
  perfect: number
  /** the graze zone — half quality, still edible */
  good: number
  /** anything outside is ruined */
  burn: number
}

/**
 * Higher craft level does NOT shrink the window (that would punish veterans by
 * making the game harder as they invest). Instead, the window *drifts faster* —
 * the challenge is attention, not reflex decay — and the perfect band is a fixed
 * proportion so muscle memory still holds.
 */
export const timingWindow = (stage: PhoStage, craftLevel: number): TimingWindow => {
  const lvl = Math.min(20, Math.max(1, Math.round(craftLevel)))
  const base = stage === 'broth' ? 900 : stage === 'noodle' ? 520 : 640
  const good = Math.round(base * (1 - (lvl - 1) * 0.012))
  return {
    perfect: Math.round(good * 0.34),
    good,
    burn: Math.round(good * 1.9),
  }
}

/** Where the needle sits when the stage starts; the player must stop it. */
export const needleStart = (stage: PhoStage, seed: number): number => {
  // deterministic spread so two consecutive bowls are never identical
  const spread = stage === 'broth' ? 0.62 : stage === 'noodle' ? 0.44 : 0.55
  return ((seed * 0.6180339887) % 1) * spread
}

/** Fraction of the window the player stopped past the ideal stop point. */
export const gradeStop = (stage: PhoStage, offsetMs: number, craftLevel: number): number => {
  const w = timingWindow(stage, craftLevel)
  const drift = Math.abs(offsetMs)
  if (drift <= w.perfect) return 1
  if (drift <= w.good) return 1 - ((drift - w.perfect) / (w.good - w.perfect)) * 0.5
  return 0
}

/**
 * Garnish order: herbs → beef → broth. Anything else is a mistake a Hanoian
 * auntie would notice instantly, so it costs quality but never the bowl.
 */
export const GARNISH_ORDER = ['herbs', 'beef', 'broth'] as const
export type Garnish = (typeof GARNISH_ORDER)[number]

export const gradeGarnish = (placed: readonly Garnish[]): number => {
  if (placed.length !== GARNISH_ORDER.length) return 0
  let score = 1
  for (let i = 0; i < GARNISH_ORDER.length; i += 1) {
    if (placed[i] !== GARNISH_ORDER[i]) score -= 0.34
  }
  return Math.max(0, score)
}

export interface BrewInput {
  craftLevel: number
  /** absolute stop offsets in ms, one per stage, in PHO_STAGES order */
  offsets: readonly [number, number, number]
  garnish: readonly Garnish[]
  /** equipment quality 0..1 — a better pot widens nothing, it lifts the floor */
  equipment?: number
}

export interface BrewResult {
  /** 0..1, weighted by stage importance */
  quality: number
  /** đồng paid for the bowl, before the daily income cap */
  payout: number
  xp: number
  /** per-stage scores for the UI to show */
  stages: { stage: PhoStage; score: number }[]
  /** short Vietnamese verdict for the toast */
  verdict: string
  /** true when every stage was perfect and the garnish order was right */
  perfect: boolean
}

export const PHO_BASE_PAYOUT = 32

/**
 * Floor for a ruined bowl. It MUST exceed `ingredientCost()` or the profession
 * becomes a net loss and the coziest player (the one having a bad day) is
 * punished for playing — the exact failure mode RP-03 forbids. 18đ vs 11đ cost
 * leaves 7đ: enough to not go backwards, not enough to farm.
 */
export const RUINED_FLOOR = 18

/**
 * Pure function: inputs in, bowl out. Same inputs always give the same bowl,
 * which is what lets the server re-run this for anti-cheat (Phase 4).
 */
export const brewBowl = ({ craftLevel, offsets, garnish, equipment = 0 }: BrewInput): BrewResult => {
  const stages = PHO_STAGES.map((stage, i) => ({
    stage,
    score: gradeStop(stage, offsets[i] ?? 10_000, craftLevel),
  }))

  // broth is half the bowl; noodles and garnish split the rest
  const weighted =
    stages[0].score * 0.5 + stages[1].score * 0.3 + gradeGarnish(garnish) * 0.2

  // equipment lifts the floor: a good pot turns a bad day into a passable bowl
  const eq = Math.min(1, Math.max(0, equipment))
  const quality = Math.min(1, weighted + (1 - weighted) * eq * 0.35)

  const perfect = quality >= 0.995
  const ruined = quality < 0.15

  const payout = ruined
    ? RUINED_FLOOR
    : Math.round(PHO_BASE_PAYOUT * (0.5 + quality * 1.4))

  const xp = ruined ? 3 : Math.round(6 + quality * 26)

  return {
    quality,
    payout,
    xp,
    stages,
    perfect,
    verdict: ruined
      ? 'Bát phở bị lỡ tay — vẫn bán được cho khách quen.'
      : perfect
        ? 'Đúng chuẩn phố cổ. Không một ai chê.'
        : quality > 0.7
          ? 'Nước dùng trong, bánh vừa tới. Khách gật đầu.'
          : 'Tạm được — hôm nay hơi vội.',
  }
}

// ------------------------------------------------------------------ pacing

/**
 * How many bowls a day supports, so a session has a shape and money has a ceiling
 * independent of the anti-inflation cap.
 */
export const bowlsPerDay = (craftLevel: number): number => 6 + Math.min(6, Math.floor(craftLevel / 3))

/** Minutes of in-game time one bowl consumes (prep + serve). */
export const minutesPerBowl = 25

/** Ingredients bought per bowl; the stall never runs dry (cozy rule). */
export const INGREDIENT_COST = { broth: 6, noodle: 3, garnish: 2 } as const

export const ingredientCost = (): number =>
  INGREDIENT_COST.broth + INGREDIENT_COST.noodle + INGREDIENT_COST.garnish

/** Net margin, used by the economy governor to sanity-check the faucet. */
export const bowlMargin = (quality: number): number =>
  Math.round(PHO_BASE_PAYOUT * (0.5 + quality * 1.4)) - ingredientCost()
