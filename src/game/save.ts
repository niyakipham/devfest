/**
 * Save system: offline-first (localStorage), schema-validated on read.
 * Corrupted or older saves are rejected safely instead of crashing the game.
 */
import { SAVE_VERSION, SaveGameV1, migrateSave } from '@shared/contracts'

/** Key stays stable across versions — the version lives inside the payload. */
export const SAVE_KEY = 'hanoi-legends:save' 
/** pre-v2 key, read once so early players keep their progress (ER-RP-01) */
const LEGACY_KEY = 'hanoi-legends:save:v1'

const memoryFallback = new Map<string, string>()

const storage = (): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> => {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {
    /* SSR / privacy mode */
  }
  return {
    getItem: (k: string) => memoryFallback.get(k) ?? null,
    setItem: (k: string, v: string) => void memoryFallback.set(k, v),
    removeItem: (k: string) => void memoryFallback.delete(k),
  }
}

export const readSave = (): SaveGameV1 | null => {
  try {
    const raw = storage().getItem(SAVE_KEY) ?? storage().getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    // migrates v1 → v2 in place; returns null for corrupt or future saves
    return migrateSave(parsed)
  } catch {
    return null
  }
}

export const writeSave = (save: SaveGameV1): void => {
  if ((save as { version?: number }).version !== SAVE_VERSION) {
    throw new Error(`unsupported save version: ${String((save as { version?: number }).version)}`)
  }
  const validated = SaveGameV1.parse(save)
  storage().setItem(SAVE_KEY, JSON.stringify(validated))
}

export const clearSave = (): void => storage().removeItem(SAVE_KEY)

export const hasSave = (): boolean => readSave() !== null
