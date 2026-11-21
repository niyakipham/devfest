/**
 * Quest & Story Module
 * Main campaign, side quests, daily/weekly quests, faction questlines
 */

export enum QuestType {
  MAIN = 'MAIN',
  SIDE = 'SIDE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  FACTION = 'FACTION',
  DYNAMIC = 'DYNAMIC'
}

export enum QuestStatus {
  AVAILABLE = 'AVAILABLE',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  LOCKED = 'LOCKED'
}

export interface Quest {
  id: string
  type: QuestType
  chapter?: number // For main campaign
  title: string
  description: string
  detailedDescription: string
  zoneId: string
  giverNpcId: string
  prerequisites: QuestPrerequisite[]
  objectives: QuestObjective[]
  rewards: QuestRewards
  factionId?: string
  reputationRequired?: number
  levelRequired: number
  status: QuestStatus
  repeatable: boolean
  resetInterval?: 'daily' | 'weekly'
  dialogue: DialogueLine[]
}

export interface QuestPrerequisite {
  type: 'quest_completed' | 'level' | 'reputation' | 'item' | 'companion'
  value: string | number
  completed: boolean
}

export interface QuestObjective {
  id: string
  description: string
  type: 'defeat' | 'collect' | 'explore' | 'talk' | 'craft' | 'capture'
  target: string
  currentProgress: number
  requiredProgress: number
  completed: boolean
}

export interface QuestRewards {
  xp: number
  currency: number
  items: { itemId: string; quantity: number }[]
  companion?: string
  reputation?: { factionId: string; amount: number }
  unlock?: string
}

export interface DialogueLine {
  speaker: string
  speakerAvatar?: string
  text: string
  choices?: DialogueChoice[]
  isEnd: boolean
}

export interface DialogueChoice {
  text: string
  nextLineIndex: number
  effects?: { reputationChange?: { factionId: string; amount: number } }
}

export class QuestManager {
  private quests: Map<string, Quest>
  private playerQuests: Map<string, Set<string>> // userId -> quest IDs
  
  constructor() {
    this.quests = new Map()
    this.playerQuests = new Map()
    
    this.initializeMainCampaign()
    this.initializeSideQuests()
    this.initializeDailyQuests()
  }
  
