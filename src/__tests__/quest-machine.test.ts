import { describe, expect, it } from 'vitest'
import {
  emptyQuestRecord,
  revealQuest,
  startQuest,
  completeQuest,
  claimQuest,
  expireQuest,
  canClaimQuest,
  applyObjective,
  addMinutes,
  QuestMachineError,
} from '@shared/quest-machine'

const now = '2026-11-22T08:00:00.000Z'

describe('quest machine — lifecycle', () => {
  it('LOCKED → AVAILABLE via reveal, idempotent', () => {
    const created = emptyQuestRecord('q-test')
    const revealed = revealQuest(created, now)
    expect(revealed.record.state).toBe('AVAILABLE')
    const again = revealQuest(revealed.record, now)
    expect(again.replayed).toBe(true)
    expect(again.record.state).toBe('AVAILABLE')
  })

  it('AVAILABLE → ACTIVE via start', () => {
    const created = revealQuest(emptyQuestRecord('q-test'), now).record
    const started = startQuest(created, now)
    expect(started.record.state).toBe('ACTIVE')
    expect(started.record.startedAt).toBe(now)
    // re-start is idempotent — no double startedAt overwrite
    const again = startQuest(started.record, now)
    expect(again.replayed).toBe(true)
    expect(again.record.startedAt).toBe(now)
  })

  it('ACTIVE → COMPLETE via complete (no objectives → auto-complete)', () => {
    let r = revealQuest(emptyQuestRecord('q-test'), now).record
    r = startQuest(r, now).record
    r = completeQuest(r, now).record
    expect(r.state).toBe('COMPLETE')
    expect(r.completedAt).toBe(now)
  })

  it('ACTIVE → COMPLETE requires every objective at 1.0', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    r = startQuest(r, now).record
    r = applyObjective(r, 'eat', 1)
    r = applyObjective(r, 'photo', 0.5)
    expect(() => completeQuest(r, now)).toThrow(QuestMachineError)
  })

  it('COMPLETE → CLAIMED via claim, idempotent', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    r = startQuest(r, now).record
    r = completeQuest(r, now).record
    const claimed = claimQuest(r, now)
    expect(claimed.record.state).toBe('CLAIMED')
    expect(claimed.replayed).toBe(false)
    const again = claimQuest(claimed.record, now)
    expect(again.replayed).toBe(true)
    expect(again.record.state).toBe('CLAIMED')
  })

  it('claim rejects from wrong states', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    expect(() => claimQuest(r, now)).toThrow(QuestMachineError)
    r = startQuest(r, now).record
    expect(() => claimQuest(r, now)).toThrow(QuestMachineError)
  })
})

describe('quest machine — expiry', () => {
  it('expires an ACTIVE quest whose deadline has passed', () => {
    const created = emptyQuestRecord('q-test', '2026-11-22T07:00:00.000Z')
    let r = revealQuest(created, now).record
    r = startQuest(r, '2026-11-22T06:30:00.000Z').record
    const result = expireQuest(r, '2026-11-22T08:00:00.000Z')
    expect(result.record.state).toBe('FAILED')
  })

  it('does not expire before the deadline', () => {
    const created = emptyQuestRecord('q-test', '2026-11-22T09:00:00.000Z')
    let r = revealQuest(created, now).record
    r = startQuest(r, now).record
    const result = expireQuest(r, '2026-11-22T08:00:00.000Z')
    expect(result.record.state).toBe('ACTIVE')
  })

  it('x-expire on already-terminal quests is a replay', () => {
    let r = emptyQuestRecord('q-test', '2026-11-22T07:00:00.000Z')
    r = revealQuest(r, now).record
    r = startQuest(r, '2026-11-22T06:30:00.000Z').record
    r = expireQuest(r, '2026-11-22T08:00:00.000Z').record
    const again = expireQuest(r, '2026-11-22T09:00:00.000Z')
    expect(again.replayed).toBe(true)
    expect(again.record.state).toBe('FAILED')
  })
})

describe('quest machine — canClaim gate', () => {
  it('allows claim on COMPLETE', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    r = startQuest(r, now).record
    r = completeQuest(r, now).record
    const g = canClaimQuest(r, now)
    expect(g.allowed).toBe(true)
    expect(g.reason).toBe('ok')
  })

  it('refuses claim on ACTIVE (not complete)', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    r = startQuest(r, now).record
    expect(canClaimQuest(r, now).reason).toBe('not-complete')
  })

  it('refuses claim on FAILED (expired)', () => {
    const created = emptyQuestRecord('q-test', '2026-11-22T07:00:00.000Z')
    let r = revealQuest(created, now).record
    r = startQuest(r, '2026-11-22T06:30:00.000Z').record
    r = expireQuest(r, '2026-11-22T08:00:00.000Z').record
    const g = canClaimQuest(r, '2026-11-22T08:00:00.000Z')
    expect(g.allowed).toBe(false)
    expect(g.reason).toBe('expired')
  })

  it('refuses claim on CLAIMED (already claimed)', () => {
    let r = emptyQuestRecord('q-test')
    r = revealQuest(r, now).record
    r = startQuest(r, now).record
    r = completeQuest(r, now).record
    r = claimQuest(r, now).record
    expect(canClaimQuest(r, now).reason).toBe('already-claimed')
  })
})

describe('quest machine — applyObjective', () => {
  it('clamps to 0..1 and only updates ACTIVE records', () => {
    const created = emptyQuestRecord('q-test')
    const revealed = revealQuest(created, now).record
    const inactive = applyObjective(revealed, 'eat', 0.7)
    expect(inactive.objectives).toEqual({})

    const started = startQuest(revealed, now).record
    expect(applyObjective(started, 'eat', 0.5).objectives.eat).toBe(0.5)
    expect(applyObjective(started, 'eat', 2).objectives.eat).toBe(1)
    expect(applyObjective(started, 'eat', -1).objectives.eat).toBe(0)
  })
})

describe('quest machine — addMinutes', () => {
  it('adds minutes to an ISO timestamp', () => {
    expect(addMinutes('2026-11-22T08:00:00.000Z', 90)).toBe('2026-11-22T09:30:00.000Z')
  })
})
