import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BUILDINGS, facadeColor, TREES } from '@world/data/hoanKiem'
import { STREETS } from '@world/data/streets'
import { WORLD } from '@world/palette'
import { awningTexture, roofTileTexture, signTexture, stuccoTexture } from './textures'

const DEG = Math.PI / 180
const UP = new THREE.Vector3(0, 1, 0)
const RIGHT = new THREE.Vector3(1, 0, 0)

/** deterministic 0..1 from an integer — same building, same details, every load */
const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface InstancePayload {
  mats: THREE.Matrix4[]
  cols: THREE.Color[]
}

const emptyPayload = (): InstancePayload => ({ mats: [], cols: [] })

const writeInstances = (
  mesh: THREE.InstancedMesh | null,
  payload: InstancePayload,
  castShadows = true,
) => {
  if (!mesh) return
  const n = payload.mats.length
  for (let i = 0; i < n; i += 1) {
    mesh.setMatrixAt(i, payload.mats[i])
    mesh.setColorAt(i, payload.cols[i])
  }
  mesh.count = n // draw exactly what we filled
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.castShadow = castShadows
}

const compose = (
  pos: THREE.Vector3,
  quat: THREE.Quaternion,
  scale: THREE.Vector3,
): THREE.Matrix4 => new THREE.Matrix4().compose(pos, quat, scale)

/**
 * Tube houses of the Old Quarter — the textured rebuild.
 *
 * Layers (one instanced mesh per part, ~14 draw calls for 709 houses):
 *   body (stucco speckle) → plinth → barrel-tile roof → ridge → green shutters →
 *   sills → balcony slab/rail → striped awnings → shopfront signboards
 *
 * Every detail decision is a hash of the building index, so the quarter looks
 * deliberate — shops cluster, houses vary — and never changes between reloads.
 */
