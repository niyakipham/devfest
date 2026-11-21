/**
 * In-memory repositories for Phase 1.
 * The interfaces are what Postgres/Prisma will implement in Phase 4 —
 * swapping the store must not change a single route or service.
 */
import type { SaveGameV1 } from '@shared/contracts'

export interface UserRecord {
  id: string
  email: string
  username: string
  passwordHash: string
  role: 'PLAYER' | 'MODERATOR' | 'ADMIN'
  createdAt: string
}

export interface LedgerLineRecord {
  id: string
  transactionId: string
  account: string
  deltaDong: number
  reason: string
  idempotencyKey: string
  createdAt: string
}

export interface SaveRecord {
  id: string
  userId: string
  slot: number
  save: SaveGameV1
  updatedAt: string
}

const id = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export class MemoryStore {
  users = new Map<string, UserRecord>()
  usersByEmail = new Map<string, string>()
  saves = new Map<string, SaveRecord>()
  ledger: LedgerLineRecord[] = []
  transactions = new Map<string, string[]>()
  idempotency = new Map<string, LedgerLineRecord[]>()

  createUser(input: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const user: UserRecord = { ...input, id: id('usr'), createdAt: new Date().toISOString() }
    this.users.set(user.id, user)
    this.usersByEmail.set(user.email.toLowerCase(), user.id)
    return user
  }

  findUserByEmail(email: string): UserRecord | undefined {
    const userId = this.usersByEmail.get(email.toLowerCase())
    return userId ? this.users.get(userId) : undefined
  }

  findUserById(userId: string): UserRecord | undefined {
    return this.users.get(userId)
  }

  upsertSave(userId: string, slot: number, save: SaveGameV1): SaveRecord {
    const key = `${userId}:${slot}`
    const record: SaveRecord = {
      id: key,
      userId,
      slot,
      save,
      updatedAt: new Date().toISOString(),
    }
    this.saves.set(key, record)
    return record
  }

  getSave(userId: string, slot: number): SaveRecord | undefined {
    return this.saves.get(`${userId}:${slot}`)
  }

  post(lines: Array<{ account: string; deltaDong: number }>, reason: string, key: string): LedgerLineRecord[] {
    const existing = this.idempotency.get(key)
    if (existing) return existing

    const sum = lines.reduce((acc, l) => acc + l.deltaDong, 0)
    if (sum !== 0) throw new Error(`unbalanced transaction: ${sum}`)

    const transactionId = id('txn')
    const created = lines.map((line) => ({
      id: id('led'),
      transactionId,
      account: line.account,
      deltaDong: line.deltaDong,
      reason,
      idempotencyKey: key,
      createdAt: new Date().toISOString(),
    }))
    this.ledger.push(...created)
    this.transactions.set(transactionId, created.map((c) => c.id))
    this.idempotency.set(key, created)
    return created
  }

  balance(account: string): number {
    return this.ledger.filter((l) => l.account === account).reduce((acc, l) => acc + l.deltaDong, 0)
  }
}

export const memoryStore = new MemoryStore()

export const walletAccount = (userId: string): string => `wallet:${userId}`
export const SYSTEM_FAUCET = 'system:faucet'
export const SYSTEM_SHOP = 'system:shop'
