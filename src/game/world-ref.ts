/**
 * Mutable, render-frequency state (never in React state → zero re-renders).
 * The 3D player writes here every frame; the store reads it on save / HUD sync.
 */
import { SPAWN } from '@world/data/hoanKiem'

export const playerRef = {
  x: SPAWN.x,
  z: SPAWN.z,
  yaw: Math.PI,
  moving: false,
  sprinting: false,
  /** vertical offset from the walk cycle (metres), written every frame */
  bob: 0,
}

export const cameraRef = {
  yaw: Math.PI,
  distance: 13,
  pitch: 0.32,
}

export const syncPlayerRef = (x: number, z: number, yaw: number): void => {
  playerRef.x = x
  playerRef.z = z
  playerRef.yaw = yaw
}

export const resetPlayerRef = (x: number, z: number, yaw = Math.PI): void => {
  playerRef.x = x
  playerRef.z = z
  playerRef.yaw = yaw
  cameraRef.yaw = yaw
}
