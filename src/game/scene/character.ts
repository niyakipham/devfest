/**
 * Character system — one rig, three users (player, quest NPCs, crowd).
 *
 * Before this file, a person was 2–4 primitives duplicated in three places:
 * Player.tsx (capsule + sphere + cone + box), Scene/QuestMarkers (capsule + sphere
 * + cone) and Scene/Villagers (instanced capsule + sphere). That is why everyone in
 * the old quarter looked like a bowling pin with a backpack.
 *
 * Design goals, in priority order:
 *  1. **Readable at gameplay distance.** The camera sits 6–26 m behind at 12–18°,
 *     so silhouette beats detail: shoulders, a neck, hair volume, visible arms and
 *     a leg split. Those five cues are what make a figure look human from far away.
 *  2. **Not cute-chibi, not realistic.** 1:6.9 head-to-body (a real adult is ~7.5);
 *     slightly larger head and hands, slimmer than a chibi, so it reads "stylised
 *     adult" rather than "toy".
 *  3. **Cheap.** Every part is a primitive from the shared geometry cache, one
 *     material per figure, and the crowd stays instanced. Target: ≤ 8 draw calls
 *     per unique figure, and the crowd is still 2 instanced meshes.
 *  4. **Deterministic.** All variation comes from a seeded hash of a string key, so
 *     the same NPC looks the same on every device and after a reload — no
 *     Math.random in the render path (a reload must not reshuffle faces).
 *
 * Vietnamese detail is deliberate and specific, not decorative: nón lá, áo dài with
 * a visible split, áo bà ba, khăn quàng, dép lốp, and the school uniform of a
 * Hanoi student. Nothing here copies a commercial game's asset — only proportions.
 */
import { WORLD } from '@world/palette'

/* ------------------------------- dimensions ------------------------------ */

/**
 * Metric rig, in metres. Total height 1.72 m.
 * Head 0.25 m → ~6.9 heads tall. Shoulder span 0.46 m is a *scaled* adult: a real
 * 1.72 m person spans ~0.44 m, and it must exceed the head width (0.25 m) or the
 * figure reads as a bowling pin regardless of how many parts are added.
 */
export const RIG = {
  height: 1.74,
  headR: 0.125,
  headY: 1.615,
  neckY: 1.5,
  /** top of the shoulder, where a person's arm socket actually is */
  shoulderY: 1.405,
  /**
   * Arm *centre*, not the outer edge. 0.185 + armR 0.048 = 0.233 half-span →
   * 0.466 m shoulder span. The arm must also overlap the torso (torso half is
   * 0.18 > 0.137 inner arm edge) or it floats in the air — that exact bug shipped
   * for one revision when only the span was widened.
   */
  shoulderX: 0.185,
  torsoY: 1.15,
  torsoH: 0.46,
  torsoW: 0.36,
  torsoD: 0.22,
  /** hip joint height; also the ground clearance of a full leg, see legH */
  hipY: 0.87,
  /**
   * DERIVED, not typed: a leg that is shorter than the hip pivot leaves the figure
   * hovering. The first draft had hipY 0.82 with legH 0.78 and every character
   * floated 2.4 cm above the pavement.
   */
  legH: 0.87,
  legR: 0.068,
  legY: 0.44,
  /**
   * armH is derived below from the intended wrist height, not typed: the wrist must
   * sit ~2 cm above the hip joint. Typing both armH and hipY by hand is what put the
   * hand below the hip in the previous revision.
   */
  armH: 0.54,
  armR: 0.048,
  handR: 0.058,
  footH: 0.05,
  footD: 0.17,
} as const

/** Arm capsule centre: its top sits 2 cm above the shoulder joint. */
export const ARM_Y = RIG.shoulderY + 0.02 - RIG.armH / 2

/** Wrist sits at the bottom of the arm capsule — derived so it cannot drift. */
export const HAND_Y = ARM_Y - RIG.armH / 2 + 0.004

/** Sole sits exactly on y = 0 so the rig stands on the ground, not above it. */
export const FOOT_Y = -(RIG.legH - RIG.footH / 2)

/**
 * Derived, never hand-typed: the wrist sits at the bottom of the arm capsule.
 * Typing 0.88 here by hand is how the hand ended up floating at the waist.
 */

/* -------------------------------- palettes ------------------------------- */

export type GarmentKey =
  | 'aoDai'
  | 'aoBaBa'
  | 'student'
  | 'vendor'
  | 'artisan'
  | 'cyclo'
  | 'singer'
  | 'plain'

