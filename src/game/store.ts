/**
 * Client game state. Everything here is discrete (safe to re-render at 4–10 Hz);
 * per-frame transforms live in world-ref.ts.
 */
import { create } from 'zustand'
import type { Needs, Persona, PlayerSnapshot, QuestProgress, SaveGameV1 } from '@shared/contracts'
import { addCraftXp, decayNeeds, FOOD, applyIncomeCap, dailyIncomeCap } from '@shared/formulas'
import { POIS, SPAWN, nearestPoi } from '@world/data/hoanKiem'
import type { Poi } from '@world/types'
import { QUESTS, questByKey } from './content/quests'
import { DIALOGUES } from './content/dialogue'
import { readSave, writeSave } from './save'
import { playerRef, resetPlayerRef } from './world-ref'

export type Phase = 'TITLE' | 'CREATOR' | 'PLAYING' | 'PAUSED'

export interface Toast {
  id: string
  title: string
  message?: string
  tone: 'info' | 'reward'
}

export interface ClockState {
  minutes: number
  day: number
  season: 'XUAN' | 'HA' | 'THU' | 'DONG'
}

export interface DialogueState {
  key: string
  poiId: string
}

const seasonFromDate = (date: Date): ClockState['season'] => {
  const m = date.getMonth()
  if (m <= 2) return 'XUAN'
  if (m <= 5) return 'HA'
  if (m <= 8) return 'THU'
  return 'DONG'
}

const dayStart = (): ClockState => ({
  minutes: 340, // 05:40 — dawn on the lake
  day: 1,
  season: seasonFromDate(new Date()),
})

const initialNeeds = (): Needs => ({ energy: 72, hunger: 34, mood: 58, hygiene: 80 })

const NO_SAVE: SaveGameV1 | null = typeof window === 'undefined' ? null : readSave()

export interface GameStore {
  phase: Phase
  player: PlayerSnapshot
  clock: ClockState
  quests: Record<string, QuestProgress>
  pieces: string[]
  dialogue: DialogueState | null
  journalOpen: boolean
  mapOpen: boolean
  prompt: string | null
  promptPoi: Poi | null
  toasts: Toast[]
  tile: string
  loadedTiles: number
  earnedToday: number
  hasSave: boolean

  setPhase: (phase: Phase) => void
  startNew: (name: string, persona: Persona) => void
  continueGame: () => void
  pause: () => void
  resume: () => void
  saveNow: () => void

  tick: (minutes: number) => void
  scanNearestPoi: (x: number, z: number) => void
  interact: () => void
  choose: (choiceId: string) => void
  closeDialogue: () => void
  toggleJournal: () => void
  toggleMap: () => void
  quickEat: () => void
  photoAttempt: () => void

  syncTransform: () => void
  setStreamStats: (tile: string, loadedTiles: number) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const toastId = (): string => `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`

const makePlayer = (name: string, persona: Persona): PlayerSnapshot => ({
  name,
  persona,
  position: { x: SPAWN.x, y: 0, z: SPAWN.z },
  yaw: Math.PI,
  needs: initialNeeds(),
  dong: 150,
  hoaSen: 0,
  craftLevel: 1,
  craftXp: 0,
  reputation: { merchant: 0, resident: 0 },
})

const initialQuests = (): Record<string, QuestProgress> => ({
  'q-pho': { key: 'q-pho', state: 'ACTIVE', objectives: { eat: 0 } },
})

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'TITLE',
  player: makePlayer('Bạn', 'STUDENT'),
  clock: dayStart(),
  quests: initialQuests(),
  pieces: [],
  dialogue: null,
  journalOpen: false,
  mapOpen: false,
  prompt: null,
  promptPoi: null,
  toasts: [],
  tile: 't_9_8',
  loadedTiles: 0,
  earnedToday: 0,
  hasSave: NO_SAVE !== null,

  setPhase: (phase) => set({ phase }),

