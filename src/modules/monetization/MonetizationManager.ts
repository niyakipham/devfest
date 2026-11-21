/**
 * Monetization Module
 * Battle Pass, Gacha, Shop, Seasonal Events
 * Ethical: NO pay-to-win
 */

export interface BattlePassSeason {
  id: string
  name: string
  theme: string
  startDate: Date
  endDate: Date
  isActive: boolean
  maxLevel: number
  price: number // VND
  freeRewards: BattlePassReward[]
  premiumRewards: BattlePassReward[]
}

export interface BattlePassReward {
  tier: number
  reward: {
    type: 'currency' | 'item' | 'companion_skin' | 'premium_currency' | 'title' | 'emote'
    value: string
    amount?: number
  }
}

export interface BattlePassProgress {
  seasonId: string
  level: number
  xp: number
  xpToNextLevel: number
  isPremium: boolean
  claimedTiers: { tier: number; track: 'free' | 'premium' }[]
}

export interface GachaBanner {
  id: string
  name: string
  type: 'standard' | 'limited' | 'event'
  startDate: Date
  endDate: Date
  isActive: boolean
  rates: GachaRate[]
  pityGuarantee: number // Guaranteed legendary at X pulls
  pityEpic: number
  featuredSpecies?: string[]
}

export interface GachaRate {
  speciesId: string
  rate: number // percentage
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
}

export interface GachaResult {
  speciesId: string
  rarity: string
  isShiny: boolean
  isNew: boolean
  pityCount: number
  isGuaranteed: boolean
}

export interface SeasonalEvent {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  isActive: boolean
  rewards: string[]
  tasks: SeasonalTask[]
}

export interface SeasonalTask {
  id: string
  description: string
  target: number
  current: number
  reward: string
}

export class MonetizationManager {
  private seasons: Map<string, BattlePassSeason>
  private banners: Map<string, GachaBanner>
  private events: Map<string, SeasonalEvent>
  private playerProgress: Map<string, BattlePassProgress>
  private pityCounters: Map<string, number> // userId -> pity count
  
  constructor() {
    this.seasons = new Map()
    this.banners = new Map()
    this.events = new Map()
    this.playerProgress = new Map()
    this.pityCounters = new Map()
    
    this.initializeSeasons()
    this.initializeBanners()
    this.initializeEvents()
  }
  
  private initializeSeasons(): void {
    const freeRewards: BattlePassReward[] = Array.from({ length: 100 }, (_, i) => {
      const tier = i + 1
      if (tier % 10 === 0) return { tier, reward: { type: 'currency', value: 'xu_ha_thanh', amount: 500 } }
      if (tier % 5 === 0) return { tier, reward: { type: 'item', value: 'potion_large' } }
      return { tier, reward: { type: 'item', value: 'companion_food' } }
    })
    
    const premiumRewards: BattlePassReward[] = Array.from({ length: 100 }, (_, i) => {
      const tier = i + 1
      if (tier === 100) return { tier, reward: { type: 'companion_skin', value: 'golden_dragon' } }
      if (tier % 10 === 0) return { tier, reward: { type: 'premium_currency', value: 'ngoc_rong', amount: 50 } }
      if (tier % 5 === 0) return { tier, reward: { type: 'emote', value: `emote_${tier}` } }
      return { tier, reward: { type: 'item', value: 'premium_box' } }
    })
    
    this.seasons.set('season_1', {
      id: 'season_1',
      name: 'Mùa Xuân - Tết Nguyên Đán',
      theme: 'Tết',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-04-01'),
      isActive: true,
      maxLevel: 100,
      price: 299000, // VND
      freeRewards,
      premiumRewards
    })
  }
  
