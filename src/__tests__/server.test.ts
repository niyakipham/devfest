import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '@server/app'
import { MemoryStore } from '@server/repo/memory'
import { LedgerError, LedgerService } from '@server/services/ledger'

let server: Server
let baseUrl: string

beforeAll(async () => {
  const app = createApp()
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

const json = async (path: string, init?: RequestInit): Promise<{ status: number; body: any }> => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  return { status: res.status, body: await res.json() }
}

describe('ledger (double-entry)', () => {
  it('keeps every transaction balanced and idempotent', () => {
    const store = new MemoryStore()
    const ledger = new LedgerService(store)

    ledger.grant('u1', 500, 'quest', 'grant-1')
    expect(ledger.balance('u1')).toBe(500)

    const replay = ledger.grant('u1', 500, 'quest', 'grant-1')
    expect(replay.replayed).toBe(true)
    expect(ledger.balance('u1')).toBe(500)

    ledger.purchase('u1', 45, 'pho', 'buy-1')
    expect(ledger.balance('u1')).toBe(455)

    const total = store.ledger.reduce((acc, l) => acc + l.deltaDong, 0)
    expect(total).toBe(0)
  })

  it('refuses to overspend and to replay a purchase', () => {
    const store = new MemoryStore()
    const ledger = new LedgerService(store)
    ledger.grant('u2', 100, 'quest', 'g')

    expect(() => ledger.purchase('u2', 500, 'ao-dai', 'p1')).toThrow(LedgerError)
    expect(ledger.balance('u2')).toBe(100)

    ledger.purchase('u2', 40, 'tra-da', 'p2')
    const replay = ledger.purchase('u2', 40, 'tra-da', 'p2')
    expect(replay.replayed).toBe(true)
    expect(ledger.balance('u2')).toBe(60)
  })
})

describe('http api', () => {
  it('serves health and world tiles', async () => {
    const health = await json('/api/health')
    expect(health.status).toBe(200)
    expect(health.body.ok).toBe(true)

    const tile = await json('/api/world/tile/9/6')
    expect(tile.status).toBe(200)
    expect(tile.body.id).toBe('t_9_6')
    expect(Array.isArray(tile.body.pois)).toBe(true)
  })

  it('rejects invalid tiles and bboxes', async () => {
    expect((await json('/api/world/tile/99/99')).status).toBe(400)
    expect((await json('/api/world/pois')).status).toBe(400)
  })

  it('registers, logs in and guards the save endpoint', async () => {
    const email = `player_${Date.now()}@example.com`
    const register = await json('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username: `player${Date.now() % 100000}`, password: 'hanoi2026' }),
    })
    expect(register.status).toBe(201)
    const token = register.body.token as string
    expect(token).toBeTruthy()

    const login = await json('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'hanoi2026' }),
    })
    expect(login.status).toBe(200)

    expect((await json('/api/save/0')).status).toBe(401)

    const me = await json('/api/me', { headers: { authorization: `Bearer ${token}` } })
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(email)

    const wallet = await json('/api/wallet', { headers: { authorization: `Bearer ${token}` } })
    expect(wallet.body.dong).toBe(0)
  })

  it('validates the save schema before storing it', async () => {
    const email = `saver_${Date.now()}@example.com`
    const register = await json('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username: `saver${Date.now() % 100000}`, password: 'hanoi2026' }),
    })
    const token = register.body.token as string
    const authHeader = { authorization: `Bearer ${token}` }

    const bad = await json('/api/save', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ slot: 0, save: { version: 1 } }),
    })
    expect(bad.status).toBe(400)

    const good = await json('/api/save', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        slot: 0,
        save: {
          version: 1,
          slot: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          player: {
            name: 'Lan',
            persona: 'PHOTOGRAPHER',
            position: { x: 1, y: 0, z: 2 },
            yaw: 0,
            needs: { energy: 80, hunger: 60, mood: 70, hygiene: 90 },
            dong: 100,
            hoaSen: 0,
            craftLevel: 2,
            craftXp: 10,
            reputation: {},
          },
          quests: [],
          pieces: [],
          clock: { minutes: 400, day: 2, season: 'THU' },
          settings: { reduceMotion: false, sfx: true, language: 'vi' },
        },
      }),
    })
    expect(good.status).toBe(201)

    const pull = await json('/api/save/0', { headers: authHeader })
    expect(pull.status).toBe(200)
    expect(pull.body.save.player.name).toBe('Lan')
  })
})
