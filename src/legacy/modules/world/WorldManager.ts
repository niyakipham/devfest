/**
 * World Map System - Hanoi 20km²
 * Zone management, POI system, chunk streaming
 */

export interface Zone {
  id: string
  name: string
  description: string
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  center: { x: number; z: number }
  level: number // Min recommended level
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  discovered: boolean
  unlocked: boolean
  pois: PointOfInterest[]
  fastTravelPoints: FastTravelPoint[]
}

export interface PointOfInterest {
  id: string
  name: string
  type: POIType
  position: { x: number; y: number; z: number }
  description: string
  discovered: boolean
  rewards?: { xp: number; currency: number; items: string[] }
}

export enum POIType {
  LANDMARK = 'LANDMARK',
  SHOP = 'SHOP',
  QUEST_GIVER = 'QUEST_GIVER',
  FAST_TRAVEL = 'FAST_TRAVEL',
  BOSS = 'BOSS',
  COLLECTIBLE = 'COLLECTIBLE',
  NPC = 'NPC'
}

export interface FastTravelPoint {
  id: string
  name: string
  position: { x: number; y: number; z: number }
  type: 'bus_stop' | 'taxi' | 'motorbike' | 'boat'
  unlocked: boolean
  zoneId: string
}

export interface ChunkData {
  id: string
  x: number
  z: number
  loaded: boolean
  entities: string[]
  terrain: 'urban' | 'park' | 'water' | 'mixed'
}

export class WorldManager {
  private zones: Map<string, Zone>
  private chunks: Map<string, ChunkData>
  private playerPosition: { x: number; y: number; z: number }
  
  // 20km² = 200x200 chunks of 100x100m each
  private readonly CHUNK_SIZE = 100
  private readonly MAP_WIDTH = 200
  private readonly MAP_DEPTH = 200
  
  constructor() {
    this.zones = new Map()
    this.chunks = new Map()
    this.playerPosition = { x: 0, y: 0, z: 0 }
  }
  
  async initialize(): Promise<void> {
    this.initializeHanoiMap()
    console.log(`[WorldManager] Initialized 20km² Hanoi map with ${this.zones.size} zones`)
  }
  
  private initializeHanoiMap(): void {
    // MVP Zone 1: Phố Cổ (Old Quarter)
    const phoCo: Zone = {
      id: 'zone_pho_co',
      name: 'Phố Cổ Hà Nội',
      description: '36 phố phường cổ kính, nơi giao thoa giữa quá khứ và hiện tại',
      bounds: { minX: -500, maxX: 500, minZ: -500, maxZ: 500 },
      center: { x: 0, z: 0 },
      level: 1,
      difficulty: 'easy',
      discovered: false,
      unlocked: true,
      pois: [
        {
          id: 'poi_hoan_kiem',
          name: 'Hồ Hoàn Kiếm',
          type: POIType.LANDMARK,
          position: { x: 0, y: 0, z: 0 },
          description: 'Hồ nước linh thiêng giữa lòng Hà Nội, nơi Rùa Thần ngụ trị',
          discovered: false,
          rewards: { xp: 500, currency: 100, items: ['ngoc_rua'] }
        },
        {
          id: 'poi_ngoc_son',
          name: 'Đền Ngọc Sơn',
          type: POIType.LANDMARK,
          position: { x: 20, y: 2, z: 10 },
          description: 'Ngôi đền cổ trên đảo Ngọc, thờ Trần Hưng Đạo và Văn Xương',
          discovered: false
        },
        {
          id: 'poi_cho_dem',
          name: 'Chợ Đêm Phố Cổ',
          type: POIType.SHOP,
          position: { x: -100, y: 0, z: 50 },
          description: 'Chợ đêm sầm uất với đủ loại hàng hóa và ẩm thực',
          discovered: false
        },
        {
          id: 'poi_water_turtle',
          name: 'Rùa Thần',
          type: POIType.BOSS,
          position: { x: 5, y: 0, z: 5 },
          description: 'Linh thú bảo vệ Hồ Gươm - Boss Chapter 3',
          discovered: false,
          rewards: { xp: 2000, currency: 500, items: ['manh_ngoc_1', 'manh_ngoc_2', 'manh_ngoc_3'] }
        }
      ],
      fastTravelPoints: [
        { id: 'ft_benh_vien', name: 'Bến xe Bệnh viện', position: { x: -200, y: 0, z: -200 }, type: 'bus_stop', unlocked: true, zoneId: 'zone_pho_co' },
        { id: 'ft_cau_go', name: 'Bến Cầu Gỗ', position: { x: 100, y: 0, z: 100 }, type: 'boat', unlocked: true, zoneId: 'zone_pho_co' }
      ]
    }
    
    // MVP Zone 2: Hồ Tây & Quảng An
    const hoTay: Zone = {
      id: 'zone_ho_tay',
      name: 'Hồ Tây & Quảng An',
      description: 'Hồ nước ngọt lớn nhất Hà Nội, quanh năm thơ mộng',
      bounds: { minX: 500, maxX: 1500, minZ: -500, maxZ: 500 },
      center: { x: 1000, z: 0 },
      level: 10,
      difficulty: 'medium',
      discovered: false,
      unlocked: false,
      pois: [
        {
          id: 'poi_tran_quoc',
          name: 'Chùa Trấn Quốc',
          type: POIType.LANDMARK,
          position: { x: 700, y: 2, z: 200 },
          description: 'Ngôi chùa cổ nhất Hà Nội, hơn 1500 năm tuổi',
          discovered: false,
          rewards: { xp: 800, currency: 200, items: ['kinh_phat'] }
        },
        {
          id: 'poi_phu_tay_ho',
          name: 'Phủ Tây Hồ',
          type: POIType.LANDMARK,
          position: { x: 1200, y: 3, z: -100 },
          description: 'Nơi thờ Mẫu Liễu Hạnh, một trong Tứ bất tử',
          discovered: false
        }
      ],
      fastTravelPoints: [
        { id: 'ft_quan_ngua', name: 'Bến Quán Ngựa', position: { x: 600, y: 0, z: 0 }, type: 'bus_stop', unlocked: true, zoneId: 'zone_ho_tay' }
      ]
    }
    
    // MVP Zone 3: Khu đô thị mới
    const newUrban: Zone = {
      id: 'zone_new_urban',
      name: 'Khu Đô Thị Mới',
      description: 'Trung tâm thương mại và tài chính hiện đại của Hà Nội',
      bounds: { minX: -1500, maxX: -500, minZ: -1500, maxZ: -500 },
      center: { x: -1000, z: -1000 },
      level: 20,
      difficulty: 'hard',
      discovered: false,
      unlocked: false,
      pois: [
        {
          id: 'poi_landmark72',
          name: 'Landmark 72',
          type: POIType.LANDMARK,
          position: { x: -1000, y: 72, z: -1000 },
          description: 'Tòa nhà cao nhất Việt Nam - thử thách leo tower',
          discovered: false,
          rewards: { xp: 1500, currency: 500, items: ['key_landmark'] }
        },
        {
          id: 'poi_royal_city',
          name: 'Royal City',
          type: POIType.SHOP,
          position: { x: -800, y: 0, z: -1200 },
          description: 'Trung tâm thương mại lớn với nhiều cửa hàng',
          discovered: false
        }
      ],
      fastTravelPoints: [
        { id: 'ft_my_dinh', name: 'Bến Mỹ Đình', position: { x: -1200, y: 0, z: -800 }, type: 'bus_stop', unlocked: true, zoneId: 'zone_new_urban' }
      ]
    }
    
    this.zones.set(phoCo.id, phoCo)
    this.zones.set(hoTay.id, hoTay)
    this.zones.set(newUrban.id, newUrban)
    
    // Initialize chunks
    this.initializeChunks()
  }
  