const Buildings = () => {
  const body = useRef<THREE.InstancedMesh>(null)
  const plinth = useRef<THREE.InstancedMesh>(null)
  const roofs = useRef<THREE.InstancedMesh>(null)
  const ridge = useRef<THREE.InstancedMesh>(null)
  const shutters = useRef<THREE.InstancedMesh>(null)
  const sills = useRef<THREE.InstancedMesh>(null)
  const slab = useRef<THREE.InstancedMesh>(null)
  const rail = useRef<THREE.InstancedMesh>(null)
  const signRefs = useRef<Array<THREE.InstancedMesh | null>>([])
  const awningRefs = useRef<Array<THREE.InstancedMesh | null>>([])

  const tex = useMemo(() => {
    const stucco = stuccoTexture()
    stucco.repeat.set(2, 2)
    const tile = roofTileTexture()
    tile.repeat.set(2, 2)
    return {
      stucco,
      tile,
      awningA: awningTexture(WORLD.awningB, WORLD.signCream, 'awning-red'),
      awningB: awningTexture(WORLD.tealDeep, WORLD.signCream, 'awning-teal'),
      signs: [0, 1, 2, 3, 4, 5].map((i) => signTexture(i)),
    }
  }, [])

  useLayoutEffect(() => {
    const q = new THREE.Quaternion()
    const tilt = new THREE.Quaternion()
    const local = new THREE.Vector3()
    const v = new THREE.Vector3()
    const s = new THREE.Vector3()
    const c = new THREE.Color()

    const pBody = emptyPayload()
    const pPlinth = emptyPayload()
    const pRoof = emptyPayload()
    const pRidge = emptyPayload()
    const pShutter = emptyPayload()
    const pSill = emptyPayload()
    const pSlab = emptyPayload()
    const pRail = emptyPayload()
    const pSigns = [0, 1, 2, 3, 4, 5].map(emptyPayload)
    const pAwnings = [0, 1].map(emptyPayload)

    BUILDINGS.forEach((b, i) => {
      /* Authoring rotY aligns the long axis with the street; the tall tube face
       * (w×h) then points ALONG the road like a warehouse. Turning every house
       * 90° puts the narrow frontage on the street and the depth going back —
       * actual Hanoi tube-house layout. Details are painted on BOTH ±z faces so
       * whichever side of the street the house stands on shows a shopfront. */
      const a = b.rotY * DEG + Math.PI / 2
      q.setFromAxisAngle(UP, a)
      const r1 = hash(i * 7 + 1)
      const r2 = hash(i * 7 + 2)
      const r3 = hash(i * 7 + 3)
      const h = b.h
      const w = b.w
      const d = b.d

      /* ---- body: stucco walls tinted per palette slot ---- */
      pBody.mats.push(compose(v.set(b.x, h / 2, b.z), q, s.set(w, h, d)))
      pBody.cols.push(c.set(facadeColor(b.palette)).clone())

      /* ---- plinth: ground floor reads heavier ---- */
      pPlinth.mats.push(compose(v.set(b.x, 0.36, b.z), q, s.set(w + 0.08, 0.72, d + 0.08)))
      pPlinth.cols.push(c.set(WORLD.stoneMid).clone())

      /* ---- roof: NGÓI ÂM DƯƠNG barrel tiles ---- */
      pRoof.mats.push(compose(v.set(b.x, h + 0.26, b.z), q, s.set(w + 0.85, 0.52, d + 0.85)))
      pRoof.cols.push(c.set(i % 2 === 0 ? WORLD.roofA : WORLD.roofB).clone())

      /* ---- ridge: the rounded tile spine ---- */
      tilt.setFromAxisAngle(RIGHT, Math.PI / 2)
      const ridgeQuat = q.clone().multiply(tilt)
      pRidge.mats.push(compose(v.set(b.x, h + 0.55, b.z), ridgeQuat, s.set(0.2, w * 0.9, 0.2)))
      pRidge.cols.push(c.set(WORLD.roofTile).clone())

      /* ---- windows: green Hanoi shutters + sills, upper floors only ---- */
      const isShop = r1 < 0.38
      const floors = Math.max(1, Math.min(4, Math.floor(h / 3.6)))
      const startFloor = isShop ? 1 : 0
      const cols = 3
      for (const face of [1, -1] as const) {
        for (let f = startFloor; f < floors; f += 1) {
          for (let col = 0; col < cols; col += 1) {
            const lx = (col - 1) * (w * 0.3)
            local.set(lx, 2.1 + f * 3.3, face * (d / 2 + 0.045)).applyQuaternion(q)
            pShutter.mats.push(compose(v.set(b.x + local.x, local.y, b.z + local.z), q, s.set(0.74, 1.02, 0.09)))
            pShutter.cols.push(c.set(WORLD.shutterGreen).clone())
            local.set(lx, 2.1 + f * 3.3 - 0.62, face * (d / 2 + 0.075)).applyQuaternion(q)
            pSill.mats.push(compose(v.set(b.x + local.x, local.y, b.z + local.z), q, s.set(0.94, 0.09, 0.16)))
            pSill.cols.push(c.set(WORLD.wallWhite).clone())
          }
        }
      }

      /* ---- shopfront signboard — real Vietnamese lettering ---- */
      if (isShop) {
        const variant = Math.floor(r2 * 887) % 6
        const signW = Math.min(w * 0.84, 4.4)
        for (const face of [1, -1] as const) {
          local.set(0, 3.05, face * (d / 2 + 0.09)).applyQuaternion(q)
          pSigns[variant].mats.push(
            compose(v.set(b.x + local.x, local.y, b.z + local.z), q, s.set(signW, 0.72, 0.08)),
          )
          pSigns[variant].cols.push(c.set(WORLD.wallWhite).clone())

          /* ---- striped awning over the sidewalk (outer edge dips) ---- */
          if (r3 > 0.42) {
            const av = r3 > 0.72 ? 1 : 0
            const awn = new THREE.Quaternion().setFromAxisAngle(RIGHT, face * 0.34)
            const quat = q.clone().multiply(awn)
            local.set(0, 2.35, face * (d / 2 + 0.72)).applyQuaternion(q)
            pAwnings[av].mats.push(
              compose(v.set(b.x + local.x, local.y, b.z + local.z), quat, s.set(Math.min(w * 0.9, 5), 0.1, 1.28)),
            )
            pAwnings[av].cols.push(c.set(WORLD.wallWhite).clone())
          }
        }
      }

      /* ---- balcony for the tall houses — slab + top rail ---- */
      if (h > 9.5 && r2 > 0.35) {
        const by = h * 0.56
        for (const face of [1, -1] as const) {
          local.set(0, by, face * (d / 2 + 0.34)).applyQuaternion(q)
          pSlab.mats.push(compose(v.set(b.x + local.x, local.y, b.z + local.z), q, s.set(w * 0.72, 0.14, 0.72)))
          pSlab.cols.push(c.set(WORLD.pavement).clone())
          local.set(0, by + 0.38, face * (d / 2 + 0.66)).applyQuaternion(q)
          pRail.mats.push(compose(v.set(b.x + local.x, local.y, b.z + local.z), q, s.set(w * 0.72, 0.07, 0.07)))
          pRail.cols.push(c.set(WORLD.metalDark).clone())
        }
      }
    })

    writeInstances(body.current, pBody)
    writeInstances(plinth.current, pPlinth)
    writeInstances(roofs.current, pRoof)
    writeInstances(ridge.current, pRidge)
    writeInstances(shutters.current, pShutter, false)
    writeInstances(sills.current, pSill, false)
    writeInstances(slab.current, pSlab, false)
    writeInstances(rail.current, pRail, false)
    pSigns.forEach((payload, i) => writeInstances(signRefs.current[i], payload, false))
    pAwnings.forEach((payload, i) => writeInstances(awningRefs.current[i], payload, false))
  }, [])

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, BUILDINGS.length]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={tex.stucco} roughness={0.92} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={plinth} args={[undefined, undefined, BUILDINGS.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, BUILDINGS.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial map={tex.tile} roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={ridge} args={[undefined, undefined, BUILDINGS.length]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial roughness={0.9} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={shutters} args={[undefined, undefined, 14500]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.88} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={sills} args={[undefined, undefined, 14500]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={slab} args={[undefined, undefined, 1000]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={rail} args={[undefined, undefined, 1000]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.3} />
      </instancedMesh>
      {tex.signs.map((t, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            signRefs.current[i] = el
          }}
          args={[undefined, undefined, 120]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial map={t} roughness={0.85} metalness={0} />
        </instancedMesh>
      ))}
      {[tex.awningA, tex.awningB].map((t, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            awningRefs.current[i] = el
          }}
          args={[undefined, undefined, 400]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial map={t} roughness={0.9} metalness={0} />
        </instancedMesh>
      ))}
    </group>
  )
}

/**
 * Trees — layered canopies instead of single cones: a main crown plus two side
 * clusters gives the phượng vỹ / bàng silhouette of the lake park. ~10% bloom
 * scarlet (hoa phượng) for that May–June Hà Nội.
 */
const Trees = () => {
  const trunks = useRef<THREE.InstancedMesh>(null)
  const crown = useRef<THREE.InstancedMesh>(null)
  const sideA = useRef<THREE.InstancedMesh>(null)
  const sideB = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const c = new THREE.Color()

    const pTrunk = emptyPayload()
    const pCrown = emptyPayload()
    const pA = emptyPayload()
    const pB = emptyPayload()

    TREES.forEach((t, i) => {
      const yaw = hash(i * 13 + 5) * Math.PI * 2
      q.setFromAxisAngle(UP, yaw)
      const sBase = t.scale
      const blooming = t.hue > 0.88
      const crownColor = blooming
        ? WORLD.hoaPhuong
        : t.hue > 0.62
          ? WORLD.leafHueWarm
          : t.hue > 0.3
            ? WORLD.leafHueMid
            : WORLD.leafHueCool

      /* trunk — slight taper reads as age */
      pTrunk.mats.push(compose(p.set(t.x, 2.4 * sBase, t.z), q, s.set(sBase, sBase, sBase)))
      pTrunk.cols.push(c.set(WORLD.trunk).offsetHSL(0, 0, (hash(i * 3 + 11) - 0.5) * 0.07).clone())

      /* main crown */
      const cr = (3.6 + t.hue * 1.4) * sBase
      pCrown.mats.push(compose(p.set(t.x, (5.9 + t.hue) * sBase, t.z), q, s.set(cr, cr * 0.82, cr)))
      pCrown.cols.push(c.set(crownColor).offsetHSL(0, 0, (hash(i * 5 + 7) - 0.5) * 0.08).clone())

      /* side clusters — the irregular, hand-drawn outline */
      pA.mats.push(
        compose(
          p.set(t.x + Math.cos(yaw) * cr * 0.72, (5.1 + t.hue) * sBase, t.z - Math.sin(yaw) * cr * 0.72),
          q,
          s.set(cr * 0.66, cr * 0.52, cr * 0.66),
        ),
      )
      pA.cols.push(c.set(crownColor).offsetHSL(0, -0.02, -0.045).clone())
      pB.mats.push(
        compose(
          p.set(t.x - Math.cos(yaw) * cr * 0.6, (6.7 + t.hue) * sBase, t.z + Math.sin(yaw) * cr * 0.6),
          q,
          s.set(cr * 0.55, cr * 0.48, cr * 0.55),
        ),
      )
      pB.cols.push(c.set(crownColor).offsetHSL(0, 0.03, 0.05).clone())
    })

    writeInstances(trunks.current, pTrunk)
    writeInstances(crown.current, pCrown)
    writeInstances(sideA.current, pA)
    writeInstances(sideB.current, pB)
  }, [])

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES.length]} castShadow>
        <cylinderGeometry args={[0.42, 0.66, 4.8, 7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, TREES.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
      <instancedMesh ref={sideA} args={[undefined, undefined, TREES.length]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
      <instancedMesh ref={sideB} args={[undefined, undefined, TREES.length]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}

/** Streets as flat strips with a sandalstone kerb tint — cheap and readable. */
const Roads = () => {
  const segments = useMemo(() => {
    const out: Array<{ x: number; z: number; len: number; angle: number; width: number }> = []
    for (const street of STREETS) {
      for (let i = 1; i < street.points.length; i += 1) {
        const [ax, az] = street.points[i - 1]
        const [bx, bz] = street.points[i]
        const len = Math.hypot(bx - ax, bz - az)
        out.push({
          x: (ax + bx) / 2,
          z: (az + bz) / 2,
          len,
          angle: Math.atan2(bx - ax, bz - az),
          width: street.width,
        })
      }
    }
    return out
  }, [])

  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0.03, s.z]} rotation={[-Math.PI / 2, 0, -s.angle]} receiveShadow>
          <planeGeometry args={[s.width, s.len]} />
          <meshStandardMaterial color={WORLD.kerbStone} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** Ô Quan Chưởng — tiled top instead of a bare slab. */
const OldGate = () => (
  <group position={[2696, 0, 1006]} rotation={[0, -0.2, 0]}>
    <mesh position={[0, 5, 0]} castShadow receiveShadow>
      <boxGeometry args={[16, 10, 6]} />
      <meshStandardMaterial color={WORLD.pavement} roughness={1} />
    </mesh>
    <mesh position={[0, 7.4, 3.1]} castShadow>
      <boxGeometry args={[6.4, 5.2, 0.5]} />
      <meshStandardMaterial color={WORLD.asphalt} roughness={1} />
    </mesh>
    <mesh position={[0, 10.6, 0]} castShadow>
      <boxGeometry args={[18, 1.2, 7.6]} />
      <meshStandardMaterial map={roofTileTexture()} color={WORLD.roofA} roughness={0.85} />
    </mesh>
  </group>
)

export const City = () => (
  <group>
    <Roads />
    <Buildings />
    <Trees />
    <OldGate />
  </group>
)
