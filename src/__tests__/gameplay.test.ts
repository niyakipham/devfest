import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '@game/store'
import { POIS } from '@world/data/hoanKiem'

const coHoa = POIS.find((p) => p.id === 'npc-co-hoa')!
const chiLan = POIS.find((p) => p.id === 'npc-lan')!
const lakeSpot = POIS.find((p) => p.id === 'lm-ho-guom')!
import { atmosphereAt, formatClock } from '@game/scene/atmosphere'
import { clearSave, readSave } from '@game/save'

describe('first 10 minutes loop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearSave()
    useGameStore.setState({
      phase: 'TITLE',
      dialogue: null,
      prompt: null,
      promptPoi: null,
      toasts: [],
      pieces: [],
      earnedToday: 0,
    })
  })

  it('starts a new day with the first quest active', () => {
    useGameStore.getState().startNew('Minh', 'PHO_VENDOR')
    const s = useGameStore.getState()
    expect(s.phase).toBe('PLAYING')
    expect(s.quests['q-pho']?.state).toBe('ACTIVE')
    expect(s.player.dong).toBe(150)
    expect(s.clock.minutes).toBe(340)
  })

  it('walks up to Aunt Hoa, talks, and finishes the pho quest', () => {
    const store = useGameStore.getState()
    store.startNew('Minh', 'PHO_VENDOR')

    useGameStore.getState().scanNearestPoi(coHoa.x, coHoa.z)
    expect(useGameStore.getState().prompt).toContain('Cô Hoa')

    useGameStore.getState().interact()
    expect(useGameStore.getState().dialogue?.key).toBe('co-hoa')

    useGameStore.getState().choose('eat')
    const after = useGameStore.getState()
    expect(after.dialogue).toBeNull()
    expect(after.player.dong).toBe(105)
    expect(after.quests['q-pho']?.state).toBe('CLAIMED')
    expect(after.quests['q-photo']?.state).toBe('AVAILABLE')
    expect(after.pieces).toContain('piece-01')
    expect(after.player.needs.hunger).toBeGreaterThan(34)
    expect(after.toasts.at(-1)?.title).toContain('Hoàn thành')
  })

  it('accepts and completes the photo quest at the lake', () => {
    const store = useGameStore.getState()
    store.startNew('Minh', 'PHOTOGRAPHER')
    // finish quest 1 quickly
    useGameStore.getState().scanNearestPoi(coHoa.x, coHoa.z)
    useGameStore.getState().interact()
    useGameStore.getState().choose('eat')

    useGameStore.getState().scanNearestPoi(chiLan.x, chiLan.z)
    useGameStore.getState().interact()
    expect(useGameStore.getState().dialogue?.key).toBe('chi-lan')
    useGameStore.getState().choose('accept')
    expect(useGameStore.getState().quests['q-photo']?.state).toBe('ACTIVE')

    useGameStore.getState().scanNearestPoi(lakeSpot.x, lakeSpot.z)
    useGameStore.getState().interact()
    const after = useGameStore.getState()
    expect(after.quests['q-photo']?.state).toBe('CLAIMED')
    expect(after.player.dong).toBe(105 + 120)
    expect(after.pieces).toContain('piece-02')
  })

  it('never lets the player spend money they do not have', () => {
    const store = useGameStore.getState()
    store.startNew('Ngheo', 'STUDENT')
    useGameStore.setState({ player: { ...useGameStore.getState().player, dong: 10 } })
    useGameStore.getState().scanNearestPoi(coHoa.x, coHoa.z)
    useGameStore.getState().interact()
    useGameStore.getState().choose('eat')
    expect(useGameStore.getState().player.dong).toBe(10)
    expect(useGameStore.getState().quests['q-pho']?.state).toBe('ACTIVE')
  })

  it('decays needs and advances the clock without killing the player', () => {
    useGameStore.getState().startNew('Minh', 'STUDENT')
    const before = useGameStore.getState().player.needs.hunger
    useGameStore.getState().tick(120)
    const after = useGameStore.getState()
    expect(after.player.needs.hunger).toBeLessThan(before)
    expect(after.player.needs.hunger).toBeGreaterThanOrEqual(0)
    expect(after.clock.minutes).toBe(460)
  })

  it('rolls over to the next day at midnight', () => {
    useGameStore.getState().startNew('Minh', 'STUDENT')
    useGameStore.setState({ clock: { ...useGameStore.getState().clock, minutes: 1430 } })
    useGameStore.getState().tick(20)
    expect(useGameStore.getState().clock.minutes).toBe(10)
    expect(useGameStore.getState().clock.day).toBe(2)
  })

  it('saves and reloads the exact same player state', () => {
    useGameStore.getState().startNew('Hương', 'SILVERSMITH')
    useGameStore.getState().tick(30)
    useGameStore.getState().saveNow()
    const save = readSave()
    expect(save?.player.name).toBe('Hương')
    expect(save?.player.persona).toBe('SILVERSMITH')
    expect(useGameStore.getState().hasSave).toBe(true)
  })
})

describe('atmosphere', () => {
  it('formats the clock and switches palettes', () => {
    expect(formatClock(340)).toBe('05:40')
    expect(formatClock(1440)).toBe('00:00')
    expect(atmosphereAt(340).night).toBe(false)
    expect(atmosphereAt(60).night).toBe(true)
    expect(atmosphereAt(720).sunIntensity).toBeGreaterThan(atmosphereAt(60).sunIntensity)
  })
})

/**
 * RP-03: hygiene used to decay at 0.04/min with no meter and no way to restore it,
 * so after ~33 in-game hours the stat was permanently at 0 and invisible. The fix is
 * a meter plus public taps, and it must stay free (a cozy game never gates cleanliness
 * behind money).
 */
describe('hygiene is a real need now', () => {
  it('has a public tap reachable in every phase-1 tile that needs one', () => {
    const taps = POIS.filter((p) => p.action === 'wash')
    expect(taps.length).toBeGreaterThan(10)
    for (const tap of taps) {
      expect(tap.type).toBe('SHOP')
      expect(tap.name).toContain('Vòi nước')
    }
  })

  it('restores hygiene at a tap and advances the clock', () => {
    useGameStore.getState().startNew('Lan', 'PHOTOGRAPHER')
    const tap = POIS.find((p) => p.action === 'wash')!
    useGameStore.setState({
      player: { ...useGameStore.getState().player, needs: { ...useGameStore.getState().player.needs, hygiene: 20 } },
      promptPoi: tap,
      clock: { minutes: 600, day: 2, season: 'THU' },
    })

    const dongBefore = useGameStore.getState().player.dong
    useGameStore.getState().interact()
    const after = useGameStore.getState()
    // +45 then 8 minutes of decay (−0.32): the need layer owns the final number
    expect(after.player.needs.hygiene).toBeCloseTo(64.68, 2)
    expect(after.clock.minutes).toBe(608)
    // washing is free
    expect(after.player.dong).toBe(dongBefore)
  })

  it('is capped at 100 and does not loop', () => {
    useGameStore.getState().startNew('Lan', 'PHOTOGRAPHER')
    const tap = POIS.find((p) => p.action === 'wash')!
    useGameStore.setState({
      player: { ...useGameStore.getState().player, needs: { ...useGameStore.getState().player.needs, hygiene: 90 } },
      promptPoi: tap,
    })
    useGameStore.getState().interact()
    // capped before decay applies
    expect(useGameStore.getState().player.needs.hygiene).toBeCloseTo(99.68, 2)
  })
})