  private initializeChunks(): void {
    for (let x = 0; x < this.MAP_WIDTH; x++) {
      for (let z = 0; z < this.MAP_DEPTH; z++) {
        const worldX = (x - this.MAP_WIDTH / 2) * this.CHUNK_SIZE
        const worldZ = (z - this.MAP_DEPTH / 2) * this.CHUNK_SIZE
        
        let terrain: ChunkData['terrain'] = 'mixed'
        if (worldX > 500 && worldX < 1500) terrain = 'park'
        if (Math.abs(worldX) < 600 && Math.abs(worldZ) < 600) terrain = 'urban'
        if (worldX > 600 && worldX < 1400 && worldZ > -100 && worldZ < 100) terrain = 'water'
        
        this.chunks.set(`${x}_${z}`, {
          id: `${x}_${z}`,
          x,
          z,
          loaded: false,
          entities: [],
          terrain
        })
      }
    }
  }
  
  getZone(id: string): Zone | undefined {
    return this.zones.get(id)
  }
  
  getAllZones(): Zone[] {
    return Array.from(this.zones.values())
  }
  
  getZoneAtPosition(x: number, z: number): Zone | undefined {
    for (const zone of this.zones.values()) {
      if (x >= zone.bounds.minX && x <= zone.bounds.maxX &&
          z >= zone.bounds.minZ && z <= zone.bounds.maxZ) {
        return zone
      }
    }
    return undefined
  }
  
  discoverPOI(poiId: string): PointOfInterest | null {
    for (const zone of this.zones.values()) {
      const poi = zone.pois.find(p => p.id === poiId)
      if (poi) {
        poi.discovered = true
        return poi
      }
    }
    return null
  }
  
  updatePlayerPosition(x: number, y: number, z: number): void {
    this.playerPosition = { x, y, z }
    this.updateLoadedChunks()
  }
  
  private updateLoadedChunks(): void {
    const playerChunkX = Math.floor((this.playerPosition.x + this.MAP_WIDTH * this.CHUNK_SIZE / 2) / this.CHUNK_SIZE)
    const playerChunkZ = Math.floor((this.playerPosition.z + this.MAP_DEPTH * this.CHUNK_SIZE / 2) / this.CHUNK_SIZE)
    
    const loadRadius = 5
    const unloadRadius = 8
    
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = chunk.x - playerChunkX
      const dz = chunk.z - playerChunkZ
      const distance = Math.sqrt(dx * dx + dz * dz)
      
      if (distance <= loadRadius) {
        chunk.loaded = true
      } else if (distance > unloadRadius) {
        chunk.loaded = false
      }
    }
  }
  
  getPlayerPosition(): { x: number; y: number; z: number } {
    return this.playerPosition
  }
}
