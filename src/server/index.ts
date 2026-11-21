/**
 * Server: Complete API with all endpoints
 * REST + WebSocket for Hanoi Legends RPG
 */

import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import { z } from 'zod'

const app = express()
const httpServer = createServer(app)

const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
})

app.use(cors())
app.use(express.json())

// ============ IN-MEMORY DATA STORES (simulating DB) ============

const users = new Map<string, any>()
const characters = new Map<string, any>()
const companions = new Map<string, any>()
const quests = new Map<string, any>()
const guilds = new Map<string, any>()
const marketplace = new Map<string, any>()
const chatMessages: any[] = []
const gachaBanners = new Map<string, any>()
const battlePassSeasons = new Map<string, any>()
const factions = new Map<string, any>()

// ============ INITIALIZE DATA ============

function initializeData() {
  // Factions
  const factionData = [
    { id: 'faction_pho_co', name: 'Hội Phố Cổ', description: 'Bảo tồn văn hóa 36 phố phường', color: '#FF5722', icon: '🏛️', thresholds: [{name: 'Stranger', rep: 0}, {name: 'Friend', rep: 100}, {name: 'Ally', rep: 500}, {name: 'Champion', rep: 1000}, {name: 'Legend', rep: 5000}] },
    { id: 'faction_foodie', name: 'Dân Chơi Hệ Ẩm Thực', description: 'Tinh hoa ẩm thực Hà Thành', color: '#FF9800', icon: '🍜', thresholds: [{name: 'Stranger', rep: 0}, {name: 'Foodie', rep: 100}, {name: 'Gourmand', rep: 500}, {name: 'Chef', rep: 1000}, {name: 'Master Chef', rep: 5000}] },
    { id: 'faction_tech', name: 'Hội Công Nghệ', description: 'Startup community Hà Nội', color: '#2196F3', icon: '💻', thresholds: [{name: 'Stranger', rep: 0}, {name: 'Coder', rep: 100}, {name: 'Developer', rep: 500}, {name: 'Engineer', rep: 1000}, {name: 'CTO', rep: 5000}] },
    { id: 'faction_art', name: 'Phường Hát', description: 'Nghệ thuật truyền thống', color: '#9C27B0', icon: '🎭', thresholds: [{name: 'Stranger', rep: 0}, {name: 'Audience', rep: 100}, {name: 'Fan', rep: 500}, {name: 'Artist', rep: 1000}, {name: 'Maestro', rep: 5000}] },
    { id: 'faction_green', name: 'Biệt Đội Xanh', description: 'Bảo vệ môi trường thủ đô', color: '#4CAF50', icon: '🌿', thresholds: [{name: 'Stranger', rep: 0}, {name: 'Supporter', rep: 100}, {name: 'Volunteer', rep: 500}, {name: 'Guardian', rep: 1000}, {name: 'Eco Hero', rep: 5000}] }
  ]
  factionData.forEach(f => factions.set(f.id, f))
  
  // Battle Pass Season
  battlePassSeasons.set('season_1', {
    id: 'season_1',
    name: 'Mùa Xuân - Tết Nguyên Đán',
    theme: 'Tết',
    startDate: new Date('2026-01-01').toISOString(),
    endDate: new Date('2026-04-01').toISOString(),
    isActive: true,
    price: 299000,
    maxLevel: 100,
    freeRewards: Array.from({length: 100}, (_, i) => ({
      tier: i + 1,
      reward: i % 10 === 0 ? {type: 'currency', amount: 500} : {type: 'item', itemId: 'bp_free_' + (i+1)}
    })),
    premiumRewards: Array.from({length: 100}, (_, i) => ({
      tier: i + 1,
      reward: i % 5 === 0 ? {type: 'companion_skin', skinId: 'premium_' + (i+1)} : {type: 'premium_currency', amount: 10}
    }))
  })
  
  // Gacha Banner
  gachaBanners.set('banner_standard', {
    id: 'banner_standard',
    name: 'Summon Linh Thú',
    type: 'STANDARD',
    isActive: true,
    rates: [
      { speciesId: 'mao_mat', rate: 40, rarity: 'COMMON' },
      { speciesId: 'chim_se', rate: 30, rarity: 'COMMON' },
      { speciesId: 'ca_chep', rate: 15, rarity: 'RARE' },
      { speciesId: 'hoang_trung', rate: 10, rarity: 'EPIC' },
      { speciesId: 'rong_thieng', rate: 4, rarity: 'LEGENDARY' },
      { speciesId: 'phuong_hoang', rate: 1, rarity: 'MYTHIC' }
    ],
    pityGuarantee: 90,
    pityEpic: 10
  })
  
  console.log('[Server] Data initialized')
}