  private initializeMainCampaign(): void {
    const quests: Quest[] = [
      {
        id: 'main_ch1_1',
        type: QuestType.MAIN,
        chapter: 1,
        title: 'Thức Tỉnh',
        description: 'Nhận linh vật đầu tiên và bắt đầu hành trình',
        detailedDescription: 'Ngươi được chọn làm Linh Thú Sư. Hãy đến gặp Thầy Giáo ở Phố Cổ để nhận linh vật đầu tiên.',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_thay_giao',
        prerequisites: [],
        objectives: [
          { id: 'obj_1', description: 'Đến gặp Thầy Giáo', type: 'talk', target: 'npc_thay_giao', currentProgress: 0, requiredProgress: 1, completed: false },
          { id: 'obj_2', description: 'Chọn linh vật đầu tiên', type: 'collect', target: 'starter_companion', currentProgress: 0, requiredProgress: 1, completed: false }
        ],
        rewards: { xp: 200, currency: 100, items: [{ itemId: 'long_than_basic', quantity: 5 }] },
        levelRequired: 1,
        status: QuestStatus.AVAILABLE,
        repeatable: false,
        dialogue: [
          { speaker: 'Thầy Giáo', text: 'Chào mừng đến với thế giới Linh Thú! Ta đã chờ con từ lâu.', choices: [{ text: 'Con sẵn sàng!', nextLineIndex: 1 }], isEnd: false },
          { speaker: 'Thầy Giáo', text: 'Hãy chọn một trong ba linh vật này. Mỗi con có sức mạnh riêng.', isEnd: true }
        ]
      },
      {
        id: 'main_ch2_1',
        type: QuestType.MAIN,
        chapter: 2,
        title: 'Bí Mật Phố Cổ',
        description: 'Khám phá bí ẩn ẩn sau 36 phố phường',
        detailedDescription: 'Một thế lực đen tối đang đe dọa Phố Cổ. Hãy tìm hiểu và ngăn chặn nó.',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_chu_to',
        prerequisites: [{ type: 'quest_completed', value: 'main_ch1_1', completed: false }],
        objectives: [
          { id: 'obj_1', description: 'Tìm 3 manh mối trong Phố Cổ', type: 'explore', target: 'clue', currentProgress: 0, requiredProgress: 3, completed: false },
          { id: 'obj_2', description: 'Đánh bại boss bóng tối', type: 'defeat', target: 'boss_shadow', currentProgress: 0, requiredProgress: 1, completed: false }
        ],
        rewards: { xp: 800, currency: 300, items: [{ itemId: 'manh_do_pho_co', quantity: 1 }] },
        factionId: 'faction_pho_co',
        reputationRequired: 100,
        levelRequired: 5,
        status: QuestStatus.LOCKED,
        repeatable: false,
        dialogue: []
      },
      {
        id: 'main_ch3_1',
        type: QuestType.MAIN,
        chapter: 3,
        title: 'Rùa Thần Hồ Gươm',
        description: 'Đối mặt với Rùa Thần để lấy mảnh ngọc đầu tiên',
        detailedDescription: 'Rùa Thần đang giữ mảnh ngọc quý. Hãy chứng tỏ bản thân để được Rùa Thần công nhận.',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_ru_than',
        prerequisites: [{ type: 'quest_completed', value: 'main_ch2_1', completed: false }],
        objectives: [
          { id: 'obj_1', description: 'Thu thập 3 mảnh ngọc', type: 'collect', target: 'manh_ngoc', currentProgress: 0, requiredProgress: 3, completed: false },
          { id: 'obj_2', description: 'Đánh bại Rùa Thần', type: 'defeat', target: 'boss_ru_than', currentProgress: 0, requiredProgress: 1, completed: false }
        ],
        rewards: { xp: 2000, currency: 500, items: [{ itemId: 'manh_ngoc_hoan_kiem', quantity: 1 }], companion: 'rua_than_friend' },
        levelRequired: 10,
        status: QuestStatus.LOCKED,
        repeatable: false,
        dialogue: []
      }
    ]
    
    quests.forEach(q => this.quests.set(q.id, q))
  }
  
  private initializeSideQuests(): void {
    const sideQuests: Quest[] = [
      {
        id: 'side_food_1',
        type: QuestType.SIDE,
        title: 'Thử Thách Ẩm Thực',
        description: 'Thưởng thức 5 món ăn đặc sản Hà Nội',
        detailedDescription: 'Dân Chơi Hệ Ẩm Thực muốn ngươi thử các món: Phở, Bún Chả, Chả Cá, Bánh Cuốn, Cà Phê Trứng',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_foodie',
        prerequisites: [{ type: 'level', value: 3, completed: false }],
        objectives: [
          { id: 'obj_1', description: 'Ăn Phở', type: 'collect', target: 'food_pho', currentProgress: 0, requiredProgress: 1, completed: false },
          { id: 'obj_2', description: 'Ăn Bún Chả', type: 'collect', target: 'food_bun_cha', currentProgress: 0, requiredProgress: 1, completed: false }
        ],
        rewards: { xp: 300, currency: 150, items: [{ itemId: 'recipe_pho_dac_biet', quantity: 1 }] },
        factionId: 'faction_foodie',
        reputationRequired: 50,
        levelRequired: 3,
        status: QuestStatus.AVAILABLE,
        repeatable: false,
        dialogue: []
      }
    ]
    
    sideQuests.forEach(q => this.quests.set(q.id, q))
  }
  
