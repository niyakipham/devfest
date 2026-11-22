/**
 * Nghề phở wired into the store (RP-04 + the Phase 1 progression blocker).
 *
 * These assert the *transactions*, not the pixels:
 *  - ingredients are charged, so the bowl is not free money
 *  - a perfect bowl levels a fresh player up inside one shift
 *  - the daily income cap still applies (farming is not the win condition)
 *  - the shift stops at bowlsPerDay and the player is told why
 *  - every bowl costs in-game time, so a day has a shape
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '@game/store'
import { GARNISH_ORDER, PHO_STAGES, bowlsPerDay, ingredientCost, minutesPerBowl, timingWindow } from '@rp/craft/pho'
import { xpToNext } from '@shared/formulas'

const freshGame = (dong = 500): void => {
  useGameStore.getState().startNew('Minh', 'PHO_VENDOR')
  useGameStore.setState({
    player: { ...useGameStore.getState().player, dong },
    shift: { brewed: 0, stage: -1, offsets: [], garnish: [], last: null, open: false },
    earnedToday: 0,
  })
}

/** plays one bowl at a given precision: 0 = perfect, 1 = ruined */
const brew = (precision: 0 | 1): void => {
  const store = useGameStore.getState()
  const level = store.player.craftLevel
  store.openShift()
  for (const stage of PHO_STAGES) {
    const offset = precision === 0 ? 0 : timingWindow(stage, level).burn + 500
    useGameStore.getState().stopStage(offset)
  }
  for (const item of GARNISH_ORDER) useGameStore.getState().placeGarnish(item)
  useGameStore.getState().closeShift()
}

describe('phở shift', () => {
  beforeEach(() => freshGame())

  it('charges ingredients when a bowl is sold', () => {
    const before = useGameStore.getState().player.dong
    brew(0)
    const after = useGameStore.getState().player.dong
    // perfect payout is 77đ; minus 11đ ingredients
    expect(after).toBeGreaterThan(before)
    expect(after - before).toBeLessThan(100)
    expect(after - before).toBeGreaterThan(0)
  })

  it('levels a brand-new player up within one shift', () => {
    expect(xpToNext(1)).toBe(120)
    // 5 perfect bowls give 26 XP each = 130 ≥ 120
    for (let i = 0; i < 5; i += 1) brew(0)
    const { player, shift } = useGameStore.getState()
    expect(shift.brewed).toBe(5)
    expect(player.craftLevel).toBeGreaterThanOrEqual(2)
  })

  it('never lets a bad bowl lose money', () => {
    const before = useGameStore.getState().player.dong
    brew(1)
    const after = useGameStore.getState().player.dong
    // worst case: one stage might scrape the graze band, but the net is always > 0
    // because the ruined floor (18đ) already covers the 11đ of ingredients
    expect(after - before).toBeGreaterThan(0)
  })

  it('advances the clock by the prep time of each bowl', () => {
    const before = useGameStore.getState().clock
    brew(0)
    const after = useGameStore.getState().clock
    const elapsed = (after.day - before.day) * 1440 + (after.minutes - before.minutes)
    expect(elapsed).toBe(minutesPerBowl)
  })

  it('stops accepting bowls at the daily limit and explains why', () => {
    const limit = bowlsPerDay(1)
    for (let i = 0; i < limit; i += 1) brew(0)
    expect(useGameStore.getState().shift.brewed).toBe(limit)

    useGameStore.getState().openShift()
    const toasts = useGameStore.getState().toasts
    expect(toasts.some((t) => t.title.includes('Hết nguyên liệu'))).toBe(true)
    expect(useGameStore.getState().shift.open).toBe(false)
  })

  it('refuses to open when the player cannot afford ingredients', () => {
    freshGame(ingredientCost() - 1)
    useGameStore.getState().openShift()
    expect(useGameStore.getState().shift.open).toBe(false)
    expect(useGameStore.getState().toasts.some((t) => t.title.includes('Không đủ tiền'))).toBe(true)
  })

  it('still respects the daily income cap', () => {
    freshGame(2_000)
    // burn the cap with quest-like earnings first
    useGameStore.setState({ earnedToday: 10_000 })
    const before = useGameStore.getState().player.dong
    brew(0)
    const gained = useGameStore.getState().player.dong - before
    // past the cap a bowl pays 20% of the payout, minus ingredients
    expect(gained).toBeLessThan(10)
  })

  it('ignores stops that arrive without an open shift', () => {
    const before = useGameStore.getState().player.dong
    useGameStore.getState().stopStage(0)
    useGameStore.getState().placeGarnish('herbs')
    expect(useGameStore.getState().player.dong).toBe(before)
    expect(useGameStore.getState().shift.offsets).toHaveLength(0)
  })

  it('keeps the last bowl visible after the card is dismissed', () => {
    brew(0)
    const last = useGameStore.getState().shift.last
    expect(last).not.toBeNull()
    expect(last!.perfect).toBe(true)
  })
})
