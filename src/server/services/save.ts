import { migrateSave } from '@shared/contracts'
import type { SaveGameV1 } from '@shared/contracts'
import type { MemoryStore, SaveRecord } from '../repo/memory'

export class SaveError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID_SAVE' | 'SLOT_OUT_OF_RANGE',
  ) {
    super(message)
    this.name = 'SaveError'
  }
}

export class SaveService {
  constructor(private readonly store: MemoryStore) {}

  push(userId: string, slot: number, candidate: unknown): SaveRecord {
    if (!Number.isInteger(slot) || slot < 0 || slot > 2) throw new SaveError('slot must be 0..2', 'SLOT_OUT_OF_RANGE')
    // ER-RP-01: a client running an older build still pushes v1. Migrating here
    // means a schema bump never strands a player mid-progress; only genuinely
    // malformed payloads are rejected.
    const migrated = migrateSave(candidate)
    if (!migrated) throw new SaveError('save payload does not match schema', 'INVALID_SAVE')

    const save: SaveGameV1 = {
      ...migrated,
      slot,
      updatedAt: new Date().toISOString(),
    }
    return this.store.upsertSave(userId, slot, save)
  }

  pull(userId: string, slot: number): SaveGameV1 | null {
    return this.store.getSave(userId, slot)?.save ?? null
  }

  latest(userId: string): SaveGameV1 | null {
    let best: SaveRecord | null = null
    for (const slot of [0, 1, 2]) {
      const record = this.store.getSave(userId, slot)
      if (!record) continue
      if (!best || record.updatedAt > best.updatedAt) best = record
    }
    return best?.save ?? null
  }
}
