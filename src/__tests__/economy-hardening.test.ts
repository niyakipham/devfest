/**
 * Regression tests for the two money bugs found in the Phase 1.5 audit (F4).
 *
 *  1. `POST /api/shop/purchase` used to trust a client-supplied `price`,
 *     so a 480đ áo dài could be bought for 1đ.
 *  2. `earnedToday` was never reset when the in-game day rolled over, so every
 *     reward after day one was cut to 20% by applyIncomeCap — permanently.
 */
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '@server/app'
import { CATALOG, findSku, quote } from '@shared/catalog'
import { applyIncomeCap, dailyIncomeCap, priceWithReputation } from '@shared/formulas'
import { useGameStore } from '@game/store'

describe('server-authoritative pricing', () => {
  let server: Server
  let baseUrl: string
  let token: string

  const json = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    })
    return { status: res.status, body: await res.json() }
  }

  beforeAll(async () => {
    const app = createApp()
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve())
    })
    const address = server.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}`

    const email = `buyer-${Date.now()}@example.com`
    const username = `buyer${Date.now() % 100000}`
    const reg = await json('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password: 'mat-khau-du-dai-123' }),
    })
    expect(reg.status).toBe(201)
    token = reg.body.token
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('catalog prices are positive integers and skus are unique', () => {
    const seen = new Set<string>()
    for (const entry of CATALOG) {
      expect(Number.isInteger(entry.price)).toBe(true)
      expect(entry.price).toBeGreaterThan(0)
      expect(seen.has(entry.sku)).toBe(false)
      seen.add(entry.sku)
    }
  })

  it('refuses a body price and charges the catalog price instead', async () => {
    const entry = findSku('cosmetic:ao-dai')
    expect(entry).toBeDefined()

    const res = await json('/api/shop/purchase', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      // the attacker's payload: 1đ for a 480đ item
      body: JSON.stringify({ sku: 'cosmetic:ao-dai', price: 1, idempotencyKey: 'attack-key-0001' }),
    })

    // 402 = not enough dong, which proves the server tried to charge 480, not 1
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('INSUFFICIENT_FUNDS')
    expect(entry!.price).toBe(480)
  })

  it('rejects unknown skus instead of falling back to a client price', async () => {
    const res = await json('/api/shop/purchase', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ sku: 'free:everything', price: 0, idempotencyKey: 'attack-key-0002' }),
    })
    expect(res.status).toBe(404)
    expect(res.body.code).toBe('UNKNOWN_SKU')
  })

  it('requires a real idempotency key', async () => {
    const res = await json('/api/shop/purchase', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ sku: 'food:tra-da', idempotencyKey: 'short' }),
    })
    expect(res.status).toBe(400)
  })

  it('serves the catalog so the client never invents a price', async () => {
    const res = await json('/api/shop/catalog')
    expect(res.status).toBe(200)
    expect(res.body.entries.length).toBe(CATALOG.length)
    const pho = res.body.entries.find((e: { sku: string }) => e.sku === 'food:pho')
    expect(pho.price).toBe(45)
  })
})

describe('price quotations never fall to zero', () => {
  it('reputation caps the discount at 15%', () => {
    const q = quote('cosmetic:ao-dai', 100, priceWithReputation)
    expect(q).not.toBeNull()
    expect(q!.charged).toBe(408) // 480 * 0.85
    expect(q!.discount).toBe(72)
  })

  it('returns null for a sku that does not exist', () => {
    expect(quote('nope', 0, priceWithReputation)).toBeNull()
  })
})

describe('daily income cap resets with the in-game day', () => {
  it('grants full value on a fresh day and only 20% once the cap is spent', () => {
    const cap = dailyIncomeCap(1)
    expect(cap).toBe(920)

    // fresh day: full reward
    expect(applyIncomeCap(120, 0, cap)).toBe(120)

    // cap already spent: only the overflow multiplier
    expect(applyIncomeCap(120, cap, cap)).toBe(24)
  })

  it('clears earnedToday when the clock passes midnight', () => {
    const store = useGameStore.getState()
    store.startNew('Minh', 'PHO_VENDOR')

    useGameStore.setState({ clock: { minutes: 1430, day: 1, season: 'THU' }, earnedToday: 900 })
    useGameStore.getState().tick(20)

    const after = useGameStore.getState()
    expect(after.clock.day).toBe(2)
    expect(after.clock.minutes).toBe(10)
    expect(after.earnedToday).toBe(0)
  })

  it('keeps earnedToday across a tick that stays inside the same day', () => {
    useGameStore.getState().startNew('Lan', 'PHOTOGRAPHER')
    useGameStore.setState({ clock: { minutes: 600, day: 3, season: 'HA' }, earnedToday: 640 })
    useGameStore.getState().tick(30)

    const after = useGameStore.getState()
    expect(after.clock.day).toBe(3)
    expect(after.earnedToday).toBe(640)
  })
})
