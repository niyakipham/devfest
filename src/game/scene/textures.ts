/**
 * Canvas-generated world textures — one flat call-to-action against the "robot
 * flat-shaded primitives" look. Every texture is generated once and cached, so the
 * render loop never allocates. No third-party assets; everything is painted here.
 *
 * Colours come from @world/palette (the 3D palette file), so the scene still has
 * a single place where colours live.
 */
import * as THREE from 'three'
import { WORLD } from '@world/palette'

const cache = new Map<string, THREE.CanvasTexture>()

const make = (key: string, size: [number, number], paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture => {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = size[0]
  canvas.height = size[1]
  const ctx = canvas.getContext('2d')
  if (ctx) {
    paint(ctx, canvas.width, canvas.height)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  tex.needsUpdate = true
  cache.set(key, tex)
  return tex
}

/** Subtle plaster/stucco with speckles — kills the "perfectly flat wall" CG look. */
export const stuccoTexture = (): THREE.CanvasTexture =>
  make('stucco', [256, 256], (ctx, w, h) => {
    ctx.fillStyle = WORLD.wallWhite
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i += 1) {
      const a = 0.05 + ((i * 37) % 10) / 60
      ctx.fillStyle = i % 3 === 0 ? `rgba(90,70,50,${a})` : `rgba(255,255,255,${a})`
      ctx.beginPath()
      ctx.arc((i * 137) % w, (i * 89) % h, 1 + ((i * 17) % 3), 0, Math.PI * 2)
      ctx.fill()
    }
    // two faint rising damp stains near the bottom edge
    const stain = ctx.createLinearGradient(0, h * 0.72, 0, h)
    stain.addColorStop(0, 'rgba(70,55,40,0)')
    stain.addColorStop(1, 'rgba(70,55,40,0.22)')
    ctx.fillStyle = stain
    ctx.fillRect(0, h * 0.72, w, h * 0.28)
  })

/** Ground speckle for the lawn — large-scale mottling, tiled many times. */
export const groundTexture = (): THREE.CanvasTexture =>
  make('ground', [256, 256], (ctx, w, h) => {
    ctx.fillStyle = WORLD.grass
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 260; i += 1) {
      const a = 0.25 + ((i * 13) % 10) / 40
      ctx.fillStyle = [WORLD.grassLit, WORLD.grassMid, WORLD.grassPatchC, WORLD.grassPatchA][i % 4]
      ctx.globalAlpha = a
      ctx.beginPath()
      ctx.ellipse((i * 149) % w, (i * 97) % h, 9 + ((i * 29) % 22), 6 + ((i * 43) % 14), (i * 0.7) % Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })

/** Ngói âm dương — rows of half-round Hanoi barrel tiles. */
export const roofTileTexture = (): THREE.CanvasTexture =>
  make('roof-tile', [256, 256], (ctx, w, h) => {
    ctx.fillStyle = WORLD.roofTile
    ctx.fillRect(0, 0, w, h)
    const rows = 8
    const cols = 8
    const rh = h / rows
    const cw = w / cols
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = c * cw
        const y = r * rh
        // barrel arch
        const g = ctx.createLinearGradient(x, y, x + cw, y)
        g.addColorStop(0, 'rgba(60,20,15,0.55)')
        g.addColorStop(0.35, 'rgba(255,235,210,0.34)')
        g.addColorStop(0.65, 'rgba(120,50,40,0.25)')
        g.addColorStop(1, 'rgba(60,20,15,0.55)')
        ctx.fillStyle = g
        ctx.fillRect(x, y, cw, rh)
        // the barrel lip
        ctx.strokeStyle = 'rgba(46,18,14,0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + cw, y)
        ctx.stroke()
      }
    }
  })

