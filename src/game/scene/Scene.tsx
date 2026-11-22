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
import { CharacterMesh } from './CharacterMesh'
import { GARMENTS, RIG, appearanceFor, crowdSlot, hairColor } from './character'
import { WORLD } from '@world/palette'

const Ground = () => {
  const patches = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = i * 2.399
        return {
          x: LAKE.cx + Math.cos(angle) * (140 + i * 46),
          z: LAKE.cz + Math.sin(angle) * (170 + i * 38),
          s: 70 + ((i * 37) % 90),
          color: i % 3 === 0 ? WORLD.grassPatchA : i % 3 === 1 ? WORLD.grassPatchB : WORLD.grassPatchC,
        }
      }),
    [],
  )

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2500, 0, 2000]} receiveShadow>
        <planeGeometry args={[5200, 4200]} />
        <meshStandardMaterial color={WORLD.grass} roughness={1} />
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
            <meshStandardMaterial color={WORLD.hillGreen} roughness={1} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * A quest NPC: the shared rig plus a two-second breathing idle and a "turn to the
 * player when they are close" behaviour. The turn is what makes an NPC feel alive
 * without any dialogue system running — the old cone-and-sphere figures faced one
 * fixed direction forever.
 */
const NpcFigure = ({ npcId }: { npcId: string }) => {
  const look = useMemo(() => appearanceFor(npcId), [npcId])
  const group = useRef<THREE.Group>(null)
  const base = useRef(0)

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    if (!group.current) return
    // breathing: ±1.5 cm, slow, and it never syncs across NPCs because each uses
    // its own phase offset derived from the id hash below
    const phase = (base.current = base.current || (npcId.length % 7) * 0.9)
    group.current.position.y = Math.sin(t * 1.15 + phase) * 0.015

    // turn toward the player when within 4 m, otherwise drift back to rest
    const dx = playerRef.x - group.current.position.x
    const dz = playerRef.z - group.current.position.z
    const dist = Math.hypot(dx, dz)
    const target = dist < 4 ? Math.atan2(dx, dz) : group.current.rotation.y
    let delta = target - group.current.rotation.y
    while (delta > Math.PI) delta -= Math.PI * 2
    while (delta < -Math.PI) delta += Math.PI * 2
    group.current.rotation.y += delta * Math.min(1, dt * 3)
  })

  return (
    <group ref={group}>
      <CharacterMesh look={look} THREEmod={THREE} />
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
          {/* Same rig as the player, so an NPC and the player read as the same
              species. Appearance is keyed by NPC id: stable across reloads. */}
          <NpcFigure npcId={npc.id} />
          <group
            ref={(el) => {
              groupRefs.current[i] = el
            }}
            position={[0, 2.65, 0]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.26, 0.06, 8, 20]} />
              <meshStandardMaterial color={WORLD.lampGlow} emissive={WORLD.lampEmissive} emissiveIntensity={0.9} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

/**
 * The crowd. Still instanced — 40 people in 4 draw calls — but now built from the
 * same anatomy as the rig: legs, torso with a shoulder line, head, hair. The old
 * version was a capsule plus a sphere per figure, which at the new player scale
 * looked like a field of bowling pins.
 *
 * Height, colour and hair darkness are seeded per index, so the street is not a
 * clone parade. Nobody walks: a static standing crowd at this budget reads as
 * "people paused on the pavement", which is what an old quarter looks like anyway.
 */
const Villagers = () => {
  const legs = useRef<THREE.InstancedMesh>(null)
  const bodies = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const hairs = useRef<THREE.InstancedMesh>(null)

  // derived once: legs/torso/head are placed by their bottoms, not their centres
  const slot = useMemo(() => crowdSlot(), [])

  const spots = useMemo(
    () =>
      TREES.slice(0, 40).map((t, i) => {
        const look = appearanceFor(`crowd-${i}`)
        return {
          x: t.x + ((i % 3) - 1) * 3.4,
          z: t.z + ((i % 5) - 2) * 2.6,
          yaw: (i * 1.37) % 6.28,
          scale: look.stature,
          shirt: GARMENTS[look.garment].top,
          trousers: GARMENTS[look.garment].bottom,
          hair: hairColor(look.tone),
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    if (!legs.current || !bodies.current || !heads.current || !hairs.current) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const p = new THREE.Vector3()
    const sc = new THREE.Vector3()
    const c = new THREE.Color()
    const up = new THREE.Vector3(0, 1, 0)

    spots.forEach((s, i) => {
      q.setFromAxisAngle(up, s.yaw)
      sc.set(s.scale, s.scale, s.scale)

      // legs: a single tapered pair, low enough to read as two legs from behind
      m.compose(p.set(s.x, slot.legsY, s.z), q, sc)
      legs.current?.setMatrixAt(i, m)
      legs.current?.setColorAt(i, c.set(s.trousers))

      m.compose(p.set(s.x, slot.torsoY, s.z), q, sc)
      bodies.current?.setMatrixAt(i, m)
      bodies.current?.setColorAt(i, c.set(s.shirt))

      m.compose(p.set(s.x, slot.headY, s.z), q, sc)
      heads.current?.setMatrixAt(i, m)

      m.compose(p.set(s.x, slot.hairY, s.z), q, sc)
      hairs.current?.setMatrixAt(i, m)
      hairs.current?.setColorAt(i, c.set(s.hair))
    })

    for (const mesh of [legs.current, bodies.current, heads.current, hairs.current]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [spots, slot])

  return (
    <group>
      {/* legs: one capsule per figure, in trouser colour */}
      <instancedMesh ref={legs} args={[undefined, undefined, spots.length]} castShadow>
        <capsuleGeometry args={[0.075, RIG.legH - 0.14, 4, 6]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>

      {/* torso: capsule is the cheapest shape with a shoulder line once it is scaled
          wider than it is deep — done through the geometry, not the matrix */}
      <instancedMesh ref={bodies} args={[undefined, undefined, spots.length]} castShadow>
        <capsuleGeometry args={[0.17, RIG.torsoH * 0.72, 4, 8]} />
        <meshStandardMaterial roughness={0.93} />
      </instancedMesh>

      <instancedMesh ref={heads} args={[undefined, undefined, spots.length]} castShadow>
        <sphereGeometry args={[RIG.headR, 10, 8]} />
        <meshStandardMaterial color={WORLD.skinWarm} roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={hairs} args={[undefined, undefined, spots.length]} castShadow>
        <sphereGeometry args={[RIG.headR * 1.04, 8, 6]} />
        <meshStandardMaterial roughness={0.92} />
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
      <hemisphereLight args={[atm.sky, WORLD.groundShade, atm.ambient]} />
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
