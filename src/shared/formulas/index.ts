/**
 * Shared game formulas — single source of truth for client AND server.
 * If a number controls progression, money or fairness it MUST live here.
 */
import type { Needs } from '@shared/contracts'

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Craft XP curve: 120 * level^1.35 (L1→2 = 120, L10 ≈ 2,688, L20 ≈ 6,900). */
export const xpToNext = (level: number): number =>
  Math.round(120 * Math.pow(clamp(level, 1, 20), 1.35))

export const addCraftXp = (
  level: number,
  xp: number,
  amount: number,
): { level: number; xp: number; leveledUp: boolean } => {
  let nextLevel = clamp(level, 1, 20)
  let nextXp = xp + Math.max(0, amount)
  let leveledUp = false
  while (nextLevel < 20 && nextXp >= xpToNext(nextLevel)) {
    nextXp -= xpToNext(nextLevel)
    nextLevel += 1
    leveledUp = true
  }
  return { level: nextLevel, xp: nextXp, leveledUp }
}

export const NEED_DECAY_PER_MINUTE = {
  energy: 0.1,
  hunger: 0.18,
  mood: 0.06,
  hygiene: 0.04,
} as const

export interface DecayContext {
  raining?: boolean
  indoors?: boolean
  sleeping?: boolean
}

/**
 * Cozy rule: needs never kill and never block play — below 25 they only
 * reduce movement speed and shorten NPC lines.
 */
export const decayNeeds = (needs: Needs, minutes: number, ctx: DecayContext = {}): Needs => {
  const m = Math.max(0, minutes)
  const comfort = ctx.indoors ? 0.6 : 1
  const rainMood = ctx.raining ? 1.5 : 1
  if (ctx.sleeping) {
    return {
      energy: clamp(needs.energy + m * 2.2, 0, 100),
      hunger: clamp(needs.hunger - m * 0.2, 0, 100),
      mood: clamp(needs.mood + m * 0.35, 0, 100),
      hygiene: clamp(needs.hygiene - m * 0.05, 0, 100),
    }
  }
  return {
    energy: clamp(needs.energy - m * NEED_DECAY_PER_MINUTE.energy * comfort, 0, 100),
    hunger: clamp(needs.hunger - m * NEED_DECAY_PER_MINUTE.hunger * (ctx.indoors ? 0.5 : 1), 0, 100),
    mood: clamp(
      needs.mood - m * NEED_DECAY_PER_MINUTE.mood * rainMood * (needs.hunger < 25 ? 1.6 : 1),
      0,
      100,
    ),
    hygiene: clamp(needs.hygiene - m * NEED_DECAY_PER_MINUTE.hygiene, 0, 100),
  }
}

/** Mood < 25 → 90% speed, else 100%. Never 0 (never punishing). */
export const speedMultiplier = (needs: Needs): number => (needs.mood < 25 ? 0.9 : 1)

/** Merchant reputation lowers shop prices by at most 15% (never a free item). */
export const priceWithReputation = (base: number, merchantRep: number): number =>
  Math.round(base * (1 - (clamp(merchantRep, 0, 100) / 100) * 0.15))

/** Anti-inflation: earned dong past the daily cap only counts at 20%. */
export const dailyIncomeCap = (craftLevel: number): number => 800 + craftLevel * 120

export const applyIncomeCap = (earned: number, alreadyEarned: number, cap: number): number => {
  const remaining = Math.max(0, cap - alreadyEarned)
  if (earned <= remaining) return Math.round(earned)
  return Math.round(remaining + (earned - remaining) * 0.2)
}

/** Food restores hunger; pho is the canonical comfort food of this game. */
export const FOOD = {
  pho: { price: 45, hunger: 38, mood: 12, label: 'Phở bò' },
  bunCha: { price: 40, hunger: 34, mood: 9, label: 'Bún chả' },
  caPheTrung: { price: 30, hunger: 8, mood: 16, label: 'Cà phê trứng' },
  banhMi: { price: 25, hunger: 22, mood: 5, label: 'Bánh mì' },
  traDa: { price: 10, hunger: 2, mood: 6, label: 'Trà đá' },
} as const
export type FoodKey = keyof typeof FOOD

/** Movement sanity check used by the anti-cheat hook (server side). */
export const MAX_WALK_SPEED = 6.5
export const MAX_VEHICLE_SPEED = 18

export const isTeleportSuspect = (distance: number, deltaSeconds: number, inVehicle: boolean): boolean => {
  if (deltaSeconds <= 0) return false
  return distance / deltaSeconds > (inVehicle ? MAX_VEHICLE_SPEED : MAX_WALK_SPEED)
}
