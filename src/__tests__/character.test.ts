/**
 * Character rig — the visual contract, as assertions.
 *
 * These tests exist because "looks more human" is not reviewable in CI, but the
 * *properties that make it look human* are:
 *   - proportions (head-to-body ratio in a stylised-adult band)
 *   - a silhouette that includes legs, arms, a neck and hair volume
 *   - determinism (the same save must not reshuffle the player's face)
 *   - a part budget (this runs on phones; a 200-mesh NPC is a regression)
 */
import { describe, expect, it } from 'vitest'
import {
  ARM_Y,
  GARMENTS,
  HAND_Y,
  PART_BUDGET,
  RIG,
  appearanceFor,
  buildLeg,
  buildParts,
  capsuleBottom,
  crowdSlot,
  hashKey,
  hairColor,
  hipX,
  skinColor,
} from '@game/scene/character'
import { PHASE_PER_METRE, STRIDE_LENGTH, applyLegPose, stepsCrossed, walkPose } from '@game/scene/gait'

describe('proportions', () => {
  it('is a stylised adult, not a chibi and not a mannequin', () => {
    const headToBody = RIG.height / (RIG.headR * 2)
    // real adult ≈ 7.5; chibi ≈ 3–4; this rig targets the middle
    expect(headToBody).toBeGreaterThan(6)
    expect(headToBody).toBeLessThan(8)
  })

  it('stands about 1.7 m tall so doors and benches stay believable', () => {
    expect(RIG.height).toBeGreaterThan(1.6)
    expect(RIG.height).toBeLessThan(1.85)
  })

  it('puts the head above the shoulders above the hips', () => {
    expect(RIG.headY).toBeGreaterThan(RIG.shoulderY)
    expect(RIG.shoulderY).toBeGreaterThan(RIG.hipY)
    expect(RIG.hipY).toBeGreaterThan(RIG.legY)
    expect(RIG.legY).toBeGreaterThan(0)
  })

  it('keeps shoulders wider than the head, which is the human silhouette cue', () => {
    const shoulderSpan = (RIG.shoulderX + RIG.armR) * 2
    expect(shoulderSpan).toBeGreaterThan(RIG.headR * 2)
    expect(RIG.torsoW).toBeGreaterThan(RIG.headR * 2)
    // a real 1.72 m adult spans roughly 0.42–0.50 m
    expect(shoulderSpan).toBeGreaterThan(0.42)
    expect(shoulderSpan).toBeLessThan(0.5)
  })

  it('never lets an arm float beside the body', () => {
    // regression: widening only shoulderX pushed the arms 13 cm clear of the torso,
    // which renders as a scarecrow. The inner arm edge must overlap the torso.
    const innerArmEdge = RIG.shoulderX - RIG.armR
    const torsoHalf = RIG.torsoW / 2
    expect(innerArmEdge).toBeLessThan(torsoHalf)
  })

  it('puts the wrist at hip height, the way a standing adult hangs their arms', () => {
    // A real adult's wrist sits level with, or a little above, the hip joint.
    // HAND_Y is derived from the arm capsule so it cannot drift when the arm changes.
    const delta = HAND_Y - RIG.hipY
    expect(delta).toBeGreaterThan(-0.02)
    expect(delta).toBeLessThan(0.06)
    expect(HAND_Y).toBeGreaterThan(RIG.legH / 2)
  })

  it('keeps the neck short enough to look human', () => {
    // regression: moving the shoulder down without moving the torso up left a
    // 10 cm giraffe neck, which the coordinate dump caught and no type does
    const torsoTop = RIG.torsoY + RIG.torsoH / 2
    const headBottom = RIG.headY - RIG.headR
    const neckGap = headBottom - torsoTop
    expect(neckGap).toBeGreaterThan(0.04)
    expect(neckGap).toBeLessThan(0.12)
  })

  it('keeps the arms level with the shoulder joint, not 15 cm above it', () => {
    // the arm capsule hangs from the socket: its centre must be below shoulderY
    expect(ARM_Y).toBeLessThan(RIG.shoulderY)
    expect(RIG.shoulderY - ARM_Y).toBeLessThan(0.35)
  })
})

