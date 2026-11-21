import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BUILDINGS, facadeColor, TREES } from '@world/data/hoanKiem'
import { STREETS } from '@world/data/streets'

const DEG = Math.PI / 180

/** Tube houses of the Old Quarter — one instanced mesh, one draw call. */
const Buildings = () => {
  const body = useRef<THREE.InstancedMesh>(null)
  const roofs = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!body.current || !roofs.current) return
    const matrix = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const color = new THREE.Color()

    BUILDINGS.forEach((b, i) => {
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), b.rotY * DEG)
      pos.set(b.x, b.h / 2, b.z)
      scale.set(b.w, b.h, b.d)
      matrix.compose(pos, quat, scale)
      body.current?.setMatrixAt(i, matrix)
      body.current?.setColorAt(i, color.set(facadeColor(b.palette)))

      pos.set(b.x, b.h + 0.22, b.z)
      scale.set(b.w + 0.9, 0.45, b.d + 0.9)
      matrix.compose(pos, quat, scale)
      roofs.current?.setMatrixAt(i, matrix)
      roofs.current?.setColorAt(i, color.set(b.palette % 2 === 0 ? '#B4674E' : '#A25C48'))
    })

    body.current.instanceMatrix.needsUpdate = true
    roofs.current.instanceMatrix.needsUpdate = true
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true
    if (roofs.current.instanceColor) roofs.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, BUILDINGS.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.92} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, BUILDINGS.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} metalness={0} />
      </instancedMesh>
    </group>
  )
}

/** Trees: two instanced meshes (trunks + canopies) for the whole park. */
const Trees = () => {
  const trunks = useRef<THREE.InstancedMesh>(null)
  const leaves = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!trunks.current || !leaves.current) return
    const matrix = new THREE.Matrix4()
    const quat = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const color = new THREE.Color()

    TREES.forEach((t, i) => {
      pos.set(t.x, 2.4 * t.scale, t.z)
      scale.set(t.scale, t.scale, t.scale)
      matrix.compose(pos, quat, scale)
      trunks.current?.setMatrixAt(i, matrix)

      pos.set(t.x, (5.6 + t.hue * 1.2) * t.scale, t.z)
      const s = (3.4 + t.hue * 1.6) * t.scale
      scale.set(s, s * 0.86, s)
      matrix.compose(pos, quat, scale)
      leaves.current?.setMatrixAt(i, matrix)
      const green = t.hue > 0.62 ? '#8FD44A' : t.hue > 0.3 ? '#63B944' : '#4E9F35'
      leaves.current?.setColorAt(i, color.set(green))
    })

    trunks.current.instanceMatrix.needsUpdate = true
    leaves.current.instanceMatrix.needsUpdate = true
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true
  }, [])

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES.length]} castShadow>
        <cylinderGeometry args={[0.42, 0.62, 4.8, 6]} />
        <meshStandardMaterial color="#7A6247" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, TREES.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}

/** Streets as flat strips — cheap, readable, and they anchor the POIs. */
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
          <meshStandardMaterial color="#B9B0A0" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** Ô Quan Chưởng — the last old city gate, a silhouette that says "Hà Nội". */
const OldGate = () => (
  <group position={[2696, 0, 1006]} rotation={[0, -0.2, 0]}>
    <mesh position={[0, 5, 0]} castShadow receiveShadow>
      <boxGeometry args={[16, 10, 6]} />
      <meshStandardMaterial color="#B7A88C" roughness={1} />
    </mesh>
    <mesh position={[0, 7.4, 3.1]} castShadow>
      <boxGeometry args={[6.4, 5.2, 0.5]} />
      <meshStandardMaterial color="#4B4238" roughness={1} />
    </mesh>
    <mesh position={[0, 10.6, 0]} castShadow>
      <boxGeometry args={[18, 1.2, 7.6]} />
      <meshStandardMaterial color="#8E7F66" roughness={1} />
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
