/**
 * Walkability: the lake is solid, buildings are oriented bounding boxes.
 * Shared by the renderer and by tests so "can I walk there?" has one answer.
 */
import { BUILDINGS, isInLake } from './data/hoanKiem'
import { WORLD_DEPTH, WORLD_WIDTH } from './grid'

const DEG = Math.PI / 180

const boxes = BUILDINGS.map((b) => ({
  x: b.x,
  z: b.z,
  halfW: b.w / 2 + 0.5,
  halfD: b.d / 2 + 0.5,
  cos: Math.cos(b.rotY * DEG),
  sin: Math.sin(b.rotY * DEG),
}))

export const PLAYER_RADIUS = 0.35

export const isWalkable = (x: number, z: number, radius = PLAYER_RADIUS): boolean => {
  if (x < 30 || z < 30 || x > WORLD_WIDTH - 30 || z > WORLD_DEPTH - 30) return false
  if (isInLake(x, z, 2 + radius)) return false

  for (const b of boxes) {
    const dx = x - b.x
    const dz = z - b.z
    if (Math.abs(dx) > 30 || Math.abs(dz) > 30) continue
    // world → building local space (three.js Y rotation)
    const lx = dx * b.cos - dz * b.sin
    const lz = dx * b.sin + dz * b.cos
    if (Math.abs(lx) < b.halfW + radius && Math.abs(lz) < b.halfD + radius) return false
  }
  return true
}

/** Sample a straight line; used by CI to prove quest routes are walkable. */
export const isPathWalkable = (
  from: { x: number; z: number },
  to: { x: number; z: number },
  step = 2,
): boolean => {
  const distance = Math.hypot(to.x - from.x, to.z - from.z)
  const steps = Math.max(1, Math.ceil(distance / step))
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    if (!isWalkable(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t)) return false
  }
  return true
}
