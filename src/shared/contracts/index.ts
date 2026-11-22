/**
 * Shared contracts — the ONLY way data crosses module boundaries.
 * Rule: core never imports modules, modules never import each other,
 * client and server both validate with these exact schemas.
 */
import { z } from 'zod'

export const Vec3 = z.object({ x: z.number(), y: z.number(), z: z.number() })
export type Vec3 = z.infer<typeof Vec3>

export const Persona = z.enum([
  'STUDENT',
  'SILVERSMITH',
  'PHO_VENDOR',
  'CYCLO_DRIVER',
  'PHOTOGRAPHER',
  'FOLK_SINGER',
])
export type Persona = z.infer<typeof Persona>

export const PERSONA_LABEL: Record<Persona, { vi: string; en: string; icon: string }> = {
  STUDENT: { vi: 'Sinh viên Mỹ thuật', en: 'Art student', icon: '🎨' },
  SILVERSMITH: { vi: 'Nghệ nhân bạc', en: 'Silversmith', icon: '🔨' },
  PHO_VENDOR: { vi: 'Cô bán phở', en: 'Pho vendor', icon: '🍜' },
  CYCLO_DRIVER: { vi: 'Anh xích lô', en: 'Cyclo driver', icon: '🛺' },
  PHOTOGRAPHER: { vi: 'Nhiếp ảnh gia', en: 'Photographer', icon: '📷' },
  FOLK_SINGER: { vi: 'Nghệ sĩ hát xẩm', en: 'Folk singer', icon: '🎶' },
}

export const Needs = z.object({
  energy: z.number().min(0).max(100),
  hunger: z.number().min(0).max(100),
  mood: z.number().min(0).max(100),
  hygiene: z.number().min(0).max(100),
})
export type Needs = z.infer<typeof Needs>

export const PlayerSnapshot = z.object({
  name: z.string().min(1).max(24),
  persona: Persona,
  position: Vec3,
  yaw: z.number(),
  needs: Needs,
  dong: z.number().int().min(0),
  hoaSen: z.number().int().min(0).default(0),
  craftLevel: z.number().int().min(1).max(20),
  craftXp: z.number().int().min(0),
  reputation: z.record(z.string(), z.number()).default({}),
})
export type PlayerSnapshot = z.infer<typeof PlayerSnapshot>

export const QuestState = z.enum(['LOCKED', 'AVAILABLE', 'ACTIVE', 'COMPLETE', 'CLAIMED'])
export type QuestState = z.infer<typeof QuestState>

export const QuestProgress = z.object({
  key: z.string(),
  state: QuestState,
  objectives: z.record(z.string(), z.number()).default({}),
})
export type QuestProgress = z.infer<typeof QuestProgress>

/**
 * Journal v2 (RP-08). Entries are capped at 60 by `@rp/journal`, so a full diary is
 * ~9 kB of JSON — small enough to live beside the save in localStorage and in the
 * `SaveSlot.payload` JSON column.
 */
export const JournalEntrySchema = z.object({
  id: z.string(),
  day: z.number().int().min(1),
  minute: z.number().min(0).max(1439),
  kind: z.enum(['walk', 'eat', 'craft', 'meet', 'photo', 'earn', 'day']),
  text: z.string().max(160),
})
export type JournalEntrySchema = z.infer<typeof JournalEntrySchema>

export const JournalStatsSchema = z.object({
  metresWalked: z.number().min(0).default(0),
  bowlsEaten: z.number().int().min(0).default(0),
  bowlsBrewed: z.number().int().min(0).default(0),
  npcsMet: z.number().int().min(0).default(0),
  photosTaken: z.number().int().min(0).default(0),
  dongEarned: z.number().int().min(0).default(0),
  tilesSeen: z.array(z.string()).max(400).default([]),
})
export type JournalStatsSchema = z.infer<typeof JournalStatsSchema>

export const SAVE_VERSION = 2

/** Legacy shape, kept only so the v1→v2 migration can be tested against it. */
export const SaveGameV1 = z.object({
  version: z.literal(2),
  slot: z.number().int().min(0).max(2),
  createdAt: z.string(),
  updatedAt: z.string(),
  player: PlayerSnapshot,
  quests: z.array(QuestProgress).default([]),
  pieces: z.array(z.string()).default([]),
  clock: z.object({
    /** in-game minutes since midnight, 0..1439 */
    minutes: z.number().min(0).max(1439),
    /** in-game day index since epoch (1 = first day) */
    day: z.number().int().min(1),
    /** real-world ISO date used to derive the in-game season */
    season: z.enum(['XUAN', 'HA', 'THU', 'DONG']),
  }),
  settings: z
    .object({
      reduceMotion: z.boolean().default(false),
      sfx: z.boolean().default(true),
      language: z.enum(['vi', 'en']).default('vi'),
    })
    .default({ reduceMotion: false, sfx: true, language: 'vi' }),
  /** RP-08: self-written diary + lifetime stats. Both optional so v1 saves migrate. */
  journal: z.array(JournalEntrySchema).max(60).default([]),
  stats: JournalStatsSchema.default({
    metresWalked: 0,
    bowlsEaten: 0,
    bowlsBrewed: 0,
    npcsMet: 0,
    photosTaken: 0,
    dongEarned: 0,
    tilesSeen: [],
  }),
  metNpcs: z.array(z.string()).max(120).default([]),
})
export type SaveGameV1 = z.infer<typeof SaveGameV1>

/**
 * ER-RP-01: every schema change ships with a migration, not a wipe. A v1 save has
 * no journal/stats/metNpcs, so it is upgraded in place; a v2 save passes through.
 * Unknown versions are rejected (readSave returns null and the title screen offers
 * "new game" instead of crashing).
 */
export const migrateSave = (raw: unknown): SaveGameV1 | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const version = (raw as { version?: unknown }).version

  if (version === 1) {
    const upgraded = {
      ...(raw as Record<string, unknown>),
      version: 2,
      journal: [],
      stats: {
        metresWalked: 0,
        bowlsEaten: 0,
        bowlsBrewed: 0,
        npcsMet: 0,
        photosTaken: 0,
        dongEarned: 0,
        tilesSeen: [],
      },
      metNpcs: [],
    }
    const parsed = SaveGameV1.safeParse(upgraded)
    return parsed.success ? parsed.data : null
  }

  const parsed = SaveGameV1.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export const AuthRegister = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'letters, digits, underscore'),
  password: z.string().min(8).max(72),
})
export type AuthRegister = z.infer<typeof AuthRegister>

export const AuthLogin = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
})

export const SavePushRequest = z.object({
  slot: z.number().int().min(0).max(2),
  save: SaveGameV1,
})

export const WorldTileRequest = z.object({
  x: z.coerce.number().int().min(0),
  z: z.coerce.number().int().min(0),
})

/** Socket / API error shape — one shape everywhere. */
export const ApiError = z.object({
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof ApiError>
