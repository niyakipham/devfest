/**
 * CONTENT BIBLE gate (F7 of the blueprint).
 *
 * Measured before this file existed: 311 POIs, **64 distinct names**, one shared
 * toast for all 29 streets, and 0 lines of street-specific writing. The blueprint
 * calls that "Hà Nội sáo rỗng" and makes a Content Bible mandatory:
 * "mỗi phố phải có: nghề, 1 thoại riêng, 1 âm thanh, 1 món ăn/biểu tượng".
 *
 * This suite is the reviewer. It fails when future content drifts back to filler.
 */
import { describe, expect, it } from 'vitest'
import { STREET_LORE, loreFor, loreLine, loreCoverage } from '@world/data/lore'
import { STREETS } from '@world/data/streets'
import { POIS } from '@world/data/hoanKiem'

describe('coverage', () => {
  it('covers every street in the world', () => {
    const coverage = loreCoverage(STREETS.map((s) => s.id))
    expect(coverage.missing).toEqual([])
    expect(coverage.covered).toBe(coverage.total)
    expect(coverage.total).toBeGreaterThanOrEqual(29)
  })

  it('has no orphan lore entries for streets that do not exist', () => {
    const ids = new Set(STREETS.map((s) => s.id))
    const orphans = STREET_LORE.filter((l) => !ids.has(l.id)).map((l) => l.id)
    expect(orphans).toEqual([])
  })

  it('every lore entry carries the four mandatory fields', () => {
    for (const lore of STREET_LORE) {
      expect(lore.craft.length, `${lore.id} craft`).toBeGreaterThan(1)
      expect(lore.line.length, `${lore.id} line`).toBeGreaterThan(20)
      expect(lore.sound.length, `${lore.id} sound`).toBeGreaterThan(10)
      expect(lore.buy.length, `${lore.id} buy`).toBeGreaterThan(5)
      expect(lore.prop, `${lore.id} prop`).toBeTruthy()
    }
  })
})

describe('editorial rules', () => {
  it('never repeats a line across streets', () => {
    const seen = new Map<string, string>()
    for (const lore of STREET_LORE) {
      const prev = seen.get(lore.line)
      expect(prev, `${lore.id} duplicates the line of ${prev}`).toBeUndefined()
      seen.set(lore.line, lore.id)
    }
  })

  it('contains none of the filler sentences the audit deleted', () => {
    const banned = [
      'một chỗ nhỏ, nhưng có chuyện để kể',
      'một chỗ nhỏ nhưng có chuyện để kể',
      'phố này xưa làm nghề',
      'nơi đây lưu giữ',
      'đậm đà bản sắc',
    ]
    for (const lore of STREET_LORE) {
      const haystack = `${lore.line} ${lore.sound} ${lore.buy}`.toLowerCase()
      for (const phrase of banned) {
        expect(haystack.includes(phrase), `${lore.id} still contains "${phrase}"`).toBe(false)
      }
    }
  })

  it('keeps every line short enough for one toast', () => {
    for (const lore of STREET_LORE) {
      // 120 chars fits the toast plate at 360 px without truncating mid-word
      expect(lore.line.length, `${lore.id}: ${lore.line.length} chars`).toBeLessThanOrEqual(120)
      expect(lore.sound.length).toBeLessThanOrEqual(90)
      expect(lore.buy.length).toBeLessThanOrEqual(80)
    }
  })

  it('is written in Vietnamese with diacritics', () => {
    // a line with no diacritics at all is almost always a placeholder or a typo
    const hasDiacritic = (s: string): boolean => /[àáảãạăâđêôơưÀÁẢÃẠĂÂĐÊÔƠƯ]/u.test(s)
    for (const lore of STREET_LORE) {
      expect(hasDiacritic(lore.line), `${lore.id} has no Vietnamese diacritics`).toBe(true)
    }
  })

  it('does not invent dates or historical claims', () => {
    // the game is fiction; fake years read as facts and age badly
    for (const lore of STREET_LORE) {
      expect(/\b(1[0-9]{3}|20[0-2][0-9])\b/.test(lore.line), `${lore.id} states a year`).toBe(false)
    }
  })
})

describe('lookup behaviour', () => {
  it('returns the street lore by id', () => {
    expect(loreFor('hang-bac')?.craft).toBe('Bạc')
    expect(loreFor('ta-hien')?.line).toContain('bia')
  })

  it('returns undefined for an unknown street instead of throwing', () => {
    expect(loreFor('khong-ton-tai')).toBeUndefined()
    expect(loreFor(undefined)).toBeUndefined()
  })

  it('names the street in the fallback instead of saying nothing', () => {
    const line = loreLine('Hàng Chiếu', 'hang-chieu')
    expect(line).toContain('Hàng Chiếu')
    expect(line.toLowerCase()).not.toContain('có chuyện để kể')
  })
})

describe('world coherence', () => {
  it('every POI on a real street can find its lore', () => {
    const streeted = POIS.filter((p) => p.street)
    expect(streeted.length).toBeGreaterThan(150)
    const missing = streeted.filter((p) => !loreFor(p.street))
    expect(missing.map((p) => p.street)).toEqual([])
  })

  it('the street craft in the graph matches the craft in the Content Bible', () => {
    for (const street of STREETS) {
      const lore = loreFor(street.id)
      expect(lore?.craft, `${street.id} craft drift`).toBe(street.craft)
    }
  })
})

/**
 * Name diversity (F7). Measured: 311 POIs shared 64 names — the old quarter was
 * a wall of "Cà phê trứng". Street + qualifier lifted it to 160+ while keeping
 * every name grammatical ("Hồ Gươm · số lẻ" was the first, wrong, attempt).
 */
describe('POI names read like a city, not a template', () => {
  it('gives at least half the world a unique name', () => {
    const distinct = new Set(POIS.map((p) => p.name)).size
    expect(distinct).toBeGreaterThanOrEqual(Math.floor(POIS.length * 0.5))
  })

  it('only puts an address on things that can have an address', () => {
    const ADDRESS_WORDS = ['số lẻ', 'số chẵn', 'trong ngõ', 'tầng hai']
    const bogus = POIS.filter(
      (p) => p.type !== 'SHOP' && p.type !== 'WORKSHOP' && ADDRESS_WORDS.some((w) => p.name.includes(w)),
    )
    expect(bogus.map((p) => `${p.type}: ${p.name}`)).toEqual([])
  })

  it('never leaves a dangling separator', () => {
    for (const poi of POIS) {
      expect(poi.name.trim()).toBe(poi.name)
      expect(poi.name.endsWith('·')).toBe(false)
      expect(poi.name.includes('· ·')).toBe(false)
      expect(poi.name.includes('  ')).toBe(false)
    }
  })

  it('keeps every name short enough for the prompt capsule', () => {
    for (const poi of POIS) {
      expect(poi.name.length, `${poi.id}: ${poi.name}`).toBeLessThanOrEqual(56)
    }
  })
})
