#!/usr/bin/env tsx
/**
 * Offline character contact sheet.
 *
 * Why: this sandbox cannot download a browser (binaries.playwright.dev is blocked),
 * so a screenshot of the real WebGL scene is impossible here. But the *geometry* is
 * plain data — `buildParts()` returns primitives with positions and colours — so it
 * can be projected orthographically and drawn as SVG. That is enough to review the
 * thing being changed: proportion, silhouette, palette, and whether a persona is
 * recognisable. It is NOT a lighting preview and must not be presented as one.
 *
 * Output: .arena/preview/characters.svg (+ .png via ImageMagick if present)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { GARMENTS, RIG, appearanceFor, buildLeg, buildParts, hairColor, hipX, skinColor, type PartSpec } from '@game/scene/character'
import { walkPose } from '@game/scene/gait'

const OUT = resolve(import.meta.dirname, '../.arena/preview')
mkdirSync(OUT, { recursive: true })

const SCALE = 340 // px per metre
const CELL_W = 300
const CELL_H = 760
const GROUND_PAD = 0

type XYZ = readonly [number, number, number]

/** Rotate a point about Y (yaw), then project: x → screen x, y → screen y. */
const project = (p: XYZ, yaw: number): { x: number; y: number; z: number } => {
  const [x, y, z] = p
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return { x: x * c - z * s, y, z: x * s + z * c }
}

const shade = (hex: string, amount: number): string => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  // simple hemispheric light: up is brighter, down is darker
  const k = 1 + amount
  const f = (v: number): string =>
    Math.max(0, Math.min(255, Math.round(v * k)))
      .toString(16)
      .padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}

interface Shape {
  z: number
  svg: string
}

const drawPart = (part: PartSpec, yaw: number, cx: number, baseY: number): Shape => {
  const p = project(part.pos, yaw)
  const sx = cx + p.x * SCALE
  // SVG y grows downward; world y grows up from the ground
  const sy = baseY - p.y * SCALE
  // light comes from the front-left-top; use depth to pick a shade band
  const light = 0.16 * Math.cos(yaw) - 0.1 * Math.min(1, Math.abs(p.z) * 2)
  const fill = shade(part.color, light)

  switch (part.geom) {
    case 'box': {
      const w = part.args[0] * SCALE
      const h = part.args[1] * SCALE
      const d = part.args[2] * SCALE
      // front face plus a slim side face reads as a box without a full 3D transform
      const x0 = sx - w / 2
      const y0 = sy - h / 2
      const sideW = Math.max(2, d * 0.35)
      return {
        z: p.z,
        svg:
          `<rect x="${(x0 + sideW).toFixed(1)}" y="${y0.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}"/>` +
          `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${sideW.toFixed(1)}" height="${h.toFixed(1)}" fill="${shade(part.color, light - 0.18)}"/>`,
      }
    }
    case 'sphere': {
      const r = part.args[0] * SCALE
      const sc = part.scale
      const rx = r * (sc ? sc[0] : 1)
      const ry = r * (sc ? sc[1] : 1)
      return {
        z: p.z,
        svg: `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}"/>`,
      }
    }
    case 'capsule': {
      const r = part.args[0] * SCALE
      const len = part.args[1] * SCALE
      const total = len + r * 2
      // a capsule in a front view is a rounded rectangle
      return {
        z: p.z,
        svg: `<rect x="${(sx - r).toFixed(1)}" y="${(sy - total / 2).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${total.toFixed(1)}" rx="${r.toFixed(1)}" fill="${fill}"/>`,
      }
    }
    case 'cylinder': {
      const rTop = part.args[0] * SCALE
      const rBot = part.args[1] * SCALE
      const h = part.args[2] * SCALE
      return {
        z: p.z,
        svg: `<path d="M ${(sx - rTop).toFixed(1)} ${(sy - h / 2).toFixed(1)} L ${(sx + rTop).toFixed(1)} ${(sy - h / 2).toFixed(1)} L ${(sx + rBot).toFixed(1)} ${(sy + h / 2).toFixed(1)} L ${(sx - rBot).toFixed(1)} ${(sy + h / 2).toFixed(1)} Z" fill="${fill}"/>`,
      }
    }
    case 'cone': {
      const r = part.args[0] * SCALE
      const h = part.args[1] * SCALE
      return {
        z: p.z,
        svg: `<path d="M ${sx.toFixed(1)} ${(sy - h / 2).toFixed(1)} L ${(sx + r).toFixed(1)} ${(sy + h / 2).toFixed(1)} L ${(sx - r).toFixed(1)} ${(sy + h / 2).toFixed(1)} Z" fill="${fill}"/>`,
      }
    }
    case 'torus': {
      const r = part.args[0] * SCALE
      return {
        z: p.z,
        svg: `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.28).toFixed(1)}" fill="none" stroke="${fill}" stroke-width="${(part.args[1] * SCALE).toFixed(1)}"/>`,
      }
    }
  }
}

