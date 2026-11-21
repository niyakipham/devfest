import { beforeEach, describe, expect, it } from 'vitest'
import { clearSave, hasSave, readSave, writeSave } from '@game/save'
import type { SaveGameV1 } from '@shared/contracts'

const makeSave = (name = 'Minh'): SaveGameV1 => ({
  version: 1,
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
    ;(globalThis as { localStorage?: Storage }).localStorage = broken
    try {
      expect(readSave()).toBeNull()
    } finally {
      ;(globalThis as { localStorage?: Storage }).localStorage = original
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
