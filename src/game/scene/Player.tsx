import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { speedMultiplier } from '@shared/formulas'
import { isWalkable } from '@world/collision'
import { useGameStore } from '../store'
import { cameraRef, playerRef, syncPlayerRef } from '../world-ref'
import { CharacterMesh } from './CharacterMesh'
import { appearanceFor } from './character'
import { PHASE_PER_METRE, applyLegPose, walkPose } from './gait'

const blocked = (x: number, z: number): boolean => !isWalkable(x, z)

/** How often walked distance is committed to the journal (seconds of real time). */
const WALK_FLUSH_SECONDS = 1

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const keys = new Set<string>()

export const Player = () => {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const persona = useGameStore((s) => s.player.persona)
  // F9: respect the player setting and the OS preference, not a hard-coded false
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion) || prefersReducedMotion()
  /** RP-08 odometer: metres since the last flush, and time since the last flush */
  const walkedRef = useRef({ distance: 0, carry: 0 })
  /** walk-cycle phase, advanced by metres travelled so feet never slide */
  const gaitPhase = useRef(0)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const lastScan = useRef(0)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  // Appearance is derived from the player's name + persona, so the same save always
  // produces the same person (no reshuffle on reload).
  const name = useGameStore((s) => s.player.name)
  const look = useMemo(() => appearanceFor(`${name}:${persona}`, persona), [name, persona])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.add(e.code)
      if (e.code === 'KeyE') useGameStore.getState().interact()
      if (e.code === 'Escape') {
        const s = useGameStore.getState()
        if (s.mapOpen || s.journalOpen) return
        if (s.dialogue) s.closeDialogue()
        else if (s.phase === 'PLAYING') s.pause()
        else if (s.phase === 'PAUSED') s.resume()
      }
    }
    const up = (e: KeyboardEvent) => keys.delete(e.code)
    const blur = () => keys.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastPointer.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      dragging.current = false
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      cameraRef.yaw -= dx * 0.005
      cameraRef.pitch = Math.min(0.85, Math.max(0.06, cameraRef.pitch + dy * 0.004))
    }
    const onWheel = (e: WheelEvent) => {
      cameraRef.distance = Math.min(26, Math.max(6, cameraRef.distance + e.deltaY * 0.012))
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    const store = useGameStore.getState()
    if (store.phase !== 'PLAYING') return
    if (store.dialogue || store.journalOpen || store.mapOpen) {
      // menus freeze the body, not the world clock
      if (group.current) group.current.position.set(playerRef.x, 0, playerRef.z)
      return
    }

    const needs = store.player.needs
    const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const base = sprint ? 6.2 : 3.4
    const speed = base * speedMultiplier(needs)

    let forward = 0
    let strafe = 0
    if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1
    if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1

    const mag = Math.hypot(forward, strafe)
    const isMoving = mag > 0

    if (isMoving) {
      const nf = forward / mag
      const ns = strafe / mag
      const camYaw = cameraRef.yaw
      const dirX = Math.sin(camYaw) * nf + Math.cos(camYaw) * ns
      const dirZ = Math.cos(camYaw) * nf - Math.sin(camYaw) * ns
      const targetYaw = Math.atan2(dirX, dirZ)
      let delta = targetYaw - playerRef.yaw
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      playerRef.yaw += delta * Math.min(1, dt * 12)

      if (!dragging.current) {
        let camDelta = playerRef.yaw - cameraRef.yaw
        while (camDelta > Math.PI) camDelta -= Math.PI * 2
        while (camDelta < -Math.PI) camDelta += Math.PI * 2
        cameraRef.yaw += camDelta * Math.min(1, dt * 1.6)
      }

      const nx = playerRef.x + dirX * speed * dt
      const nz = playerRef.z + dirZ * speed * dt
      const fromX = playerRef.x
      const fromZ = playerRef.z
      if (!blocked(nx, nz)) {
        playerRef.x = nx
        playerRef.z = nz
      } else if (!blocked(nx, playerRef.z)) {
        playerRef.x = nx
      } else if (!blocked(playerRef.x, nz)) {
        playerRef.z = nz
      }

      // RP-08: distance actually travelled feeds the journal's "km đã đi".
      // Accumulated in a ref and flushed once per second — logging every frame
      // would write to the store 60×/s and re-render the HUD for no reason.
      walkedRef.current.distance += Math.hypot(playerRef.x - fromX, playerRef.z - fromZ)
      walkedRef.current.carry += dt
      if (walkedRef.current.carry >= WALK_FLUSH_SECONDS) {
        walkedRef.current.carry = 0
        const metres = walkedRef.current.distance
        walkedRef.current.distance = 0
        if (metres > 0.5) store.logWalk(metres, store.tile)
      }
    }

    playerRef.moving = isMoving
    playerRef.sprinting = sprint && isMoving

    /* ---------------------------- walk cycle ---------------------------- */
    // Phase advances with *distance*, not time, so the stride always matches the
    // ground speed: a slow walk and a sprint both keep their feet planted.
    const travelled = isMoving ? speed * dt : 0
    gaitPhase.current = (gaitPhase.current + travelled * PHASE_PER_METRE) % (Math.PI * 2)
    const pose = walkPose(gaitPhase.current, isMoving ? speed : 0, reduceMotion)
    applyLegPose([leftLeg.current, rightLeg.current], pose)
    if (body.current) body.current.rotation.y = pose.twist
    playerRef.bob = pose.bob

    if (group.current) {
      // the bob now comes from the gait (two small lifts per stride) instead of a
      // constant float, which is what made the old figure look like it was hovering
      group.current.position.set(playerRef.x, playerRef.bob, playerRef.z)
      group.current.rotation.y = playerRef.yaw
    }
    if (body.current && isMoving && !reduceMotion) {
      body.current.rotation.x = Math.sin(gaitPhase.current * 0.5) * 0.015
    }

    // camera rig (absolute yaw; forward = sin/cos, camera sits behind)
    const camYaw = cameraRef.yaw
    const dist = cameraRef.distance
    const cosP = Math.cos(cameraRef.pitch)
    const targetX = playerRef.x - Math.sin(camYaw) * dist * cosP
    const targetZ = playerRef.z - Math.cos(camYaw) * dist * cosP
    const targetY = 1.9 + Math.sin(cameraRef.pitch) * dist
    const k = 1 - Math.exp(-7 * dt)
    camera.position.x += (targetX - camera.position.x) * k
    camera.position.y += (Math.max(1.2, targetY) - camera.position.y) * k
    camera.position.z += (targetZ - camera.position.z) * k
    camera.lookAt(playerRef.x, 1.55, playerRef.z)

    syncPlayerRef(playerRef.x, playerRef.z, playerRef.yaw)

    lastScan.current += dt
    if (lastScan.current > 0.12) {
      lastScan.current = 0
      store.scanNearestPoi(playerRef.x, playerRef.z)
    }
  })

  return (
    <group ref={group} position={[playerRef.x, 0, playerRef.z]}>
      <group ref={body}>
        <CharacterMesh look={look} THREEmod={THREE} legRefs={{ left: leftLeg, right: rightLeg }} />
      </group>
    </group>
  )
}
