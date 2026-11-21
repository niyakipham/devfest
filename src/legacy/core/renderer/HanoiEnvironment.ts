/**
 * Hà Nội Environment
 * Stylized 3D landmarks and buildings
 */

import * as THREE from 'three'

export class HanoiEnvironment {
  private landmarks: Map<string, THREE.Group>
  
  constructor() {
    this.landmarks = new Map()
  }
  
  // Hồ Gươm with Turtle Tower
  createHoanKiemLake(): THREE.Group {
    const group = new THREE.Group()
    
    // Water surface
    const waterGeo = new THREE.CircleGeometry(80, 32)
    const waterMat = new THREE.MeshToonMaterial({ 
      color: 0x2196F3,
      transparent: true,
      opacity: 0.8
    })
    const water = new THREE.Mesh(waterGeo, waterMat)
    water.rotation.x = -Math.PI / 2
    water.position.y = 0.1
    water.receiveShadow = true
    group.add(water)
    
    // Turtle Tower (Tháp Rùa) - small island in center
    const towerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 2, 8),
      new THREE.MeshToonMaterial({ color: 0x795548 })
    )
    towerBase.position.set(0, 1, 0)
    towerBase.castShadow = true
    group.add(towerBase)
    
    const towerMid = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 4, 3, 8),
      new THREE.MeshToonMaterial({ color: 0x8D6E63 })
    )
    towerMid.position.set(0, 3.5, 0)
    towerMid.castShadow = true
    group.add(towerMid)
    
    const towerTop = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 4, 4),
      new THREE.MeshToonMaterial({ color: 0xFF5722 })
    )
    towerTop.position.set(0, 7, 0)
    towerTop.rotation.y = Math.PI / 4
    towerTop.castShadow = true
    group.add(towerTop)
    
    // Turtle statue
    const turtleBody = new THREE.Mesh(
      new THREE.SphereGeometry(6, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshToonMaterial({ color: 0x4CAF50 })
    )
    turtleBody.position.set(0, 0.5, 25)
    turtleBody.castShadow = true
    group.add(turtleBody)
    
    const turtleHead = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshToonMaterial({ color: 0x388E3C })
    )
    turtleHead.position.set(0, 2, 30)
    group.add(turtleHead)
    
    group.name = 'hoan_kiem_lake'
    return group
  }
  
  // Ngoc Son Temple
  createNgocSonTemple(): THREE.Group {
    const group = new THREE.Group()
    
    // Main building
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 20),
      new THREE.MeshToonMaterial({ color: 0xFFEB3B })
    )
    building.position.y = 4
    building.castShadow = true
    building.receiveShadow = true
    group.add(building)
    
    // Roof (curved Vietnamese style)
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(12, 5, 4),
      new THREE.MeshToonMaterial({ color: 0xC62828 })
    )
    roof.position.y = 10
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)
    
    // Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8)
    const pillarMat = new THREE.MeshToonMaterial({ color: 0xC62828 })
    
    const positions = [
      [-6, 4, -8], [6, 4, -8], [-6, 4, 8], [6, 4, 8]
    ]
    
    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat)
      pillar.position.set(...pos)
      pillar.castShadow = true
      group.add(pillar)
    })
    
    // The Huc Bridge (Cầu Thê Húc - red curved bridge)
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 30),
      new THREE.MeshToonMaterial({ color: 0xC62828 })
    )
    bridge.position.set(0, 0.5, -25)
    bridge.castShadow = true
    group.add(bridge)
    
    // Bridge arches
    for (let i = 0; i < 5; i++) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.3, 8, 8, Math.PI),
        new THREE.MeshToonMaterial({ color: 0xC62828 })
      )
      arch.position.set(0, 0.5, -12 - i * 6)
      arch.rotation.x = Math.PI
      group.add(arch)
    }
    
    group.name = 'ngoc_son_temple'
    group.position.set(20, 0, 10)
    return group
  }
  
  // Phố Cổ buildings
  createOldQuarterBuilding(style: 'tube' | 'french' | 'modern', x: number, z: number): THREE.Group {
    const group = new THREE.Group()
    
    let width: number, height: number, depth: number
    let color: number
    
    switch (style) {
      case 'tube': // Nhà ống
        width = 4 + Math.random() * 2
        height = 8 + Math.random() * 6
        depth = 15 + Math.random() * 5
        color = [0xFFEB3B, 0xFF9800, 0xE91E63, 0x2196F3][Math.floor(Math.random() * 4)]
        break
      case 'french': // Kiến trúc Pháp
        width = 12 + Math.random() * 4
        height = 10 + Math.random() * 5
        depth = 12 + Math.random() * 4
        color = 0xFFF9C4
        break
      case 'modern':
        width = 10 + Math.random() * 5
        height = 15 + Math.random() * 10
        depth = 10 + Math.random() * 5
        color = 0xB0BEC5
        break
    }
    
    // Main building
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshToonMaterial({ color })
    )
    building.position.y = height / 2
    building.castShadow = true
    building.receiveShadow = true
    group.add(building)
    
    // Roof
    const roofColor = style === 'french' ? 0xC62828 : 0x795548
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 3, 4),
      new THREE.MeshToonMaterial({ color: roofColor })
    )
    roof.position.y = height + 1.5
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)
    
    // Windows
    const windowMat = new THREE.MeshToonMaterial({ color: 0x81D4FA })
    const windowRows = Math.floor(height / 2.5)
    const windowCols = Math.floor(width / 2)
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1.5),
          windowMat
        )
        window.position.set(
          -width / 2 + 1.5 + col * 2,
          2 + row * 2.5,
          depth / 2 + 0.01
        )
        group.add(window)
      }
    }
    
    // Door
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 3),
      new THREE.MeshToonMaterial({ color: 0x5D4037 })
    )
    door.position.set(0, 1.5, depth / 2 + 0.02)
    group.add(door)
    
    group.position.set(x, 0, z)
    group.name = `building_${style}_${x}_${z}`
    return group
  }
  
  // Trees (stylized cartoon)
  createTree(x: number, z: number, variant: 'banana' | 'banyan' | 'palm' = 'banyan'): THREE.Group {
    const group = new THREE.Group()
    
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8)
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x5D4037 })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 1.5
    trunk.castShadow = true
    group.add(trunk)
    
    const leafColor = variant === 'banana' ? 0x8BC34A : 
                     variant === 'palm' ? 0x4CAF50 : 0x2E7D32
    
    if (variant === 'banyan') {
      // Multiple leaf clusters
      for (let i = 0; i < 4; i++) {
        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(2 + Math.random(), 8, 8),
          new THREE.MeshToonMaterial({ color: leafColor })
        )
        leaves.position.set(
          (Math.random() - 0.5) * 3,
          4 + Math.random() * 2,
          (Math.random() - 0.5) * 3
        )
        leaves.castShadow = true
        group.add(leaves)
      }
    } else if (variant === 'banana') {
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 4, 6),
        new THREE.MeshToonMaterial({ color: leafColor })
      )
      leaves.position.y = 5
      leaves.castShadow = true
      group.add(leaves)
    } else {
      // Palm
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 4, 4),
          new THREE.MeshToonMaterial({ color: leafColor })
        )
        leaf.position.y = 5
        leaf.rotation.z = Math.PI / 3
        leaf.rotation.y = (i / 6) * Math.PI * 2
        group.add(leaf)
      }
    }
    
    group.position.set(x, 0, z)
    return group
  }
  
  // Street lamp (cột đèn Hà Nội)
  createStreetLamp(x: number, z: number): THREE.Group {
    const group = new THREE.Group()
    
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 4, 8),
      new THREE.MeshToonMaterial({ color: 0x424242 })
    )
    pole.position.y = 2
    group.add(pole)
    
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshToonMaterial({ 
        color: 0xFFEB3B,
        emissive: 0xFFEB3B,
        emissiveIntensity: 0.5
      })
    )
    lamp.position.y = 4.2
    group.add(lamp)
    
    // Light
    const light = new THREE.PointLight(0xFFEB3B, 0.5, 10)
    light.position.y = 4.2
    group.add(light)
    
    group.position.set(x, 0, z)
    return group
  }
  
  // Cyclo (xe xích lô)
  createCyclo(x: number, z: number, rotation: number): THREE.Group {
    const group = new THREE.Group()
    
    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.8, 1),
      new THREE.MeshToonMaterial({ color: 0xFFC107 })
    )
    seat.position.y = 0.6
    group.add(seat)
    
    // Wheels
    const wheelMat = new THREE.MeshToonMaterial({ color: 0x212121 })
    const wheelGeo = new THREE.TorusGeometry(0.4, 0.1, 8, 16)
    
    const wheel1 = new THREE.Mesh(wheelGeo, wheelMat)
    wheel1.position.set(-0.7, 0.4, 0)
    wheel1.rotation.y = Math.PI / 2
    group.add(wheel1)
    
    const wheel2 = new THREE.Mesh(wheelGeo, wheelMat)
    wheel2.position.set(0.7, 0.4, 0)
    wheel2.rotation.y = Math.PI / 2
    group.add(wheel2)
    
    const wheel3 = new THREE.Mesh(wheelGeo, wheelMat)
    wheel3.position.set(0, 0.4, -1.2)
    wheel3.rotation.y = Math.PI / 2
    group.add(wheel3)
    
    group.position.set(x, 0, z)
    group.rotation.y = rotation
    return group
  }
  
  getLandmarks(): Map<string, THREE.Group> {
    return this.landmarks
  }
}
