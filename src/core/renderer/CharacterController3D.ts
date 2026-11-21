/**
 * 3D Character Controller
 * Third-person camera, movement, animations
 */

import * as THREE from 'three'

export class CharacterController3D {
  private mesh: THREE.Group
  private camera: THREE.PerspectiveCamera
  private cameraTarget: THREE.Vector3
  private cameraOffset: THREE.Vector3
  
  private moveDirection: THREE.Vector3
  private velocity: THREE.Vector3
  private speed: number
  private runSpeed: number
  
  private rotation: number
  private isMoving: boolean
  private isRunning: boolean
  
  // Animation state
  private walkCycle: number
  private jumpVelocity: number
  private isGrounded: boolean
  
  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera
    this.mesh = this.createCharacterMesh()
    this.cameraTarget = new THREE.Vector3(0, 1, 0)
    this.cameraOffset = new THREE.Vector3(0, 5, 8)
    
    this.moveDirection = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.speed = 5
    this.runSpeed = 10
    
    this.rotation = 0
    this.isMoving = false
    this.isRunning = false
    
    this.walkCycle = 0
    this.jumpVelocity = 0
    this.isGrounded = true
  }
  
  private createCharacterMesh(): THREE.Group {
    const group = new THREE.Group()
    
    // Body (torso)
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8)
    const bodyMat = new THREE.MeshToonMaterial({ color: 0xFF5722 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 1
    body.castShadow = true
    group.add(body)
    
    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 8, 8)
    const headMat = new THREE.MeshToonMaterial({ color: 0xFDBCB4 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 1.7
    head.castShadow = true
    group.add(head)
    
    // Hat (red cap)
    const hatGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.15, 8)
    const hatMat = new THREE.MeshToonMaterial({ color: 0xFF1744 })
    const hat = new THREE.Mesh(hatGeo, hatMat)
    hat.position.y = 2.0
    hat.castShadow = true
    group.add(hat)
    
    // Hat brim
    const brimGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 8)
    const brim = new THREE.Mesh(brimGeo, hatMat)
    brim.position.y = 1.95
    brim.position.z = 0.2
    group.add(brim)
    
    // Backpack (yellow)
    const backpackGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3)
    const backpackMat = new THREE.MeshToonMaterial({ color: 0xFFC107 })
    const backpack = new THREE.Mesh(backpackGeo, backpackMat)
    backpack.position.y = 1.1
    backpack.position.z = -0.3
    backpack.castShadow = true
    group.add(backpack)
    
    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8)
    const legMat = new THREE.MeshToonMaterial({ color: 0x1976D2 })
    
    const leftLeg = new THREE.Mesh(legGeo, legMat)
    leftLeg.position.set(-0.2, 0.3, 0)
    leftLeg.name = 'leftLeg'
    leftLeg.castShadow = true
    group.add(leftLeg)
    
    const rightLeg = new THREE.Mesh(legGeo, legMat)
    rightLeg.position.set(0.2, 0.3, 0)
    rightLeg.name = 'rightLeg'
    rightLeg.castShadow = true
    group.add(rightLeg)
    
    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8)
    const armMat = new THREE.MeshToonMaterial({ color: 0xFF5722 })
    
    const leftArm = new THREE.Mesh(armGeo, armMat)
    leftArm.position.set(-0.5, 1.0, 0)
    leftArm.name = 'leftArm'
    leftArm.castShadow = true
    group.add(leftArm)
    
    const rightArm = new THREE.Mesh(armGeo, armMat)
    rightArm.position.set(0.5, 1.0, 0)
    rightArm.name = 'rightArm'
    rightArm.castShadow = true
    group.add(rightArm)
    
    return group
  }
  
  update(dt: number, input: { x: number; y: number }, isRunning: boolean): void {
    this.isRunning = isRunning
    const currentSpeed = isRunning ? this.runSpeed : this.speed
    
    // Calculate movement direction
    this.moveDirection.set(input.x, 0, input.y)
    this.isMoving = this.moveDirection.lengthSq() > 0.01
    
    if (this.isMoving) {
      this.moveDirection.normalize()
      
      // Apply movement
      this.velocity.x = this.moveDirection.x * currentSpeed
      this.velocity.z = this.moveDirection.z * currentSpeed
      
      // Rotate character to face movement direction
      const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z)
      this.rotation = this.lerpAngle(this.rotation, targetRotation, dt * 10)
      
      // Walk animation
      this.walkCycle += dt * (isRunning ? 12 : 8)
      this.animateWalk()
    } else {
      this.velocity.x *= 0.9
      this.velocity.z *= 0.9
      this.resetAnimation()
    }
    
    // Apply velocity
    this.mesh.position.x += this.velocity.x * dt
    this.mesh.position.z += this.velocity.z * dt
    
    // Apply gravity
    if (!this.isGrounded) {
      this.jumpVelocity -= 20 * dt
      this.mesh.position.y += this.jumpVelocity * dt
      
      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0
        this.isGrounded = true
        this.jumpVelocity = 0
      }
    }
    
    // Update mesh rotation
    this.mesh.rotation.y = this.rotation
    
    // Update camera
    this.updateCamera(dt)
  }
  
  private animateWalk(): void {
    const leftLeg = this.mesh.getObjectByName('leftLeg') as THREE.Mesh
    const rightLeg = this.mesh.getObjectByName('rightLeg') as THREE.Mesh
    const leftArm = this.mesh.getObjectByName('leftArm') as THREE.Mesh
    const rightArm = this.mesh.getObjectByName('rightArm') as THREE.Mesh
    
    if (leftLeg && rightLeg) {
      leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.5
      rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.5
    }
    
    if (leftArm && rightArm) {
      leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.4
      rightArm.rotation.x = Math.sin(this.walkCycle) * 0.4
    }
  }
  
  private resetAnimation(): void {
    const leftLeg = this.mesh.getObjectByName('leftLeg') as THREE.Mesh
    const rightLeg = this.mesh.getObjectByName('rightLeg') as THREE.Mesh
    const leftArm = this.mesh.getObjectByName('leftArm') as THREE.Mesh
    const rightArm = this.mesh.getObjectByName('rightArm') as THREE.Mesh
    
    if (leftLeg) leftLeg.rotation.x *= 0.8
    if (rightLeg) rightLeg.rotation.x *= 0.8
    if (leftArm) leftArm.rotation.x *= 0.8
    if (rightArm) rightArm.rotation.x *= 0.8
  }
  
  private updateCamera(dt: number): void {
    this.cameraTarget.copy(this.mesh.position)
    this.cameraTarget.y += 1.5
    
    const idealPosition = this.cameraTarget.clone().add(this.cameraOffset)
    this.camera.position.lerp(idealPosition, dt * 5)
    this.camera.lookAt(this.cameraTarget)
  }
  
  jump(): void {
    if (this.isGrounded) {
      this.jumpVelocity = 8
      this.isGrounded = false
    }
  }
  
  getMesh(): THREE.Group {
    return this.mesh
  }
  
  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone()
  }
  
  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z)
  }
  
  private lerpAngle(a: number, b: number, t: number): number {
    const diff = b - a
    const wrapped = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI
    return a + wrapped * t
  }
}