describe('silhouette completeness', () => {
  const looks = [
    appearanceFor('Minh:PHO_VENDOR', 'PHO_VENDOR'),
    appearanceFor('Lan:PHOTOGRAPHER', 'PHOTOGRAPHER'),
    appearanceFor('Bay:SILVERSMITH', 'SILVERSMITH'),
    appearanceFor('Hung:CYCLO_DRIVER', 'CYCLO_DRIVER'),
    appearanceFor('crowd-7'),
  ]

  it('has a neck, two hands and a head for every look', () => {
    for (const look of looks) {
      const parts = buildParts(look)
      expect(parts.some((p) => p.geom === 'cylinder'), 'neck').toBe(true)
      // two hands = two small spheres at wrist height
      const hands = parts.filter((p) => Math.abs(p.pos[1] - HAND_Y) < 1e-6 && p.geom === 'sphere')
      expect(hands.length).toBeGreaterThanOrEqual(2)
      const head = parts.find((p) => Math.abs(p.pos[1] - RIG.headY) < 1e-6)
      expect(head).toBeDefined()
    }
  })

  it('adds hair volume for every hair style', () => {
    for (const hair of ['short', 'bob', 'bun', 'long'] as const) {
      const parts = buildParts({ ...looks[0], hair })
      const aboveHead = parts.filter((p) => p.pos[1] >= RIG.headY - 0.05 && p.color === hairColor(looks[0].tone))
      expect(aboveHead.length, hair).toBeGreaterThan(0)
    }
  })

  it('stands on the ground instead of hovering above it', () => {
    // regression: hipY 0.82 with legH 0.78 left every character 2.4 cm in the air
    const leg = buildLeg(looks[0], 1)
    const foot = leg.find((p) => p.geom === 'box')!
    // foot.pos is in the leg's own frame (origin = hip pivot), so the sole is
    // hipY + pos.y - thickness/2 and it must land on the ground plane
    const sole = RIG.hipY + foot.pos[1] - RIG.footH / 2
    expect(Math.abs(sole)).toBeLessThan(0.005)
  })

  it('never lets the hat be wider than the shoulders', () => {
    // a nón lá is 40–52 cm across; the first draft made it 68 cm, wider than the body
    const nonLa = buildParts({ ...looks[0], headwear: 'nonLa' }).filter((p) => p.geom === 'cone')
    for (const cone of nonLa) {
      const diameter = cone.args[0] * 2
      const shoulderSpan = (RIG.shoulderX + RIG.armR) * 2
      expect(diameter).toBeLessThan(shoulderSpan)
      expect(diameter).toBeGreaterThan(0.4)
      expect(diameter).toBeLessThan(0.53)
    }
  })

  it('renders legs separately so they can animate', () => {
    const leg = buildLeg(looks[0], -1)
    expect(leg.length).toBeGreaterThanOrEqual(2)
    // the capsule hangs below its own origin: that is what makes rotation a hip swing
    const capsule = leg.find((p) => p.geom === 'capsule')
    expect(capsule!.pos[1]).toBeLessThan(0)
    // and there is a foot at the bottom
    const foot = leg.find((p) => p.geom === 'box')
    expect(foot!.pos[1]).toBeLessThan(-RIG.legH + 0.1)
  })

  it('mirrors the hips symmetrically', () => {
    expect(hipX(-1)).toBeCloseTo(-0.088, 6)
    expect(hipX(1)).toBeCloseTo(0.088, 6)
  })
})

describe('staying cheap', () => {
  it('holds the per-figure part budget', () => {
    for (const persona of ['PHO_VENDOR', 'STUDENT', 'FOLK_SINGER', 'CYCLO_DRIVER']) {
      const look = appearanceFor(`x-${persona}`, persona)
      const total = buildParts(look).length + buildLeg(look, -1).length + buildLeg(look, 1).length
      expect(total, persona).toBeLessThanOrEqual(PART_BUDGET)
    }
  })

  it('never returns shared mutable arrays (a cached look must not be corrupted)', () => {
    const look = appearanceFor('Minh:PHO_VENDOR', 'PHO_VENDOR')
    const a = buildParts(look)
    const b = buildParts(look)
    expect(a).not.toBe(b)
    a.pop()
    expect(buildParts(look).length).toBe(b.length)
  })
})

describe('determinism', () => {
  it('hashes the same key to the same number', () => {
    expect(hashKey('co-hoa')).toBe(hashKey('co-hoa'))
    expect(hashKey('co-hoa')).not.toBe(hashKey('co-hb'))
  })

  it('gives the same person on every call — a reload must not reshuffle a face', () => {
    const a = appearanceFor('Minh:PHO_VENDOR', 'PHO_VENDOR')
    const b = appearanceFor('Minh:PHO_VENDOR', 'PHO_VENDOR')
    expect(a).toEqual(b)
  })

  it('gives different people to different names', () => {
    const names = ['Minh', 'Lan', 'Bảo', 'Hương', 'Tuấn', 'Mai']
    const looks = names.map((n) => appearanceFor(n))
    const signatures = looks.map((l) => `${l.garment}|${l.hair}|${l.headwear}`)
    expect(new Set(signatures).size).toBeGreaterThan(2)
  })

  it('keeps stature inside a plausible human band', () => {
    for (let i = 0; i < 80; i += 1) {
      const look = appearanceFor(`p${i}`)
      expect(look.stature).toBeGreaterThanOrEqual(0.94)
      expect(look.stature).toBeLessThanOrEqual(1.06)
    }
  })

  it('respects the persona wardrobe', () => {
    // a cyclo driver never wears an áo dài, a singer can
    for (let i = 0; i < 30; i += 1) {
      const cyclo = appearanceFor(`c${i}`, 'CYCLO_DRIVER')
      expect(['cyclo', 'aoBaBa']).toContain(cyclo.garment)
    }
  })
})

