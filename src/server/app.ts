/**
 * HTTP API (Phase 1). Everything is validated with the shared zod contracts,
 * every money mutation is idempotent, and no route trusts a client-computed balance.
 */
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { AuthLogin, AuthRegister, SavePushRequest } from '@shared/contracts'
import { CATALOG, findSku } from '@shared/catalog'
import { POIS } from '@world/data/hoanKiem'
import { TILE_SIZE, tileAt, tileBounds } from '@world/grid'
import { memoryStore } from './repo/memory'
import { AuthError, AuthService } from './services/auth'
import { LedgerError, LedgerService } from './services/ledger'
import { SaveError, SaveService } from './services/save'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

const rateLimiter = () => {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const entry = hits.get(key)
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
      next()
      return
    }
    entry.count += 1
    if (entry.count > MAX_REQUESTS) {
      res.status(429).json({ error: 'too many requests', code: 'RATE_LIMITED' })
      return
    }
    next()
  }
}

const bearer = (req: Request): string | null => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

export const createApp = () => {
  const app = express()
  const auth = new AuthService(memoryStore)
  const saves = new SaveService(memoryStore)
  const ledger = new LedgerService(memoryStore)

  app.set('trust proxy', true)
  app.use(cors())
  app.use(express.json({ limit: '512kb' }))
  app.use(rateLimiter())

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'hanoi-legends-api', version: 1 })
  })

  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const input = AuthRegister.parse(req.body)
      res.status(201).json(await auth.register(input))
    } catch (err) {
      next(err)
    }
  })

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const input = AuthLogin.parse(req.body)
      res.json(await auth.login(input.email, input.password))
    } catch (err) {
      next(err)
    }
  })

  const requireUser = (req: Request, res: Response, next: NextFunction): void => {
    const token = bearer(req)
    if (!token) {
      res.status(401).json({ error: 'missing token', code: 'UNAUTHORIZED' })
      return
    }
    try {
      res.locals.user = auth.verify(token)
      next()
    } catch {
      res.status(401).json({ error: 'invalid token', code: 'UNAUTHORIZED' })
    }
  }

  app.get('/api/me', requireUser, (_req, res) => {
    res.json({ user: res.locals.user })
  })

  /* ------------------------------- WORLD ------------------------------- */
  app.get('/api/world/tile/:x/:z', (req, res) => {
    const tx = Number(req.params.x)
    const tz = Number(req.params.z)
    if (!Number.isInteger(tx) || !Number.isInteger(tz) || tx < 0 || tz < 0 || tx > 19 || tz > 15) {
      res.status(400).json({ error: 'invalid tile', code: 'BAD_TILE' })
      return
    }
    const id = tileAt(tx * TILE_SIZE + 1, tz * TILE_SIZE + 1)
    res.json({
      id,
      bounds: tileBounds(tx, tz),
      pois: POIS.filter((p) => p.tileId === id),
    })
  })

  app.get('/api/world/pois', (req, res) => {
    const { minX, maxX, minZ, maxZ } = req.query
    if (!minX || !maxX || !minZ || !maxZ) {
      res.status(400).json({ error: 'bbox required', code: 'BAD_BBOX' })
      return
    }
    const box = {
      minX: Number(minX),
      maxX: Number(maxX),
      minZ: Number(minZ),
      maxZ: Number(maxZ),
    }
    if (box.minX > box.maxX || box.minZ > box.maxZ) {
      res.status(400).json({ error: 'invalid bbox', code: 'BAD_BBOX' })
      return
    }
    res.json({
      pois: POIS.filter(
        (p) => p.x >= box.minX && p.x <= box.maxX && p.z >= box.minZ && p.z <= box.maxZ,
      ),
    })
  })

  /* -------------------------------- SAVE -------------------------------- */
  app.post('/api/save', requireUser, (req, res, next) => {
    try {
      const body = SavePushRequest.parse(req.body)
      const record = saves.push(res.locals.user.id, body.slot, body.save)
      res.status(201).json({ slot: record.slot, updatedAt: record.updatedAt })
    } catch (err) {
      next(err)
    }
  })

  app.get('/api/save/:slot', requireUser, (req, res) => {
    const slot = Number(req.params.slot)
    const save = saves.pull(res.locals.user.id, slot)
    if (!save) {
      res.status(404).json({ error: 'save not found', code: 'NOT_FOUND' })
      return
    }
    res.json({ save })
  })

  /* ------------------------------- WALLET ------------------------------- */
  app.get('/api/wallet', requireUser, (_req, res) => {
    res.json({ dong: ledger.balance(res.locals.user.id), entries: ledger.history(res.locals.user.id) })
  })

  /**
   * Server-authoritative pricing (F4).
   * The client sends a SKU only. A `price` in the body is ignored on purpose:
   * trusting it let a player buy a 480đ áo dài for 1đ.
   */
  app.get('/api/shop/catalog', (_req, res) => {
    res.json({ entries: CATALOG })
  })

  app.post('/api/shop/purchase', requireUser, (req, res, next) => {
    try {
      const { sku, idempotencyKey } = req.body as { sku?: unknown; idempotencyKey?: unknown }
      if (typeof sku !== 'string' || typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
        res.status(400).json({ error: 'sku and idempotencyKey (>=8 chars) required', code: 'BAD_REQUEST' })
        return
      }
      const entry = findSku(sku)
      if (!entry) {
        res.status(404).json({ error: `unknown sku ${sku}`, code: 'UNKNOWN_SKU' })
        return
      }
      const result = ledger.purchase(res.locals.user.id, entry.price, entry.sku, idempotencyKey)
      res.json({ ...result, sku: entry.sku, name: entry.name, charged: entry.price })
    } catch (err) {
      next(err)
    }
  })

  /* ------------------------------- ERRORS ------------------------------- */
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AuthError) {
      const status = err.code === 'EMAIL_TAKEN' ? 409 : err.code === 'NOT_FOUND' ? 404 : 401
      res.status(status).json({ error: err.message, code: err.code })
      return
    }
    if (err instanceof LedgerError) {
      res.status(err.code === 'INSUFFICIENT_FUNDS' ? 402 : 400).json({ error: err.message, code: err.code })
      return
    }
    if (err instanceof SaveError) {
      res.status(400).json({ error: err.message, code: err.code })
      return
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      res.status(400).json({ error: 'validation failed', code: 'VALIDATION', details: err })
      return
    }
    console.error('[api] unhandled', err)
    res.status(500).json({ error: 'internal error', code: 'INTERNAL' })
  })

  return app
}
