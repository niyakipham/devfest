/**
 * Character Module
 * Player character management: creation, progression, inventory
 */

export interface CharacterData {
  id: string
  userId: string
  name: string
  level: number
  xp: number
  xpToNextLevel: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  zoneId: string
  position: { x: number; y: number; z: number }
  avatar: AvatarConfig
  stats: CharacterStats
  skills: Skill[]
  factionReputation: Map<string, number>
  inventory: InventorySlot[]
  companions: string[] // Companion IDs
  quests: string[] // Active quest IDs
  achievements: string[]
  title: string
  createdAt: Date
  lastPlayed: Date
}

export interface AvatarConfig {
  face: {
    skinTone: string
    eyeShape: string
    noseShape: string
    mouthShape: string
  }
  hair: {
    style: string
    color: string
  }
  outfit: {
    top: string
    bottom: string
    shoes: string
    accessory?: string
  }
}

export interface CharacterStats {
  strength: number
  agility: number
  intelligence: number
  charisma: number
  luck: number
}

export interface Skill {
  id: string
  name: string
  description: string
  branch: SkillBranch
  level: number
  maxLevel: number
  unlocked: boolean
  effects: SkillEffect[]
}

export enum SkillBranch {
  EXPLORATION = 'EXPLORATION',
  COMBAT = 'COMBAT',
  SOCIAL = 'SOCIAL',
  COLLECTION = 'COLLECTION'
}

export interface SkillEffect {
  type: 'stat_boost' | 'unlock_ability' | 'passive_bonus'
  value: number
  description: string
}

export interface InventorySlot {
  slot: number
  itemId: string
  quantity: number
  maxQuantity: number
}

export class CharacterManager {
  private characters: Map<string, CharacterData>
  private levelTable: Map<number, number> // level -> xp required
  
  constructor() {
    this.characters = new Map()
    this.levelTable = this.generateLevelTable()
  }
  
  private generateLevelTable(): Map<number, number> {
    const table = new Map<number, number>()
    for (let level = 1; level <= 100; level++) {
      table.set(level, Math.floor(100 * Math.pow(level, 1.5)))
    }
    return table
  }
  
  createCharacter(userId: string, name: string, avatar: AvatarConfig, startingCompanion: string): CharacterData {
    const character: CharacterData = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      level: 1,
      xp: 0,
      xpToNextLevel: this.levelTable.get(1) || 100,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      zoneId: 'zone_pho_co',
      position: { x: 0, y: 0, z: 0 },
      avatar,
      stats: {
        strength: 5,
        agility: 5,
        intelligence: 5,
        charisma: 5,
        luck: 5
      },
      skills: this.getStartingSkills(),
      factionReputation: new Map(),
      inventory: Array.from({ length: 50 }, (_, i) => ({
        slot: i,
        itemId: '',
        quantity: 0,
        maxQuantity: 99
      })),
      companions: [startingCompanion],
      quests: [],
      achievements: [],
      title: 'Novice Explorer',
      createdAt: new Date(),
      lastPlayed: new Date()
    }
    
    this.characters.set(character.id, character)
    return character
  }
  
  private getStartingSkills(): Skill[] {
    return [
      {
        id: 'skill_sprint',
        name: 'Chạy Nhanh',
        description: 'Tăng tốc độ di chuyển trong 10 giây',
        branch: SkillBranch.EXPLORATION,
        level: 1,
        maxLevel: 10,
        unlocked: true,
        effects: [{ type: 'stat_boost', value: 0.5, description: '+50% tốc độ' }]
      },
      {
        id: 'skill_basic_attack',
        name: 'Tấn Công Cơ Bản',
        description: 'Đánh thường vào đối thủ',
        branch: SkillBranch.COMBAT,
        level: 1,
        maxLevel: 10,
        unlocked: true,
        effects: [{ type: 'stat_boost', value: 10, description: '10 damage' }]
      }
    ]
  }
  
  addXP(characterId: string, xp: number): { leveledUp: boolean; newLevel: number } {
    const character = this.characters.get(characterId)
    if (!character) throw new Error(`Character ${characterId} not found`)
    
    character.xp += xp
    let leveledUp = false
    
    while (character.xp >= character.xpToNextLevel && character.level < 100) {
      character.level++
      character.xp -= character.xpToNextLevel
      character.xpToNextLevel = this.levelTable.get(character.level) || 999999
      
      // Increase stats on level up
      character.maxHealth += 10
      character.health = character.maxHealth
      character.maxEnergy += 5
      character.energy = character.maxEnergy
      
      // Distribute stat points
      character.stats.strength += 1
      character.stats.agility += 1
      character.stats.intelligence += 1
      
      leveledUp = true
    }
    
    return { leveledUp, newLevel: character.level }
  }
  
  addFactionReputation(characterId: string, factionId: string, amount: number): void {
    const character = this.characters.get(characterId)
    if (!character) return
    
    const currentRep = character.factionReputation.get(factionId) || 0
    character.factionReputation.set(factionId, currentRep + amount)
  }
  
  getCharacter(id: string): CharacterData | undefined {
    return this.characters.get(id)
  }
  
  updatePosition(characterId: string, x: number, y: number, z: number): void {
    const character = this.characters.get(characterId)
    if (character) {
      character.position = { x, y, z }
      character.lastPlayed = new Date()
    }
  }
  
  addItemToInventory(characterId: string, itemId: string, quantity: number = 1): boolean {
    const character = this.characters.get(characterId)
    if (!character) return false
    
    // Find empty slot or stackable slot
    for (const slot of character.inventory) {
      if (slot.itemId === itemId && slot.quantity < slot.maxQuantity) {
        slot.quantity += quantity
        return true
      }
    }
    
    for (const slot of character.inventory) {
      if (slot.quantity === 0) {
        slot.itemId = itemId
        slot.quantity = quantity
        return true
      }
    }
    
    return false // Inventory full
  }
  
  removeItemFromInventory(characterId: string, slot: number, quantity: number = 1): boolean {
    const character = this.characters.get(characterId)
    if (!character) return false
    
    const slotData = character.inventory[slot]
    if (!slotData || slotData.quantity < quantity) return false
    
    slotData.quantity -= quantity
    if (slotData.quantity <= 0) {
      slotData.itemId = ''
      slotData.quantity = 0
    }
    
    return true
  }
  
  getInventory(characterId: string): InventorySlot[] {
    const character = this.characters.get(characterId)
    return character?.inventory || []
  }
}