/** Striped canvas awning — the red/cream of Old Quarter shopfronts. */
export const awningTexture = (c1: string, c2: string, key: string): THREE.CanvasTexture =>
  make(key, [256, 128], (ctx, w, h) => {
    ctx.fillStyle = c2
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = c1
    const stripe = w / 8
    for (let i = 0; i < 8; i += 2) {
      ctx.fillRect(i * stripe, 0, stripe, h)
    }
    // scalloped shadow at the hanging edge
    ctx.fillStyle = 'rgba(30,20,15,0.28)'
    ctx.fillRect(0, h - 10, w, 10)
  })

const SIGN_DEFS: Array<{ text: string; bg: string; fg: string; border: string }> = [
  { text: 'PHỞ BÒ', bg: WORLD.signCream, fg: WORLD.lacquerRedDeep, border: WORLD.lacquerRed },
  { text: 'CÀ PHÊ', bg: WORLD.lacquerRed, fg: WORLD.signCream, border: WORLD.goldLeaf },
  { text: 'TẠP HOÁ', bg: WORLD.goldLeaf, fg: WORLD.lacquerDark, border: WORLD.lacquerDark },
  { text: 'KIM HOÀN', bg: WORLD.signCream, fg: WORLD.lacquerDark, border: WORLD.goldLeaf },
  { text: 'HIỆU THUỐC', bg: WORLD.pavilionWall, fg: WORLD.lacquerRedDeep, border: WORLD.lacquerRedDeep },
  { text: 'XE ĐẠP', bg: WORLD.outfitCycloGreen, fg: WORLD.signCream, border: WORLD.signCream },
]

/** Shopfront board with real Vietnamese lettering — six deterministic variants. */
export const signTexture = (index: number): THREE.CanvasTexture =>
  make(`sign-${index % SIGN_DEFS.length}`, [512, 160], (ctx, w, h) => {
    const def = SIGN_DEFS[index % SIGN_DEFS.length]
    ctx.fillStyle = def.bg
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = def.border
    ctx.lineWidth = 12
    ctx.strokeRect(6, 6, w - 12, h - 12)
    ctx.fillStyle = def.fg
    ctx.font = '900 84px "Arial Black", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(def.text, w / 2, h / 2 + 4)
  })

/** Soft cloud puff for billboards. */
export const cloudTexture = (): THREE.CanvasTexture =>
  make('cloud', [256, 128], (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const puffs: Array<[number, number, number]> = [
      [70, 78, 42],
      [112, 60, 50],
      [156, 72, 46],
      [196, 84, 32],
      [128, 88, 56],
    ]
    for (const [x, y, r] of puffs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.7, 'rgba(255,255,255,0.55)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  })

/** Radial glow sprite — sun halo and quest-marker aura. */
export const glowTexture = (): THREE.CanvasTexture =>
  make('glow', [128, 128], (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,248,214,0.9)')
    g.addColorStop(0.6, 'rgba(255,236,160,0.32)')
    g.addColorStop(1, 'rgba(255,236,160,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

/** Floating motes / pollen for the Genshin breeze feel. */
export const moteTexture = (): THREE.CanvasTexture =>
  make('mote', [64, 64], (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.6)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

/** Golden quest marker — leaf-dark coin with a gold exclamation, Genshin-coded. */
export const exclaimTexture = (): THREE.CanvasTexture =>
  make('exclaim', [256, 256], (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    // aura
    const aura = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 120)
    aura.addColorStop(0, 'rgba(255,224,130,0.85)')
    aura.addColorStop(1, 'rgba(255,224,130,0)')
    ctx.fillStyle = aura
    ctx.fillRect(0, 0, w, h)
    // coin
    ctx.fillStyle = WORLD.goldLeaf
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 84, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = WORLD.lacquerDark
    ctx.lineWidth = 14
    ctx.stroke()
    // exclamation
    ctx.fillStyle = WORLD.lacquerDark
    const cx = w / 2
    ctx.fillRect(cx - 13, 42, 26, 86)
    ctx.beginPath()
    ctx.arc(cx, 158, 17, 0, Math.PI * 2)
    ctx.fill()
  })

/** Number of cached canvases — exposed for tests/debug. */
export const textureCacheSize = (): number => cache.size
