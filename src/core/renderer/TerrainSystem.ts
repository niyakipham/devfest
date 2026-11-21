/**
 * Terrain System
 * Chunk-based streaming for 20km² Hà Nội map
 * 200x200 chunks of 100x100m each
 */

import * as THREE from 'three'

export interface Chunk {
  x: number
  z: number
  mesh: THREE.Mesh
  loaded: boolean
  type: 'urban' | 'park' | 'water' | 'street' | 'river'
}

export class TerrainSystem {
  private chunks: Map<string, Chunk>
  private readonly CHUNK_SIZE = 100
  private readonly MAP_WIDTH = 200
  private readonly MAP_DEPTH = 200
  private readonly LOAD_RADIUS = 6
  private readonly UNLOAD_RADIUS = 9
  
  private terrainMaterials: Map<string, THREE.MeshToonMaterial>
  
  constructor() {
    this.chunks = new Map()
    this.terrainMaterials = new Map()
    this.initializeMaterials()
  }
  
  private initializeMaterials(): void {
    // Grass (parks, Hồ Tây area)
    this.terrainMaterials.set('park', new THREE.MeshToonMaterial({
      color: 0x4CAF50
    }))
    
    // Urban (Phố Cổ, buildings)
    this.terrainMaterials.set('urban', new THREE.MeshToonMaterial({
      color: 0x9E9E9E
    }))
    
    // Street/road
    this.terrainMaterials.set('street', new THREE.MeshToonMaterial({
      color: 0x616161
    }))
    
    // Water (Hồ Gươm, Hồ Tây, sông Hồng)
    this.terrainMaterials.set('water', new THREE.MeshToonMaterial({
      color: 0x2196F3,
      transparent: true,
      opacity: 0.85
    }))
    
    // River (sông Hồng)
    this.terrainMaterials.set('river', new THREE.MeshToonMaterial({
      color: 0x1565C0,
      transparent: true,
      opacity: 0.9
    }))
  }
  
  getChunkKey(x: number, z: number): string {
    return `${x}_${z}`
  }
  
  worldToChunk(wx: number, wz: number): { x: number; z: number } {
    return {
      x: Math.floor((wx + (this.MAP_WIDTH * this.CHUNK_SIZE) / 2) / this.CHUNK_SIZE),
      z: Math.floor((wz + (this.MAP_DEPTH * this.CHUNK_SIZE) / 2) / this.CHUNK_SIZE)
    }
  }
  
  chunkToWorld(cx: number, cz: number): { x: number; z: number } {
    return {
      x: (cx - this.MAP_WIDTH / 2) * this.CHUNK_SIZE + this.CHUNK_SIZE / 2,
      z: (cz - this.MAP_DEPTH / 2) * this.CHUNK_SIZE + this.CHUNK_SIZE / 2
    }
  }
  
  getChunkType(cx: number, cz: number): Chunk['type'] {
    const world = this.chunkToWorld(cx, cz)
    const wx = world.x
    const wz = world.z
    
    // Hồ Tây area (approximate)
    if (wx > 500 && wx < 1500 && wz > -200 && wz < 200) {
      return 'water'
    }
    
    // Sông Hồng (east side)
    if (wx > 1500 && wx < 2500 && wz > -1000 && wz < 1000) {
      return 'river'
    }
    
    // Phố Cổ (center)
    if (Math.abs(wx) < 500 && Math.abs(wz) < 500) {
      // Streets grid pattern
      const streetGrid = 100
      const onStreet = (Math.abs(wx % streetGrid) < 20) || (Math.abs(wz % streetGrid) < 20)
      return onStreet ? 'street' : 'urban'
    }
    
    // Parks and green areas
    if ((wx > -1500 && wx < -500 && wz > 500 && wz < 1500) || 
        (wx > 500 && wx < 1500 && wz > 500 && wz < 1500)) {
      return 'park'
    }
    
    return 'urban'
  }
  
  createChunkMesh(cx: number, cz: number, type: Chunk['type']): THREE.Mesh {
    const world = this.chunkToWorld(cx, cz)
    const size = this.CHUNK_SIZE
    
    const geometry = new THREE.PlaneGeometry(size, size, 4, 4)
    
    // Add slight height variation for terrain
    const positions = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const height = this.getTerrainHeight(world.x + x, world.z + y, type)
      positions.setZ(i, height)
    }
    geometry.computeVertexNormals()
    
    const material = this.terrainMaterials.get(type) || this.terrainMaterials.get('urban')!
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(world.x, 0, world.z)
    mesh.receiveShadow = true
    
    return mesh
  }
  
  private getTerrainHeight(wx: number, wz: number, type: Chunk['type']): number {
    if (type === 'water' || type === 'river') return -0.5
    if (type === 'park') return Math.sin(wx * 0.01) * Math.cos(wz * 0.01) * 0.5
    if (type === 'urban') return 0
    return 0
  }
  
  updateLoading(playerX: number, playerZ: number, scene: THREE.Scene): void {
    const playerChunk = this.worldToChunk(playerX, playerZ)
    
    const keysToLoad: string[] = []
    const keysToUnload: string[] = []
    
    for (let dx = -this.UNLOAD_RADIUS; dx <= this.UNLOAD_RADIUS; dx++) {
      for (let dz = -this.UNLOAD_RADIUS; dz <= this.UNLOAD_RADIUS; dz++) {
        const cx = playerChunk.x + dx
        const cz = playerChunk.z + dz
        const key = this.getChunkKey(cx, cz)
        const distance = Math.sqrt(dx * dx + dz * dz)
        
        if (distance <= this.LOAD_RADIUS) {
          if (!this.chunks.has(key)) {
            keysToLoad.push(key)
          }
        } else if (distance > this.UNLOAD_RADIUS && this.chunks.has(key)) {
          keysToUnload.push(key)
        }
      }
    }
    
    // Load new chunks
    keysToLoad.forEach(key => {
      const [cx, cz] = key.split('_').map(Number)
      const type = this.getChunkType(cx, cz)
      const mesh = this.createChunkMesh(cx, cz, type)
      scene.add(mesh)
      
      this.chunks.set(key, {
        x: cx,
        z: cz,
        mesh,
        loaded: true,
        type
      })
    })
    
    // Unload distant chunks
    keysToUnload.forEach(key => {
      const chunk = this.chunks.get(key)
      if (chunk) {
        scene.remove(chunk.mesh)
        chunk.mesh.geometry.dispose()
        this.chunks.delete(key)
      }
    })
  }
  
  getLoadedChunkCount(): number {
    return this.chunks.size
  }
  
  dispose(): void {
    this.chunks.forEach(chunk => {
      chunk.mesh.geometry.dispose()
    })
    this.chunks.clear()
  }
}
