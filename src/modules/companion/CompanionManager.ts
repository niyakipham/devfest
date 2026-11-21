/**
 * Companion System
 * Thu thập & huấn luyện linh vật dựa trên thần thoại Việt Nam
 */

export enum Element {
  KIM = 'KIM',       // Metal
  MOC = 'MOC',       // Wood
  THUY = 'THUY',     // Water
  HOA = 'HOA',       // Fire
  THO = 'THO'        // Earth
}

// Kim > Mộc > Thủy > Hỏa > Thổ > Kim
export const ELEMENT_ADVANTAGE: Record<Element, Element> = {
  [Element.KIM]: Element.MOC,
  [Element.MOC]: Element.THUY,
  [Element.THUY]: Element.HOA,
  [Element.HOA]: Element.THO,
  [Element.THO]: Element.KIM
}

export enum CompanionRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC'
}

export interface CompanionSpecies {
  id: string
  name: string
  element: Element
  rarity: CompanionRarity
  baseStats: CompanionStats
  evolutionChain: string[] // Species IDs
  learnableMoves: string[]
  description: string
  lore: string
  habitat: string
}

export interface CompanionStats {
  hp: number
  attack: number
  defense: number
  speed: number
  specialAttack: number
  specialDefense: number
}

export interface Companion {
  id: string
  speciesId: string
  nickname: string
  level: number
  xp: number
  bondLevel: number // 0-100
  evolutionStage: number
  currentStats: CompanionStats
  moves: CompanionMove[]
  isShiny: boolean
  caughtAt: Date
  location: string
}

export interface CompanionMove {
  id: string
  name: string
  element: Element
  power: number
  accuracy: number
  pp: number
  maxPP: number
  description: string
  effects?: MoveEffect[]
}

export interface MoveEffect {
  type: 'stat_change' | 'status' | 'heal' | 'damage_over_time'
  value: number
  duration?: number
}

export class CompanionManager {
  private species: Map<string, CompanionSpecies>
  private companions: Map<string, Companion>
  private collection: Map<string, Set<string>> // userId -> Set<speciesId>
  
  constructor() {
    this.species = new Map()
    this.companions = new Map()
    this.collection = new Map()
    
    this.initializeSpecies()
  }
  
  private initializeSpecies(): void {
    // Starter companions
    this.species.set('rong_thieng', {
      id: 'rong_thieng',
      name: 'Rồng Thiêng',
      element: Element.THUY,
      rarity: CompanionRarity.LEGENDARY,
      baseStats: { hp: 80, attack: 70, defense: 60, speed: 65, specialAttack: 90, specialDefense: 70 },
      evolutionChain: ['rong_con', 'rong_thieng', 'rong_than'],
      learnableMoves: ['thuy_long_quyen', 'rong_cuon', 'thuy_tri'],
      description: 'Linh thú rồng nước, bảo vệ sông hồ',
      lore: 'Hậu duệ của Rồng Lạc Long Quân, mang trong mình sức mạnh của biển cả',
      habitat: 'Sông Hồng, Hồ Tây'
    })
    
    this.species.set('rua_than', {
      id: 'rua_than',
      name: 'Rùa Thần',
      element: Element.THUY,
      rarity: CompanionRarity.MYTHIC,
      baseStats: { hp: 100, attack: 50, defense: 100, speed: 30, specialAttack: 70, specialDefense: 90 },
      evolutionChain: ['rua_con', 'rua_than'],
      learnableMoves: ['khi_giap', 'thuy_tri', 'than_luc'],
      description: 'Linh thú ngàn năm tuổi, bảo vệ Hồ Gươm',
      lore: 'Từng giúp Lê Lợi đánh giặc Minh, nay守护 thủ đô',
      habitat: 'Hồ Hoàn Kiếm'
    })
    
    this.species.set('phuong_hoang', {
      id: 'phuong_hoang',
      name: 'Phượng Hoàng Lửa',
      element: Element.HOA,
      rarity: CompanionRarity.LEGENDARY,
      baseStats: { hp: 70, attack: 85, defense: 55, speed: 90, specialAttack: 100, specialDefense: 65 },
      evolutionChain: ['phuong_con', 'phuong_hoang', 'phuong_de'],
      learnableMoves: ['hoa_phung', 'tai_sinh', 'nang_luc'],
      description: 'Chim phượng hoàng lửa, biểu tượng của sự tái sinh',
      lore: 'Xuất hiện mỗi 500 năm, mang đến may mắn và thịnh vượng',
      habitat: 'Núi Ba Vì'
    })
    
    // More species to be added (150+ total)
    this.species.set('mao_mat', {
      id: 'mao_mat',
      name: 'Mèo Mun',
      element: Element.THO,
      rarity: CompanionRarity.COMMON,
      baseStats: { hp: 50, attack: 55, defense: 45, speed: 70, specialAttack: 50, specialDefense: 45 },
      evolutionChain: ['meo_con', 'mao_mat'],
      learnableMoves: ['vot', 'cat_cào', 'né'],
      description: 'Mèo đen thông minh, phổ biến ở Phố Cổ',
      lore: 'Người dân tin rằng mèo mun mang lại may mắn',
      habitat: 'Phố Cổ Hà Nội'
    })
  }
  
