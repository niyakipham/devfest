import { describe, expect, it } from 'vitest'
import {
  EMPTY_STREAK,
  MILESTONE_BONUS_POINTS,
  ictNow,
  weekStartOf,
  dayGap,
  evaluateStreakClaim,
  type StreakState,
} from '@shared/streak'

const claimOn = (prev: StreakState, date: string, pro = false) => evaluateStreakClaim(prev, date, { pro })

describe('streak date helpers', () => {
  it('weekStartOf returns the ICT Sunday (UTC Sunday reference)', () => {
    // 2026-11-22 is a Sunday
    expect(weekStartOf('2026-11-22')).toBe('2026-11-22')
    // 2026-11-25 is a Wednesday → the Sunday of that week
    expect(weekStartOf('2026-11-25')).toBe('2026-11-22')
    // 2026-11-29 is a Sunday
    expect(weekStartOf('2026-11-29')).toBe('2026-11-29')
  })

  it('dayGap counts ICT calendar days', () => {
    expect(dayGap('2026-11-20', '2026-11-21')).toBe(1)
    expect(dayGap('2026-11-20', '2026-11-23')).toBe(3)
    expect(dayGap('2026-11-22', '2026-11-21')).toBe(-1)
  })

  it('ictNow returns a YYYY-MM-DD string', () => {
    // the exact value depends on the host clock, but the shape and a sane range do not
    const now = new Date('2026-11-22T00:00:00+07:00')
    expect(ictNow(now)).toBe('2026-11-22')
  })
})

describe('evaluateStreakClaim — fresh start', () => {
  it('starts at day 1 when streak is empty', () => {
    const result = claimOn(EMPTY_STREAK, '2026-11-22', true)
    expect(result.awarded).toBe(true)
    expect(result.reason).toBe('reset-to-fresh-streak')
    expect(result.state.count).toBe(1)
    expect(result.state.freeze).toBe(1) // Pro week refills on rollover
    expect(result.state.lastMilestoneCount).toBe(0)
  })

  it('free tier starts with no freezes', () => {
    const result = claimOn(EMPTY_STREAK, '2026-11-22', false)
    expect(result.state.freeze).toBe(0)
  })
})

describe('evaluateStreakClaim — consecutive days', () => {
  it('grows by one each day', () => {
    let s = claimOn(EMPTY_STREAK, '2026-11-20').state
    s = claimOn(s, '2026-11-21').state
    s = claimOn(s, '2026-11-22').state
    expect(s.count).toBe(3)
  })

  it('no-op when called twice on the same day', () => {
    const once = claimOn(EMPTY_STREAK, '2026-11-20')
    const twice = claimOn(once.state, '2026-11-20')
    expect(twice.awarded).toBe(false)
    expect(twice.reason).toBe('same-day')
    expect(twice.state.count).toBe(1)
  })

  it('ignores a claim dated in the future', () => {
    const future = claimOn(EMPTY_STREAK, '2026-11-22').state
    // a day later is "in the future" relative to a date anchor still in the past
    const later = claimOn(future, '2026-11-21')
    expect(later.awarded).toBe(false)
    expect(later.reason).toBe('future-date')
  })
})

describe('evaluateStreakClaim — milestone at day 7', () => {
  it('grants the milestone bonus exactly once per 7-day cycle', () => {
    let s = EMPTY_STREAK
    const today = '2026-11-22'
    for (let i = 6; i >= 1; i -= 1) {
      // step backward days from day 7
      const d = new Date(Date.UTC(2026, 10, 22 - i))
      s = claimOn(s, `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`).state
    }
    const before = s
    expect(before.count).toBe(6)
    const result = claimOn(before, today, false)
    expect(result.state.count).toBe(7)
    expect(result.reason).toBe('milestone')
    expect(result.bonusPoints).toBe(MILESTONE_BONUS_POINTS)

    const again = claimOn(result.state, today, false) // same day
    expect(again.awarded).toBe(false)
    expect(again.state.count).toBe(7)
  })
})

describe('evaluateStreakClaim — missed days', () => {
  it('one missing day → eats the freeze (Pro)', () => {
    // consecutive 3 days, then one missed day, then claim on day 5 (gap = 2)
    let s = EMPTY_STREAK
    const d = ['2026-11-19', '2026-11-20', '2026-11-21']
    for (const day of d) s = claimOn(s, day, true).state
    expect(s.count).toBe(3)
    expect(s.freeze).toBe(1)
    const result = claimOn(s, '2026-11-23', true)
    expect(result.reason).toBe('freeze-eaten')
    expect(result.state.count).toBe(3)
    expect(result.state.freeze).toBe(0)
  })

  it('one missing day + no freeze → fresh streak of 1', () => {
    let s = EMPTY_STREAK
    s = claimOn(s, '2026-11-19', false).state
    s = claimOn(s, '2026-11-20', false).state
    const result = claimOn(s, '2026-11-22', false) // one day missed
    expect(result.reason).toBe('reset-to-fresh-streak')
    expect(result.state.count).toBe(1)
  })

  it('two or more missed days → streak resets, freeze cannot jump two', () => {
    let s = EMPTY_STREAK
    s = claimOn(s, '2026-11-19', true).state
    s = claimOn(s, '2026-11-20', true).state
    const result = claimOn(s, '2026-11-23', true)
    expect(result.reason).toBe('reset-to-fresh-streak')
    expect(result.state.count).toBe(1)
  })
})

describe('evaluateStreakClaim — weekly freeze refill', () => {
  it('Pro gets the freeze refilled on a new ICT Sunday', () => {
    let s = claimOn(EMPTY_STREAK, '2026-11-22', true).state // Sunday
    s = claimOn({ ...s, freeze: 0 }, '2026-11-23', true).state // Monday, freeze eaten by miss
    expect(s.freeze).toBe(0)
    // skip to the next Sunday: week rollover refills
    const refilled = claimOn(s, '2026-11-29', true)
    expect(refilled.state.freeze).toBe(1)
  })
})
