/**
 * Unit Tests - Hanoi Legends RPG
 * Tests for core modules
 */

import { describe, it, expect } from 'vitest'
import { CharacterManager } from '../modules/character/CharacterManager'
import { CompanionManager, Element, CompanionRarity } from '../modules/companion/CompanionManager'
import { QuestManager, QuestType, QuestStatus } from '../modules/quest/QuestManager'
import { EconomyManager } from '../modules/economy/EconomyManager'
import { SocialManager, ChatChannel } from '../modules/social/SocialManager'
import { MonetizationManager } from '../modules/monetization/MonetizationManager'
import { AdminManager } from '../modules/admin/AdminManager'

// ============ CHARACTER TESTS ============
describe('CharacterManager', () => {
  it('should create a character', () => {
    const manager = new CharacterManager()
    const avatar = {
      face: { skinTone: '#FDBCB4', eyeShape: 'round', noseShape: 'small', mouthShape: 'smile' },
      hair: { style: 'short', color: '#2C1810' },
      outfit: { top: 'shirt', bottom: 'pants', shoes: 'sneakers' }
    }
    
    const character = manager.createCharacter('user_1', 'TestPlayer', avatar, 'rong_thieng')
    
    expect(character.name).toBe('TestPlayer')
    expect(character.level).toBe(1)
    expect(character.companions).toContain('rong_thieng')
    expect(character.inventory.length).toBe(50)
    expect(character.title).toBe('Novice Explorer')
  })
  
  it('should add XP and level up', () => {
    const manager = new CharacterManager()
    const avatar = {
      face: { skinTone: '#FDBCB4', eyeShape: 'round', noseShape: 'small', mouthShape: 'smile' },
      hair: { style: 'short', color: '#2C1810' },
      outfit: { top: 'shirt', bottom: 'pants', shoes: 'sneakers' }
    }
    
    const character = manager.createCharacter('user_1', 'TestPlayer', avatar, 'rong_thieng')
    const result = manager.addXP(character.id, 150)
    
    expect(result.leveledUp).toBe(true)
    expect(character.level).toBe(2)
  })
  
  it('should add items to inventory', () => {
    const manager = new CharacterManager()
    const avatar = {
      face: { skinTone: '#FDBCB4', eyeShape: 'round', noseShape: 'small', mouthShape: 'smile' },
      hair: { style: 'short', color: '#2C1810' },
      outfit: { top: 'shirt', bottom: 'pants', shoes: 'sneakers' }
    }
    
    const character = manager.createCharacter('user_1', 'TestPlayer', avatar, 'rong_thieng')
    const success = manager.addItemToInventory(character.id, 'potion_small', 5)
    
    expect(success).toBe(true)
    const inventory = manager.getInventory(character.id)
    expect(inventory[0].itemId).toBe('potion_small')
    expect(inventory[0].quantity).toBe(5)
  })
  
  it('should not add items when inventory is full', () => {
    const manager = new CharacterManager()
    const avatar = {
      face: { skinTone: '#FDBCB4', eyeShape: 'round', noseShape: 'small', mouthShape: 'smile' },
      hair: { style: 'short', color: '#2C1810' },
      outfit: { top: 'shirt', bottom: 'pants', shoes: 'sneakers' }
    }
    
    const character = manager.createCharacter('user_1', 'TestPlayer', avatar, 'rong_thieng')
    
    // Fill inventory
    for (let i = 0; i < 50; i++) {
      manager.addItemToInventory(character.id, `item_${i}`, 1)
    }
    
    const success = manager.addItemToInventory(character.id, 'new_item', 1)
    expect(success).toBe(false)
  })
  
  it('should track faction reputation', () => {
    const manager = new CharacterManager()
    const avatar = {
      face: { skinTone: '#FDBCB4', eyeShape: 'round', noseShape: 'small', mouthShape: 'smile' },
      hair: { style: 'short', color: '#2C1810' },
      outfit: { top: 'shirt', bottom: 'pants', shoes: 'sneakers' }
    }
    
    const character = manager.createCharacter('user_1', 'TestPlayer', avatar, 'rong_thieng')
    manager.addFactionReputation(character.id, 'faction_pho_co', 100)
    
    expect(character.factionReputation.get('faction_pho_co')).toBe(100)
  })
})

