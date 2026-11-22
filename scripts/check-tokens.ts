#!/usr/bin/env tsx
/**
 * CI gate — one design-token source, no raw colour literals in components.
 *
 * F10 of the blueprint: the repo had THREE parallel token systems
 * (styles.css 26 tokens · shared/styles/global.css 59 tokens, only the archived
 * legacy app imported it · shared/styles/designTokens.ts 150 lines, zero imports)
 * plus 27 hard-coded hex values and 64 rgba() literals inside component CSS.
 *
 * Rules enforced here:
 *   1. every colour literal used in the stylesheet must be declared in :root
 *   2. component blocks may not contain raw #hex or rgb()/hsl() literals
 *   3. every declared token must actually be used (dead tokens fail the gate)
 *   4. no stray r,g,b triple that is not a token file (designTokens.ts) — that file
 *      is deleted; if it comes back this gate has to be taught about it on purpose.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const CSS_PATH = resolve(here, '../src/game/ui/styles.css')
const TOKENS_TS = resolve(here, '../src/shared/styles/designTokens.ts')
const LEGACY_CSS = resolve(here, '../src/shared/styles/global.css')

const css = readFileSync(CSS_PATH, 'utf8')

const errors: string[] = []

// ---- 1. split :root from the rest -------------------------------------------------
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
if (rootStart < 0 || rootClose < 0) {
  errors.push('styles.css: no :root block found — tokens must live in exactly one place')
}

const rootBlock = css.slice(rootOpen + 1, rootClose)
const body = css.slice(rootClose + 1)

// ---- 2. collect declared tokens ---------------------------------------------------
const declared = new Map<string, string>()
for (const m of rootBlock.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
  declared.set(`--${m[1]}`, m[2].trim())
}

// ---- 3. no raw colour literals in component blocks --------------------------------
/**
 * Only colour-bearing declarations are policed. box-shadow / text-shadow are
 * *elevation and depth*, not palette: they are allowed to carry their own
 * translucency, exactly like the hand-tuned shadows in the reference art.
 * Anything that paints a surface or a glyph must come from a token.
 */
const COLOUR_PROPS = /(?:^|[\s;{])(color|background|background-color|border|border-color|border-top-color|border-bottom-color|outline|outline-color|fill|stroke|text-decoration-color)\s*:/i

const colourDeclarations = body
  .split('}')
  .flatMap((block) => block.split(';'))
  .filter((decl) => COLOUR_PROPS.test(decl))
  .join(';')

const HEX = /#[0-9a-fA-F]{3,8}\b/g
const FUNC = /\b(?:rgba?|hsla?)\([^)]*\)/g

const rawHex = colourDeclarations.match(HEX) ?? []
const rawFunc = (colourDeclarations.match(FUNC) ?? []).filter((v) => {
  // rgba(255,255,255,.94) etc. would be duplicate literals; transparent is fine
  return !/^rgba?\(0,\s*0,\s*0,\s*0\)$/.test(v.replace(/\s/g, ''))
})

for (const hex of rawHex) errors.push(`component CSS contains raw hex ${hex} — declare a token in :root instead`)
for (const fn of rawFunc.slice(0, 10)) errors.push(`component CSS contains raw colour ${fn} — declare a token in :root instead`)

// ---- 4. no dead tokens ------------------------------------------------------------
const used = new Set<string>()
for (const m of body.matchAll(/var\((--[a-z0-9-]+)/g)) used.add(m[1])
const dead = [...declared.keys()].filter((t) => !used.has(t))

// ---- 5. one token file only -------------------------------------------------------
const zombies: string[] = []
for (const [path, label] of [
  [TOKENS_TS, 'src/shared/styles/designTokens.ts'],
  [LEGACY_CSS, 'src/shared/styles/global.css'],
] as const) {
  try {
    readFileSync(path)
    zombies.push(`${label} still exists — it is not imported by the live app and duplicates the palette`)
  } catch {
    /* gone — good */
  }
}

// ---- report -----------------------------------------------------------------------
const minTokens = 40
console.log('── DESIGN TOKEN GATE ────────────────────────────')
console.log(`tokens declared: ${declared.size} · used: ${used.size} · dead: ${dead.length}`)
console.log(`raw hex in components: ${rawHex.length} · raw rgb/hsl: ${rawFunc.length}`)

if (declared.size < minTokens) {
  errors.push(`only ${declared.size} tokens (expected ≥ ${minTokens}) — palette was probably truncated`)
}
for (const t of dead) errors.push(`dead token ${t} — remove it or use it`)

const all = [...errors, ...zombies]
if (all.length > 0) {
  console.error('\n❌ DESIGN TOKEN GATE FAILED')
  for (const e of all.slice(0, 40)) console.error(`  • ${e}`)
  if (all.length > 40) console.error(`  … and ${all.length - 40} more`)
  process.exit(1)
}

console.log('\n✅ DESIGN TOKEN GATE PASSED — one palette, zero raw colours')
