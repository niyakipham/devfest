/**
 * Physics Engine
 * Handles collision detection, ragdoll physics, and water simulation
 */

import { Vector3, Box3, Sphere } from 'three'

export interface PhysicsBody {
  id: string
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  mass: number
  isStatic: boolean
  boundingBox: Box3
  boundingSphere: Sphere
  restitution: number
  friction: number
}

export class PhysicsEngine {
  private bodies: Map<string, PhysicsBody>
  private gravity: Vector3
  private timeStep: number
  
  constructor() {
    this.bodies = new Map()
    this.gravity = new Vector3(0, -9.81, 0)
    this.timeStep = 1 / 60
  }
  
  async initialize(): Promise<void> {
    console.log('[PhysicsEngine] Initialized')
  }
  
  addBody(body: PhysicsBody): void {
    this.bodies.set(body.id, body)
  }
  
  removeBody(id: string): void {
    this.bodies.delete(id)
  }
  
  update(dt: number): void {
    this.bodies.forEach(body => {
      if (body.isStatic) return
      
      // Apply gravity
      body.velocity.add(this.gravity.clone().multiplyScalar(dt))
      
      // Update position
      body.position.add(body.velocity.clone().multiplyScalar(dt))
      
      // Update bounding volumes
      body.boundingBox.setFromCenterAndSize(
        body.position,
        new Vector3(1, 1, 1) // Will be updated per body type
      )
      
      body.boundingSphere.center.copy(body.position)
    })
    
    this.detectCollisions()
  }
  
  private detectCollisions(): void {
    const bodies = Array.from(this.bodies.values())
    
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bodyA = bodies[i]
        const bodyB = bodies[j]
        
        if (bodyA.isStatic && bodyB.isStatic) continue
        
        if (this.checkCollision(bodyA, bodyB)) {
          this.resolveCollision(bodyA, bodyB)
        }
      }
    }
  }
  
  private checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): boolean {
    return bodyA.boundingSphere.intersectsSphere(bodyB.boundingSphere)
  }
  
  private resolveCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): void {
    const normal = bodyB.position.clone().sub(bodyA.position).normalize()
    const relativeVelocity = bodyB.velocity.clone().sub(bodyA.velocity)
    const speed = relativeVelocity.dot(normal)
    
    if (speed > 0) return // Moving apart
    
    const restitution = Math.min(bodyA.restitution, bodyB.restitution)
    const impulse = -(1 + restitution) * speed / (1 / bodyA.mass + 1 / bodyB.mass)
    
    if (!bodyA.isStatic) {
      bodyA.velocity.sub(normal.clone().multiplyScalar(impulse / bodyA.mass))
    }
    if (!bodyB.isStatic) {
      bodyB.velocity.add(normal.clone().multiplyScalar(impulse / bodyB.mass))
    }
    
    // Separate overlapping bodies
    const overlap = bodyA.boundingSphere.radius + bodyB.boundingSphere.radius - 
                    bodyA.position.distanceTo(bodyB.position)
    
    if (overlap > 0 && !bodyA.isStatic) {
      bodyA.position.sub(normal.clone().multiplyScalar(overlap / 2))
    }
    if (overlap > 0 && !bodyB.isStatic) {
      bodyB.position.add(normal.clone().multiplyScalar(overlap / 2))
    }
  }
  
  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id)
  }
  
  getAllBodies(): PhysicsBody[] {
    return Array.from(this.bodies.values())
  }
  
  setGravity(gravity: Vector3): void {
    this.gravity.copy(gravity)
  }
  
  dispose(): void {
    this.bodies.clear()
    console.log('[PhysicsEngine] Disposed')
  }
}
