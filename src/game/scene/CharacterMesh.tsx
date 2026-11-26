/**
 * Renders a character from `buildParts`. One implementation for the player, quest
 * NPCs and (via instancing) the crowd — so a change to the rig shows up everywhere
 * instead of drifting between three copies.
 *
 * ADR-005: figures use cel shading (MeshToonMaterial, 3-step gradient map) — the
 * Genshin/“anime splash art” look comes from banded light + saturated albedo, not
 * from textures. Geometry is cached per unique argument signature: 40 parts across
 * 30 NPCs would otherwise allocate ~1200 BufferGeometries on mount. Materials are
 * cached per colour for the same reason. Where toon materials are unavailable
 * (test doubles), it falls back to MeshStandardMaterial.
 */
import { useMemo, type RefObject } from 'react'
import type * as THREE from 'three'
import type * as ThreeNS from 'three'
import { RIG, buildLeg, buildParts, hipX, type Appearance, type PartSpec } from './character'
import { WORLD } from '@world/palette'

const geomCache = new Map<string, THREE.BufferGeometry>()
const matCache = new Map<string, THREE.Material>()

/** Dark-leaf inverted hull — the anime outline pass, shared by every part. */
let hullMaterial: THREE.Material | null = null
const getHullMaterial = (THREEmod: typeof ThreeNS): THREE.Material => {
  if (!hullMaterial) {
    hullMaterial = new THREEmod.MeshBasicMaterial({ color: WORLD.hullDark, side: THREEmod.BackSide })
  }
  return hullMaterial
}

/** 3-step toon gradient (shadow · mid · lit). Shared by every toon material. */
let gradientMap: THREE.DataTexture | null = null
const getGradientMap = (THREEmod: typeof ThreeNS): THREE.DataTexture => {
  if (!gradientMap) {
    const data = new Uint8Array([96, 170, 255])
    gradientMap = new THREEmod.DataTexture(data, 3, 1, THREEmod.RedFormat)
    gradientMap.minFilter = THREEmod.NearestFilter
    gradientMap.magFilter = THREEmod.NearestFilter
    gradientMap.generateMipmaps = false
    gradientMap.needsUpdate = true
  }
  return gradientMap
}

/**
 * three's geometry constructors are resolved lazily from a tiny factory table so
 * this file imports three for *types* only and never duplicates the primitives
 * three already ships.
 */
type GeomCtor = new (args: number[]) => THREE.BufferGeometry

const makeGeometry = (spec: PartSpec, THREEmod: typeof ThreeNS): THREE.BufferGeometry => {
  const key = `${spec.geom}:${spec.args.join(',')}`
  const cached = geomCache.get(key)
  if (cached) return cached

  const a = spec.args
  let geometry: THREE.BufferGeometry
  switch (spec.geom) {
    case 'box':
      geometry = new THREEmod.BoxGeometry(a[0], a[1], a[2])
      break
    case 'capsule':
      geometry = new THREEmod.CapsuleGeometry(a[0], a[1], a[2] ?? 4, a[3] ?? 8)
      break
    case 'sphere':
      geometry = new THREEmod.SphereGeometry(a[0], a[1] ?? 12, a[2] ?? 8)
      break
    case 'cylinder':
      geometry = new THREEmod.CylinderGeometry(a[0], a[1], a[2], a[3] ?? 8)
      break
    case 'cone':
      geometry = new THREEmod.ConeGeometry(a[0], a[1], a[2] ?? 12)
      break
    case 'torus':
      geometry = new THREEmod.TorusGeometry(a[0], a[1], a[2] ?? 6, a[3] ?? 12)
      break
  }
  geomCache.set(key, geometry)
  return geometry
}

const makeMaterial = (spec: PartSpec, THREEmod: typeof ThreeNS): THREE.Material => {
  const key = `${spec.color}:${spec.rough ?? 0.9}`
  const cached = matCache.get(key)
  if (cached) return cached
  // Cel shading first; plain standard material only where toon is unavailable.
  const MaterialCtor = (THREEmod as { MeshToonMaterial?: new (args: Record<string, unknown>) => THREE.Material })
    .MeshToonMaterial
  const emissiveArgs = spec.emissive ? { emissive: spec.emissive, emissiveIntensity: spec.emissiveIntensity ?? 0.4 } : {}
  const material = MaterialCtor
    ? new MaterialCtor({ color: spec.color, gradientMap: getGradientMap(THREEmod), ...emissiveArgs })
    : new THREEmod.MeshStandardMaterial({
        color: spec.color,
        roughness: spec.rough ?? 0.9,
        metalness: 0,
        ...emissiveArgs,
      })
  matCache.set(key, material)
  return material
}

