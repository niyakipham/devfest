/**
 * Audio Manager
 * Handles background music, sound effects, and spatial audio
 */

export interface AudioConfig {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  voiceVolume: number
}

export class AudioManager {
  private audioContext: AudioContext | null
  private masterGain: GainNode | null
  private musicGain: GainNode | null
  private sfxGain: GainNode | null
  private voiceGain: GainNode | null
  
  private currentMusic: AudioBufferSourceNode | null
  private config: AudioConfig
  
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.musicGain = null
    this.sfxGain = null
    this.voiceGain = null
    this.currentMusic = null
    
    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      voiceVolume: 0.9
    }
  }
  
  async initialize(): Promise<void> {
    this.audioContext = new AudioContext()
    
    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)
    
    this.musicGain = this.audioContext.createGain()
    this.musicGain.connect(this.masterGain)
    
    this.sfxGain = this.audioContext.createGain()
    this.sfxGain.connect(this.masterGain)
    
    this.voiceGain = this.audioContext.createGain()
    this.voiceGain.connect(this.masterGain)
    
    this.updateVolumes()
    
    console.log('[AudioManager] Initialized')
  }
  
  async loadMusic(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized')
    
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }
  
  async loadSFX(url: string): Promise<AudioBuffer> {
    return this.loadMusic(url) // Same process for SFX
  }
  
  playMusic(buffer: AudioBuffer, loop: boolean = true): void {
    if (!this.audioContext) return
    
    this.stopMusic()
    
    this.currentMusic = this.audioContext.createBufferSource()
    this.currentMusic.buffer = buffer
    this.currentMusic.loop = loop
    this.currentMusic.connect(this.musicGain!)
    this.currentMusic.start()
  }
  
  playSFX(buffer: AudioBuffer, position?: { x: number; y: number; z: number }): void {
    if (!this.audioContext) return
    
    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    
    if (position) {
      const panner = this.audioContext.createPanner()
      panner.positionX.value = position.x
      panner.positionY.value = position.y
      panner.positionZ.value = position.z
      source.connect(panner)
      panner.connect(this.sfxGain!)
    } else {
      source.connect(this.sfxGain!)
    }
    
    source.start()
  }
  
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic.disconnect()
      this.currentMusic = null
    }
  }
  
  updateVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.voiceGain) return
    
    this.masterGain.gain.value = this.config.masterVolume
    this.musicGain.gain.value = this.config.musicVolume
    this.sfxGain.gain.value = this.config.sfxVolume
    this.voiceGain.gain.value = this.config.voiceVolume
  }
  
  setConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config }
    this.updateVolumes()
  }
  
  getConfig(): AudioConfig {
    return this.config
  }
  
  dispose(): void {
    this.stopMusic()
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    console.log('[AudioManager] Disposed')
  }
}
