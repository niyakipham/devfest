import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { LAKE } from '@world/data/hoanKiem'
import { WORLD } from '@world/palette'

const Water = () => (
  <group>
    <mesh
      position={[LAKE.cx, 0.02, LAKE.cz]}
      scale={[LAKE.rx + 16, LAKE.rz + 16, 1]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <circleGeometry args={[1, 96]} />
      <meshStandardMaterial color={WORLD.lakeShore} roughness={1} />
    </mesh>
    <mesh position={[LAKE.cx, 0.08, LAKE.cz]} scale={[LAKE.rx, LAKE.rz, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1, 96]} />
      <meshStandardMaterial color={WORLD.lakeWater} roughness={0.14} metalness={0.2} transparent opacity={0.97} />
    </mesh>
    <mesh
      position={[LAKE.cx, 0.1, LAKE.cz]}
      scale={[LAKE.rx * 0.72, LAKE.rz * 0.8, 1]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[1, 64]} />
      <meshStandardMaterial color={WORLD.waterGlow} roughness={0.2} metalness={0.1} transparent opacity={0.3} />
    </mesh>
  </group>
)

/** Tháp Rùa — three tiers, weathered stone, the icon of the lake. */
const TurtleTower = () => (
  <group position={[2430, 0, 1700]}>
    <mesh position={[0, 0.8, 0]} receiveShadow>
      <cylinderGeometry args={[17, 19, 1.6, 12]} />
      <meshStandardMaterial color={WORLD.rockDark} roughness={1} />
    </mesh>
    <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
      <boxGeometry args={[11, 6, 11]} />
      <meshStandardMaterial color={WORLD.stoneLight} roughness={0.95} />
    </mesh>
    <mesh position={[0, 8.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[8, 1.8, 8]} />
      <meshStandardMaterial color={WORLD.stoneMid} roughness={0.95} />
    </mesh>
    <mesh position={[0, 11.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[6, 4, 6]} />
      <meshStandardMaterial color={WORLD.stoneLight} roughness={0.95} />
    </mesh>
    <mesh position={[0, 14.1, 0]} castShadow>
      <coneGeometry args={[5.2, 2.6, 4]} />
      <meshStandardMaterial color={WORLD.stoneDeep} roughness={0.95} />
    </mesh>
    {[
      [0, 4.8, 5.6],
      [5.6, 4.8, 0],
      [0, 8.6, 4.1],
      [-4.1, 8.6, 0],
    ].map((p, i) => (
      <mesh key={i} position={[p[0], p[1], p[2]]} rotation={[0, i * (Math.PI / 2), 0]}>
        <boxGeometry args={[1.4, 2.4, 0.2]} />
        <meshStandardMaterial color={WORLD.metalDark} roughness={1} />
      </mesh>
    ))}
  </group>
)

/** Đền Ngọc Sơn + Cầu Thế Húc. */
const NgocSonTemple = () => (
  <group>
    <mesh position={[2400, 0.5, 1315]} receiveShadow>
      <cylinderGeometry args={[25, 27, 1, 16]} />
      <meshStandardMaterial color={WORLD.islandGrass} roughness={1} />
    </mesh>

    <group position={[2400, 1, 1330]}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 4.4, 10]} />
        <meshStandardMaterial color={WORLD.stoneWarm} roughness={0.95} />
      </mesh>
      <mesh position={[0, 5.4, 0]} castShadow>
        <coneGeometry args={[10, 3, 4]} />
        <meshStandardMaterial color={WORLD.roofTile} roughness={0.85} />
      </mesh>
      <mesh position={[0, 7.6, 0]} castShadow>
        <coneGeometry args={[5.6, 2.2, 4]} />
        <meshStandardMaterial color={WORLD.lacquerDark} roughness={0.85} />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 2.4, 5.2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 4.8, 8]} />
          <meshStandardMaterial color={WORLD.lacquerRed} roughness={0.9} />
        </mesh>
      ))}
    </group>

    <group position={[2400, 0, 1245]}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const t = i / 5
        return (
          <group key={i} position={[0, 1.4 + Math.sin(t * Math.PI) * 2.6, -t * 62]}>
            <mesh rotation={[Math.cos(t * Math.PI) * 0.42, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.6, 0.4, 11]} />
              <meshStandardMaterial color={WORLD.bridgeRed} roughness={0.9} />
            </mesh>
            {[-1.5, 1.5].map((x) => (
              <mesh key={x} position={[x, 0.9, 0]}>
                <boxGeometry args={[0.2, 0.9, 10.6]} />
                <meshStandardMaterial color={WORLD.bridgeRedDeep} roughness={0.9} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  </group>
)

const Benches = () => {
  const seats = useRef<THREE.InstancedMesh>(null)
  const legs = useRef<THREE.InstancedMesh>(null)
  const spots = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return {
          x: LAKE.cx + Math.cos(a) * (LAKE.rx + 20),
          z: LAKE.cz + Math.sin(a) * (LAKE.rz + 18),
          rot: -a + Math.PI / 2,
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    if (!seats.current || !legs.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const sc = new THREE.Vector3(1, 1, 1)
    spots.forEach((b, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rot)
      m.compose(p.set(b.x, 0.45, b.z), q, sc)
      seats.current?.setMatrixAt(i, m)
      m.compose(p.set(b.x, 0.2, b.z), q, sc)
      legs.current?.setMatrixAt(i, m)
    })
    seats.current.instanceMatrix.needsUpdate = true
    legs.current.instanceMatrix.needsUpdate = true
  }, [spots])

  return (
    <group>
      <instancedMesh ref={seats} args={[undefined, undefined, spots.length]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.16, 0.7]} />
        <meshStandardMaterial color={WORLD.pavilionWall} roughness={1} />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, spots.length]} castShadow>
        <boxGeometry args={[2.8, 0.4, 0.16]} />
        <meshStandardMaterial color={WORLD.pavilionShade} roughness={1} />
      </instancedMesh>
    </group>
  )
}

const Lamps = () => {
  const poles = useRef<THREE.InstancedMesh>(null)
  const bulbs = useRef<THREE.InstancedMesh>(null)
  const spots = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2
        return {
          x: LAKE.cx + Math.cos(a) * (LAKE.rx + 34),
          z: LAKE.cz + Math.sin(a) * (LAKE.rz + 32),
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    if (!poles.current || !bulbs.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const sc = new THREE.Vector3(1, 1, 1)
    spots.forEach((l, i) => {
      m.compose(p.set(l.x, 2.6, l.z), q, sc)
      poles.current?.setMatrixAt(i, m)
      m.compose(p.set(l.x, 5.35, l.z), q, sc)
      bulbs.current?.setMatrixAt(i, m)
    })
    poles.current.instanceMatrix.needsUpdate = true
    bulbs.current.instanceMatrix.needsUpdate = true
  }, [spots])

  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 5.2, 5]} />
        <meshStandardMaterial color={WORLD.lanternBody} roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[undefined, undefined, spots.length]}>
        <sphereGeometry args={[0.34, 10, 8]} />
        <meshStandardMaterial color={WORLD.lanternGlow} emissive={WORLD.lanternEmissive} emissiveIntensity={0.6} />
      </instancedMesh>
    </group>
  )
}

export const Lake = () => (
  <group>
    <Water />
    <TurtleTower />
    <NgocSonTemple />
    <Benches />
    <Lamps />
  </group>
)