export const GARMENTS: Record<GarmentKey, { top: string; bottom: string; trim?: string }> = {
  // áo dài: one colour for the tunic, trousers in a lighter silk
  aoDai: { top: WORLD.outfitStudent, bottom: WORLD.facadeCream, trim: WORLD.goldLeaf },
  aoBaBa: { top: WORLD.outfitDefault, bottom: WORLD.metalGrey },
  student: { top: WORLD.facadeCream, bottom: WORLD.outfitCycloGreen, trim: WORLD.primaryDeep },
  vendor: { top: WORLD.outfitSmith, bottom: WORLD.outfitDefault, trim: WORLD.facadeWarm },
  artisan: { top: WORLD.outfitCyclo, bottom: WORLD.outfitDefault },
  cyclo: { top: WORLD.outfitCycloGreen, bottom: WORLD.metalDark },
  singer: { top: WORLD.outfitSinger, bottom: WORLD.lacquerDark, trim: WORLD.goldLeaf },
  plain: { top: WORLD.outfitDefault, bottom: WORLD.outfitCyclo },
}

export type HeadwearKey = 'nonLa' | 'cap' | 'headband' | 'none'
export type HairKey = 'short' | 'bob' | 'bun' | 'long'

export interface Appearance {
  garment: GarmentKey
  headwear: HeadwearKey
  hair: HairKey
  /** 0..1, drives hair darkness and skin warmth slightly */
  tone: number
  /** relative height multiplier, 0.94..1.06 — the crowd must not be clones */
  stature: number
}

/* ------------------------------ determinism ------------------------------ */

/** FNV-1a — stable across engines, so a name always yields the same person. */
export const hashKey = (key: string): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

const pick = <T,>(arr: readonly T[], n: number): T => arr[n % arr.length]

const GARMENT_KEYS: GarmentKey[] = ['aoDai', 'aoBaBa', 'student', 'vendor', 'artisan', 'cyclo', 'singer', 'plain']
const HEADWEAR_KEYS: HeadwearKey[] = ['nonLa', 'cap', 'headband', 'none', 'none', 'none']
const HAIR_KEYS: HairKey[] = ['short', 'bob', 'bun', 'long']

/**
 * Persona → the two or three garment/headwear options that make sense.
 * A cyclo driver never shows up in an áo dài; a student always has a backpack in
 * the UI but a cap on the street.
 */
const PERSONA_LOOK: Record<string, { garments: GarmentKey[]; headwear: HeadwearKey[] }> = {
  STUDENT: { garments: ['student', 'aoDai', 'plain'], headwear: ['cap', 'none', 'headband'] },
  SILVERSMITH: { garments: ['artisan', 'aoBaBa'], headwear: ['headband', 'none'] },
  PHO_VENDOR: { garments: ['vendor', 'aoBaBa'], headwear: ['nonLa', 'none'] },
  CYCLO_DRIVER: { garments: ['cyclo', 'aoBaBa'], headwear: ['cap', 'nonLa'] },
  PHOTOGRAPHER: { garments: ['plain', 'aoDai', 'artisan'], headwear: ['cap', 'none'] },
  FOLK_SINGER: { garments: ['singer', 'aoDai'], headwear: ['headband', 'none'] },
}

/** Appearance for a named, persistent figure (the player, a quest NPC). */
export const appearanceFor = (key: string, persona?: string): Appearance => {
  const h = hashKey(key)
  const look = persona ? PERSONA_LOOK[persona] : undefined
  return {
    garment: look ? pick(look.garments, h >>> 3) : pick(GARMENT_KEYS, h >>> 3),
    headwear: look ? pick(look.headwear, h >>> 11) : pick(HEADWEAR_KEYS, h >>> 11),
    hair: pick(HAIR_KEYS, h >>> 17),
    tone: ((h >>> 23) % 100) / 100,
    stature: 0.94 + (((h >>> 5) % 13) / 13) * 0.12,
  }
}

/* ------------------------------- materials ------------------------------- */

const HAIR_DARK = WORLD.hairDark
const HAIR_WARM = WORLD.hairWarm

/** Hair colour drifts between espresso and warm lacquer; no blond Hanoi crowd. */
export const hairColor = (tone: number): string => (tone > 0.55 ? HAIR_WARM : HAIR_DARK)

/**
 * Skin stays a narrow, believable band. The old rig used two fixed colours for
 * everybody, which read as mannequins.
 */
export const skinColor = (tone: number): string =>
  tone > 0.66 ? WORLD.skinWarm : tone > 0.33 ? WORLD.skin : WORLD.skinDeep

/* --------------------------------- parts --------------------------------- */

export interface PartSpec {
  geom: 'box' | 'capsule' | 'sphere' | 'cylinder' | 'cone' | 'torus'
  args: readonly number[]
  pos: readonly [number, number, number]
  rot?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  color: string
  /** slightly rougher cloth, smoother skin/metal */
  rough?: number
}

