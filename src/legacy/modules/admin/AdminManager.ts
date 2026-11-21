/**
 * Admin/CMS Module
 * Dashboard, player management, analytics, content editor
 */

export interface DashboardStats {
  dau: number
  mau: number
  revenue: number
  retention: { d1: number; d7: number; d30: number }
  newUsersToday: number
  avgSessionMinutes: number
  topZones: { zoneId: string; name: string; players: number }[]
}

export interface PlayerRecord {
  id: string
  username: string
  email: string
  level: number
  zone: string
  createdAt: Date
  lastLogin: Date
  isBanned: boolean
  banReason?: string
  totalPlaytime: number // hours
  currency: number
  premiumCurrency: number
}

export interface ContentItem {
  id: string
  type: 'quest' | 'npc' | 'item' | 'companion' | 'zone' | 'event'
  name: string
  status: 'draft' | 'published' | 'archived'
  lastModified: Date
  modifiedBy: string
}

export interface AdminAction {
  id: string
  adminId: string
  adminName: string
  action: string
  target: string
  details: string
  timestamp: Date
}

export class AdminManager {
  private players: Map<string, PlayerRecord>
  private content: Map<string, ContentItem>
  private actionLog: AdminAction[]
  
  constructor() {
    this.players = new Map()
    this.content = new Map()
    this.actionLog = []
    
    this.initializeDemoData()
  }
  
  private initializeDemoData(): void {
    // Demo players
    for (let i = 1; i <= 50; i++) {
      this.players.set(`user_${i}`, {
        id: `user_${i}`,
        username: `Player${i}`,
        email: `player${i}@hanoilegends.vn`,
        level: Math.floor(Math.random() * 50) + 1,
        zone: ['zone_pho_co', 'zone_ho_tay', 'zone_new_urban'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - Math.random() * 90 * 86400000),
        lastLogin: new Date(Date.now() - Math.random() * 7 * 86400000),
        isBanned: Math.random() < 0.02,
        banReason: Math.random() < 0.02 ? 'Cheating' : undefined,
        totalPlaytime: Math.floor(Math.random() * 200),
        currency: Math.floor(Math.random() * 50000),
        premiumCurrency: Math.floor(Math.random() * 500)
      })
    }
    
    // Demo content
    const contentItems: ContentItem[] = [
      { id: 'quest_main_1', type: 'quest', name: 'Ch.1: Thức Tỉnh', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'quest_main_2', type: 'quest', name: 'Ch.2: Bí Mật Phố Cổ', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'quest_side_1', type: 'quest', name: 'Thử Thách Ẩm Thực', status: 'published', lastModified: new Date(), modifiedBy: 'admin_2' },
      { id: 'npc_thay_giao', type: 'npc', name: 'Thầy Giáo', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'npc_ru_than', type: 'npc', name: 'Rùa Thần', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'item_potion_1', type: 'item', name: 'Thuốc Hồi Phục Nhỏ', status: 'published', lastModified: new Date(), modifiedBy: 'admin_2' },
      { id: 'companion_rong', type: 'companion', name: 'Rồng Thiêng', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'zone_pho_co', type: 'zone', name: 'Phố Cổ Hà Nội', status: 'published', lastModified: new Date(), modifiedBy: 'admin_1' },
      { id: 'event_tet', type: 'event', name: 'Tết 2026', status: 'draft', lastModified: new Date(), modifiedBy: 'admin_1' }
    ]
    
    contentItems.forEach(item => this.content.set(item.id, item))
  }
  
  getDashboardStats(): DashboardStats {
    const totalPlayers = this.players.size
    const onlinePlayers = Array.from(this.players.values()).filter(p => {
      const hoursSinceLogin = (Date.now() - p.lastLogin.getTime()) / 3600000
      return hoursSinceLogin < 24
    }).length
    
    return {
      dau: onlinePlayers,
      mau: Math.floor(totalPlayers * 0.3),
      revenue: 45000000,
      retention: { d1: 42, d7: 18, d30: 8 },
      newUsersToday: Math.floor(Math.random() * 100) + 50,
      avgSessionMinutes: 35,
      topZones: [
        { zoneId: 'zone_pho_co', name: 'Phố Cổ', players: Math.floor(onlinePlayers * 0.5) },
        { zoneId: 'zone_ho_tay', name: 'Hồ Tây', players: Math.floor(onlinePlayers * 0.3) },
        { zoneId: 'zone_new_urban', name: 'Khu Mới', players: Math.floor(onlinePlayers * 0.2) }
      ]
    }
  }
  
