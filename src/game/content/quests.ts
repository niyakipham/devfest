/** Phase 1 quest content — short, warm, and always finishable in < 10 minutes. */

export interface QuestObjective {
  id: string
  label: string
  target: number
}

export interface QuestReward {
  dong: number
  xp: number
  piece?: string
}

export interface QuestDef {
  key: string
  title: string
  summary: string
  giver: string
  objectives: QuestObjective[]
  reward: QuestReward
  followUp?: string
}

export const QUESTS: QuestDef[] = [
  {
    key: 'q-pho',
    title: 'Một bát phở buổi sáng',
    summary: 'Cô Hoa dựng quán phở vỉa hè ngay góc Lê Thái Tổ, sát hồ. Bụng bạn đang réo.',
    giver: 'npc-co-hoa',
    objectives: [{ id: 'eat', label: 'Ăn một bát phở ở quán cô Hoa (bờ hồ)', target: 1 }],
    reward: { dong: 0, xp: 45, piece: 'piece-01' },
    followUp: 'q-photo',
  },
  {
    key: 'q-photo',
    title: 'Chụp Hồ Gươm lúc bình minh',
    summary: 'Chị Lan nói: “Sáng nay sương còn trên mặt hồ. Chụp đi, kẻo tan mất.”',
    giver: 'npc-lan',
    objectives: [{ id: 'photo', label: 'Chụp ảnh ở bờ hồ phía nam', target: 1 }],
    reward: { dong: 120, xp: 60, piece: 'piece-02' },
  },
]

export const questByKey = (key: string): QuestDef | undefined => QUESTS.find((q) => q.key === key)