interface Figure {
  label: string
  sub: string
  shapes: Shape[]
}

const buildFigure = (label: string, sub: string, key: string, persona: string | undefined, yaw: number, swing = 0): Figure => {
  const look = appearanceFor(key, persona)
  const shapes: Shape[] = []

  // body parts are drawn in the figure's own frame; stature scales every point
  const push = (parts: PartSpec[], legsRot = 0, legsY = 0, hip?: { x: number; y: number }): void => {
    for (const part of parts) {
      const rotated: PartSpec = legsRot
        ? {
            ...part,
            pos: [
              part.pos[0] * Math.cos(legsRot) - part.pos[1] * Math.sin(legsRot),
              part.pos[0] * Math.sin(legsRot) + part.pos[1] * Math.cos(legsRot) + legsY,
              part.pos[2],
            ],
          }
        : part
      const scaled: PartSpec = {
        ...rotated,
        pos: [rotated.pos[0] * look.stature, rotated.pos[1] * look.stature, rotated.pos[2] * look.stature],
      }
      if (hip) {
        // move the part into world space for the leg pivot
        scaled.pos = [
          (scaled.pos[0] + hip.x) as number,
          (scaled.pos[1] + hip.y) as number,
          scaled.pos[2],
        ]
      }
      shapes.push(drawPart(scaled, yaw, CELL_W / 2, GROUND_PAD))
    }
  }

  push(buildParts(look))
  const legLen = RIG.legH
  for (const side of [-1, 1] as const) {
    const rot = side === -1 ? swing : -swing
    push(buildLeg(look, side), rot, -Math.sin(Math.abs(rot)) * 0.18, { x: hipX(side), y: RIG.hipY })
  }
  void legLen

  return { label, sub, shapes }
}

/* ------------------------------- the sheet ------------------------------- */

const figures: Figure[] = [
  buildFigure('Cô Hoa', 'PHO_VENDOR · đứng', 'npc-co-hoa', 'PHO_VENDOR', 0.35),
  buildFigure('Chị Lan', 'PHOTOGRAPHER · đứng', 'npc-lan', 'PHOTOGRAPHER', 0.2),
  buildFigure('Chú Bảy', 'SILVERSMITH · đứng', 'npc-chu-bay', 'SILVERSMITH', -0.3),
  buildFigure('Minh', 'PHO_VENDOR · đi bộ', 'Minh:PHO_VENDOR', 'PHO_VENDOR', 0, walkPose(Math.PI / 2, 3).left.swing),
  buildFigure('Hương', 'STUDENT · đi bộ', 'Huong:STUDENT', 'STUDENT', 0, walkPose(Math.PI / 2, 3).left.swing),
  buildFigure('Khách', 'crowd · ngẫu nhiên', 'crowd-7', undefined, 0.1),
]

const W = figures.length * CELL_W
const svgHead = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${CELL_H}" viewBox="0 0 ${W} ${CELL_H}">
<rect width="${W}" height="${CELL_H}" fill="#0e2a33"/>
<g font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">`

