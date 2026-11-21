/**
 * Input Manager
 * Handles keyboard, mouse, and touch input
 */

export interface InputState {
  keys: Set<string>
  mousePosition: { x: number; y: number }
  mouseButtons: Set<number>
  touchPoints: Map<number, { x: number; y: number }>
  movement: { x: number; y: number }
  camera: { x: number; y: number }
}

export class InputManager {
  private state: InputState
  
  constructor() {
    this.state = {
      keys: new Set(),
      mousePosition: { x: 0, y: 0 },
      mouseButtons: new Set(),
      touchPoints: new Map(),
      movement: { x: 0, y: 0 },
      camera: { x: 0, y: 0 }
    }
  }
  
  async initialize(): Promise<void> {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('mousedown', this.handleMouseDown)
    window.addEventListener('mouseup', this.handleMouseUp)
    window.addEventListener('touchstart', this.handleTouchStart)
    window.addEventListener('touchmove', this.handleTouchMove)
    window.addEventListener('touchend', this.handleTouchEnd)
    
    console.log('[InputManager] Initialized')
  }
  
  update(_dt: number): void {
    // Update movement vector from keys
    let x = 0
    let y = 0
    
    if (this.state.keys.has('w') || this.state.keys.has('arrowup')) y += 1
    if (this.state.keys.has('s') || this.state.keys.has('arrowdown')) y -= 1
    if (this.state.keys.has('a') || this.state.keys.has('arrowleft')) x -= 1
    if (this.state.keys.has('d') || this.state.keys.has('arrowright')) x += 1
    
    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y)
      x /= length
      y /= length
    }
    
    this.state.movement = { x, y }
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    this.state.keys.add(event.key.toLowerCase())
  }
  
  private handleKeyUp = (event: KeyboardEvent): void => {
    this.state.keys.delete(event.key.toLowerCase())
  }
  
  private handleMouseMove = (event: MouseEvent): void => {
    this.state.mousePosition = { x: event.clientX, y: event.clientY }
  }
  
  private handleMouseDown = (event: MouseEvent): void => {
    this.state.mouseButtons.add(event.button)
  }
  
  private handleMouseUp = (event: MouseEvent): void => {
    this.state.mouseButtons.delete(event.button)
  }
  
  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      this.state.touchPoints.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      })
    }
  }
  
  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i]
      if (this.state.touchPoints.has(touch.identifier)) {
        this.state.touchPoints.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        })
      }
    }
  }
  
  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault()
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      this.state.touchPoints.delete(touch.identifier)
    }
  }
  
  isKeyPressed(key: string): boolean {
    return this.state.keys.has(key.toLowerCase())
  }
  
  isMouseButtonPressed(button: number): boolean {
    return this.state.mouseButtons.has(button)
  }
  
  getMovement(): { x: number; y: number } {
    return this.state.movement
  }
  
  getMousePosition(): { x: number; y: number } {
    return this.state.mousePosition
  }
  
  getTouchPoints(): Map<number, { x: number; y: number }> {
    return this.state.touchPoints
  }
  
  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('mousedown', this.handleMouseDown)
    window.removeEventListener('mouseup', this.handleMouseUp)
    window.removeEventListener('touchstart', this.handleTouchStart)
    window.removeEventListener('touchmove', this.handleTouchMove)
    window.removeEventListener('touchend', this.handleTouchEnd)
    
    console.log('[InputManager] Disposed')
  }
}
