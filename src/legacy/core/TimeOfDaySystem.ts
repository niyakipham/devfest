/**
 * Time of Day System
 * 24h game time = 1h real time
 * Controls lighting, NPC schedules, and dynamic events
 */

export enum TimeOfDay {
  DAWN = 'DAWN',        // 5:00 - 7:00
  MORNING = 'MORNING',  // 7:00 - 11:00
  NOON = 'NOON',        // 11:00 - 13:00
  AFTERNOON = 'AFTERNOON', // 13:00 - 17:00
  EVENING = 'EVENING',  // 17:00 - 20:00
  NIGHT = 'NIGHT',      // 20:00 - 5:00
}

export interface TimeConfig {
  gameTimePerRealSecond: number // How many game seconds pass per real second
  startHour: number
}

export class TimeOfDaySystem {
  private currentGameTime: number // In seconds (0-86400)
  private config: TimeConfig
  
  constructor() {
    this.currentGameTime = 6 * 3600 // Start at 6:00 AM
    this.config = {
      gameTimePerRealSecond: 24, // 24 game seconds per real second = 24h in 1h
      startHour: 6
    }
  }
  
  async initialize(): Promise<void> {
    console.log('[TimeOfDaySystem] Initialized, starting at 6:00 AM')
  }
  
  update(dt: number): void {
    this.currentGameTime += dt * this.config.gameTimePerRealSecond
    
    if (this.currentGameTime >= 86400) {
      this.currentGameTime -= 86400
    }
  }
  
  getCurrentTime(): { hours: number; minutes: number; seconds: number } {
    const totalSeconds = Math.floor(this.currentGameTime)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return { hours, minutes, seconds }
  }
  
  getTimeOfDay(): TimeOfDay {
    const { hours } = this.getCurrentTime()
    
    if (hours >= 5 && hours < 7) return TimeOfDay.DAWN
    if (hours >= 7 && hours < 11) return TimeOfDay.MORNING
    if (hours >= 11 && hours < 13) return TimeOfDay.NOON
    if (hours >= 13 && hours < 17) return TimeOfDay.AFTERNOON
    if (hours >= 17 && hours < 20) return TimeOfDay.EVENING
    return TimeOfDay.NIGHT
  }
  
  getFormattedTime(): string {
    const { hours, minutes } = this.getCurrentTime()
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
  
  setCurrentTime(hours: number, minutes: number): void {
    this.currentGameTime = hours * 3600 + minutes * 60
  }
  
  getConfig(): TimeConfig {
    return this.config
  }
  
  setConfig(config: Partial<TimeConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
