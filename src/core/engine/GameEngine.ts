/**
 * Core Game Engine - Main orchestrator for Hanoi Legends RPG
 * Manages game loop, scene graph, and module coordination
 */

import { Renderer } from './renderer/Renderer'
import { PhysicsEngine } from './physics/PhysicsEngine'
import { AudioManager } from './audio/AudioManager'
import { InputManager } from './input/InputManager'
import { AISystem } from './ai/AISystem'
import { TimeOfDaySystem } from './TimeOfDaySystem'
import { WeatherSystem } from './WeatherSystem'

export interface EngineConfig {
  targetFPS: number
  chunkLoadRadius: number
  chunkUnloadRadius: number
  maxLODDistance: number
}

export class GameEngine {
  private renderer: Renderer
  private physics: PhysicsEngine
  private audio: AudioManager
  private input: InputManager
  private ai: AISystem
  private timeOfDay: TimeOfDaySystem
  private weather: WeatherSystem
  
  private lastTime: number = 0
  private deltaTime: number = 0
  private accumulator: number = 0
  private fixedTimeStep: number = 1 / 60
  
  private isRunning: boolean = false
  private animationFrameId: number | null = null
  
  constructor(config: EngineConfig) {
    this.renderer = new Renderer()
    this.physics = new PhysicsEngine()
    this.audio = new AudioManager()
    this.input = new InputManager()
    this.ai = new AISystem()
    this.timeOfDay = new TimeOfDaySystem()
    this.weather = new WeatherSystem()
    
    console.log('[GameEngine] Initialized with config:', config)
  }
  
  async initialize(): Promise<void> {
    console.log('[GameEngine] Starting initialization...')
    
    await this.renderer.initialize()
    await this.physics.initialize()
    await this.audio.initialize()
    await this.input.initialize()
    await this.ai.initialize()
    await this.timeOfDay.initialize()
    await this.weather.initialize()
    
    console.log('[GameEngine] Initialization complete')
  }
  
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
    
    console.log('[GameEngine] Game loop started')
  }
  
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    console.log('[GameEngine] Game loop stopped')
  }
  
  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return
    
    this.deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this.accumulator += this.deltaTime
    
    // Fixed timestep physics updates
    while (this.accumulator >= this.fixedTimeStep) {
      this.fixedUpdate(this.fixedTimeStep)
      this.accumulator -= this.fixedTimeStep
    }
    
    // Variable timestep render updates
    this.update(this.deltaTime)
    this.render()
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }
  
  private fixedUpdate(dt: number): void {
    this.physics.update(dt)
    this.ai.update(dt)
  }
  
  private update(dt: number): void {
    this.timeOfDay.update(dt)
    this.weather.update(dt)
    this.input.update(dt)
  }
  
  private render(): void {
    this.renderer.render()
  }
  
  // Public API for modules
  getRenderer(): Renderer { return this.renderer }
  getPhysics(): PhysicsEngine { return this.physics }
  getAudio(): AudioManager { return this.audio }
  getInput(): InputManager { return this.input }
  getAI(): AISystem { return this.ai }
  getTimeOfDay(): TimeOfDaySystem { return this.timeOfDay }
  getWeather(): WeatherSystem { return this.weather }
  
  isEngineRunning(): boolean { return this.isRunning }
  getDeltaTime(): number { return this.deltaTime }
}
