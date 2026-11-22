import { describe, expect, it } from 'vitest'
import {
  findRoute,
  distanceToStreet,
  nearestStreet,
  walkSeconds,
  walkInGameMinutes,
  type StreetPolyline,
} from '@shared/route'
import { STREETS } from '@world/data/streets'

const street = (id: string, points: Array<[number, number]>): StreetPolyline => ({
  id,
  name: id,
  points,
})

describe('route — distanceToStreet', () => {
  it('measures the perpendicular distance to the nearest segment', () => {
    const s = street('h-a', [[0, 0], [100, 0]])
    expect(distanceToStreet(s, 50, 30)).toBeCloseTo(30, 1)
    expect(distanceToStreet(s, 50, -30)).toBeCloseTo(30, 1)
    expect(distanceToStreet(s, 50, 0)).toBeCloseTo(0, 1)
  })

  it('uses the closest point on the segment (not the nearest vertex)', () => {
    const s = street('h-a', [[0, 0], [100, 0]])
    // point at the right end — the nearest segment is the endpoint
    expect(distanceToStreet(s, 100, 10)).toBeCloseTo(10, 1)
    expect(distanceToStreet(s, 999, 0)).toBeCloseTo(899, 1)
  })
})

describe('route — nearestStreet', () => {
  it('picks the street closest to a point', () => {
    const streets = [
      street('a', [[0, 0], [100, 0]]),
      street('b', [[0, 100], [100, 100]]),
    ]
    expect(nearestStreet(streets, 50, 80)?.id).toBe('b')
  })

  it('returns null when nothing is within 200 m', () => {
    const streets = [street('a', [[0, 0], [100, 0]])]
    expect(nearestStreet(streets, 500, 500)).toBeNull()
  })
})

describe('route — findRoute', () => {
  it('straight line with the nearest street reported when both ends are on it', () => {
    const route = findRoute(STREETS, { x: 2290, z: 1400 }, { x: 2290, z: 1800 })
    expect(route.path).toHaveLength(2)
    expect(route.directMetres).toBeCloseTo(400, 1)
    expect(route.distanceMetres).toBe(route.directMetres)
    expect(route.nearestStreetId).not.toBeNull()
  })

  it('straight when both ends are far from any street', () => {
    const route = findRoute(STREETS, { x: 5000, z: 4000 }, { x: 5100, z: 4100 })
    expect(route.path).toHaveLength(2)
    expect(route.nearestStreetId).toBeNull()
    expect(route.nearestStreetDistanceM).toBe(0)
  })

  it('is deterministic — the same call gives the same path', () => {
    const a = findRoute(STREETS, { x: 2290, z: 1400 }, { x: 2200, z: 1100 })
    const b = findRoute(STREETS, { x: 2290, z: 1400 }, { x: 2200, z: 1100 })
    expect(a).toEqual(b)
  })
})

describe('route — walking estimates', () => {
  it('estimates walking time at 1.3 m/s', () => {
    expect(walkSeconds(130)).toBe(100)
  })

  it('converts to in-game minutes 1:1', () => {
    expect(walkInGameMinutes(130)).toBe(100)
  })
})
