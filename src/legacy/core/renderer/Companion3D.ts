/**
 * Companion 3D Renderer
 * Stylized companion models with animations
 */

import * as THREE from 'three'
import { Element, CompanionRarity } from '../../modules/companion/CompanionManager'

export interface Companion3DConfig {
  speciesId: string
  element: Element
  rarity: CompanionRarity
  level: number
  isShiny: boolean
}

export class Companion3D {
  private mesh: THREE.Group
  private config: Companion3DConfig
  private bobOffset: number
  private floatSpeed: number
  
  constructor(config: Companion3DConfig) {
    this.config = config
    this.mesh = this.createCompanionMesh()
    this.bobOffset = Math.random() * Math.PI * 2
    this.floatSpeed = 2 + Math.random()
  }
  
  private createCompanionMesh(): THREE.Group {
    const group = new THREE.Group()
    
    const color = this.getElementColor(this.config.element)
    const mainColor = this.config.isShiny ? 0xFFD700 : color
    const rarityScale = this.getRarityScale(this.config.rarity)
    
    // Body
    const bodyGeo = new THREE.SphereGeometry(0.8 * rarityScale, 12, 12)
    const bodyMat = new THREE.MeshToonMaterial({ color: mainColor })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.8
    body.castShadow = true
    group.add(body)
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.5 * rarityScale, 12, 12)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.y = 1.6 * rarityScale
    head.castShadow = true
    group.add(head)
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 })
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.15, 1.7 * rarityScale, 0.4 * rarityScale)
    group.add(leftEye)
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.15, 1.7 * rarityScale, 0.4 * rarityScale)
    group.add(rightEye)
    
    // Element aura (glow effect)
    const auraGeo = new THREE.SphereGeometry(1.2 * rarityScale, 16, 16)
    const auraMat = new THREE.MeshToonMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.2
    })
    const aura = new THREE.Mesh(auraGeo, auraMat)
    aura.position.y = 1 * rarityScale
    aura.name = 'aura'
    group.add(aura)
    
    // Rarity indicator (crown for legendary/mythic)
    if (this.config.rarity === CompanionRarity.LEGENDARY || 
        this.config.rarity === CompanionRarity.MYTHIC) {
      const crownGeo = new THREE.ConeGeometry(0.2, 0.4, 4)
      const crownMat = new THREE.MeshToonMaterial({ color: 0xFFD700 })
      const crown = new THREE.Mesh(crownGeo, crownMat)
      crown.position.y = 2.2 * rarityScale
      crown.rotation.x = Math.PI
      group.add(crown)
    }
    
    // Species-specific features
    this.addSpeciesFeatures(group, this.config.speciesId, rarityScale)
    
    return group
  }
  
  private addSpeciesFeatures(group: THREE.Group, speciesId: string, scale: number): void {
    switch (speciesId) {
      case 'rong_thieng':
        // Dragon horns and tail
        const hornGeo = new THREE.ConeGeometry(0.1, 0.5, 4)
        const hornMat = new THREE.MeshToonMaterial({ color: 0x1565C0 })
        const horn1 = new THREE.Mesh(hornGeo, hornMat)
        horn1.position.set(-0.2, 1.9 * scale, 0)
        horn1.rotation.z = 0.3
        group.add(horn1)
        
        const horn2 = new THREE.Mesh(hornGeo, hornMat)
        horn2.position.set(0.2, 1.9 * scale, 0)
        horn2.rotation.z = -0.3
        group.add(horn2)
        
        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.1, 0.05, 1.5, 8)
        const tail = new THREE.Mesh(tailGeo, new THREE.MeshToonMaterial({ color: 0x2196F3 }))
        tail.position.set(0, 0.5 * scale, -1 * scale)
        tail.rotation.x = Math.PI / 3
        tail.name = 'tail'
        group.add(tail)
        break
        
      case 'rua_than':
        // Shell
        const shellGeo = new THREE.SphereGeometry(0.9 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
        const shellMat = new THREE.MeshToonMaterial({ color: 0x2E7D32 })
        const shell = new THREE.Mesh(shellGeo, shellMat)
        shell.position.y = 0.8 * scale
        shell.scale.y = 0.6
        group.add(shell)
        break
        
      case 'phuong_hoang':
        // Wings
        const wingGeo = new THREE.ConeGeometry(0.6, 1.5, 4)
        const wingMat = new THREE.MeshToonMaterial({ color: 0xFF5722, transparent: true, opacity: 0.8 })
        
        const leftWing = new THREE.Mesh(wingGeo, wingMat)
        leftWing.position.set(-1 * scale, 1 * scale, 0)
        leftWing.rotation.z = Math.PI / 3
        leftWing.name = 'leftWing'
        group.add(leftWing)
        
        const rightWing = new THREE.Mesh(wingGeo, wingMat)
        rightWing.position.set(1 * scale, 1 * scale, 0)
        rightWing.rotation.z = -Math.PI / 3
        rightWing.name = 'rightWing'
        group.add(rightWing)
        break
    }
  }
  
  private getElementColor(element: Element): number {
    switch (element) {
      case Element.KIM: return 0xB0BEC5
      case Element.MOC: return 0x4CAF50
      case Element.THUY: return 0x2196F3
      case Element.HOA: return 0xFF5722
      case Element.THO: return 0x8D6E63
    }
  }
  
  private getRarityScale(rarity: CompanionRarity): number {
    switch (rarity) {
      case CompanionRarity.COMMON: return 1.0
      case CompanionRarity.RARE: return 1.1
      case CompanionRarity.EPIC: return 1.2
      case CompanionRarity.LEGENDARY: return 1.4
      case CompanionRarity.MYTHIC: return 1.6
    }
  }
  
  update(dt: number, time: number): void {
    // Bobbing animation
    this.mesh.position.y = Math.sin(time * this.floatSpeed + this.bobOffset) * 0.2
    
    // Aura rotation
    const aura = this.mesh.getObjectByName('aura') as THREE.Mesh
    if (aura) {
      aura.rotation.y += dt * 2
      aura.scale.setScalar(1 + Math.sin(time * 3) * 0.1)
    }
    
    // Species-specific animations
    const tail = this.mesh.getObjectByName('tail') as THREE.Mesh
    if (tail) {
      tail.rotation.z = Math.sin(time * 2) * 0.3
    }
    
    const leftWing = this.mesh.getObjectByName('leftWing') as THREE.Mesh
    const rightWing = this.mesh.getObjectByName('rightWing') as THREE.Mesh
    if (leftWing && rightWing) {
      leftWing.rotation.z = Math.PI / 3 + Math.sin(time * 4) * 0.3
      rightWing.rotation.z = -Math.PI / 3 - Math.sin(time * 4) * 0.3
    }
  }
  
  getMesh(): THREE.Group {
    return this.mesh
  }
  
  playCaptureAnimation(): void {
    // Animation when captured
    const mesh = this.mesh
    let startTime = performance.now()
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      if (elapsed > 1) return
      
      mesh.scale.setScalar(1 - elapsed)
      mesh.rotation.y += elapsed * 10
      requestAnimationFrame(animate)
    }
    
    animate()
  }
}
