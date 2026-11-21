/**
 * Social Module
 * Chat, friends, guilds, parties, leaderboards
 */

export enum ChatChannel {
  GLOBAL = 'GLOBAL',
  ZONE = 'ZONE',
  PARTY = 'PARTY',
  GUILD = 'GUILD',
  PRIVATE = 'PRIVATE',
  SYSTEM = 'SYSTEM'
}

export interface ChatMessage {
  id: string
  channel: ChatChannel
  senderId: string
  senderName: string
  content: string
  timestamp: number
  zoneId?: string
  guildId?: string
  targetId?: string
}

export interface Friend {
  userId: string
  username: string
  characterLevel: number
  status: 'online' | 'offline' | 'in_battle' | 'in_quest'
  lastSeen?: Date
  friendshipLevel: number
}

export interface Guild {
  id: string
  name: string
  description: string
  leaderId: string
  leaderName: string
  memberCount: number
  maxMembers: number
  level: number
  xp: number
  createdAt: Date
  members: GuildMember[]
}

export interface GuildMember {
  userId: string
  username: string
  role: 'leader' | 'officer' | 'member'
  joinedAt: Date
  contribution: number
  characterLevel: number
}

export interface Party {
  id: string
  leaderId: string
  members: PartyMember[]
  maxMembers: number
  questProgress?: string
}

export interface PartyMember {
  userId: string
  username: string
  characterLevel: number
  hp: number
  maxHp: number
  isReady: boolean
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  characterLevel: number
  score: number
  zone: string
}

export class SocialManager {
  private messages: ChatMessage[]
  private maxMessages: number
  private friends: Map<string, Map<string, Friend>> // userId -> friendId -> Friend
  private guilds: Map<string, Guild>
  private parties: Map<string, Party>
  
  constructor() {
    this.messages = []
    this.maxMessages = 200
    this.friends = new Map()
    this.guilds = new Map()
    this.parties = new Map()
    
    this.initializeDemoGuilds()
  }
  
  private initializeDemoGuilds(): void {
    this.guilds.set('guild_1', {
      id: 'guild_1',
      name: 'Hội Rồng Thiêng',
      description: 'Guild mạnh nhất Phố Cổ - Chuyên PvP và Boss raids',
      leaderId: 'user_1',
      leaderName: 'RongMaster',
      memberCount: 15,
      maxMembers: 20,
      level: 5,
      xp: 12500,
      createdAt: new Date(Date.now() - 30 * 86400000),
      members: [
        { userId: 'user_1', username: 'RongMaster', role: 'leader', joinedAt: new Date(Date.now() - 30 * 86400000), contribution: 5000, characterLevel: 25 },
        { userId: 'user_2', username: 'LinhThuMaster', role: 'officer', joinedAt: new Date(Date.now() - 25 * 86400000), contribution: 3000, characterLevel: 20 },
        { userId: 'user_3', username: 'PhoCoExplorer', role: 'member', joinedAt: new Date(Date.now() - 10 * 86400000), contribution: 800, characterLevel: 15 }
      ]
    })
    
    this.guilds.set('guild_2', {
      id: 'guild_2',
      name: 'Dân Chơi Hồ Tây',
      description: 'Chill, exploration, collect all companions',
      leaderId: 'user_4',
      leaderName: 'HoTayChill',
      memberCount: 8,
      maxMembers: 20,
      level: 3,
      xp: 4500,
      createdAt: new Date(Date.now() - 15 * 86400000),
      members: [
        { userId: 'user_4', username: 'HoTayChill', role: 'leader', joinedAt: new Date(Date.now() - 15 * 86400000), contribution: 2000, characterLevel: 18 }
      ]
    })
  }
  
  // Chat
  sendMessage(channel: ChatChannel, senderId: string, senderName: string, content: string, options?: { zoneId?: string; guildId?: string; targetId?: string }): ChatMessage {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channel,
      senderId,
      senderName,
      content: content.substring(0, 500), // Max 500 chars
      timestamp: Date.now(),
      zoneId: options?.zoneId,
      guildId: options?.guildId,
      targetId: options?.targetId
    }
    
    this.messages.push(message)
    if (this.messages.length > this.maxMessages) {
      this.messages.shift()
    }
    