// ============ COMPANION TESTS ============
describe('CompanionManager', () => {
  it('should create a companion', () => {
    const manager = new CompanionManager()
    const companion = manager.createCompanion('rong_thieng', 5)
    
    expect(companion).not.toBeNull()
    expect(companion!.speciesId).toBe('rong_thieng')
    expect(companion!.level).toBe(5)
  })
  
  it('should calculate element advantage correctly', () => {
    const manager = new CompanionManager()
    
    // Thủy > Hỏa
    expect(manager.getElementAdvantage(Element.THUY, Element.HOA)).toBe(2.0)
    // Hỏa < Thủy
    expect(manager.getElementAdvantage(Element.HOA, Element.THUY)).toBe(0.5)
    // Same element
    expect(manager.getElementAdvantage(Element.KIM, Element.KIM)).toBe(1.0)
  })
  
  it('should calculate capture rate', () => {
    const manager = new CompanionManager()
    
    const lowHpRate = manager.calculateCaptureRate(0.2, CompanionRarity.COMMON, 1)
    const highHpRate = manager.calculateCaptureRate(0.8, CompanionRarity.COMMON, 1)
    
    expect(lowHpRate).toBeGreaterThan(highHpRate)
  })
  
  it('should add bond', () => {
    const manager = new CompanionManager()
    const companion = manager.createCompanion('rong_thieng')!
    
    const bond = manager.addBond(companion.id, 25)
    expect(bond).toBe(25)
  })
  
  it('should add XP and level up companion', () => {
    const manager = new CompanionManager()
    const companion = manager.createCompanion('rong_thieng', 1)!
    
    const result = manager.addXP(companion.id, 60)
    expect(result.leveledUp).toBe(true)
    expect(companion.level).toBe(2)
  })
})

// ============ QUEST TESTS ============
describe('QuestManager', () => {
  it('should get available quests', () => {
    const manager = new QuestManager()
    const quests = manager.getAvailableQuests('user_1')
    
    expect(quests.length).toBeGreaterThan(0)
  })
  
  it('should accept a quest', () => {
    const manager = new QuestManager()
    const quests = manager.getAvailableQuests('user_1')
    
    if (quests.length > 0) {
      const success = manager.acceptQuest('user_1', quests[0].id)
      expect(success).toBe(true)
    }
  })
  
  it('should get main campaign quests', () => {
    const manager = new QuestManager()
    const mainQuests = manager.getMainCampaignQuests()
    
    expect(mainQuests.length).toBeGreaterThan(0)
    expect(mainQuests[0].type).toBe(QuestType.MAIN)
  })
  
  it('should get daily quests', () => {
    const manager = new QuestManager()
    const dailyQuests = manager.getDailyQuests()
    
    expect(dailyQuests.length).toBeGreaterThan(0)
  })
})

// ============ ECONOMY TESTS ============
describe('EconomyManager', () => {
  it('should buy items from shop', () => {
    const manager = new EconomyManager()
    const result = manager.buyItem('zone_pho_co', 'potion_small', 2, 500, 'xu')
    
    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(400) // 500 - 50*2
  })
  
  it('should fail to buy with insufficient funds', () => {
    const manager = new EconomyManager()
    const result = manager.buyItem('zone_pho_co', 'potion_large', 1, 50, 'xu')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Not enough currency')
  })
  
  it('should sell items with tax', () => {
    const manager = new EconomyManager()
    const result = manager.sellItem('sword', 1, 1000)
    
    expect(result.earnings).toBe(1000)
    expect(result.afterTax).toBe(950) // 5% tax
  })
  
  it('should create marketplace listing', () => {
    const manager = new EconomyManager()
    const listing = manager.createListing('user_1', 'Player1', 'sword', 'Kiếm Sắt', 1, 5000)
    
    expect(listing.id).toBeTruthy()
    expect(listing.status).toBe('active')
  })
  
  it('should craft items', () => {
    const manager = new EconomyManager()
    const result = manager.craft('craft_potion_large', 5)
    
    expect(result.success).toBe(true)
    expect(result.xpReward).toBe(20)
  })
  
  it('should fail craft if level too low', () => {
    const manager = new EconomyManager()
    const result = manager.craft('craft_capture_net', 2)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Level')
  })
})

