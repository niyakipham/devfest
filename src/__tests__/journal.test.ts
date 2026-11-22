/**
 * Nhật ký tự sinh (RP-08). The journal must read like a memory, not a to-do list:
 * events append themselves, statistics can never disagree with the diary, and the
 * log stays small enough to live in localStorage next to the save.
 */
import { describe, expect, it } from 'vitest'
import {
  EMPTY_STATS,
  JOURNAL_LIMIT,
  appendEntry,
  brewEntry,
  dayEntry,
  earnEntry,
  eatEntry,
  formatEntryTime,
  formatKm,
  makeEntryId,
  meetEntry,
  photoEntry,
  walkEntry,
  type JournalEntry,
  type JournalStats,
} from '@rp/journal'

const id = makeEntryId

describe('append + cap', () => {
  it('puts the newest entry first and never exceeds the cap', () => {
    let entries: JournalEntry[] = []
    for (let i = 0; i < JOURNAL_LIMIT + 15; i += 1) {
      entries = appendEntry(entries, {
        id: `e${i}`,
        day: 1,
        minute: i,
        kind: 'walk',
        text: `bước ${i}`,
      })
    }
    expect(entries).toHaveLength(JOURNAL_LIMIT)
    expect(entries[0].id).toBe(`e${JOURNAL_LIMIT + 14}`)
  })

  it('formats a timestamp the way the journal prints it', () => {
    expect(formatEntryTime({ id: 'x', day: 3, minute: 605, kind: 'eat', text: '' })).toBe('Ngày 3 · 10:05')
  })
})

describe('walk entries', () => {
  it('always counts metres but only writes on a new tile', () => {
    const first = walkEntry(EMPTY_STATS, { metres: 120, day: 1, minute: 400, tile: 't_08_07' }, id)
    expect(first.entry).not.toBeNull()
    expect(first.stats.metresWalked).toBe(120)
    expect(first.stats.tilesSeen).toEqual(['t_08_07'])

    const second = walkEntry(first.stats, { metres: 40, day: 1, minute: 402, tile: 't_08_07' }, id)
    expect(second.entry).toBeNull()
    expect(second.stats.metresWalked).toBe(160)
  })

  it('writes an entry for a landmark even on a known tile', () => {
    const known: JournalStats = { ...EMPTY_STATS, tilesSeen: ['t_08_07'] }
    const result = walkEntry(known, { metres: 10, day: 2, minute: 500, tile: 't_08_07', atLandmark: 'Hồ Gươm' }, id)
    expect(result.entry?.text).toContain('Hồ Gươm')
  })

  it('ignores negative distance (a teleport back is not a walk)', () => {
    const result = walkEntry(EMPTY_STATS, { metres: -500, day: 1, minute: 400, tile: 't_08_07' }, id)
    expect(result.stats.metresWalked).toBe(0)
  })

  it('formats kilometres with a Vietnamese decimal comma', () => {
    expect(formatKm(3400)).toBe('3,4 km')
    expect(formatKm(0)).toBe('0,0 km')
  })
})

describe('activity entries', () => {
  it('counts bowls eaten and writes the price', () => {
    const r = eatEntry(EMPTY_STATS, { dish: 'phở bò', price: 45, day: 1, minute: 420 }, id)
    expect(r.entry.text).toBe('Ăn phở bò (45đ).')
    expect(r.stats.bowlsEaten).toBe(1)
  })

  it('counts brewed bowls and only adds positive income', () => {
    let stats = EMPTY_STATS
    const r1 = brewEntry(stats, { verdict: 'Ngon.', quality: 0.9, dong: 77, day: 1, minute: 430 }, id)
    stats = r1.stats
    const r2 = brewEntry(stats, { verdict: 'Lỡ tay.', quality: 0.2, dong: -4, day: 1, minute: 460 }, id)
    expect(r2.stats.bowlsBrewed).toBe(2)
    // a loss never subtracts from lifetime earnings
    expect(r2.stats.dongEarned).toBe(77)
  })

  it('records an NPC once, not on every greeting', () => {
    const first = meetEntry(EMPTY_STATS, [], { name: 'Cô Hoa', district: 'Hoàn Kiếm', day: 1, minute: 400 }, id)
    expect(first.entry?.text).toContain('Cô Hoa')
    expect(first.stats.npcsMet).toBe(1)

    const again = meetEntry(first.stats, first.metNpcs, { name: 'Cô Hoa', district: 'Hoàn Kiếm', day: 1, minute: 500 }, id)
    expect(again.entry).toBeNull()
    expect(again.stats.npcsMet).toBe(1)
    expect(again.metNpcs).toEqual(['Cô Hoa'])
  })

  it('counts photos and earnings', () => {
    const p = photoEntry(EMPTY_STATS, { subject: 'Tháp Rùa', day: 1, minute: 500 }, id)
    expect(p.stats.photosTaken).toBe(1)

    const e = earnEntry(EMPTY_STATS, { reason: 'Xong việc cô Hoa', dong: 45, day: 1, minute: 520 }, id)
    expect(e.entry.text).toContain('+45đ')
    expect(e.stats.dongEarned).toBe(45)
  })

  it('stamps a new day at minute 0', () => {
    const entry = dayEntry(4, id)
    expect(entry.day).toBe(4)
    expect(entry.minute).toBe(0)
    expect(entry.text).toContain('Ngày 4')
  })
})

describe('ids are stable', () => {
  it('produces the same id for the same seed so React keys survive a reload', () => {
    expect(makeEntryId('meet-Cô Hoa')).toBe('j-meet-cô-hoa')
    expect(makeEntryId('walk t_08_07 3')).toBe('j-walk-t_08_07-3')
  })
})