    return message
  }
  
  getMessages(channel: ChatChannel, zoneId?: string, limit: number = 50): ChatMessage[] {
    return this.messages
      .filter(msg => {
        if (msg.channel !== channel) return false
        if (channel === ChatChannel.ZONE && msg.zoneId !== zoneId) return false
        return true
      })
      .slice(-limit)
  }
  
  // Friends
  addFriend(userId: string, friendId: string, friendUsername: string): void {
    if (!this.friends.has(userId)) {
      this.friends.set(userId, new Map())
    }
    
    this.friends.get(userId)!.set(friendId, {
      userId: friendId,
      username: friendUsername,
      characterLevel: 1,
      status: 'offline',
      friendshipLevel: 1
    })
  }
  
  getFriends(userId: string): Friend[] {
    return Array.from(this.friends.get(userId)?.values() || [])
  }
  
  removeFriend(userId: string, friendId: string): boolean {
    return this.friends.get(userId)?.delete(friendId) || false
  }
  
  setFriendStatus(friendId: string, status: Friend['status']): void {
    this.friends.forEach(friendMap => {
      const friend = friendMap.get(friendId)
      if (friend) {
        friend.status = status
        if (status !== 'offline') {
          friend.lastSeen = new Date()
        }
      }
    })
  }
  
  // Guilds
  createGuild(leaderId: string, leaderName: string, name: string, description: string): Guild {
    const guild: Guild = {
      id: `guild_${Date.now()}`,
      name,
      description,
      leaderId,
      leaderName,
      memberCount: 1,
      maxMembers: 20,
      level: 1,
      xp: 0,
      createdAt: new Date(),
      members: [
        { userId: leaderId, username: leaderName, role: 'leader', joinedAt: new Date(), contribution: 0, characterLevel: 1 }
      ]
    }
    
    this.guilds.set(guild.id, guild)
    return guild
  }
  
  joinGuild(guildId: string, userId: string, username: string, characterLevel: number): { success: boolean; error?: string } {
    const guild = this.guilds.get(guildId)
    if (!guild) return { success: false, error: 'Guild not found' }
    
    if (guild.memberCount >= guild.maxMembers) {
      return { success: false, error: 'Guild is full' }
    }
    
    if (guild.members.some(m => m.userId === userId)) {
      return { success: false, error: 'Already a member' }
    }
    
    guild.members.push({
      userId,
      username,
      role: 'member',
      joinedAt: new Date(),
      contribution: 0,
      characterLevel
    })
    guild.memberCount++
    
    return { success: true }
  }
  
  leaveGuild(guildId: string, userId: string): boolean {
    const guild = this.guilds.get(guildId)
    if (!guild) return false
    
    const memberIndex = guild.members.findIndex(m => m.userId === userId)
    if (memberIndex === -1) return false
    
    const member = guild.members[memberIndex]
    if (member.role === 'leader') {
      // Transfer leadership or disband
      if (guild.members.length > 1) {
        guild.members[memberIndex === 0 ? 1 : 0].role = 'leader'
        guild.leaderId = guild.members[memberIndex === 0 ? 1 : 0].userId
      } else {
        this.guilds.delete(guildId)
        return true
      }
    }
    
    guild.members.splice(memberIndex, 1)
    guild.memberCount--
    
    return true
  }
  
  getGuilds(): Guild[] {
    return Array.from(this.guilds.values())
  }
  
  getGuild(id: string): Guild | undefined {
    return this.guilds.get(id)
  }
  
  // Parties
  createParty(leaderId: string, leaderName: string): Party {
    const party: Party = {
      id: `party_${Date.now()}`,
      leaderId,
      members: [{
        userId: leaderId,
        username: leaderName,
        characterLevel: 1,
        hp: 100,
        maxHp: 100,
        isReady: true
      }],
      maxMembers: 4
    }
    
    this.parties.set(party.id, party)
    return party
  }
  
  joinParty(partyId: string, userId: string, username: string, characterLevel: number): { success: boolean; error?: string } {
    const party = this.parties.get(partyId)
    if (!party) return { success: false, error: 'Party not found' }
    if (party.members.length >= party.maxMembers) return { success: false, error: 'Party is full' }
    
    party.members.push({
      userId,
      username,
      characterLevel,
      hp: 100,
      maxHp: 100,
      isReady: false
    })
    
    return { success: true }
  }
  
  // Leaderboards
  getLeaderboard(type: 'level' | 'guild' | 'pvp' | 'collection', zoneId?: string, limit: number = 50): LeaderboardEntry[] {
    // Simulated leaderboard
    const entries: LeaderboardEntry[] = Array.from({ length: limit }, (_, i) => ({
      rank: i + 1,
      userId: `user_${i + 1}`,
      username: `Player${i + 1}`,
      characterLevel: Math.max(1, 50 - i * 2 + Math.floor(Math.random() * 5)),
      score: Math.floor(Math.random() * 100000),
      zone: zoneId || 'zone_pho_co'
    }))
    
    return entries.sort((a, b) => {
      if (type === 'level') return b.characterLevel - a.characterLevel
      return b.score - a.score
    }).map((entry, i) => ({ ...entry, rank: i + 1 }))
  }
  
  // Stats
  getOnlineCount(): number {
    let count = 0
    this.friends.forEach(friendMap => {
      friendMap.forEach(friend => {
        if (friend.status === 'online') count++
      })
    })
    return count
  }
}
