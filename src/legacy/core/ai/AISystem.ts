/**
 * AI System
 * Manages NPC behavior trees, companion AI, and enemy AI
 */

export enum AIState {
  IDLE = 'IDLE',
  PATROLLING = 'PATROLLING',
  CHASING = 'CHASING',
  FLEEING = 'FLEEING',
  ATTACKING = 'ATTACKING',
  INTERACTING = 'INTERACTING'
}

export interface AIAgent {
  id: string
  type: 'npc' | 'companion' | 'enemy'
  state: AIState
  position: { x: number; y: number; z: number }
  targetPosition?: { x: number; y: number; z: number }
  speed: number
  perceptionRange: number
  behaviorTree: BehaviorNode
}

export interface BehaviorNode {
  type: 'sequence' | 'selector' | 'action' | 'condition'
  children?: BehaviorNode[]
  action?: (agent: AIAgent) => boolean
  condition?: (agent: AIAgent) => boolean
}

export class AISystem {
  private agents: Map<string, AIAgent>
  private updateInterval: number
  
  constructor() {
    this.agents = new Map()
    this.updateInterval = 0.1 // Update AI 10 times per second
  }
  
  async initialize(): Promise<void> {
    console.log('[AISystem] Initialized')
  }
  
  addAgent(agent: AIAgent): void {
    this.agents.set(agent.id, agent)
  }
  
  removeAgent(id: string): void {
    this.agents.delete(id)
  }
  
  update(dt: number): void {
    this.agents.forEach(agent => {
      this.executeBehaviorTree(agent)
      this.updateMovement(agent, dt)
    })
  }
  
  private executeBehaviorTree(agent: AIAgent): void {
    if (agent.behaviorTree) {
      this.evaluateNode(agent, agent.behaviorTree)
    }
  }
  
  private evaluateNode(agent: AIAgent, node: BehaviorNode): boolean {
    switch (node.type) {
      case 'sequence':
        return node.children?.every(child => this.evaluateNode(agent, child)) ?? false
      
      case 'selector':
        return node.children?.some(child => this.evaluateNode(agent, child)) ?? false
      
      case 'action':
        return node.action?.(agent) ?? false
      
      case 'condition':
        return node.condition?.(agent) ?? false
      
      default:
        return false
    }
  }
  
  private updateMovement(agent: AIAgent, dt: number): void {
    if (!agent.targetPosition) return
    
    const dx = agent.targetPosition.x - agent.position.x
    const dz = agent.targetPosition.z - agent.position.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    if (distance < 0.1) {
      agent.targetPosition = undefined
      return
    }
    
    const moveX = (dx / distance) * agent.speed * dt
    const moveZ = (dz / distance) * agent.speed * dt
    
    agent.position.x += moveX
    agent.position.z += moveZ
  }
  
  getAgent(id: string): AIAgent | undefined {
    return this.agents.get(id)
  }
  
  getAgentsByType(type: AIAgent['type']): AIAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type)
  }
  
  dispose(): void {
    this.agents.clear()
    console.log('[AISystem] Disposed')
  }
}