  private initializeBanners(): void {
    this.banners.set('banner_standard', {
      id: 'banner_standard',
      name: 'Summon Linh Thú',
      type: 'standard',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
      rates: [
        { speciesId: 'mao_mat', rate: 35, rarity: 'common' },
        { speciesId: 'chim_se', rate: 25, rarity: 'common' },
        { speciesId: 'ca_chep', rate: 15, rarity: 'rare' },
        { speciesId: 'hoang_trung', rate: 10, rarity: 'epic' },
        { speciesId: 'rong_thieng', rate: 4, rarity: 'legendary' },
        { speciesId: 'phuong_hoang', rate: 1, rarity: 'mythic' }
      ],
      pityGuarantee: 90,
      pityEpic: 10
    })
    
    this.banners.set('banner_limited_tet', {
      id: 'banner_limited_tet',
      name: 'Linh Thú Tết - Giới Hạn',
      type: 'limited',
      startDate: new Date('2026-01-20'),
      endDate: new Date('2026-02-15'),
      isActive: true,
      rates: [
        { speciesId: 'li_xi_dragon', rate: 0.5, rarity: 'mythic' },
        { speciesId: 'mai_vang_bird', rate: 2, rarity: 'legendary' },
        { speciesId: 'dao_tet_spirit', rate: 7, rarity: 'epic' },
        { speciesId: 'tet_cat', rate: 20, rarity: 'rare' },
        { speciesId: 'lucky_fish', rate: 30, rarity: 'rare' },
        { speciesId: 'spring_bunny', rate: 40.5, rarity: 'common' }
      ],
      pityGuarantee: 60,
      pityEpic: 8,
      featuredSpecies: ['li_xi_dragon', 'mai_vang_bird']
    })
  }
  
  private initializeEvents(): void {
    this.events.set('event_tet_2026', {
      id: 'event_tet_2026',
      name: 'Tết Nguyên Đán 2026',
      description: 'Sự kiện đặc biệt mừng năm mới! Thu thập linh thú Tết và nhận quà tặng.',
      startDate: new Date('2026-01-25'),
      endDate: new Date('2026-02-15'),
      isActive: true,
      rewards: ['special_companion_tet', 'tet_outfit', '500_premium_currency', 'limited_title'],
      tasks: [
        { id: 'task_1', description: 'Thu thập 10 linh thú Tết', target: 10, current: 0, reward: 'tet_companion_common' },
        { id: 'task_2', description: 'Hoàn thành 5 nhiệm vụ Tết', target: 5, current: 0, reward: 'tet_companion_rare' },
        { id: 'task_3', description: 'Thắng 3 trận đấu Tết', target: 3, current: 0, reward: 'tet_companion_epic' }
      ]
    })
  }
  
  // Battle Pass
  getProgress(userId: string, seasonId: string = 'season_1'): BattlePassProgress {
    const key = `${userId}_${seasonId}`
    
    if (!this.playerProgress.has(key)) {
      this.playerProgress.set(key, {
        seasonId,
        level: 0,
        xp: 0,
        xpToNextLevel: 100,
        isPremium: false,
        claimedTiers: []
      })
    }
    
    return this.playerProgress.get(key)!
  }
  
  addBattlePassXP(userId: string, xp: number, seasonId: string = 'season_1'): { leveledUp: boolean; newLevel: number; rewards: BattlePassReward[] } {
    const progress = this.getProgress(userId, seasonId)
    progress.xp += xp
    
    const rewards: BattlePassReward[] = []
    let leveledUp = false
    
    while (progress.xp >= progress.xpToNextLevel && progress.level < 100) {
      progress.level++
      progress.xp -= progress.xpToNextLevel
      progress.xpToNextLevel = Math.floor(100 * Math.pow(progress.level, 0.8))
      leveledUp = true
      
      // Auto-claim free reward
      const freeReward = this.seasons.get(seasonId)?.freeRewards.find(r => r.tier === progress.level)
      if (freeReward) rewards.push(freeReward)
      
      // Auto-claim premium reward if premium
      if (progress.isPremium) {
        const premiumReward = this.seasons.get(seasonId)?.premiumRewards.find(r => r.tier === progress.level)
        if (premiumReward) rewards.push(premiumReward)
      }
    }
    
    return { leveledUp, newLevel: progress.level, rewards }
  }
  
