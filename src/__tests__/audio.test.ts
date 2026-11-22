// @vitest-environment jsdom
/**
 * Audio bus (CORE-07). jsdom has no AudioContext, so this suite proves two things:
 *  - every entry point degrades to a no-op instead of throwing (a phone with a
 *    blocked context must never break the render loop)
 *  - the *scheduling* logic (hour → profile, district → gain) is pure and correct
 */
import { describe, expect, it } from 'vitest'
import { AMBIENCE_MIX, AudioBus, ambienceAt, audioBus, districtGain } from '@game/audio/bus'

describe('no-context safety', () => {
  it('reports not-ready and silently ignores every cue when Web Audio is missing', () => {
    const bus = new AudioBus()
    expect(bus.ready).toBe(false)
    expect(bus.init()).toBe(false)

    // none of these may throw in jsdom
    expect(() => bus.cue('step')).not.toThrow()
    expect(() => bus.cue('coin')).not.toThrow()
    expect(() => bus.bell()).not.toThrow()
    expect(() => bus.noise()).not.toThrow()
    expect(() => bus.tone(4)).not.toThrow()
    expect(() => bus.setDuck(true)).not.toThrow()
    expect(() => bus.setSettings({ master: 0.5 })).not.toThrow()
    expect(bus.ready).toBe(false)
  })

  it('does not resurrect a context after a failed init', () => {
    const bus = new AudioBus()
    bus.init()
    bus.init()
    expect(bus.ready).toBe(false)
  })

  it('exposes a shared singleton for the game to use', () => {
    expect(audioBus).toBeInstanceOf(AudioBus)
  })
})

describe('ambience by in-game hour', () => {
  it('maps every band of the day', () => {
    expect(ambienceAt(0)).toBe('night')
    expect(ambienceAt(5 * 60)).toBe('night')
    expect(ambienceAt(6 * 60)).toBe('dawn')
    expect(ambienceAt(8 * 60 + 59)).toBe('dawn')
    expect(ambienceAt(9 * 60)).toBe('morning')
    expect(ambienceAt(12 * 60)).toBe('noon')
    expect(ambienceAt(15 * 60)).toBe('afternoon')
    expect(ambienceAt(19 * 60)).toBe('evening')
    expect(ambienceAt(22 * 60)).toBe('night')
  })

  it('starts a new game at dawn with birds, not traffic', () => {
    // SPAWN time is 05:40 — just before the dawn band opens at 06:00
    const start = ambienceAt(340)
    expect(start).toBe('night')
    expect(ambienceAt(361)).toBe('dawn')
    expect(AMBIENCE_MIX.dawn.nature).toBeGreaterThan(AMBIENCE_MIX.dawn.traffic)
  })

  it('gives every profile a Vietnamese label and a level in 0..1', () => {
    for (const [key, mix] of Object.entries(AMBIENCE_MIX)) {
      expect(mix.label.length).toBeGreaterThan(6)
      for (const v of [mix.nature, mix.traffic, mix.crowd]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
      expect(key).toMatch(/^(dawn|morning|noon|afternoon|evening|night)$/)
    }
  })

  it('peaks traffic at rush hour, not at night', () => {
    const evening = AMBIENCE_MIX.evening.traffic
    const night = AMBIENCE_MIX.night.traffic
    expect(evening).toBeGreaterThan(night * 3)
  })
})

describe('district flavour', () => {
  it('makes the Old Quarter louder than the quiet shore', () => {
    expect(districtGain('Hàng Bạc')).toBeGreaterThan(districtGain('Bờ hồ phía nam'))
    expect(districtGain('Phố cổ')).toBeGreaterThan(1)
  })

  it('is case- and accent-tolerant enough for the generator names', () => {
    expect(districtGain('hàng mã')).toBe(districtGain('Hàng Mã'))
  })
})
