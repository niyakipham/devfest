#!/usr/bin/env tsx
/**
 * Offline Prisma schema gate.
 *
 * `prisma validate` needs to download a query engine, which is not available in
 * CI sandboxes (and was not available when this gate was written). But the bug it
 * would have caught — `Character.skills CharacterSkill[]` where `CharacterSkill`
 * was never defined, so the whole schema failed to parse — is pure structure and
 * can be checked without the engine.
 *
 * Checks:
 *  1. every field type is a known model, enum, scalar or list-of-those
 *  2. every relation (`@relation` / model-typed field) has a matching back-reference
 *  3. no duplicate model/enum names
 *  4. banned feature tables are absent (gacha / loot box / battle pass — scope fence)
 *  5. every model has a primary key
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(resolve(here, '../prisma/schema.prisma'), 'utf8')

const SCALARS = new Set([
  'String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json', 'Bytes',
])

const errors: string[] = []

// --------------------------------------------------------------- parse blocks
interface Block {
  kind: 'model' | 'enum'
  name: string
  body: string
}

const blocks: Block[] = []
for (const m of raw.matchAll(/^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
  blocks.push({ kind: m[1] as 'model' | 'enum', name: m[2], body: m[3] })
}

const models = blocks.filter((b) => b.kind === 'model')
const enums = blocks.filter((b) => b.kind === 'enum')
const modelNames = new Set(models.map((b) => b.name))
const enumNames = new Set(enums.map((b) => b.name))

// 1 + 3 — duplicates
const seen = new Set<string>()
for (const b of blocks) {
  const key = `${b.kind}:${b.name}`
  if (seen.has(key)) errors.push(`duplicate ${b.kind} ${b.name}`)
  seen.add(key)
}

// --------------------------------------------------------------- field parsing
interface Field {
  model: string
  name: string
  type: string
  isList: boolean
  isOptional: boolean
  isPrimary: boolean
  hasRelation: boolean
  isScalar: boolean
}

const fields: Field[] = []
for (const model of models) {
  for (const line of model.body.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) continue
    const m = trimmed.match(/^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/)
    if (!m) continue
    const [, name, type, list, optional] = m
    fields.push({
      model: model.name,
      name,
      type,
      isList: Boolean(list),
      isOptional: Boolean(optional),
      isPrimary: /@id\b/.test(trimmed),
      hasRelation: /@relation\b/.test(trimmed),
      isScalar: SCALARS.has(type),
    })
  }
}

// 1 — every type must resolve
for (const f of fields) {
  if (f.isScalar) continue
  if (modelNames.has(f.type) || enumNames.has(f.type)) continue
  errors.push(`${f.model}.${f.name}: unknown type "${f.type}" (not a model, enum or scalar)`)
}

// 5 — every model needs a primary key
for (const model of models) {
  const hasId = fields.some((f) => f.model === model.name && (f.isPrimary || /@@id\b/.test(model.body)))
  if (!hasId) errors.push(`model ${model.name} has no @id / @@id`)
}

// 2 — relations must be two-way
const byModel = new Map<string, Field[]>()
for (const f of fields) {
  const list = byModel.get(f.model) ?? []
  list.push(f)
  byModel.set(f.model, list)
}

for (const f of fields) {
  if (f.isScalar) continue
  if (!modelNames.has(f.type)) continue // enums handled above

  // a field on model A whose type is B must have a field on B whose type is A
  const back = (byModel.get(f.type) ?? []).some((g) => g.type === f.model)
  if (!back) {
    errors.push(`${f.model}.${f.name}: relation to ${f.type} has no back-reference on ${f.type}`)
  }

  // a to-many relation without @relation is the classic missing-opposite bug
  if (f.isList && !f.hasRelation) {
    const declared = (byModel.get(f.type) ?? []).some((g) => g.hasRelation && g.type === f.model)
    if (!declared) {
      errors.push(`${f.model}.${f.name}: list relation to ${f.type} needs an explicit @relation on the other side`)
    }
  }
}

// 4 — scope fence
const BANNED = ['GachaBanner', 'GachaPull', 'GachaType', 'BattlePassSeason', 'BattlePassProgress', 'CompanionSpecies', 'Companion', 'Move', 'Rarity', 'Element']
for (const name of BANNED) {
  if (modelNames.has(name) || enumNames.has(name)) {
    errors.push(`banned table/enum ${name} is back — gacha, companions and battle passes violate the scope fence (§1.5)`)
  }
}

// --------------------------------------------------------------- report
console.log('── PRISMA SCHEMA GATE (offline) ─────────────────')
console.log(`models: ${models.length} · enums: ${enums.length} · fields: ${fields.length}`)

if (errors.length > 0) {
  console.error(`\n❌ SCHEMA GATE FAILED — ${errors.length} problem(s)`)
  for (const e of errors.slice(0, 40)) console.error(`  • ${e}`)
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`)
  process.exit(1)
}

console.log('\n✅ SCHEMA GATE PASSED — every relation resolves, no banned tables')
