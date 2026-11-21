/**
 * Particle System
 * Visual effects: rain, sparkles, capture effects, damage numbers
 */

import * as THREE from 'three'

export interface ParticleConfig {
  count: number
  color: number
  size: number
  speed: THREE.Vector3
  lifetime: number
  gravity?: boolean
}

export class ParticleSystem {
  private particles: Map<string, THREE.Points>
  private particleData: Map<string, { velocities: THREE.Vector3[]; lifetimes: number[]; maxLifetimes: number[] }>
  
  constructor() {
    this.particles = new Map()
    this.particleData = new Map()
  }
  
  createRain(count: number = 500): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      color: 0x81D4FA,
      size: 0.2,
      transparent: true,
      opacity: 0.6
    })
    
    const points = new THREE.Points(geometry, material)
    points.name = 'rain'
    return points
  }
  
  createSparkles(position: THREE.Vector3, color: number, count: number = 30): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities: THREE.Vector3[] = []
    const lifetimes: number[] = []
    const maxLifetimes: number[] = []
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x
      positions[i * 3 + 1] = position.y
      positions[i * 3 + 2] = position.z
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 5
      ))
      
      const lifetime = 1 + Math.random()
      lifetimes.push(lifetime)
      maxLifetimes.push(lifetime)
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const material = new THREE.PointsMaterial({
      color,
      size: 0.3,
      transparent: true,
      opacity: 1
    })
    
    const points = new THREE.Points(geometry, material)
    const id = `sparkle_${Date.now()}`
    this.particles.set(id, points)
    this.particleData.set(id, { velocities, lifetimes, maxLifetimes })
    
    return points
  }
  
  createCaptureEffect(position: THREE.Vector3): THREE.Points {
    return this.createSparkles(position, 0xFFC107, 50)
  }
  
  createLevelUpEffect(position: THREE.Vector3): THREE.Points {
    return this.createSparkles(position, 0x4CAF50, 40)
  }
  
  createDamageNumber(position: THREE.Vector3, damage: number): { element: HTMLDivElement; lifetime: number } {
    const el = document.createElement('div')
    el.textContent = `-${damage}`
    el.style.cssText = `
      position: absolute;
      color: #F44336;
      font-family: 'Nunito', sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
      text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: damageFloat 1s ease-out forwards;
    `
    return { element: el, lifetime: 1 }
  }
  
  update(dt: number): void {
    this.particleData.forEach((data, id) => {
      const points = this.particles.get(id)
      if (!points) return
      
      const positions = points.geometry.attributes.position as THREE.BufferAttribute
      let allDead = true
      
      for (let i = 0; i < data.lifetimes.length; i++) {
        data.lifetimes[i] -= dt
        
        if (data.lifetimes[i] > 0) {
          allDead = false
          
          const vel = data.velocities[i]
          positions.setX(i, positions.getX(i) + vel.x * dt)
          positions.setY(i, positions.getY(i) + vel.y * dt)
          positions.setZ(i, positions.getZ(i) + vel.z * dt)
          
          // Gravity
          vel.y -= 9.8 * dt
          
          // Fade
          const progress = 1 - data.lifetimes[i] / data.maxLifetimes[i]
        }
      }
      
      positions.needsUpdate = true
      
      if (allDead) {
        points.geometry.dispose()
        ;(points.material as THREE.Material).dispose()
        this.particles.delete(id)
        this.particleData.delete(id)
      }
    })
  }
  
  updateRain(rain: THREE.Points, dt: number): void {
    const positions = rain.geometry.attributes.position as THREE.BufferAttribute
    
    for (let i = 0; i < positions.count; i++) {
      let y = positions.getY(i)
      y -= 20 * dt
      
      if (y < 0) {
        y = 50
        positions.setX(i, (Math.random() - 0.5) * 100)
        positions.setZ(i, (Math.random() - 0.5) * 100)
      }
      
      positions.setY(i, y)
    }
    
    positions.needsUpdate = true
  }
  
  getParticles(): Map<string, THREE.Points> {
    return this.particles
  }
}