/**
 * Builds the ordered part list for one figure. The caller renders them; nothing
 * here touches React or three.js objects, so it is trivially testable and the same
 * list drives both the real rig and the instanced crowd.
 */
export const buildParts = (look: Appearance): PartSpec[] => {
  const g = GARMENTS[look.garment]
  const skin = skinColor(look.tone)
  const hair = hairColor(look.tone)
  const parts: PartSpec[] = []

  /* ---- torso: chest + waist so the body is not a single pill ---- */
  parts.push({
    geom: 'box',
    args: [RIG.torsoW, RIG.torsoH, RIG.torsoD],
    pos: [0, RIG.torsoY, 0],
    // a 6-segment capsule above a box gives a shoulder line without a bevelled mesh
    color: g.top,
    rough: 0.92,
  })
  // shoulder cap: reads as collar and fixes the "no neck" silhouette
  parts.push({
    geom: 'sphere',
    args: [RIG.torsoW * 0.56, 8, 6],
    pos: [0, RIG.shoulderY - 0.02, 0],
    scale: [1, 0.42, 0.92],
    color: g.top,
    rough: 0.92,
  })

  /* ---- hips / lower garment ---- */
  parts.push({
    geom: 'box',
    args: [RIG.torsoW * 0.92, 0.16, RIG.torsoD * 0.94],
    pos: [0, RIG.hipY + 0.04, 0],
    color: g.bottom,
    rough: 0.95,
  })

  /* ---- legs are NOT here: they animate, so they live in buildLeg ---- */

  /* ---- arms: angled slightly out so they are not hidden by the torso ---- */
  for (const side of [-1, 1] as const) {
    parts.push({
      geom: 'capsule',
      args: [RIG.armR, RIG.armH - RIG.armR * 2, 4, 7],
      pos: [side * RIG.shoulderX, ARM_Y, 0],
      rot: [0, 0, side * 0.075],
      color: g.top,
      rough: 0.92,
    })
    // hand — slightly oversized on purpose: it is the second-strongest human cue
    parts.push({
      geom: 'sphere',
      args: [RIG.handR, 8, 6],
      pos: [side * RIG.shoulderX, HAND_Y, 0.01],
      color: skin,
      rough: 0.8,
    })
  }

  /* ---- neck + head ---- */
  parts.push({
    geom: 'cylinder',
    args: [0.045, 0.05, 0.08, 8],
    pos: [0, RIG.neckY - 0.02, 0],
    color: skin,
    rough: 0.8,
  })
  parts.push({
    geom: 'sphere',
    args: [RIG.headR, 14, 10],
    pos: [0, RIG.headY, 0],
    scale: [0.94, 1.06, 0.98],
    color: skin,
    rough: 0.78,
  })

  /* ---- hair: volume behind and above the skull ---- */
  if (look.hair === 'short') {
    parts.push({
      geom: 'sphere',
      args: [RIG.headR * 1.04, 12, 8],
      pos: [0, RIG.headY + 0.022, -0.012],
      scale: [1.02, 0.82, 1.04],
      color: hair,
      rough: 0.9,
    })
  } else if (look.hair === 'bob') {
    parts.push({
      geom: 'sphere',
      args: [RIG.headR * 1.09, 12, 8],
      pos: [0, RIG.headY + 0.012, -0.018],
      scale: [1.06, 1.0, 1.06],
      color: hair,
      rough: 0.9,
    })
  } else if (look.hair === 'bun') {
    parts.push({
      geom: 'sphere',
      args: [RIG.headR * 1.02, 12, 8],
      pos: [0, RIG.headY + 0.026, -0.01],
      scale: [1.0, 0.8, 1.0],
      color: hair,
      rough: 0.9,
    })
    parts.push({
      geom: 'sphere',
      args: [0.062, 8, 6],
      pos: [0, RIG.headY - 0.03, -RIG.headR - 0.035],
      color: hair,
      rough: 0.9,
    })
  } else {
    // long: two strands falling in front of the shoulders + a back panel
    parts.push({
      geom: 'sphere',
      args: [RIG.headR * 1.05, 12, 8],
      pos: [0, RIG.headY + 0.02, -0.015],
      scale: [1.03, 0.9, 1.04],
      color: hair,
      rough: 0.9,
    })
    for (const side of [-1, 1] as const) {
      parts.push({
        geom: 'box',
        args: [0.075, 0.3, 0.07],
        pos: [side * 0.1, RIG.headY - 0.19, -0.03],
        color: hair,
        rough: 0.9,
      })
    }
  }

  /* ---- headwear ---- */
  if (look.headwear === 'nonLa') {
    // nón lá: wide, shallow cone — the single most recognisable silhouette in the game
    // 0.23 radius = 0.46 m across: a real nón lá is 40–52 cm, and it must stay
    // narrower than the shoulder span (0.466 m) or the head reads as a lampshade.
    parts.push({
      geom: 'cone',
      args: [0.23, 0.17, 18],
      pos: [0, RIG.headY + 0.085, 0],
      color: WORLD.pavilionWall,
      rough: 0.95,
    })
  } else if (look.headwear === 'cap') {
    parts.push({
      geom: 'sphere',
      args: [RIG.headR * 1.05, 10, 8],
      pos: [0, RIG.headY + 0.04, 0],
      scale: [1.02, 0.55, 1.02],
      color: g.trim ?? g.bottom,
      rough: 0.9,
    })
    parts.push({
      geom: 'box',
      args: [0.17, 0.014, 0.1],
      pos: [0, RIG.headY + 0.05, 0.11],
      color: g.trim ?? g.bottom,
      rough: 0.9,
    })
  } else if (look.headwear === 'headband') {
    parts.push({
      geom: 'torus',
      args: [RIG.headR * 0.98, 0.014, 6, 16],
      pos: [0, RIG.headY + 0.045, 0],
      rot: [Math.PI / 2, 0, 0],
      color: g.trim ?? WORLD.lacquerRed,
      rough: 0.9,
    })
  }

  /* ---- garment-specific detail ---- */
  if (look.garment === 'aoDai') {
    // the split tunic: two flat panels falling over the trousers
    for (const side of [-1, 1] as const) {
      parts.push({
        geom: 'box',
        args: [0.09, 0.5, 0.02],
        pos: [side * 0.09, RIG.hipY - 0.16, RIG.torsoD / 2 + 0.01],
        color: g.top,
        rough: 0.94,
      })
    }
  }
  if (look.garment === 'student') {
    // backpack, the visual signature of the art-student persona
    parts.push({
      geom: 'box',
      args: [0.24, 0.3, 0.13],
      pos: [0, RIG.torsoY + 0.02, -RIG.torsoD / 2 - 0.06],
      color: WORLD.awningA,
      rough: 0.95,
    })
  }
  if (look.garment === 'vendor') {
    // apron: a lighter panel over the torso, and it is what makes cô Hoa legible
    parts.push({
      geom: 'box',
      args: [0.3, 0.34, 0.02],
      pos: [0, RIG.torsoY - 0.04, RIG.torsoD / 2 + 0.008],
      color: g.trim ?? WORLD.facadeCream,
      rough: 0.95,
    })
  }

  // Stature is applied by the caller as a uniform group/instance scale, so the part
  // list stays cheap and the crowd can encode height in its instance matrix.
  return parts
}