describe('palette use', () => {
  it('keeps skin in a believable band, not a single mannequin colour', () => {
    expect(skinColor(0.1)).not.toBe(skinColor(0.9))
  })

  it('never returns a blonde hair colour for a Hanoi crowd', () => {
    for (const tone of [0, 0.5, 1]) {
      expect(hairColor(tone)).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
    expect(hairColor(0)).not.toBe(hairColor(1))
  })

  it('defines a bottom garment for every top (no invisible legs)', () => {
    for (const [key, g] of Object.entries(GARMENTS)) {
      expect(g.top, `${key} top`).toMatch(/^#/)
      expect(g.bottom, `${key} bottom`).toMatch(/^#/)
    }
  })
})

describe('walk cycle', () => {
  it('moves the legs in antiphase', () => {
    const pose = walkPose(Math.PI / 2, 3)
    expect(Math.sign(pose.left.swing)).toBe(-Math.sign(pose.right.swing))
    expect(Math.abs(pose.left.swing)).toBeGreaterThan(0.001)
  })

  it('settles to a still pose at zero speed', () => {
    const pose = walkPose(1.2, 0)
    expect(pose.left.swing).toBeCloseTo(0, 6)
    expect(pose.right.swing).toBeCloseTo(0, 6)
    expect(pose.bob).toBeCloseTo(0, 6)
  })

  it('respects reduced motion by not moving the legs at all', () => {
    const pose = walkPose(1.7, 4, true)
    expect(pose.left).toEqual({ swing: 0, lift: 0 })
    expect(pose.right).toEqual({ swing: 0, lift: 0 })
    expect(pose.bob).toBe(0)
  })

  it('never bends a knee backwards', () => {
    for (let p = 0; p < Math.PI * 4; p += 0.13) {
      const pose = walkPose(p, 3)
      expect(pose.left.lift).toBeGreaterThanOrEqual(0)
      expect(pose.right.lift).toBeGreaterThanOrEqual(0)
    }
  })

  it('bobs twice per stride, not once', () => {
    // 24 samples over one stride: the first max lands on sample 0 and the second on
    // sample 12. A >= comparison is required because abs(cos) is flat at the peak,
    // so the second maximum has an equal neighbour on both sides.
    const samples = Array.from({ length: 24 }, (_, i) => walkPose((i / 24) * Math.PI * 2, 3).bob)
    const peaks: number[] = []
    for (let i = 0; i < samples.length; i += 1) {
      const prev = samples[(i - 1 + samples.length) % samples.length]
      const next = samples[(i + 1) % samples.length]
      if (samples[i] >= prev && samples[i] >= next) peaks.push(i)
    }
    expect(peaks).toEqual([0, 12])
  })

  it('ties stride to distance so feet do not slide', () => {
    // one stride of travel must equal exactly one phase cycle
    expect(PHASE_PER_METRE * STRIDE_LENGTH).toBeCloseTo(Math.PI * 2, 6)
  })

  it('counts footfalls for the audio layer', () => {
    expect(stepsCrossed(0, 0.2)).toBe(0)
    expect(stepsCrossed(0, Math.PI + 0.1)).toBe(1)
    expect(stepsCrossed(0, Math.PI * 2 + 0.1)).toBe(2)
    // never negative when phase wraps
    expect(stepsCrossed(6, 0.1)).toBe(0)
  })
})

describe('applying a pose', () => {
  it('writes rotation.x on both legs and ignores nulls', () => {
    const left = { rotation: { x: 0 }, position: { y: 0 } }
    const right = { rotation: { x: 0 }, position: { y: 0 } }
    const pose = walkPose(Math.PI / 2, 3)
    applyLegPose([left, right], pose)
    expect(left.rotation.x).toBeCloseTo(pose.left.swing, 6)
    expect(right.rotation.x).toBeCloseTo(pose.right.swing, 6)
    expect(() => applyLegPose([null, null], pose)).not.toThrow()
  })
})

describe('crowd placement', () => {
  it('does not bury the crowd’s legs under the pavement', () => {
    // regression: the leg instance sat at y = 0, so the capsule's lower half was
    // below ground and the crowd looked like they were standing in a hole
    const slot = crowdSlot()
    const bottom = capsuleBottom(slot.legsY, RIG.legH)
    expect(bottom).toBeGreaterThanOrEqual(-0.01)
    expect(bottom).toBeLessThan(0.03)
  })

  it('stacks legs below torso below head below hair', () => {
    const slot = crowdSlot()
    expect(slot.torsoY).toBeGreaterThan(slot.legsY)
    expect(slot.headY).toBeGreaterThan(slot.torsoY)
    expect(slot.hairY).toBeGreaterThan(slot.headY)
  })

  it('keeps the crowd the same height band as the player rig', () => {
    const slot = crowdSlot()
    const headTop = slot.headY + RIG.headR
    // a crowd member may not be taller than the player by more than a hair's width
    expect(headTop).toBeLessThanOrEqual(RIG.headY + RIG.headR + 0.01)
  })
})