// ============ SOCIAL TESTS ============
describe('SocialManager', () => {
  it('should send chat message', () => {
    const manager = new SocialManager()
    const msg = manager.sendMessage(ChatChannel.GLOBAL, 'user_1', 'Player1', 'Hello!')
    
    expect(msg.content).toBe('Hello!')
    expect(msg.senderId).toBe('user_1')
  })
  
  it('should get messages by channel', () => {
    const manager = new SocialManager()
    manager.sendMessage(ChatChannel.GLOBAL, 'user_1', 'Player1', 'Global msg')
    manager.sendMessage(ChatChannel.ZONE, 'user_1', 'Player1', 'Zone msg', { zoneId: 'zone_1' })
    
    const globalMsgs = manager.getMessages(ChatChannel.GLOBAL)
    expect(globalMsgs.length).toBeGreaterThanOrEqual(1)
  })
  
  it('should add friend', () => {
    const manager = new SocialManager()
    manager.addFriend('user_1', 'user_2', 'Player2')
    
    const friends = manager.getFriends('user_1')
    expect(friends.length).toBe(1)
    expect(friends[0].username).toBe('Player2')
  })
  
  it('should create guild', () => {
    const manager = new SocialManager()
    const guild = manager.createGuild('user_1', 'Leader1', 'Test Guild', 'A test guild')
    
    expect(guild.name).toBe('Test Guild')
    expect(guild.memberCount).toBe(1)
  })
  
  it('should join guild', () => {
    const manager = new SocialManager()
    const guild = manager.createGuild('user_1', 'Leader1', 'Test Guild', 'A test guild')
    const result = manager.joinGuild(guild.id, 'user_2', 'Player2', 5)
    
    expect(result.success).toBe(true)
    expect(guild.memberCount).toBe(2)
  })
  
  it('should get leaderboard', () => {
    const manager = new SocialManager()
    const leaderboard = manager.getLeaderboard('level')
    
    expect(leaderboard.length).toBe(50)
    expect(leaderboard[0].rank).toBe(1)
  })
})

// ============ MONETIZATION TESTS ============
describe('MonetizationManager', () => {
  it('should get battle pass progress', () => {
    const manager = new MonetizationManager()
    const progress = manager.getProgress('user_1')
    
    expect(progress.level).toBe(0)
    expect(progress.xp).toBe(0)
  })
  
  it('should add battle pass XP', () => {
    const manager = new MonetizationManager()
    const result = manager.addBattlePassXP('user_1', 150)
    
    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBe(1)
  })
  
  it('should upgrade to premium', () => {
    const manager = new MonetizationManager()
    const result = manager.upgradeToPremium('user_1')
    
    expect(result.success).toBe(true)
    expect(result.price).toBe(299000)
  })
  
  it('should pull gacha', () => {
    const manager = new MonetizationManager()
    const result = manager.pull('banner_standard', 'user_1')
    
    expect(result.speciesId).toBeTruthy()
    expect(result.rarity).toBeTruthy()
  })
  
  it('should get active events', () => {
    const manager = new MonetizationManager()
    const events = manager.getActiveEvents()
    
    expect(events.length).toBeGreaterThan(0)
  })
})

// ============ ADMIN TESTS ============
describe('AdminManager', () => {
  it('should get dashboard stats', () => {
    const manager = new AdminManager()
    const stats = manager.getDashboardStats()
    
    expect(stats.dau).toBeGreaterThan(0)
    expect(stats.revenue).toBeGreaterThan(0)
  })
  
  it('should get players', () => {
    const manager = new AdminManager()
    const result = manager.getPlayers(1, 10)
    
    expect(result.players.length).toBeLessThanOrEqual(10)
    expect(result.total).toBeGreaterThan(0)
  })
  
  it('should ban player', () => {
    const manager = new AdminManager()
    const result = manager.banPlayer('admin_1', 'Admin', 'user_1', 'Cheating')
    
    expect(result.success).toBe(true)
    
    const player = manager.getPlayer('user_1')
    expect(player?.isBanned).toBe(true)
  })
  
  it('should unban player', () => {
    const manager = new AdminManager()
    manager.banPlayer('admin_1', 'Admin', 'user_1', 'Cheating')
    const result = manager.unbanPlayer('admin_1', 'Admin', 'user_1')
    
    expect(result.success).toBe(true)
    
    const player = manager.getPlayer('user_1')
    expect(player?.isBanned).toBe(false)
  })
  
  it('should get content', () => {
    const manager = new AdminManager()
    const content = manager.getContent()
    
    expect(content.length).toBeGreaterThan(0)
  })
  
  it('should get revenue analytics', () => {
    const manager = new AdminManager()
    const revenue = manager.getRevenueAnalytics(7)
    
    expect(revenue.length).toBe(7)
    expect(revenue[0].revenue).toBeGreaterThan(0)
  })
})
