/**
 * Quest state machine (P0-Quest, blueprint) — pure, deterministic.
 *
 * A quest walks a strict path. No transition is allowed outside the table,
 * and no transition is allowed to skip a step:
 *
 *   LOCKED → AVAILABLE → ACTIVE → COMPLETE → CLAIMED
 *     ·        
 *   ACTIVE → FAILED (timed quest, past its deadline)
 *
 * Every operation is idempotent: re-applying the same action in the same state
 * returns the same record and a `replayed` flag, so a double-tap or a retry
 * can never double-claim, double-grant or jump a step.
 *
 * NOTE: this machine tracks quest lifecycle only. Objectives, rewards, and
 * budget decisions live in the caller (store/server).
 */
import { z } from 'zod'

export const QUEST_STATES = ['LOCKED', 'AVAILABLE', 'ACTIVE', 'COMPLETE', 'CLAIMED', 'FAILED'] as const
export type QuestState = (typeof QUEST_STATES)[number]

export const QuestRecordSchema = z.object({
  questId: z.string().min(1),
  state: z.enum(QUEST_STATES),
  /** objective id → 0..1 progress (0 = not started, 1 = done) */
  objectives: z.record(z.string(), z.number().min(0).max(1)).default({}),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  claimedAt: z.string().nullable().default(null),
  /** optional deadline (ICT ISO string) — fails the quest when it passes */
  expiresAt: z.string().nullable().default(null),
})
export type QuestRecord = z.infer<typeof QuestRecordSchema>

export const emptyQuestRecord = (questId: string, expiresAt: string | null = null): QuestRecord => ({
  questId,
  state: 'LOCKED',
  objectives: {},
  startedAt: null,
  completedAt: null,
  claimedAt: null,
  expiresAt,
})

/** Add (or subtract) minutes to an ISO timestamp and return it as ISO. */
export const addMinutes = (iso: string, minutes: number): string => {
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

export type QuestTransition =
  | 'reveal'      // boss → AVAILABLE
  | 'start'       // AVAILABLE → ACTIVE
  | 'complete'    // ACTIVE → COMPLETE
  | 'claim'       // COMPLETE → CLAIMED
  | 'expire'      // ACTIVE → FAILED
  | 'fail'        // AVAILABLE → FAILED (optional, for a boss-cancelled quest)

export class QuestMachineError extends Error {
  constructor(
    message: string,
    readonly code: 'NO_TRANSITION' | 'BAD_STATE' | 'EXPIRED' | 'NOT_COMPLETE' | 'ALREADY_CLAIMED',
  ) {
    super(message)
    this.name = 'QuestMachineError'
  }
}

export interface TransitionResult {
  record: QuestRecord
  replayed: boolean
}

/** AVAILABLE/LOCKED → AVAILABLE (idempotent reveal). */
export const revealQuest = (record: QuestRecord, _atICT: string): TransitionResult => {
  if (record.state === 'AVAILABLE' || record.state === 'ACTIVE' || record.state === 'COMPLETE' || record.state === 'CLAIMED') {
    return { record: { ...record }, replayed: true }
  }
  if (record.state === 'FAILED') {
    throw new QuestMachineError('quest already FAILED, cannot reveal', 'NO_TRANSITION')
  }
  return { record: { ...record, state: 'AVAILABLE' }, replayed: false }
}

/** AVAILABLE → ACTIVE. */
export const startQuest = (record: QuestRecord, nowICT: string): TransitionResult => {
  if (record.state === 'ACTIVE' || record.state === 'COMPLETE' || record.state === 'CLAIMED') {
    return { record: { ...record }, replayed: true }
  }
  if (record.state === 'LOCKED' || record.state === 'AVAILABLE') {
    return { record: { ...record, state: 'ACTIVE', startedAt: nowICT }, replayed: false }
  }
  throw new QuestMachineError(`cannot start quest in state ${record.state}`, 'NO_TRANSITION')
}

/** ACTIVE → COMPLETE (idempotent). */
export const completeQuest = (record: QuestRecord, nowICT: string): TransitionResult => {
  if (record.state === 'COMPLETE' || record.state === 'CLAIMED') {
    return { record: { ...record }, replayed: true }
  }
  if (record.state === 'ACTIVE') {
    // A quest with objectives requires every objective at 1.0.
    const unfinished = Object.entries(record.objectives).filter(([, v]) => v < 1)
    if (unfinished.length > 0) {
      throw new QuestMachineError(
        `objectives not done: ${unfinished.map(([k]) => k).join(', ')}`,
        'BAD_STATE',
      )
    }
    return { record: { ...record, state: 'COMPLETE', completedAt: nowICT }, replayed: false }
  }
  throw new QuestMachineError(`cannot complete quest in state ${record.state}`, 'NO_TRANSITION')
}

/** Mark an objective progress (clamped 0..1). Only active quests evolve this. */
export const applyObjective = (record: QuestRecord, objectiveId: string, progress: number): QuestRecord => {
  if (record.state !== 'ACTIVE') return record
  const next = Math.max(0, Math.min(1, progress))
  return { ...record, objectives: { ...record.objectives, [objectiveId]: next } }
}

/** COMPLETE → CLAIMED. Idempotent. */
export const claimQuest = (record: QuestRecord, nowICT: string): TransitionResult => {
  if (record.state === 'CLAIMED') {
    return { record: { ...record }, replayed: true }
  }
  if (record.state === 'COMPLETE') {
    return { record: { ...record, state: 'CLAIMED', claimedAt: nowICT }, replayed: false }
  }
  throw new QuestMachineError(
    `cannot claim quest in state ${record.state}`,
    record.state === 'FAILED' ? 'EXPIRED' : 'NOT_COMPLETE',
  )
}

/** ACTIVE → FAILED if the deadline has passed. Idempotent if already FAILED. */
export const expireQuest = (record: QuestRecord, nowICT: string): TransitionResult => {
  if (record.state === 'FAILED' || record.state === 'CLAIMED' || record.state === 'COMPLETE') {
    return { record: { ...record }, replayed: true }
  }
  if (record.state === 'ACTIVE' && record.expiresAt && nowICT > record.expiresAt) {
    return { record: { ...record, state: 'FAILED' }, replayed: false }
  }
  return { record: { ...record }, replayed: true }
}

/**
 * Is the quest eligible for a claim right now?
 * Returns the machine state + the expiry check together, so the server does not
 * have to layer two independent branches.
 */
export const canClaimQuest = (record: QuestRecord, nowICT: string): { state: QuestRecord; allowed: boolean; reason: 'ok' | 'not-complete' | 'expired' | 'already-claimed' } => {
  const expired = expireQuest(record, nowICT)
  if (expired.record.state === 'FAILED') {
    return { state: expired.record, allowed: false, reason: 'expired' }
  }
  if (expired.record.state === 'CLAIMED') {
    return { state: expired.record, allowed: false, reason: 'already-claimed' }
  }
  if (expired.record.state === 'COMPLETE') {
    return { state: expired.record, allowed: true, reason: 'ok' }
  }
  return { state: expired.record, allowed: false, reason: 'not-complete' }
}
