#!/usr/bin/env tsx
/**
 * CI gate — WCAG AA contrast for every foreground/background pair the UI uses.
 *
 * F9 of the blueprint: the repo shipped white text on #3FC24B (2.33:1) as the
 * primary button, and #6A8B98 captions on white (3.65:1). Both are invisible to
 * a typechecker and to jsdom, so they need a numeric gate.
 *
 * The gate reads the palette straight out of styles.css (one source of truth) and
 * checks each declared pair. Translucent tokens are composited against the
 * worst-case world backgrounds sampled from the reference art:
 *   grass #A6D344 · water #17B8D9 · sand #E5E5BD · deep foliage #076B26 · white
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/game/ui/styles.css'), 'utf8')

// ---------------------------------------------------------------- palette parser
const rootStart = css.indexOf(':root')
const rootOpen = css.indexOf('{', rootStart)
let depth = 0
let rootClose = -1
for (let i = rootOpen; i < css.length; i += 1) {
  if (css[i] === '{') depth += 1
  else if (css[i] === '}') {
    depth -= 1
    if (depth === 0) {
      rootClose = i
      break
    }
  }
}

const tokens = new Map<string, string>()
for (const m of css.slice(rootOpen + 1, rootClose).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
  tokens.set(`--${m[1]}`, m[2].replace(/\/\*[\s\S]*?\*\//g, '').trim())
}

// ---------------------------------------------------------------- colour maths
type RGB = [number, number, number]

const parse = (value: string): RGB | null => {
  const v = value.trim()
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const rgba = v.match(/^rgba?\(([^)]+)\)$/i)
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => Number(p.trim()))
    return [parts[0], parts[1], parts[2]]
  }
  return null
}

const alphaOf = (value: string): number => {
  const rgba = value.trim().match(/^rgba\(([^)]+)\)$/i)
  if (!rgba) return 1
  const parts = rgba[1].split(',').map((p) => Number(p.trim()))
  return parts.length > 3 ? parts[3] : 1
}

const over = (fg: RGB, alpha: number, bg: RGB): RGB =>
  [0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha))) as RGB

const luminance = (rgb: RGB): number => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: RGB, b: RGB): number => {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const token = (name: string): string => {
  const v = tokens.get(name)
  if (!v) throw new Error(`missing token ${name}`)
  return v
}

const solid = (name: string): RGB => parse(token(name)) as RGB

const on = (fgName: string, bgName: string): number => {
  const fg = parse(token(fgName)) as RGB
  const bg = parse(token(bgName)) as RGB
  return contrast(fg, bg)
}

/** translucent surface composited over each worst-case world background */
const WORST_BG: Array<[string, RGB]> = [
  ['white', [255, 255, 255]],
  ['sand', [229, 229, 189]],
  ['grass', [166, 211, 68]],
  ['water', [23, 184, 217]],
]

const onGlassWorst = (fgName: string): number =>
  Math.min(...WORST_BG.map(([, bg]) => contrast(solid(fgName), over(parse(token('--c-glass')) as RGB, alphaOf(token('--c-glass')), bg))))

const onSlabWorst = (fgName: string): number =>
  Math.min(...WORST_BG.map(([, bg]) => contrast(solid(fgName), over(parse(token('--c-slab')) as RGB, alphaOf(token('--c-slab')), bg))))

// ---------------------------------------------------------------- the pairs
const AA_NORMAL = 4.5
const AA_LARGE = 3
const UI_COMPONENT = 3

interface Check {
  label: string
  ratio: number
  min: number
}

const checks: Check[] = [
  // text on the white-glass chrome
  { label: 'ink on glass (worst world)', ratio: onGlassWorst('--c-ink'), min: AA_NORMAL },
  { label: 'ink-soft on glass (worst world)', ratio: onGlassWorst('--c-ink-soft'), min: AA_NORMAL },
  { label: 'ink-muted on glass (worst world)', ratio: onGlassWorst('--c-ink-muted'), min: AA_NORMAL },

  // text on the dark slab chrome
  { label: 'on-dark on slab (worst world)', ratio: onSlabWorst('--c-ink-on-dark'), min: AA_NORMAL },
  { label: 'gold-soft on slab (worst world)', ratio: onSlabWorst('--c-gold-soft'), min: AA_LARGE },

  // buttons: every state of the primary gradient must hold its glyph colour
  { label: 'on-primary on primary-light', ratio: on('--c-on-primary', '--c-primary-light'), min: AA_NORMAL },
  { label: 'on-primary on primary', ratio: on('--c-on-primary', '--c-primary'), min: AA_NORMAL },
  { label: 'on-primary on primary-mid', ratio: on('--c-on-primary', '--c-primary-mid'), min: AA_LARGE },
  { label: 'white on primary-deep', ratio: on('--c-ink-on-dark', '--c-primary-deep'), min: AA_NORMAL },

  { label: 'white on teal-deep (ghost-teal)', ratio: on('--c-ink-on-dark', '--c-teal-deep'), min: AA_NORMAL },

  { label: 'white on danger', ratio: on('--c-ink-on-dark', '--c-danger'), min: AA_NORMAL },
  { label: 'white on danger-deep', ratio: on('--c-ink-on-dark', '--c-danger-deep'), min: AA_NORMAL },

  { label: 'ink on gold (chip)', ratio: on('--c-ink', '--c-gold'), min: AA_NORMAL },

  // focus ring must be perceivable on glass
  { label: 'focus ring on glass', ratio: onGlassWorst('--c-focus'), min: UI_COMPONENT },
]

// every pair that must also survive against pure white (panels over the void)
const whitePairs: Array<[string, number]> = [
  ['--c-ink', AA_NORMAL],
  ['--c-ink-soft', AA_NORMAL],
  ['--c-ink-muted', AA_NORMAL],
  ['--c-danger', AA_NORMAL],
  ['--c-primary-deep', AA_NORMAL],
]

for (const [name, min] of whitePairs) {
  checks.push({ label: `${name} on white`, ratio: on(name, '--c-ink-on-dark'), min })
}

// ---------------------------------------------------------------- run
console.log('── CONTRAST GATE ───────────────────────────────')
const failures = checks.filter((c) => c.ratio + 1e-9 < c.min)

for (const c of checks) {
  const ok = c.ratio + 1e-9 >= c.min
  console.log(`${ok ? '✓' : '✗'} ${c.ratio.toFixed(2).padStart(5)}:1  (min ${c.min})  ${c.label}`)
}

if (failures.length > 0) {
  console.error(`\n❌ CONTRAST GATE FAILED — ${failures.length} pair(s) below WCAG AA`)
  for (const f of failures) console.error(`  • ${f.label}: ${f.ratio.toFixed(2)}:1 < ${f.min}:1`)
  process.exit(1)
}

console.log(`\n✅ CONTRAST GATE PASSED — ${checks.length} pairs, all ≥ WCAG AA`)
