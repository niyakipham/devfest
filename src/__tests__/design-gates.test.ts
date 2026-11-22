/**
 * Design-system gates as unit tests, so `npm test` alone catches palette drift.
 * (The same checks also run as standalone CI steps: check:tokens / check:contrast.)
 *
 * F9 + F10 of the blueprint:
 *  - the repo had three parallel token sources and 27 raw hex values in component CSS
 *  - white text on the primary green was 2.33:1, captions 3.65:1, and only 2 of 21
 *    buttons had a focus ring
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p: string): string => readFileSync(new URL(p, import.meta.url), 'utf8')
const css = read('../game/ui/styles.css')

const rootEnd = css.indexOf('}', css.indexOf(':root'))
const rootBlock = css.slice(css.indexOf('{', css.indexOf(':root')) + 1, rootEnd)
const body = css.slice(rootEnd)

const tokens = new Map<string, string>()
for (const m of rootBlock.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
  tokens.set(`--${m[1]}`, m[2].replace(/\/\*[\s\S]*?\*\//g, '').trim())
}

type RGB = [number, number, number]
const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}
const luminance = ([r, g, b]: RGB): number => {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: string, b: string): number => {
  const la = luminance(hexToRgb(a))
  const lb = luminance(hexToRgb(b))
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
const token = (name: string): string => tokens.get(name) as string

describe('palette', () => {
  it('has exactly one token source and no raw colour in component blocks', () => {
    // no hex outside :root
    expect(body.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toHaveLength(0)
  })

  it('every declared token is used (no dead palette)', () => {
    const used = new Set([...body.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))
    const dead = [...tokens.keys()].filter((t) => !used.has(t))
    expect(dead).toEqual([])
  })

  it('no longer ships the two duplicate palette files', () => {
    const exists = (p: string): boolean => {
      try {
        read(p)
        return true
      } catch {
        return false
      }
    }
    expect(exists('../shared/styles/designTokens.ts')).toBe(false)
    expect(exists('../shared/styles/global.css')).toBe(false)
  })
})

describe('contrast (WCAG AA)', () => {
  it('primary button glyph is readable on every gradient stop', () => {
    const ink = token('--c-on-primary')
    expect(ratio(ink, token('--c-primary-light'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(ink, token('--c-primary'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(ink, token('--c-primary-mid'))).toBeGreaterThanOrEqual(3)
  })

  it('primary button is NOT white-on-green anymore', () => {
    const whiteOnGreen = ratio(token('--c-ink-on-dark'), token('--c-primary'))
    // the old pairing measured 2.33:1 — assert the fix, not the old number
    expect(whiteOnGreen).toBeLessThan(4.5)
    expect(token('--c-on-primary')).not.toBe(token('--c-ink-on-dark'))
  })

  it('body and caption text on the glass panel pass 4.5:1', () => {
    const white = token('--c-ink-on-dark')
    expect(ratio(token('--c-ink'), white)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('--c-ink-soft'), white)).toBeGreaterThanOrEqual(4.5)
    expect(ratio(token('--c-ink-muted'), white)).toBeGreaterThanOrEqual(4.5)
  })

  it('accent roles used behind white text pass 4.5:1', () => {
    const white = token('--c-ink-on-dark')
    expect(ratio(white, token('--c-danger'))).toBeGreaterThanOrEqual(4.5)
    expect(ratio(white, token('--c-teal-deep'))).toBeGreaterThanOrEqual(4.5)
  })
})

describe('typography + interaction floor', () => {
  it('no font size below 12px', () => {
    const sizes = [...body.matchAll(/font-size:\s*([0-9.]+)px/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBeGreaterThan(0)
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(12)
  })

  it('keeps the type scale small (the old file had 17 ad-hoc sizes)', () => {
    const scale = new Set([...body.matchAll(/font-size:\s*var\((--t-[a-z-]+)\)/g)].map((m) => m[1]))
    // every size either comes from a token or is ≥ 12px
    const raw = [...body.matchAll(/font-size:\s*([0-9.]+)px/g)].map((m) => Number(m[1]))
    const distinctRaw = new Set(raw)
    expect(distinctRaw.size).toBeLessThanOrEqual(6)
    expect(scale.size).toBeGreaterThanOrEqual(3)
  })

  it('gives every interactive surface a visible focus ring', () => {
    const focusClasses = [
      '.btn',
      '.rail__btn',
      '.slot',
      '.switch__btn',
      '.persona',
      '.prompt',
    ]
    for (const cls of focusClasses) {
      const pattern = new RegExp(`${cls.replace('.', '\\.')}:focus-visible`)
      expect(pattern.test(css), `${cls} needs :focus-visible`).toBe(true)
    }
  })

  it('respects touch targets and safe areas', () => {
    expect(css).toContain('--tap-min')
    expect(css).toContain('@media (pointer: coarse)')
    expect(css).toContain('env(safe-area-inset')
  })

  it('does not block first paint with a Google Fonts @import', () => {
    expect(css.includes('@import url(')).toBe(false)
  })
})
