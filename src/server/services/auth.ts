import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { AuthRegister } from '@shared/contracts'
import type { MemoryStore, UserRecord } from '../repo/memory'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me'
export const JWT_TTL = '15m'

export interface PublicUser {
  id: string
  email: string
  username: string
  role: UserRecord['role']
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: 'EMAIL_TAKEN' | 'INVALID_CREDENTIALS' | 'WEAK_PASSWORD' | 'NOT_FOUND',
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

const toPublic = (user: UserRecord): PublicUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
})

export class AuthService {
  constructor(private readonly store: MemoryStore) {}

  async register(input: AuthRegister): Promise<{ user: PublicUser; token: string }> {
    if (this.store.findUserByEmail(input.email)) throw new AuthError('email already used', 'EMAIL_TAKEN')
    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = this.store.createUser({
      email: input.email,
      username: input.username,
      passwordHash,
      role: 'PLAYER',
    })
    return { user: toPublic(user), token: this.sign(user) }
  }

  async login(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
    const user = this.store.findUserByEmail(email)
    if (!user) throw new AuthError('invalid credentials', 'INVALID_CREDENTIALS')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new AuthError('invalid credentials', 'INVALID_CREDENTIALS')
    return { user: toPublic(user), token: this.sign(user) }
  }

  verify(token: string): PublicUser {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    const user = this.store.findUserById(payload.sub)
    if (!user) throw new AuthError('user not found', 'NOT_FOUND')
    return toPublic(user)
  }

  private sign(user: UserRecord): string {
    return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_TTL })
  }
}
