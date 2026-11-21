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

export const SAVE_VERSION = 1

export const SaveGameV1 = z.object({
  version: z.literal(1),
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
})
export type SaveGameV1 = z.infer<typeof SaveGameV1>

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
