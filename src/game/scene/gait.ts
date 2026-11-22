/**
 * Walk cycle. Pure functions only, so the pose can be tested without a renderer
 * and the same numbers drive the player rig and the instanced crowd.
 *
 * Why a separate file: the old player "walked" by bobbing the whole group ±0.055 m.
 * At the new proportions that reads as a floating mannequin — the eye looks for the
 * legs and finds none moving. A rotation of the thigh/calf pair is the cheapest
 * convincing fix (two sines per leg, no skeletal animation, no asset).
 *
 * Convention: angles in radians, one stride = 2π of phase.
 *  - `swing` is the thigh rotation about X, positive = forward
 *  - `lift` is the knee bend applied to the lower leg, always ≥ 0
 */

export interface LegPose {
  swing: number
  lift: number
}

export interface GaitPose {
  left: LegPose
  right: LegPose
  /** vertical bob of the whole body, metres */
  bob: number
  /** torso counter-rotation about Y, radians — the "shoulders" of a walk */
  twist: number
  /** arm swing, opposite phase to the legs */
  arm: number
}

/** Full stride in metres, so foot speed matches ground speed (no moonwalking). */
export const STRIDE_LENGTH = 1.35

/** Radians of phase per metre travelled. */
export const PHASE_PER_METRE = (Math.PI * 2) / STRIDE_LENGTH

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

/**
 * @param phase    accumulated radians (distance × PHASE_PER_METRE)
 * @param speed    m/s, used to scale amplitude and settle to idle at 0
 * @param reduceMotion  keeps the legs planted and only allows the bob to settle
 */
export const walkPose = (phase: number, speed: number, reduceMotion = false): GaitPose => {
  const s = Math.sin(phase)
  // amplitude ramps in over 0–1.2 m/s and caps at 1: a slow stroll still steps,
  // a sprint does not windmill
  const amp = clamp(speed / 1.2, 0, 1)
  const stride = 0.52 * amp
  const kneeLift = 0.62 * amp

  if (reduceMotion) {
    return {
      left: { swing: 0, lift: 0 },
      right: { swing: 0, lift: 0 },
      bob: 0,
      twist: 0,
      arm: 0,
    }
  }

  return {
    // legs in antiphase
    left: {
      swing: s * stride,
      // the knee bends only while the leg is travelling forward, which prevents the
      // "bent backwards" look that a naive |sin| produces
      lift: Math.max(0, Math.cos(phase)) * kneeLift,
    },
    right: {
      swing: -s * stride,
      lift: Math.max(0, -Math.cos(phase)) * kneeLift,
    },
    // two bobs per stride — one per foot plant
    bob: Math.abs(Math.cos(phase)) * 0.028 * amp,
    twist: Math.sin(phase) * 0.09 * amp,
    arm: -s * 0.42 * amp,
  }
}

/**
 * Applies the pose to the two leg groups of a rig. The rig exposes leg roots at
 * `0, hipY, 0`; the caller passes the groups in [left, right] order.
 */
export const applyLegPose = (
  legs: readonly [unknown | null, unknown | null],
  pose: GaitPose,
): void => {
  const targets = [pose.left, pose.right]
  legs.forEach((leg, i) => {
    const g = leg as { rotation?: { x: number }; position?: { y: number } } | null
    if (!g || !g.rotation || !g.position) return
    const t = targets[i]
    g.rotation.x = t.swing
    // a bent knee shortens the leg visually; lowering the root keeps the foot on
    // the ground instead of clipping through it
    g.position.y = -Math.sin(t.lift) * 0.18
  })
}

/**
 * Camera-relative footstep phase used by the audio layer: a step sound fires each
 * time a foot lands, i.e. twice per stride.
 */
export const stepsCrossed = (fromPhase: number, toPhase: number): number => {
  const a = Math.floor(fromPhase / Math.PI)
  const b = Math.floor(toPhase / Math.PI)
  return Math.max(0, b - a)
}

/** Leg group positions for the rig builder. */
export const legsOf = (): Array<[number, number, number]> => [
  [-0.088, 0.82, 0],
  [0.088, 0.82, 0],
]