  startNew: (name, persona) => {
    resetPlayerRef(SPAWN.x, SPAWN.z)
    set({
      phase: 'PLAYING',
      player: makePlayer(name.trim() || 'Bạn', persona),
      clock: dayStart(),
      quests: initialQuests(),
      pieces: [],
      dialogue: null,
      prompt: null,
      promptPoi: null,
      earnedToday: 0,
      toasts: [],
    })
    get().addToast({
      title: 'Hà Nội, 5 giờ 40 sáng',
      message: 'Bạn có một ngày mới. Đi đâu trước?',
      tone: 'info',
    })
  },

  continueGame: () => {
    const save = readSave()
    if (!save) {
      set({ hasSave: false })
      get().addToast({ title: 'Không tìm thấy bản lưu', message: 'Hãy bắt đầu hành trình mới.', tone: 'info' })
      return
    }
    resetPlayerRef(save.player.position.x, save.player.position.z, save.player.yaw)
    const quests: Record<string, QuestProgress> = {}
    for (const q of save.quests) quests[q.key] = q
    set({
      phase: 'PLAYING',
      player: save.player,
      clock: save.clock,
      quests: Object.keys(quests).length > 0 ? quests : initialQuests(),
      pieces: save.pieces,
      dialogue: null,
      toasts: [],
    })
    get().addToast({ title: 'Chào mừng trở lại', message: `Ngày ${save.clock.day} · ${save.player.name}`, tone: 'info' })
  },

  pause: () => set({ phase: 'PAUSED' }),
  resume: () => set({ phase: 'PLAYING' }),

  saveNow: () => {
    const { player, clock, quests, pieces } = get()
    const save: SaveGameV1 = {
      version: 1,
      slot: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      player: { ...player, position: { x: playerRef.x, y: 0, z: playerRef.z }, yaw: playerRef.yaw },
      quests: Object.values(quests),
      pieces,
      clock,
      settings: { reduceMotion: false, sfx: true, language: 'vi' },
    }
    try {
      writeSave(save)
      set({ hasSave: true })
      get().addToast({ title: 'Đã lưu', message: 'Bạn có thể tiếp tục từ đây bất cứ lúc nào.', tone: 'info' })
    } catch {
      get().addToast({ title: 'Không lưu được', message: 'Bộ nhớ trình duyệt đang bị chặn.', tone: 'info' })
    }
  },

  tick: (minutes) => {
    const { clock, player } = get()
    const next = decayNeeds(player.needs, minutes)
    let total = clock.minutes + minutes
    let day = clock.day
    while (total >= 1440) {
      total -= 1440
      day += 1
    }
    set({
      player: { ...player, needs: next },
      clock: { ...clock, minutes: total, day },
    })
  },

  scanNearestPoi: (x, z) => {
    const poi = nearestPoi(x, z, 5.5)
    const prompt = poi
      ? poi.type === 'QUEST_GIVER'
        ? `Nói chuyện với ${poi.name}`
        : poi.type === 'FOOD'
          ? `${poi.name} · ${String(poi.payload?.price ?? 20)}đ`
          : poi.type === 'PHOTO_SPOT'
            ? `Chụp ảnh · ${poi.name}`
            : poi.type === 'BENCH'
              ? 'Ngồi nghỉ một lát'
              : `Xem · ${poi.name}`
      : null
    const current = get().prompt
    if (current !== prompt) set({ prompt, promptPoi: poi })
  },

