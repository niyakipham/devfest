// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { clearSave, hasSave, readSave, writeSave } from '@game/save'
import { migrateSave } from '@shared/contracts'
import type { SaveGameV1 } from '@shared/contracts'
import { EMPTY_STREAK } from '@shared/streak'

const makeSave = (name = 'Minh'): SaveGameV1 => ({
  version: 3,
  slot: 0,
  createdAt: '2026-11-21T05:00:00.000Z',
  updatedAt: '2026-11-21T05:10:00.000Z',
  player: {
    name,
    persona: 'PHO_VENDOR',
    position: { x: 2460, y: 0, z: 2010 },
    yaw: Math.PI,
    needs: { energy: 70, hunger: 40, mood: 55, hygiene: 80 },
    dong: 150,
    hoaSen: 0,
    craftLevel: 1,
    craftXp: 20,
    reputation: { resident: 2 },
  },
  quests: [{ key: 'q-pho', state: 'ACTIVE', objectives: { eat: 0 } }],
  pieces: ['piece-01'],
  clock: { minutes: 340, day: 1, season: 'DONG' },
  settings: { reduceMotion: false, sfx: true, language: 'vi' },
  journal: [],
  stats: { metresWalked: 0, bowlsEaten: 0, bowlsBrewed: 0, npcsMet: 0, photosTaken: 0, dongEarned: 0, tilesSeen: [] },
  metNpcs: [],
  streak: EMPTY_STREAK,
  companion: null,
})

describe('save system', () => {
  beforeEach(() => clearSave())

  it('round-trips a valid save', () => {
    writeSave(makeSave())
    const loaded = readSave()
    expect(loaded?.player.name).toBe('Minh')
    expect(loaded?.pieces).toEqual(['piece-01'])
    expect(hasSave()).toBe(true)
  })

  it('rejects a corrupted payload instead of crashing', () => {
    const original = (globalThis as { localStorage?: Storage }).localStorage
    const broken = {
      getItem: () => '{"version":1,"player":',
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } as unknown as Storage
    const g = globalThis as { localStorage?: Storage }
    g.localStorage = broken
    try {
      expect(readSave()).toBeNull()
    } finally {
      g.localStorage = original
    }
  })

  it('drops saves from an unknown future version', () => {
    const future = { ...makeSave(), version: 99 }
    expect(() => writeSave(future as unknown as SaveGameV1)).toThrow()
  })

  it('clears the save on demand', () => {
    writeSave(makeSave())
    clearSave()
    expect(hasSave()).toBe(false)
  })
})

/**
 * ER-RP-01: the journal (v2) must not wipe a Phase 1 save. A v1 payload has no
 * journal/stats/metNpcs — the migration fills them in and keeps every other value.
 */
describe('save migration v1 → v2', () => {
  beforeEach(() => clearSave())

  it('upgrades a v1 payload in place instead of rejecting it', () => {
    const v2 = makeSave()
    const { journal: _j, stats: _s, metNpcs: _m, ...rest } = v2
    const v1 = { ...rest, version: 1 }

    const migrated = migrateSave(v1)
    expect(migrated).not.toBeNull()
    expect(migrated!.version).toBe(3)
    expect(migrated!.player.name).toBe('Minh')
    expect(migrated!.pieces).toEqual(['piece-01'])
    expect(migrated!.journal).toEqual([])
    expect(migrated!.metNpcs).toEqual([])
    expect(migrated!.stats.metresWalked).toBe(0)
  })

  it('reads a v1 payload that is still sitting in the old storage key', () => {
    const v2 = makeSave()
    const { journal: _j, stats: _s, metNpcs: _m, ...rest } = v2
    const v1 = { ...rest, version: 1 }
    const store = (globalThis as { localStorage?: Storage }).localStorage
    expect(store, 'this test needs a real Storage (jsdom environment)').toBeDefined()
    store!.setItem('hanoi-legends:save:v1', JSON.stringify(v1))

    const loaded = readSave()
    expect(loaded?.version).toBe(3)
    expect(loaded?.player.name).toBe('Minh')
  })

  it('upgrades a v2 payload in place (v2 → v3)', () => {
    const v2 = {
      version: 2,
      slot: 0,
      createdAt: '2026-11-21T05:00:00.000Z',
      updatedAt: '2026-11-21T05:10:00.000Z',
      player: {
        name: 'Minh',
        persona: 'PHO_VENDOR',
        position: { x: 2460, y: 0, z: 2010 },
        yaw: Math.PI,
        needs: { energy: 70, hunger: 40, mood: 55, hygiene: 80 },
        dong: 150,
        hoaSen: 0,
        craftLevel: 1,
        craftXp: 20,
        reputation: { merchant: 2 },
      },
      quests: [{ key: 'q-pho', state: 'ACTIVE', objectives: { eat: 0 } }],
      pieces: ['piece-01'],
      clock: { minutes: 340, day: 1, season: 'DONG' },
      settings: { reduceMotion: false, sfx: true, language: 'vi' },
      journal: [],
      stats: { metresWalked: 0, bowlsEaten: 0, bowlsBrewed: 0, npcsMet: 0, photosTaken: 0, dongEarned: 0, tilesSeen: [] },
      metNpcs: [],
    }

    const migrated = migrateSave(v2)
    expect(migrated).not.toBeNull()
    expect(migrated!.version).toBe(3)
    expect(migrated!.player.name).toBe('Minh')
    expect(migrated!.streak.count).toBe(0) // EMPTY_STREAK default
    expect(migrated!.companion).toBeNull() // companion adoption is opt-in
  })

  it('keeps an already-valid v3 save untouched', () => {
    const v3 = makeSave()
    const parsed = migrateSave(v3)
    expect(parsed).not.toBeNull()
    expect(parsed!.streak.count).toBe(0)
    expect(parsed!.companion).toBeNull()
  })

  it('rejects a payload that is not an object at all', () => {
    expect(migrateSave(null)).toBeNull()
    expect(migrateSave('nope')).toBeNull()
    expect(migrateSave(42)).toBeNull()
  })

  it('keeps journal entries through a round-trip', () => {
    const save = makeSave()
    save.journal = [{ id: 'j-meet-co-hoa', day: 2, minute: 420, kind: 'meet', text: 'Gặp Cô Hoa.' }]
    save.stats.bowlsBrewed = 7
    save.metNpcs = ['Cô Hoa']

    writeSave(save)
    const loaded = readSave()
    expect(loaded?.journal[0].text).toBe('Gặp Cô Hoa.')
    expect(loaded?.stats.bowlsBrewed).toBe(7)
    expect(loaded?.metNpcs).toEqual(['Cô Hoa'])
  })
})
