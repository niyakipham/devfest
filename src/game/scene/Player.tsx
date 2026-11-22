import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { speedMultiplier } from '@shared/formulas'
import { isWalkable } from '@world/collision'
import { useGameStore } from '../store'
import { cameraRef, playerRef, syncPlayerRef } from '../world-ref'
import { WORLD } from '@world/palette'

const blocked = (x: number, z: number): boolean => !isWalkable(x, z)

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const keys = new Set<string>()

const playerColor = (persona: string): string => {
  switch (persona) {
    case 'PHOTOGRAPHER':
      return WORLD.outfitStudent
    case 'PHO_VENDOR':
      return WORLD.outfitSmith
    case 'SILVERSMITH':
      return WORLD.outfitCyclo
    case 'CYCLO_DRIVER':
      return WORLD.outfitCycloGreen
    case 'FOLK_SINGER':
      return WORLD.outfitSinger
    default:
      return WORLD.outfitDefault
  }
}

export const Player = () => {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()
  const persona = useGameStore((s) => s.player.persona)
  // F9: respect the player setting and the OS preference, not a hard-coded false
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion) || prefersReducedMotion()
  const bobT = useRef(0)
  const lastScan = useRef(0)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  const color = useMemo(() => playerColor(persona), [persona])

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
      if (!blocked(nx, nz)) {
        playerRef.x = nx
        playerRef.z = nz
      } else if (!blocked(nx, playerRef.z)) {
        playerRef.x = nx
      } else if (!blocked(playerRef.x, nz)) {
        playerRef.z = nz
      }
      bobT.current += dt * (sprint ? 13 : 9)
    }

    playerRef.moving = isMoving
    playerRef.sprinting = sprint && isMoving

    const bob = isMoving && !reduceMotion ? Math.sin(bobT.current) * 0.055 : 0
    if (group.current) {
      group.current.position.set(playerRef.x, bob, playerRef.z)
      group.current.rotation.y = playerRef.yaw
    }
    if (body.current && isMoving) {
      body.current.rotation.x = Math.sin(bobT.current * 0.5) * 0.02
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
        <mesh position={[0, 1.0, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.75, 6, 12]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.24, 16, 12]} />
          <meshStandardMaterial color={WORLD.skin} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.86, 0]} castShadow>
          <coneGeometry args={[0.46, 0.22, 18]} />
          <meshStandardMaterial color={WORLD.facadeCream} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.12, -0.18]} castShadow>
          <boxGeometry args={[0.34, 0.42, 0.18]} />
          <meshStandardMaterial color={WORLD.hairDark} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
