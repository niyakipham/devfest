/**
 * Double-entry wallet. Every mutation writes two lines that sum to zero and is
 * protected by an idempotency key, so retries and double-clicks cannot mint money.
 */
import type { MemoryStore } from '../repo/memory'
import { SYSTEM_SHOP, walletAccount } from '../repo/memory'

export class LedgerError extends Error {
  constructor(
    message: string,
    readonly code: 'INSUFFICIENT_FUNDS' | 'INVALID_AMOUNT' | 'UNBALANCED',
  ) {
    super(message)
    this.name = 'LedgerError'
  }
}

export interface LedgerResult {
  balance: number
  replayed: boolean
}

export class LedgerService {
  constructor(private readonly store: MemoryStore) {}

  balance(userId: string): number {
    return this.store.balance(walletAccount(userId))
  }

  /** Player buys something: player −amount, shop +amount. */
  purchase(userId: string, amount: number, sku: string, idempotencyKey: string): LedgerResult {
    if (!Number.isInteger(amount) || amount <= 0) throw new LedgerError('amount must be a positive integer', 'INVALID_AMOUNT')
    if (!idempotencyKey) throw new LedgerError('idempotency key required', 'INVALID_AMOUNT')

    const replay = this.store.idempotency.has(idempotencyKey)
    if (!replay && this.balance(userId) < amount) {
      throw new LedgerError('not enough dong', 'INSUFFICIENT_FUNDS')
    }

    this.store.post(
      [
        { account: walletAccount(userId), deltaDong: -amount },
        { account: SYSTEM_SHOP, deltaDong: amount },
      ],
      `purchase:${sku}`,
      idempotencyKey,
    )

    return { balance: this.balance(userId), replayed: replay }
  }

  /** Quest / profession reward: faucet −amount (negative) and player +amount. */
  grant(userId: string, amount: number, reason: string, idempotencyKey: string): LedgerResult {
    if (!Number.isInteger(amount) || amount <= 0) throw new LedgerError('amount must be a positive integer', 'INVALID_AMOUNT')
    const replay = this.store.idempotency.has(idempotencyKey)

    this.store.post(
      [
        { account: walletAccount(userId), deltaDong: amount },
        { account: 'system:faucet', deltaDong: -amount },
      ],
      `grant:${reason}`,
      idempotencyKey,
    )

    return { balance: this.balance(userId), replayed: replay }
  }

  history(userId: string): number {
    return this.store.ledger.filter((l) => l.account === walletAccount(userId)).length
  }
}