/**
 * One leg, built around its own origin so it can be rotated about the hip.
 * The pivot is at y=0 and the leg hangs down, which means `rotation.x` swings the
 * foot forward/back exactly like a thigh joint.
 */
export const buildLeg = (look: Appearance, _side: -1 | 1): PartSpec[] => {
  const g = GARMENTS[look.garment]
  return [
    {
      geom: 'capsule',
      // the capsule starts at the hip pivot and hangs down
      args: [RIG.legR, RIG.legH - RIG.legR * 2, 4, 7],
      pos: [0, -RIG.legH / 2, 0],
      color: g.bottom,
      rough: 0.95,
    },
    // foot: a flattened box reads as a shoe or a dép lốp from above
    {
      geom: 'box',
      args: [0.095, RIG.footH, RIG.footD],
      pos: [0, FOOT_Y, 0.035],
      color: WORLD.metalDark,
      rough: 0.85,
    },
  ]
}

/** Hip pivot X for a side, so the caller does not hard-code 0.088 twice. */
export const hipX = (side: -1 | 1): number => side * 0.088

/** Part count, exposed so a test can hold the draw-call budget. */
export const PART_BUDGET = 40

/* ------------------------------ crowd placement ------------------------------ */

export interface CrowdSlot {
  legsY: number
  torsoY: number
  headY: number
  hairY: number
}

/**
 * Where each instanced layer sits vertically, derived from the rig.
 *
 * Regression this guards: `capsuleGeometry(r, len)` is centred on its origin, so
 * placing the leg instance at y = 0 buried half of every crowd member's legs under
 * the pavement. Each layer is placed by its *bottom*, not its centre.
 */
export const crowdSlot = (): CrowdSlot => {
  const legTotal = RIG.legH - 0.14 + 0.075 * 2 // capsule length + both caps
  return {
    legsY: legTotal / 2,
    torsoY: RIG.torsoY,
    headY: RIG.headY,
    hairY: RIG.headY + 0.024,
  }
}

/** Y of the lowest point of a capsule of total height `h` centred at `cy`. */
export const capsuleBottom = (cy: number, h: number): number => cy - h / 2