  // Capture mechanic: success rate = f(HP%, rarity, item tier)
  calculateCaptureRate(companionHPPercent: number, rarity: CompanionRarity, itemTier: number): number {
    const baseRate = 100
    const hpFactor = 1 - companionHPPercent // Lower HP = higher capture rate
    const rarityFactor = this.getRarityFactor(rarity)
    const itemFactor = 1 + (itemTier - 1) * 0.3
    
    const rate = baseRate * hpFactor * (1 / rarityFactor) * itemFactor
    return Math.min(Math.max(rate, 5), 95) // Clamp between 5% and 95%
  }
  
  private getRarityFactor(rarity: CompanionRarity): number {
    switch (rarity) {
      case CompanionRarity.COMMON: return 1.0
      case CompanionRarity.RARE: return 1.5
      case CompanionRarity.EPIC: return 2.5
      case CompanionRarity.LEGENDARY: return 4.0
      case CompanionRarity.MYTHIC: return 6.0
    }
  }
  
  createCompanion(speciesId: string, level: number = 1, isShiny: boolean = false): Companion | null {
    const species = this.species.get(speciesId)
    if (!species) return null
    
    const companion: Companion = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speciesId,
      nickname: species.name,
      level,
      xp: 0,
      bondLevel: 0,
      evolutionStage: 0,
      currentStats: { ...species.baseStats },
      moves: species.learnableMoves.slice(0, 2).map(moveId => this.getMoveTemplate(moveId)),
      isShiny,
      caughtAt: new Date(),
      location: 'Phố Cổ'
    }
    
    this.companions.set(companion.id, companion)
    return companion
  }
  
  private getMoveTemplate(moveId: string): CompanionMove {
    // Default move templates
    return {
      id: moveId,
      name: moveId,
      element: Element.KIM,
      power: 40,
      accuracy: 100,
      pp: 30,
      maxPP: 30,
      description: 'Basic attack move'
    }
  }
  
  calculateDamage(attacker: Companion, defender: Companion, move: CompanionMove): number {
    const level = attacker.level
    const power = move.power
    const attack = move.element === Element.HOA || move.element === Element.KIM 
      ? attacker.currentStats.specialAttack 
      : attacker.currentStats.attack
    const defense = defender.currentStats.defense
    
    // Pokémon-style damage formula
    const baseDamage = ((2 * level / 5 + 2) * power * attack / defense) / 50 + 2
    
    // Element advantage
    const advantage = this.getElementAdvantage(move.element, this.getCompanionElement(defender))
    
    return Math.floor(baseDamage * advantage)
  }
  
  getElementAdvantage(attackElement: Element, defendElement: Element): number {
    if (ELEMENT_ADVANTAGE[attackElement] === defendElement) return 2.0
    if (ELEMENT_ADVANTAGE[defendElement] === attackElement) return 0.5
    return 1.0
  }
  
  private getCompanionElement(companion: Companion): Element {
    const species = this.species.get(companion.speciesId)
    return species?.element || Element.THO
  }
  
  addBond(companionId: string, amount: number): number {
    const companion = this.companions.get(companionId)
    if (!companion) return 0
    
    companion.bondLevel = Math.min(100, companion.bondLevel + amount)
    return companion.bondLevel
  }
  
  addXP(companionId: string, xp: number): { leveledUp: boolean; newLevel: number } {
    const companion = this.companions.get(companionId)
    if (!companion) throw new Error(`Companion ${companionId} not found`)
    
    companion.xp += xp
    let leveledUp = false
    
    const xpNeeded = companion.level * 50
    
    if (companion.xp >= xpNeeded && companion.level < 100) {
      companion.level++
      companion.xp -= xpNeeded
      
      // Scale stats
      const species = this.species.get(companion.speciesId)
      if (species) {
        companion.currentStats.hp += Math.floor(species.baseStats.hp * 0.1)
        companion.currentStats.attack += Math.floor(species.baseStats.attack * 0.1)
        companion.currentStats.defense += Math.floor(species.baseStats.defense * 0.1)
      }
      
      leveledUp = true
    }
    
    return { leveledUp, newLevel: companion.level }
  }
  
  addToCollection(userId: string, speciesId: string): void {
    if (!this.collection.has(userId)) {
      this.collection.set(userId, new Set())
    }
    this.collection.get(userId)!.add(speciesId)
  }
  
  getCollection(userId: string): Set<string> {
    return this.collection.get(userId) || new Set()
  }
  
  getSpecies(id: string): CompanionSpecies | undefined {
    return this.species.get(id)
  }
  
  getAllSpecies(): CompanionSpecies[] {
    return Array.from(this.species.values())
  }
  
  getCompanion(id: string): Companion | undefined {
    return this.companions.get(id)
  }
  
  checkEvolution(companionId: string): Companion | null {
    const companion = this.companions.get(companionId)
    if (!companion) return null
    
    const species = this.species.get(companion.speciesId)
    if (!species) return null
    
    if (companion.evolutionStage < species.evolutionChain.length - 1) {
      const bondThreshold = (companion.evolutionStage + 1) * 30
      if (companion.bondLevel >= bondThreshold && companion.level >= 15) {
        companion.evolutionStage++
        const newSpeciesId = species.evolutionChain[companion.evolutionStage]
        companion.speciesId = newSpeciesId
        
        // Update stats
        const newSpecies = this.species.get(newSpeciesId)
        if (newSpecies) {
          companion.currentStats = { ...newSpecies.baseStats }
        }
        
        return companion
      }
    }
    
    return null
  }
}
