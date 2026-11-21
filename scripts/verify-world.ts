#!/usr/bin/env tsx
/**
 * CI gate (anti-failure F1): the world must never be empty.
 * Usage: npm run verify:world
 */
import { TILE_SIZE, isPhase1Tile } from '../src/world/grid'
import { POIS, TILE_POI_COUNT } from '../src/world/data/hoanKiem'
import { STREETS } from '../src/world/data/streets'
import { roadTilesFromStreets, validateDensity } from '../src/world/density'

const roadTiles = roadTilesFromStreets(STREETS, isPhase1Tile, TILE_SIZE)
const report = validateDensity(POIS, STREETS, roadTiles)

console.log('── WORLD DENSITY REPORT ─────────────────────────')
console.log(`POIs: ${report.totalPois} · road tiles: ${report.roadTiles}`)
console.log(`Gap median: ${report.medianGap} m · max: ${report.maxGap} m (limit 150 m)`)

const sparse = Object.entries(TILE_POI_COUNT)
  .filter(([, n]) => n < 4)
  .sort((a, b) => a[1] - b[1])
if (sparse.length > 0) console.log(`Tiles under 4 POIs: ${sparse.map(([k, v]) => `${k}(${v})`).join(', ')}`)

if (!report.ok) {
  console.error('\n❌ DENSITY GATE FAILED')
  for (const v of report.tileViolations) console.error(`  tile ${v.tileId}: ${v.count}/${v.required} POIs`)
  for (const v of report.gapViolations.slice(0, 20)) {
    console.error(`  street ${v.streetName} @${v.distance}m → nearest POI ${v.nearest}m`)
  }
  process.exit(1)
}

console.log('\n✅ DENSITY GATE PASSED — every 150 m of street has an interactable')