  upgradeToPremium(userId: string, seasonId: string = 'season_1'): { success: boolean; price: number } {
    const progress = this.getProgress(userId, seasonId)
    if (progress.isPremium) return { success: false, price: 0 }
    
    progress.isPremium = true
    const season = this.seasons.get(seasonId)
    
    // Backfill premium rewards for already-completed tiers
    if (season) {
      for (let tier = 1; tier <= progress.level; tier++) {
        const reward = season.premiumRewards.find(r => r.tier === tier)
        if (reward) {
          progress.claimedTiers.push({ tier, track: 'premium' })
        }
      }
    }
    
    return { success: true, price: season?.price || 299000 }
  }
  
  claimTierReward(userId: string, tier: number, track: 'free' | 'premium', seasonId: string = 'season_1'): { success: boolean; reward?: BattlePassReward } {
    const progress = this.getProgress(userId, seasonId)
    
    if (tier > progress.level) return { success: false }
    if (track === 'premium' && !progress.isPremium) return { success: false }
    if (progress.claimedTiers.some(t => t.tier === tier && t.track === track)) return { success: false }
    
    const season = this.seasons.get(seasonId)
    const rewards = track === 'free' ? season?.freeRewards : season?.premiumRewards
    const reward = rewards?.find(r => r.tier === tier)
    
    if (reward) {
      progress.claimedTiers.push({ tier, track })
      return { success: true, reward }
    }
    
    return { success: false }
  }
  
  // Gacha
  pull(bannerId: string, userId: string): GachaResult {
    const banner = this.banners.get(bannerId)
    if (!banner) throw new Error('Banner not found')
    
    let pityCount = this.pityCounters.get(userId) || 0
    pityCount++
    
    const roll = Math.random() * 100
    let cumulative = 0
    let result: GachaResult | null = null
    
    // Check pity first
    if (pityCount >= banner.pityGuarantee) {
      const legendaryRate = banner.rates.find(r => r.rarity === 'legendary' || r.rarity === 'mythic')
      if (legendaryRate) {
        result = {
          speciesId: legendaryRate.speciesId,
          rarity: legendaryRate.rarity,
          isShiny: Math.random() < 0.05,
          isNew: true,
          pityCount,
          isGuaranteed: true
        }
      }
    } else if (pityCount >= banner.pityEpic) {
      const epicRate = banner.rates.find(r => r.rarity === 'epic')
      if (epicRate && Math.random() < 0.5) {
        result = {
          speciesId: epicRate.speciesId,
          rarity: epicRate.rarity,
          isShiny: Math.random() < 0.05,
          isNew: true,
          pityCount,
          isGuaranteed: true
        }
      }
    }
    
    // Normal roll
    if (!result) {
      for (const rate of banner.rates) {
        cumulative += rate.rate
        if (roll <= cumulative) {
          result = {
            speciesId: rate.speciesId,
            rarity: rate.rarity,
            isShiny: Math.random() < 0.05,
            isNew: Math.random() < 0.3,
            pityCount,
            isGuaranteed: false
          }
          break
        }
      }
    }
    
    // Reset pity on legendary/mythic
    if (result && (result.rarity === 'legendary' || result.rarity === 'mythic')) {
      pityCount = 0
    }
    
    this.pityCounters.set(userId, pityCount)
    
    return result!
  }
  
  getPityCount(userId: string, bannerId: string = 'banner_standard'): number {
    return this.pityCounters.get(userId) || 0
  }
  
  // Seasonal Events
  getActiveEvents(): SeasonalEvent[] {
    return Array.from(this.events.values()).filter(e => e.isActive)
  }
  
  getEventProgress(userId: string, eventId: string): SeasonalTask[] {
    const event = this.events.get(eventId)
    if (!event) return []
    
    // Simulated progress
    return event.tasks.map(task => ({
      ...task,
      current: Math.floor(Math.random() * task.target)
    }))
  }
  
  // Stats
  getSeasons(): BattlePassSeason[] {
    return Array.from(this.seasons.values())
  }
  
  getBanners(): GachaBanner[] {
    return Array.from(this.banners.values())
  }
  
  getBanner(id: string): GachaBanner | undefined {
    return this.banners.get(id)
  }
}