  interact: () => {
    const { promptPoi, quests } = get()
    if (!promptPoi || get().dialogue) return
    const poi = promptPoi

    if (poi.action?.startsWith('dialogue:')) {
      const key = poi.action.slice('dialogue:'.length)
      if (DIALOGUES[key]) {
        set({ dialogue: { key, poiId: poi.id } })
        return
      }
    }

    if (poi.type === 'FOOD') {
      const price = Number(poi.payload?.price ?? 20)
      const { player } = get()
      if (player.dong < price) {
        get().addToast({ title: `Không đủ tiền cho ${poi.name}`, message: 'Cần thêm vài đồng nữa.', tone: 'info' })
        return
      }
      set({
        player: {
          ...player,
          dong: player.dong - price,
          needs: {
            ...player.needs,
            hunger: Math.min(100, player.needs.hunger + 30),
            mood: Math.min(100, player.needs.mood + 8),
          },
        },
      })
      get().addToast({ title: `Đã mua ${poi.name}`, message: `−${price}đ · ăn ngon miệng`, tone: 'info' })
      if (quests['q-pho']?.state === 'ACTIVE') completeQuest(set, get, 'q-pho')
      return
    }

    if (poi.type === 'BENCH') {
      const { player } = get()
      set({
        player: {
          ...player,
          needs: {
            ...player.needs,
            energy: Math.min(100, player.needs.energy + 18),
            mood: Math.min(100, player.needs.mood + 4),
          },
        },
      })
      get().tick(12)
      get().addToast({ title: 'Ngồi nghỉ một lát', message: 'Nắng lên. Bạn thấy dễ chịu hơn.', tone: 'info' })
      return
    }

    if (poi.type === 'PHOTO_SPOT') {
      const active = get().quests['q-photo']?.state === 'ACTIVE'
      if (active) {
        completeQuest(set, get, 'q-photo')
      } else {
        get().addToast({ title: `Bạn ngắm ${poi.name} một lúc`, message: 'Mặt hồ phẳng như tấm gương.', tone: 'info' })
      }
      return
    }

    if (poi.action === 'shrine' || poi.type === 'SHRINE') {
      const { player } = get()
      set({ player: { ...player, needs: { ...player.needs, mood: Math.min(100, player.needs.mood + 6) } } })
      get().addToast({ title: poi.name, message: 'Bạn thắp một nén hương. Lòng nhẹ đi.', tone: 'info' })
      return
    }

    get().addToast({
      title: poi.name,
      message: poi.craft ? `Phố này xưa làm nghề ${poi.craft.toLowerCase()}.` : 'Một chỗ nhỏ, nhưng có chuyện để kể.',
      tone: 'info',
    })
  },

  choose: (choiceId) => {
    const { dialogue } = get()
    if (!dialogue) return
    const node = DIALOGUES[dialogue.key]
    const choice = node?.choices.find((c) => c.id === choiceId)
    if (!choice) return
    const player = get().player

    if (choice.cost && player.dong < choice.cost) {
      get().addToast({ title: 'Không đủ tiền', message: `Cần ${choice.cost}đ, bạn có ${player.dong}đ.`, tone: 'info' })
      return
    }

    switch (choice.effect) {
      case 'eat-pho': {
        const pho = FOOD.pho
        set({
          dialogue: null,
          player: {
            ...player,
            dong: player.dong - (choice.cost ?? pho.price),
            needs: {
              ...player.needs,
              hunger: Math.min(100, player.needs.hunger + pho.hunger),
              mood: Math.min(100, player.needs.mood + pho.mood),
              energy: Math.min(100, player.needs.energy + 8),
            },
          },
        })
        get().tick(20)
        get().addToast({ title: 'Một bát phở nóng', message: 'Nước dùng trong, thơm mùi hồi. Bụng ấm lên.', tone: 'reward' })
        if (get().quests['q-pho']?.state === 'ACTIVE') completeQuest(set, get, 'q-pho')
        return
      }
      case 'accept-photo':
        set({
          dialogue: null,
          quests: {
            ...get().quests,
            'q-photo': { key: 'q-photo', state: 'ACTIVE', objectives: { photo: 0 } },
          },
        })
        get().addToast({ title: 'Nhiệm vụ mới', message: 'Chụp Hồ Gươm lúc bình minh — bờ hồ phía nam.', tone: 'reward' })
        return
      case 'lore-pho':
        set({ dialogue: null })
        get().addToast({
          title: 'Chuyện phố quanh hồ',
          message: 'Xưa kia phố nào cũng có nghề riêng: Hàng Bạc làm bạc, Hàng Mã làm đồ giấy, Hàng Gai bán lụa.',
          tone: 'info',
        })
        return
      case 'hint-silver':
        set({ dialogue: null })
        get().addToast({ title: 'Nghề chạm bạc', message: 'Mở khoá ở Cấp 3 tay nghề — cần 120 XP nghề.', tone: 'info' })
        return
      case 'hint-cyclo':
        set({ dialogue: null })
        get().addToast({ title: 'Nghề xích lô', message: 'Mỗi vòng hồ là một câu chuyện. Mở ở Phase 2.', tone: 'info' })
        return
      case 'close':
      default:
        set({ dialogue: null })
    }
  },