/** Exposed for tests: caches must not grow without bound across a session. */
export const cacheSizes = (): { geometry: number; material: number } => ({
  geometry: geomCache.size,
  material: matCache.size,
})

/**
 * Inverted hull: the same geometry pushed 5.5% larger, rendered BackSide in flat
 * dark leaf. Classic anime outline, and the single cheapest way to stop a
 * cel-shaded figure dissolving into a busy background.
 */
const OutlineList = ({ parts, THREEmod }: { parts: PartSpec[]; THREEmod: typeof ThreeNS }) => {
  const hull = getHullMaterial(THREEmod)
  return (
    <>
      {parts
        .filter((part) => !part.noOutline)
        .map((part, i) => {
          const [sx, sy, sz] = part.scale ?? [1, 1, 1]
          return (
            <mesh
              key={`hull-${part.geom}-${i}`}
              geometry={makeGeometry(part, THREEmod)}
              material={hull}
              position={[part.pos[0], part.pos[1], part.pos[2]]}
              rotation={part.rot ? [part.rot[0], part.rot[1], part.rot[2]] : undefined}
              scale={[sx * 1.055, sy * 1.055, sz * 1.055]}
            />
          )
        })}
    </>
  )
}

const PartList = ({ parts, THREEmod, castShadow }: { parts: PartSpec[]; THREEmod: typeof ThreeNS; castShadow: boolean }) => (
  <>
    {parts.map((part, i) => (
      <mesh
        // parts are a static ordered list; index is a stable key here
        key={`${part.geom}-${i}`}
        geometry={makeGeometry(part, THREEmod)}
        material={makeMaterial(part, THREEmod)}
        position={[part.pos[0], part.pos[1], part.pos[2]]}
        rotation={part.rot ? [part.rot[0], part.rot[1], part.rot[2]] : undefined}
        scale={part.scale ? [part.scale[0], part.scale[1], part.scale[2]] : undefined}
        castShadow={castShadow}
        receiveShadow={false}
      />
    ))}
  </>
)

/**
 * `legRefs` opts into the animated leg rig. When omitted (NPCs standing still, the
 * crowd) the figure is one static group and costs the same as before.
 */
export interface LegRefs {
  left: RefObject<ThreeNS.Group>
  right: RefObject<ThreeNS.Group>
}

export const CharacterMesh = ({
  look,
  THREEmod,
  castShadow = true,
  legRefs,
}: {
  look: Appearance
  /** injected so this component stays a pure function of its props in tests */
  THREEmod: typeof ThreeNS
  castShadow?: boolean
  legRefs?: LegRefs
}) => {
  const parts = useMemo(() => buildParts(look), [look])
  const leftLeg = useMemo(() => buildLeg(look, -1), [look])
  const rightLeg = useMemo(() => buildLeg(look, 1), [look])

  return (
    <group scale={[look.stature, look.stature, look.stature]}>
      <OutlineList parts={parts} THREEmod={THREEmod} />
      <PartList parts={parts} THREEmod={THREEmod} castShadow={castShadow} />

      {/* legs pivot at the hip so the walk cycle can rotate them */}
      <group ref={legRefs?.left} position={[hipX(-1), RIG.hipY, 0]}>
        <OutlineList parts={leftLeg} THREEmod={THREEmod} />
        <PartList parts={leftLeg} THREEmod={THREEmod} castShadow={castShadow} />
      </group>
      <group ref={legRefs?.right} position={[hipX(1), RIG.hipY, 0]}>
        <OutlineList parts={rightLeg} THREEmod={THREEmod} />
        <PartList parts={rightLeg} THREEmod={THREEmod} castShadow={castShadow} />
      </group>
    </group>
  )
}

export type { GeomCtor }