  private initializeDailyQuests(): void {
    const dailyQuests: Quest[] = [
      {
        id: 'daily_capture_1',
        type: QuestType.DAILY,
        title: 'Thợ Săn Linh Thú',
        description: 'Thu phục 5 linh vật hoang dã',
        detailedDescription: 'Mỗi ngày thu phục 5 linh vật để nhận phần thưởng',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_hunter_guild',
        prerequisites: [],
        objectives: [
          { id: 'obj_1', description: 'Thu phục linh vật hoang dã', type: 'capture', target: 'wild_companion', currentProgress: 0, requiredProgress: 5, completed: false }
        ],
        rewards: { xp: 200, currency: 100, items: [{ itemId: 'long_than_basic', quantity: 3 }] },
        levelRequired: 1,
        status: QuestStatus.AVAILABLE,
        repeatable: true,
        resetInterval: 'daily',
        dialogue: []
      },
      {
        id: 'daily_battle_1',
        type: QuestType.DAILY,
        title: 'Chiến Binh Hàng Ngày',
        description: 'Thắng 3 trận đấu với linh thú sư khác',
        detailedDescription: 'Tham gia 3 trận PvP để rèn luyện kỹ năng',
        zoneId: 'zone_pho_co',
        giverNpcId: 'npc_arena',
        prerequisites: [],
        objectives: [
          { id: 'obj_1', description: 'Thắng trận đấu PvP', type: 'defeat', target: 'pvp_opponent', currentProgress: 0, requiredProgress: 3, completed: false }
        ],
        rewards: { xp: 300, currency: 200, items: [{ itemId: 'battle_token', quantity: 5 }] },
        levelRequired: 5,
        status: QuestStatus.AVAILABLE,
        repeatable: true,
        resetInterval: 'daily',
        dialogue: []
      }
    ]
    
    dailyQuests.forEach(q => this.quests.set(q.id, q))
  }
  
  acceptQuest(playerId: string, questId: string): boolean {
    const quest = this.quests.get(questId)
    if (!quest || quest.status !== QuestStatus.AVAILABLE) return false
    
    // Check prerequisites
    for (const prereq of quest.prerequisites) {
      if (!this.checkPrerequisite(playerId, prereq)) return false
    }
    
    quest.status = QuestStatus.ACCEPTED
    
    if (!this.playerQuests.has(playerId)) {
      this.playerQuests.set(playerId, new Set())
    }
    this.playerQuests.get(playerId)!.add(questId)
    
    return true
  }
  
  updateObjectiveProgress(questId: string, objectiveId: string, amount: number): void {
    const quest = this.quests.get(questId)
    if (!quest) return
    
    const objective = quest.objectives.find(o => o.id === objectiveId)
    if (!objective) return
    
    objective.currentProgress += amount
    if (objective.currentProgress >= objective.requiredProgress) {
      objective.completed = true
    }
    
    // Check if all objectives complete
    const allComplete = quest.objectives.every(o => o.completed)
    if (allComplete) {
      quest.status = QuestStatus.COMPLETED
    } else {
      quest.status = QuestStatus.IN_PROGRESS
    }
  }
  
  claimReward(playerId: string, questId: string): QuestRewards | null {
    const quest = this.quests.get(questId)
    if (!quest || quest.status !== QuestStatus.COMPLETED) return null
    
    // Remove from active quests
    this.playerQuests.get(playerId)?.delete(questId)
    
    // Reset if repeatable
    if (quest.repeatable) {
      quest.status = QuestStatus.AVAILABLE
      quest.objectives.forEach(o => {
        o.currentProgress = 0
        o.completed = false
      })
    } else {
      quest.status = QuestStatus.COMPLETED
    }
    
    return quest.rewards
  }
  
  private checkPrerequisite(playerId: string, prereq: QuestPrerequisite): boolean {
    switch (prereq.type) {
      case 'quest_completed': {
        const prevQuest = this.quests.get(prereq.value as string)
        return prevQuest?.status === QuestStatus.COMPLETED
      }
      case 'level':
        return true // Would check player level
      case 'reputation':
        return true // Would check faction reputation
      case 'item':
        return true // Would check inventory
      case 'companion':
        return true // Would check companions
      default:
        return false
    }
  }
  
  getAvailableQuests(playerId: string, zoneId?: string): Quest[] {
    return Array.from(this.quests.values()).filter(q => {
      if (zoneId && q.zoneId !== zoneId) return false
      return q.status === QuestStatus.AVAILABLE
    })
  }
  
  getPlayerQuests(playerId: string): Quest[] {
    const questIds = this.playerQuests.get(playerId) || new Set()
    return Array.from(questIds).map(id => this.quests.get(id)).filter(Boolean) as Quest[]
  }
  
  getQuest(id: string): Quest | undefined {
    return this.quests.get(id)
  }
  
  getMainCampaignQuests(): Quest[] {
    return Array.from(this.quests.values())
      .filter(q => q.type === QuestType.MAIN)
      .sort((a, b) => (a.chapter || 0) - (b.chapter || 0))
  }
  
  getDailyQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(q => q.type === QuestType.DAILY)
  }
}