  closeDialogue: () => set({ dialogue: null }),

  toggleJournal: () => set({ journalOpen: !get().journalOpen, mapOpen: false }),

  toggleMap: () => set({ mapOpen: !get().mapOpen, journalOpen: false }),

  quickEat: () => {
    const { player } = get()
    const snack = FOOD.banhMi
    if (player.dong < snack.price) {
      get().addToast({ title: 'Ví không đủ', message: `Bánh mì ${snack.price}đ — bạn còn ${player.dong}đ.`, tone: 'info' })
      return
    }
    set({
      player: {
        ...player,
        dong: player.dong - snack.price,
        needs: {
          ...player.needs,
          hunger: Math.min(100, player.needs.hunger + snack.hunger),
          mood: Math.min(100, player.needs.mood + snack.mood),
        },
      },
    })
    get().addToast({ title: 'Bánh mì nóng', message: `−${snack.price}đ · ăn dọc đường`, tone: 'info' })
  },

  photoAttempt: () => {
    const poi = nearestPoi(playerRef.x, playerRef.z, 12)
    if (!poi || poi.type !== 'PHOTO_SPOT') {
      get().addToast({ title: 'Chưa có gì trong khung hình', message: 'Tới điểm ngắm cảnh rồi hãy giơ máy lên.', tone: 'info' })
      return
    }
    if (get().quests['q-photo']?.state === 'ACTIVE') {
      completeQuest(set, get, 'q-photo')
      return
    }
    const { player } = get()
    set({ player: { ...player, needs: { ...player.needs, mood: Math.min(100, player.needs.mood + 4) } } })
    get().addToast({ title: `Một tấm ảnh ${poi.name}`, message: 'Ánh sáng đẹp. Bạn lưu vào album.', tone: 'info' })
  },

  syncTransform: () => {
    const { player } = get()
    set({ player: { ...player, position: { x: playerRef.x, y: 0, z: playerRef.z }, yaw: playerRef.yaw } })
  },

  setStreamStats: (tile, loadedTiles) => set({ tile, loadedTiles }),

  addToast: (toast) => {
    const id = toastId()
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-3) })
    setTimeout(() => get().dismissToast(id), 4200)
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Shared by direct interactions and dialogue effects. */
const completeQuest = (
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  key: string,
): void => {
  const def = questByKey(key)
  const current = get().quests[key]
  if (!def || !current || current.state !== 'ACTIVE') return

  const player = get().player
  const xp = addCraftXp(player.craftLevel, player.craftXp, def.reward.xp)
  const cappedDong = applyIncomeCap(def.reward.dong, get().earnedToday, dailyIncomeCap(player.craftLevel))
  const nextQuests: Record<string, QuestProgress> = {
    ...get().quests,
    [key]: { ...current, state: 'CLAIMED' },
  }
  if (def.followUp) {
    nextQuests[def.followUp] = { key: def.followUp, state: 'AVAILABLE', objectives: { photo: 0 } }
  }

  set({
    quests: nextQuests,
    player: {
      ...player,
      dong: player.dong + cappedDong,
      craftLevel: xp.level,
      craftXp: xp.xp,
      reputation: { ...player.reputation, resident: (player.reputation.resident ?? 0) + 2 },
    },
    pieces: def.reward.piece && !get().pieces.includes(def.reward.piece)
      ? [...get().pieces, def.reward.piece]
      : get().pieces,
    earnedToday: get().earnedToday + cappedDong,
  })

  get().addToast({
    title: `Hoàn thành: ${def.title}`,
    message: `${def.reward.piece ? 'Một mảnh ký ức mới. ' : ''}${cappedDong > 0 ? `+${cappedDong}đ · ` : ''}+${def.reward.xp} XP nghề`,
    tone: 'reward',
  })
}

export const QUESTS_LIST = QUESTS
export const POI_LIST = POIS