let body = ''
figures.forEach((fig, i) => {
  const ox = i * CELL_W
  const groundY = CELL_H - 90
  // baseline: feet sit on the ground line
  const shiftY = groundY - GROUND_PAD
  const look = appearanceFor(
    ['npc-co-hoa', 'npc-lan', 'npc-chu-bay', 'Minh:PHO_VENDOR', 'Huong:STUDENT', 'crowd-7'][i],
    ['PHO_VENDOR', 'PHOTOGRAPHER', 'SILVERSMITH', 'PHO_VENDOR', 'STUDENT', undefined][i],
  )
  const g = GARMENTS[look.garment]
  body += `<g transform="translate(${ox}, ${shiftY})">`
  // scale guide: 10 cm ticks up the left edge of the cell, so proportion is checkable
  for (let cm = 0; cm <= 180; cm += 20) {
    const y = -cm / 100 * SCALE + GROUND_PAD
    if (i === 0) {
      body += `<line x1="8" y1="${(-GROUND_PAD + y).toFixed(1)}" x2="20" y2="${(-GROUND_PAD + y).toFixed(1)}" stroke="#3d6474" stroke-width="1"/>`
      body += `<text x="24" y="${(-GROUND_PAD + y + 4).toFixed(1)}" fill="#5a7684" font-size="11">${cm}</text>`
    }
  }
  // ground line
  body += `<line x1="0" y1="0" x2="${CELL_W}" y2="0" stroke="#5a7684" stroke-width="1" opacity="0.5"/>`
  // painter's algorithm: far shapes first
  const sorted = [...fig.shapes].sort((a, b) => a.z - b.z)
  for (const s of sorted) body += s.svg
  body += `<text x="14" y="${CELL_H - 58}" fill="#ffffff" font-size="17" font-weight="700">${fig.label}</text>`
  body += `<text x="14" y="${CELL_H - 38}" fill="${shade(g.top, 0.55)}" font-size="12" font-weight="600">${fig.sub}</text>`
  body += `<text x="14" y="${CELL_H - 20}" fill="#5a7684" font-size="11">${look.hair} · ${look.headwear} · ${look.garment} · ${look.stature.toFixed(2)}×</text>`
  body += '</g>'
})

const svg = `${svgHead}${body}</g></svg>`
writeFileSync(resolve(OUT, 'characters.svg'), svg)

// a swatch strip so palette drift is visible side by side
const swatches = (['aoDai', 'aoBaBa', 'student', 'vendor', 'artisan', 'cyclo', 'singer', 'plain'] as const).map(
  (k, i) => `<g transform="translate(${i * 120 + 20}, 30)">
    <rect width="100" height="60" rx="8" fill="${GARMENTS[k].top}"/>
    <rect y="64" width="100" height="24" rx="6" fill="${GARMENTS[k].bottom}"/>
    <text y="106" fill="#e8f2f6" font-size="12" font-weight="700">${k}</text>
  </g>`,
)
const skinRow = [skinColor(0.1), skinColor(0.5), skinColor(0.9), hairColor(0), hairColor(0.8)]
  .map((c, i) => `<rect x="${20 + i * 70}" y="150" width="60" height="40" rx="6" fill="${c}"/>`)
  .join('')
writeFileSync(
  resolve(OUT, 'palette.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${8 * 120 + 40}" height="210"><rect width="100%" height="100%" fill="#0e2a33"/><g font-family="system-ui, sans-serif">${swatches.join('')}${skinRow}</g></svg>`,
)

console.log(`wrote ${OUT}/characters.svg and palette.svg`)
console.log(`figures: ${figures.length} · parts per figure: ${figures[0].shapes.length}`)
console.log(`rig: ${RIG.height} m · ${(RIG.height / (RIG.headR * 2)).toFixed(2)} heads tall · shoulder span ${((RIG.shoulderX + RIG.armR) * 2).toFixed(2)} m`)
