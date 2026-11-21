import { useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QUEST_GIVERS, SPAWN, TREES } from '@world/data/hoanKiem'
import { LAKE } from '@world/data/hoanKiem'
import { TileStreamer } from '@world/streamer'
import { districtAt, districtName, tileAt } from '@world/grid'
import { useGameStore } from '../store'
import { playerRef } from '../world-ref'
import { atmosphereAt } from './atmosphere'
import { City } from './City'
import { Lake } from './Lake'
import { Player } from './Player'

const Ground = () => {
  const patches = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = i * 2.399
        return {
          x: LAKE.cx + Math.cos(angle) * (140 + i * 46),
          z: LAKE.cz + Math.sin(angle) * (170 + i * 38),
          s: 70 + ((i * 37) % 90),
          color: i % 3 === 0 ? '#97DA55' : i % 3 === 1 ? '#6DBB39' : '#84CB46',
        }
      }),
    [],
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2500, 0, 2000]} receiveShadow>
        <planeGeometry args={[5200, 4200]} />
        <meshStandardMaterial color="#7CC63F" roughness={1} />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.012, p.z]}>
          <circleGeometry args={[p.s, 20]} />
          <meshStandardMaterial color={p.color} roughness={1} transparent opacity={0.55} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        return (
          <mesh
            key={`hill-${i}`}
            position={[LAKE.cx + Math.cos(a) * 1150, 14, LAKE.cz + Math.sin(a) * 1150]}
            scale={[260, 70, 150]}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#519B34" roughness={1} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

const QuestMarkers = () => {
  const groupRefs = useRef<Array<THREE.Group | null>>([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    groupRefs.current.forEach((g, i) => {
      if (!g) return
      g.position.y = 2.65 + Math.sin(t * 1.8 + i) * 0.09
      g.rotation.y = t * 0.8
    })
  })

  return (
    <group>
      {QUEST_GIVERS.map((npc, i) => (
        <group key={npc.id} position={[npc.x, 0, npc.z]}>
          <mesh position={[0, 1.02, 0]} castShadow>
            <capsuleGeometry args={[0.31, 0.72, 6, 12]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#B8735F' : '#6B7F92'} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.62, 0]} castShadow>
            <sphereGeometry args={[0.23, 14, 12]} />
            <meshStandardMaterial color="#E3BE97" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <coneGeometry args={[0.44, 0.2, 16]} />
            <meshStandardMaterial color="#EADFC0" roughness={0.9} />
          </mesh>
          <group
            ref={(el) => {
              groupRefs.current[i] = el
            }}
            position={[0, 2.65, 0]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.26, 0.06, 8, 20]} />
              <meshStandardMaterial color="#FFF4D6" emissive="#D9A441" emissiveIntensity={0.9} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

const Villagers = () => {
  const bodies = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const spots = useMemo(
    () =>
      TREES.slice(0, 40).map((t, i) => ({
        x: t.x + ((i % 3) - 1) * 3.4,
        z: t.z + ((i % 5) - 2) * 2.6,
        yaw: (i * 1.37) % 6.28,
        color: ['#8B7A63', '#6E7F6A', '#A07A6B', '#7A6C86'][i % 4],
      })),
    [],
  )

  useLayoutEffect(() => {
    if (!bodies.current || !heads.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const sc = new THREE.Vector3(1, 1, 1)
    const c = new THREE.Color()
    spots.forEach((s, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw)
      m.compose(p.set(s.x, 0.92, s.z), q, sc)
      bodies.current?.setMatrixAt(i, m)
      bodies.current?.setColorAt(i, c.set(s.color))
      m.compose(p.set(s.x, 1.44, s.z), q, sc)
      heads.current?.setMatrixAt(i, m)
    })
    bodies.current.instanceMatrix.needsUpdate = true
    heads.current.instanceMatrix.needsUpdate = true
    if (bodies.current.instanceColor) bodies.current.instanceColor.needsUpdate = true
  }, [spots])

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, spots.length]} castShadow>
        <capsuleGeometry args={[0.26, 0.62, 5, 10]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, spots.length]} castShadow>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color="#DDB894" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}

const StreamerBridge = () => {
  const streamer = useMemo(() => new TileStreamer({ radius: 2, unloadRadius: 3, budgetPerTick: 6 }), [])
  const acc = useRef(0)
  const lastDistrict = useRef<string>('')

  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 0.25) return
    acc.current = 0
    streamer.update(playerRef.x, playerRef.z)
    const store = useGameStore.getState()
    if (store.phase === 'PLAYING') {
      store.setStreamStats(tileAt(playerRef.x, playerRef.z), streamer.loadedCount)
      const district = districtAt(playerRef.x, playerRef.z)
      if (lastDistrict.current && district !== lastDistrict.current) {
        store.addToast({ title: districtName(district), message: 'Bạn vừa bước sang một khu phố khác.', tone: 'info' })
      }
      lastDistrict.current = district
    }
  })

  return null
}

const Rig = () => {
  const minutes = useGameStore((s) => s.clock.minutes)
  const atm = useMemo(() => atmosphereAt(minutes), [minutes])

  useFrame(({ scene }) => {
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.set(atm.fog)
    }
  })

  return (
    <group>
      <color attach="background" args={[atm.sky]} />
      <fog attach="fog" args={[atm.fog, 220, 1500]} />
      <hemisphereLight args={[atm.sky, '#5C6B48', atm.ambient]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[LAKE.cx + 320, 420, LAKE.cz - 380]}
        intensity={atm.sunIntensity}
        color={atm.sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0006}
        shadow-camera-left={-620}
        shadow-camera-right={620}
        shadow-camera-top={620}
        shadow-camera-bottom={-620}
        shadow-camera-near={1}
        shadow-camera-far={2000}
      />
    </group>
  )
}

export const Scene = () => (
  <Canvas
    shadows
    dpr={[1, 1.7]}
    camera={{ position: [SPAWN.x, 7.5, SPAWN.z + 22], fov: 52, near: 0.6, far: 2800 }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.08
    }}
  >
    <Rig />
    <Ground />
    <City />
    <Lake />
    <Villagers />
    <QuestMarkers />
    <Player />
    <StreamerBridge />
  </Canvas>
)
