/**
 * Route engine (P0-Map, blueprint) — 2D walk estimate + nearest-street report.
 *
 * Phase 1's world is stylized: streets are drawn polylines, not a connected
 * road network, and the player can walk anywhere (no nav-graph membership).
 * The honest route for this phase is therefore:
 *   - a straight-line estimate (the player's actual path is the city, though
 *     not necessarily street-hugging)
 *   - the street nearest the direct line, so the quest banner can say
 *     "đi theo Hàng Đường" honestly
 *   - walking-time and in-game-time estimates so quests can say when you arrive
 *
 * A real A* over a connected nav-graph arrives with Phase 5 (OSM pipeline).
 * The engine deliberately makes no claim otherwise.
 */

export interface Route {
  /** start→end polyline (two points when no street info is known) */
  path: Array<{ x: number; z: number }>
  /** direct start→end distance (metres) */
  directMetres: number
  /** straight-line distance summed along the path (metres) */
  distanceMetres: number
  /** the street nearest the direct line, or null when none is close enough */
  nearestStreetId: string | null
  /** distance from the player's line to the nearest street (metres) */
  nearestStreetDistanceM: number
}

export interface StreetPolyline {
  id: string
  name: string
  points: Array<[number, number]>
}

const distPointToSegment = (
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number => {
  const dx = bx - ax
  const dz = bz - az
  const lenSq = dx * dx + dz * dz
  if (lenSq === 0) return Math.hypot(px - ax, pz - az)
  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cz = az + t * dz
  return Math.hypot(px - cx, pz - cz)
}

/** Distance from a point to a street (the closest perpendicular segment). */
export const distanceToStreet = (street: StreetPolyline, x: number, z: number): number => {
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i + 1 < street.points.length; i += 1) {
    const d = distPointToSegment(x, z, street.points[i][0], street.points[i][1], street.points[i + 1][0], street.points[i + 1][1])
    if (d < best) best = d
  }
  return best
}

/** The single closest street to a point, or null when all streets are > 200 m away. */
export const nearestStreet = (streets: readonly StreetPolyline[], x: number, z: number): StreetPolyline | null => {
  let best: StreetPolyline | null = null
  let bestD = Number.POSITIVE_INFINITY
  for (const s of streets) {
    const d = distanceToStreet(s, x, z)
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return bestD <= 200 ? best : null
}

/**
 * Compute the honest route between `start` and `end` using the street list.
 * If no street is close to either end, the route is a straight line — never a
 * lie. Never throws.
 */
export const findRoute = (
  streets: readonly StreetPolyline[],
  start: { x: number; z: number },
  end: { x: number; z: number },
): Route => {
  const direct = Math.hypot(end.x - start.x, end.z - start.z)
  const nearest = nearestStreet(streets, start.x, start.z)
  const nearestStart = nearestStreet(streets, end.x, end.z)
  const nearestId = nearest?.id ?? nearestStart?.id ?? null
  const nearestDist = Math.min(
    nearest ? distanceToStreet(nearest, start.x, start.z) : Number.POSITIVE_INFINITY,
    nearestStart ? distanceToStreet(nearestStart, end.x, end.z) : Number.POSITIVE_INFINITY,
  )

  return {
    path: [start, end],
    directMetres: direct,
    distanceMetres: direct,
    nearestStreetId: nearestId,
    nearestStreetDistanceM: nearestDist === Number.POSITIVE_INFINITY ? 0 : Math.round(nearestDist),
  }
}

/** Walking time in seconds at an average 1.3 m/s. */
export const walkSeconds = (distanceMetres: number, speedMps = 1.3): number =>
  Math.round(distanceMetres / speedMps)

/** In-game minutes at 1 real second = 1 in-game minute (the loop's natural cadence). */
export const walkInGameMinutes = (distanceMetres: number, speedMps = 1.3): number =>
  Math.round(distanceMetres / speedMps)