// ============ VALIDATION SCHEMAS ============

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6)
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const CreateCharacterSchema = z.object({
  name: z.string().min(2).max(20),
  avatar: z.object({
    skinTone: z.string(),
    hairStyle: z.string(),
    hairColor: z.string(),
    outfit: z.string()
  }),
  startingCompanion: z.string()
})

// ============ MIDDLEWARE ============

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.errors })
    }
    req.validated = result.data
    next()
  }
}

function rateLimit(windowMs: number = 60000, maxRequests: number = 100) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    
    const record = hits.get(ip)
    if (!record || now > record.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs })
    } else {
      record.count++
      if (record.count > maxRequests) {
        return res.status(429).json({ error: 'Too many requests' })
      }
    }
    next()
  }
}

// Apply rate limiting
app.use('/api/', rateLimit(60000, 200))

// ============ AUTH ENDPOINTS ============

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

app.post('/api/auth/register', validate(RegisterSchema), (req: any, res) => {
  const { email, username, password } = req.validated
  
  if (Array.from(users.values()).some(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' })
  }
  
  const user = {
    id: `user_${Date.now()}`,
    email,
    username,
    passwordHash: Buffer.from(password).toString('base64'), // Simplified
    role: 'PLAYER',
    isBanned: false,
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
  
  users.set(user.id, user)
  
  res.status(201).json({ 
    success: true, 
    userId: user.id, 
    token: `jwt_${user.id}_${Date.now()}` 
  })
})

app.post('/api/auth/login', validate(LoginSchema), (req: any, res) => {
  const { email, password } = req.validated
  
  const user = Array.from(users.values()).find(u => u.email === email)
  if (!user) return res.status(404).json({ error: 'User not found' })
  
  if (user.isBanned) return res.status(403).json({ error: 'Account banned', reason: user.banReason })
  
  user.lastLogin = new Date().toISOString()
  
  res.json({ 
    success: true, 
    userId: user.id,
    username: user.username,
    role: user.role,
    token: `jwt_${user.id}_${Date.now()}`
  })
})

// ============ CHARACTER ENDPOINTS ============

app.post('/api/character/create', validate(CreateCharacterSchema), (req: any, res) => {
  const { name, avatar, startingCompanion } = req.validated
  
  const character = {
    id: `char_${Date.now()}`,
    userId: req.body.userId || 'demo_user',
    name,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    zoneId: 'zone_pho_co',
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    avatar,
    stats: { strength: 5, agility: 5, intelligence: 5, charisma: 5, luck: 5 },
    currency: 500,
    premiumCurrency: 50,
    title: 'Novice Explorer',
    loginStreak: 0,
    companions: [startingCompanion],
    createdAt: new Date().toISOString(),
    lastPlayed: new Date().toISOString()
  }
  
  characters.set(character.id, character)
  res.status(201).json({ success: true, character })
})

app.get('/api/character/me', (req, res) => {
  const charId = req.headers['x-character-id'] as string
  const character = characters.get(charId || 'demo')
  
  if (!character) {
    return res.json({
      id: 'char_demo',
      name: 'Player One',
      level: 5,
      xp: 320,
      xpToNextLevel: 500,
      health: 100,
      maxHealth: 100,
      energy: 80,
      maxEnergy: 100,
      zoneId: 'zone_pho_co',
      positionX: 0,
      positionY: 0,
      positionZ: 0,
      currency: 2500,
      premiumCurrency: 50,
      title: 'Phố Cổ Explorer',
      loginStreak: 7,
      stats: { strength: 12, agility: 10, intelligence: 15, charisma: 8, luck: 7 }
    })
  }
  
  res.json(character)
})

app.put('/api/character/me', (req, res) => {
  res.json({ success: true })
})

app.post('/api/character/claim-daily', (req, res) => {
  const streak = Math.floor(Math.random() * 7) + 1
  const rewards = {
    currency: 100 * streak,
    items: [{ itemId: 'daily_box', quantity: 1 }]
  }
  res.json({ success: true, streak, rewards })
})

// ============ WORLD ENDPOINTS ============

app.get('/api/world/zones', (_req, res) => {
  res.json([
    { id: 'zone_pho_co', name: 'Phố Cổ Hà Nội', level: 1, difficulty: 'easy', discovered: false, unlocked: true, poiCount: 12 },
    { id: 'zone_ho_tay', name: 'Hồ Tây & Quảng An', level: 10, difficulty: 'medium', discovered: false, unlocked: true, poiCount: 8 },
    { id: 'zone_new_urban', name: 'Khu Đô Thị Mới', level: 20, difficulty: 'hard', discovered: false, unlocked: false, poiCount: 6 }
  ])
})

app.get('/api/world/zone/:id/pois', (req, res) => {
  res.json([
    { id: 'poi_hoan_kiem', name: 'Hồ Hoàn Kiếm', type: 'landmark', position: { x: 0, y: 0, z: 0 }, discovered: true },
    { id: 'poi_ngoc_son', name: 'Đền Ngọc Sơn', type: 'landmark', position: { x: 20, y: 2, z: 10 }, discovered: true },
    { id: 'poi_cho_dem', name: 'Chợ Đêm', type: 'shop', position: { x: -100, y: 0, z: 50 }, discovered: false },
    { id: 'poi_ru_than', name: 'Rùa Thần', type: 'boss', position: { x: 5, y: 0, z: 5 }, discovered: false, level: 10 }
  ])
})

app.post('/api/world/fast-travel', (req, res) => {
  const { destinationId } = req.body
  const travelCost = 50
  res.json({ success: true, cost: travelCost, destination: destinationId })
})

// ============ COMPANION ENDPOINTS ============

app.get('/api/companions/my', (_req, res) => {
  res.json([
    { id: 'comp_1', speciesId: 'rong_thieng', nickname: 'Rồng Nhỏ', level: 5, xp: 200, bondLevel: 75, evolutionStage: 0, isShiny: false },
    { id: 'comp_2', speciesId: 'mao_mat', nickname: 'Mun', level: 3, xp: 80, bondLevel: 40, evolutionStage: 0, isShiny: false },
    { id: 'comp_3', speciesId: 'chim_lac', nickname: 'Lạc', level: 7, xp: 350, bondLevel: 60, evolutionStage: 1, isShiny: true }
  ])
})

app.get('/api/companions/species', (_req, res) => {
  res.json([
    { id: 'rong_thieng', name: 'Rồng Thiêng', element: 'THUY', rarity: 'LEGENDARY', captureRate: 0.1 },
    { id: 'rua_than', name: 'Rùa Thần', element: 'THUY', rarity: 'MYTHIC', captureRate: 0.05 },
    { id: 'phuong_hoang', name: 'Phượng Hoàng', element: 'HOA', rarity: 'LEGENDARY', captureRate: 0.1 },
    { id: 'mao_mat', name: 'Mèo Mun', element: 'THO', rarity: 'COMMON', captureRate: 0.5 },
    { id: 'chim_lac', name: 'Chim Lạc', element: 'MOC', rarity: 'RARE', captureRate: 0.3 }
  ])
})

app.post('/api/companions/capture', (req, res) => {
  const { companionId, itemTier = 1 } = req.body
  const hpPercent = 0.3 // Simulated
  const baseRate = (1 - hpPercent) * 0.8
  const itemBonus = itemTier * 0.1
  const successRate = Math.min(0.95, baseRate + itemBonus)
  const success = Math.random() < successRate
  
  res.json({ success, rate: Math.round(successRate * 100), companionId })
})

app.post('/api/companions/battle', (req, res) => {
  const { playerCompanionId, enemyCompanionId } = req.body
  
  // Simulate battle
  const playerWins = Math.random() > 0.3
  const xpGained = Math.floor(Math.random() * 100) + 50
  
  res.json({ 
    result: playerWins ? 'win' : 'lose', 
    xpGained,
    itemsDropped: playerWins ? [{ itemId: 'battle_token', quantity: 3 }] : [],
    bondIncreased: playerWins ? 5 : 2
  })
})

app.put('/api/companions/:id/nickname', (req, res) => {
  const { nickname } = req.body
  res.json({ success: true, nickname })
})

// ============ QUEST ENDPOINTS ============

app.get('/api/quests/available', (_req, res) => {
  res.json([
    { id: 'main_ch1_1', title: 'Thức Tỉnh', type: 'MAIN', chapter: 1, levelRequired: 1, rewards: { xp: 200, currency: 100 } },
    { id: 'main_ch2_1', title: 'Bí Mật Phố Cổ', type: 'MAIN', chapter: 2, levelRequired: 5, rewards: { xp: 800, currency: 300 } },
    { id: 'side_food_1', title: 'Thử Thách Ẩm Thực', type: 'SIDE', levelRequired: 3, rewards: { xp: 300, currency: 150 } }
  ])
})

app.get('/api/quests/my', (_req, res) => {
  res.json([
    { id: 'main_ch1_1', title: 'Thức Tỉnh', progress: 33, objectives: [{ desc: 'Gặp Thầy Giáo', done: true }, { desc: 'Chọn linh vật', done: false }] },
    { id: 'daily_capture', title: 'Thợ Săn Linh Thú', progress: 60, resetIn: '12h 30m' }
  ])
})

app.post('/api/quests/:id/accept', (req, res) => {
  res.json({ success: true })
})

app.post('/api/quests/:id/complete', (req, res) => {
  res.json({ success: true, rewards: { xp: 500, currency: 200, items: [] } })
})

// ============ FACTION ENDPOINTS ============

app.get('/api/factions', (_req, res) => {
  res.json(Array.from(factions.values()))
})

app.get('/api/factions/:id/reputation', (req, res) => {
  res.json({ factionId: req.params.id, reputation: 250, title: 'Friend' })
})

// ============ ECONOMY ENDPOINTS ============

app.get('/api/shops/:zoneId', (req, res) => {
  res.json({
    zoneId: req.params.zoneId,
    shopName: 'Cửa Hàng Phố Cổ',
    items: [
      { itemId: 'potion_small', name: 'Thuốc Nhỏ', price: 50, stock: 99 },
      { itemId: 'potion_large', name: 'Thuốc Lớn', price: 200, stock: 20 },
      { itemId: 'companion_food', name: 'Thức Ăn Linh Thú', price: 30, stock: 50 },
      { itemId: 'capture_net_basic', name: 'Lồng Thần Cơ Bản', price: 100, stock: 10 }
    ]
  })
})

app.post('/api/shops/:zoneId/buy', (req, res) => {
  const { itemId, quantity } = req.body
  res.json({ success: true, itemId, quantity, totalCost: 50 * quantity })
})

app.get('/api/crafting/recipes', (_req, res) => {
  res.json([
    { id: 'craft_potion', name: 'Thuốc Hồi Phục Lớn', materials: [{ itemId: 'herb', qty: 3 }, { itemId: 'water', qty: 1 }], craftTime: 30 },
    { id: 'craft_net', name: 'Lồng Thần Tốt', materials: [{ itemId: 'iron', qty: 5 }, { itemId: 'crystal', qty: 2 }], craftTime: 120 }
  ])
})

app.post('/api/crafting/craft', (req, res) => {
  res.json({ success: true, craftedItem: req.body.recipeId, time: 30 })
})

// ============ MARKETPLACE ENDPOINTS ============

app.get('/api/marketplace/listings', (req, res) => {
  res.json([
    { id: 'list_1', sellerName: 'Trader1', itemId: 'rare_sword', itemName: 'Kiếm Hiếm', price: 5000, quantity: 1 },
    { id: 'list_2', sellerName: 'Trader2', itemId: 'epic_armor', itemName: 'Giáp Epic', price: 15000, quantity: 1 }
  ])
})

app.post('/api/marketplace/list', (req, res) => {
  res.json({ success: true, listingId: `list_${Date.now()}` })
})

app.post('/api/marketplace/buy/:id', (req, res) => {
  res.json({ success: true, listingId: req.params.id })
})

// ============ GUILD ENDPOINTS ============

app.get('/api/guilds', (_req, res) => {
  res.json([
    { id: 'guild_1', name: 'Hội Rồng Thiêng', memberCount: 15, level: 5, description: 'Guild mạnh nhất Phố Cổ' },
    { id: 'guild_2', name: 'Dân Chơi Hồ Tây', memberCount: 8, level: 3, description: 'Chill và exploration' }
  ])
})

app.post('/api/guilds/create', (req, res) => {
  const { name, description } = req.body
  res.json({ success: true, guildId: `guild_${Date.now()}`, name })
})

app.post('/api/guilds/:id/join', (req, res) => {
  res.json({ success: true })
})

// ============ BATTLE PASS ENDPOINTS ============

app.get('/api/battle-pass/current', (_req, res) => {
  const season = battlePassSeasons.get('season_1')
  res.json({
    season,
    playerProgress: { level: 23, xp: 450, isPremium: false, nextLevelXp: 500 }
  })
})

app.post('/api/battle-pass/claim/:tier', (req, res) => {
  res.json({ success: true, tier: req.params.tier, reward: { type: 'currency', amount: 100 } })
})

app.post('/api/battle-pass/upgrade', (req, res) => {
  res.json({ success: true, price: 299000, currency: 'VND' })
})

// ============ GACHA ENDPOINTS ============

app.get('/api/gacha/banners', (_req, res) => {
  res.json(Array.from(gachaBanners.values()))
})

app.post('/api/gacha/pull', (req, res) => {
  const banner = gachaBanners.get('banner_standard')!
  const rates = banner.rates
  const pityCount = (req.body.pityCount || 0) + 1
  
  let result: any
  const roll = Math.random() * 100
  let cumulative = 0
  
  for (const rate of rates) {
    cumulative += rate.rate
    if (roll <= cumulative || (pityCount >= 90 && rate.rarity === 'LEGENDARY') || (pityCount >= 10 && rate.rarity === 'EPIC')) {
      result = { speciesId: rate.speciesId, rarity: rate.rarity }
      break
    }
  }
  
  if (!result) result = { speciesId: rates[0].speciesId, rarity: rates[0].rarity }
  
  res.json({
    result,
    pityCount: result.rarity === 'LEGENDARY' || result.rarity === 'MYTHIC' ? 0 : pityCount,
    isGuaranteed: pityCount >= 90
  })
})

// ============ SOCIAL ENDPOINTS ============

app.get('/api/friends', (_req, res) => {
  res.json([
    { userId: 'user_2', username: 'LinhThuMaster', status: 'online', characterLevel: 15 },
    { userId: 'user_3', username: 'PhoCoExplorer', status: 'offline', characterLevel: 8 }
  ])
})

app.post('/api/friends/request', (req, res) => {
  res.json({ success: true, friendId: req.body.friendId })
})

app.post('/api/friends/:id/accept', (req, res) => {
  res.json({ success: true })
})

// ============ SEASONAL EVENTS ============

app.get('/api/events/active', (_req, res) => {
  res.json([
    { id: 'event_tet_2026', name: 'Tết Nguyên Đán 2026', description: 'Sự kiện đặc biệt mừng năm mới!', startDate: '2026-01-25', endDate: '2026-02-15', rewards: ['special_companion_tet', 'tet_outfit', '500_premium_currency'] }
  ])
})

// ============ ADMIN ENDPOINTS ============

app.get('/api/admin/dashboard', (_req, res) => {
  res.json({
    stats: {
      dau: 12400,
      mau: 89000,
      revenue: 45000000,
      retention_d1: 42,
      retention_d7: 18,
      retention_d30: 8,
      newUsersToday: 340
    },
    topZones: [
      { zoneId: 'zone_pho_co', activePlayers: 5200 },
      { zoneId: 'zone_ho_tay', activePlayers: 3100 }
    ],
    recentActivity: [
      { type: 'purchase', userId: 'user_1', item: 'battle_pass', amount: 299000, time: Date.now() - 300000 },
      { type: 'level_up', userId: 'user_2', level: 10, time: Date.now() - 600000 }
    ]
  })
})

app.get('/api/admin/players', (req, res) => {
  res.json({
    total: 89000,
    players: Array.from({length: 20}, (_, i) => ({
      id: `user_${i+1}`,
      username: `Player${i+1}`,
      level: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      lastLogin: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      isBanned: false
    }))
  })
})

app.post('/api/admin/players/:id/ban', (req, res) => {
  res.json({ success: true, playerId: req.params.id })
})

app.get('/api/admin/analytics/revenue', (_req, res) => {
  res.json({
    daily: Array.from({length: 30}, (_, i) => ({
      date: new Date(Date.now() - (29-i) * 86400000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000000) + 1000000
    }))
  })
})

// ============ WEBSOCKET HANDLING ============

const playerPositions = new Map<string, { x: number; y: number; z: number; zoneId: string }>()

io.on('connection', (socket) => {
  console.log(`[WS] Connected: ${socket.id}`)
  
  // Player position updates
  socket.on('player:position', (data: { x: number; y: number; z: number; zoneId: string }) => {
    playerPositions.set(socket.id, data)
    
    // Broadcast to nearby players
    socket.to(data.zoneId).emit('player:moved', {
      playerId: socket.id,
      position: { x: data.x, y: data.y, z: data.z }
    })
  })
  
  // Join zone room
  socket.on('zone:join', (zoneId: string) => {
    socket.join(zoneId)
    socket.emit('zone:players', Array.from(playerPositions.entries())
      .filter(([_, data]) => data.zoneId === zoneId)
      .map(([id, data]) => ({ playerId: id, ...data }))
    )
  })
  
  socket.on('zone:leave', (zoneId: string) => {
    socket.leave(zoneId)
  })
  
  // Chat
  socket.on('chat:send', (data: { channel: string; content: string; zoneId?: string; guildId?: string; targetId?: string }) => {
    const message = {
      id: `msg_${Date.now()}`,
      senderId: socket.id,
      senderName: data.senderName || 'Player',
      channel: data.channel,
      content: data.content,
      timestamp: Date.now()
    }
    
    chatMessages.push(message)
    if (chatMessages.length > 100) chatMessages.shift()
    
    switch (data.channel) {
      case 'GLOBAL':
        io.emit('chat:message', message)
        break
      case 'ZONE':
        io.to(data.zoneId!).emit('chat:message', message)
        break
      case 'GUILD':
        io.to(`guild_${data.guildId}`).emit('chat:message', message)
        break
      case 'PRIVATE':
        io.to(data.targetId!).emit('chat:message', message)
        break
    }
  })
  
  // Battle
  socket.on('battle:challenge', (data: { opponentId: string }) => {
    io.to(data.opponentId).emit('battle:challenge_received', {
      challengerId: socket.id,
      challengerName: data.challengerName
    })
  })
  
  socket.on('battle:accept', (data: { opponentId: string }) => {
    const roomName = `battle_${socket.id}_${data.opponentId}`
    socket.join(roomName)
    io.to(data.opponentId).socketsJoin(roomName)
    
    io.to(roomName).emit('battle:start', { roomId: roomName })
  })
  
  socket.on('battle:move', (data: { roomId: string; moveId: string }) => {
    socket.to(data.roomId).emit('battle:opponent_move', data)
  })
  
  // Friend requests
  socket.on('friend:request', (data: { targetId: string }) => {
    io.to(data.targetId).emit('friend:request_received', { fromId: socket.id })
  })
  
  socket.on('disconnect', () => {
    playerPositions.delete(socket.id)
    console.log(`[WS] Disconnected: ${socket.id}`)
  })
})

// ============ START SERVER ============

initializeData()

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔═══════════════════════════════════════════╗`)
  console.log(`║     🐉 HÀ NỘI LEGENDS - API Server       ║`)
  console.log(`╠═══════════════════════════════════════════╣`)
  console.log(`║  Port: ${PORT}                              ║`)
  console.log(`║  REST: http://0.0.0.0:${PORT}/api           ║`)
  console.log(`║  WS:   ws://0.0.0.0:${PORT}                 ║`)
  console.log(`║  Status: ✅ Running                        ║`)
  console.log(`╚═══════════════════════════════════════════╝\n`)
})