  getPlayers(page: number = 1, limit: number = 20, filter?: { search?: string; banned?: boolean }): { players: PlayerRecord[]; total: number; totalPages: number } {
    let filtered = Array.from(this.players.values())
    
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      filtered = filtered.filter(p => p.username.toLowerCase().includes(search) || p.id.includes(search))
    }
    
    if (filter?.banned !== undefined) {
      filtered = filtered.filter(p => p.isBanned === filter.banned)
    }
    
    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    
    return {
      players: filtered.slice(start, start + limit),
      total,
      totalPages
    }
  }
  
  getPlayer(id: string): PlayerRecord | undefined {
    return this.players.get(id)
  }
  
  banPlayer(adminId: string, adminName: string, playerId: string, reason: string): { success: boolean } {
    const player = this.players.get(playerId)
    if (!player) return { success: false }
    
    player.isBanned = true
    player.banReason = reason
    
    this.logAction(adminId, adminName, 'BAN_PLAYER', playerId, reason)
    
    return { success: true }
  }
  
  unbanPlayer(adminId: string, adminName: string, playerId: string): { success: boolean } {
    const player = this.players.get(playerId)
    if (!player) return { success: false }
    
    player.isBanned = false
    player.banReason = undefined
    
    this.logAction(adminId, adminName, 'UNBAN_PLAYER', playerId, 'Unbanned')
    
    return { success: true }
  }
  
  rollbackPlayer(adminId: string, adminName: string, playerId: string, rollbackTo: Date): { success: boolean } {
    const player = this.players.get(playerId)
    if (!player) return { success: false }
    
    // In real implementation, restore from backup
    this.logAction(adminId, adminName, 'ROLLBACK_PLAYER', playerId, `Rolled back to ${rollbackTo.toISOString()}`)
    
    return { success: true }
  }
  
  // Content Management
  getContent(type?: ContentItem['type']): ContentItem[] {
    const items = Array.from(this.content.values())
    return type ? items.filter(i => i.type === type) : items
  }
  
  updateContent(adminId: string, adminName: string, contentId: string, updates: Partial<ContentItem>): { success: boolean } {
    const item = this.content.get(contentId)
    if (!item) return { success: false }
    
    Object.assign(item, updates, { lastModified: new Date(), modifiedBy: adminName })
    this.logAction(adminId, adminName, 'UPDATE_CONTENT', contentId, JSON.stringify(updates))
    
    return { success: true }
  }
  
  createContent(adminId: string, adminName: string, item: Omit<ContentItem, 'id' | 'lastModified' | 'modifiedBy'>): ContentItem {
    const newItem: ContentItem = {
      ...item,
      id: `${item.type}_${Date.now()}`,
      lastModified: new Date(),
      modifiedBy: adminName
    }
    
    this.content.set(newItem.id, newItem)
    this.logAction(adminId, adminName, 'CREATE_CONTENT', newItem.id, item.name)
    
    return newItem
  }
  
  publishContent(adminId: string, adminName: string, contentId: string): { success: boolean } {
    return this.updateContent(adminId, adminName, contentId, { status: 'published' })
  }
  
  // Revenue Analytics
  getRevenueAnalytics(days: number = 30): { date: string; revenue: number; purchases: number }[] {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000000) + 500000,
      purchases: Math.floor(Math.random() * 200) + 20
    }))
  }
  
  getRetentionAnalytics(): { day: number; rate: number }[] {
    return [
      { day: 1, rate: 42 },
      { day: 2, rate: 32 },
      { day: 3, rate: 27 },
      { day: 7, rate: 18 },
      { day: 14, rate: 12 },
      { day: 30, rate: 8 }
    ]
  }
  
  // Action Log
  private logAction(adminId: string, adminName: string, action: string, target: string, details: string): void {
    this.actionLog.push({
      id: `action_${Date.now()}`,
      adminId,
      adminName,
      action,
      target,
      details,
      timestamp: new Date()
    })
    
    if (this.actionLog.length > 1000) {
      this.actionLog.shift()
    }
  }
  
  getActionLog(limit: number = 50): AdminAction[] {
    return this.actionLog.slice(-limit).reverse()
  }
  
  getPlayerCount(): number {
    return this.players.size
  }
  
  getContentCount(): number {
    return this.content.size
  }
}
