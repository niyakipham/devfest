/**
 * Weather System
 * Dynamic weather: sunny, rain, fog (typical Hanoi weather)
 */

export enum WeatherType {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAIN = 'RAIN',
  HEAVY_RAIN = 'HEAVY_RAIN',
  FOG = 'FOG',
  STORM = 'STORM'
}

export interface WeatherState {
  type: WeatherType
  intensity: number // 0-1
  windSpeed: number
  windDirection: number
  temperature: number
  humidity: number
}

export class WeatherSystem {
  private currentWeather: WeatherState
  private transitionProgress: number
  private targetWeather: WeatherState | null
  
  constructor() {
    this.currentWeather = {
      type: WeatherType.SUNNY,
      intensity: 1.0,
      windSpeed: 5,
      windDirection: 0,
      temperature: 28,
      humidity: 70
    }
    
    this.transitionProgress = 0
    this.targetWeather = null
  }
  
  async initialize(): Promise<void> {
    console.log('[WeatherSystem] Initialized, starting with sunny weather')
  }
  
  update(dt: number): void {
    if (this.targetWeather && this.transitionProgress < 1) {
      this.transitionProgress += dt * 0.1 // Transition over 10 seconds
      this.lerpWeather(this.transitionProgress)
    }
    
    // Random weather changes
    if (Math.random() < 0.001) { // Small chance each frame
      this.randomWeatherChange()
    }
  }
  
  setWeather(type: WeatherType, intensity: number = 1.0): void {
    this.targetWeather = {
      ...this.getWeatherDefaults(type),
      intensity,
      windSpeed: this.getWindSpeed(type),
      temperature: this.getTemperature(type),
      humidity: this.getHumidity(type)
    }
    this.transitionProgress = 0
  }
  
  private randomWeatherChange(): void {
    const weathers = Object.values(WeatherType)
    const randomWeather = weathers[Math.floor(Math.random() * weathers.length)]
    this.setWeather(randomWeather)
  }
  
  private lerpWeather(progress: number): void {
    if (!this.targetWeather) return
    
    this.currentWeather = {
      type: progress > 0.5 ? this.targetWeather.type : this.currentWeather.type,
      intensity: this.lerp(this.currentWeather.intensity, this.targetWeather.intensity, progress),
      windSpeed: this.lerp(this.currentWeather.windSpeed, this.targetWeather.windSpeed, progress),
      windDirection: this.lerp(this.currentWeather.windDirection, this.targetWeather.windDirection, progress),
      temperature: this.lerp(this.currentWeather.temperature, this.targetWeather.temperature, progress),
      humidity: this.lerp(this.currentWeather.humidity, this.targetWeather.humidity, progress)
    }
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }
  
  private getWeatherDefaults(type: WeatherType): Omit<WeatherState, 'type'> {
    return {
      intensity: 1.0,
      windSpeed: this.getWindSpeed(type),
      windDirection: Math.random() * 360,
      temperature: this.getTemperature(type),
      humidity: this.getHumidity(type)
    }
  }
  
  private getWindSpeed(type: WeatherType): number {
    switch (type) {
      case WeatherType.SUNNY: return 3
      case WeatherType.CLOUDY: return 5
      case WeatherType.RAIN: return 8
      case WeatherType.HEAVY_RAIN: return 12
      case WeatherType.FOG: return 2
      case WeatherType.STORM: return 20
    }
  }
  
  private getTemperature(type: WeatherType): number {
    switch (type) {
      case WeatherType.SUNNY: return 30
      case WeatherType.CLOUDY: return 26
      case WeatherType.RAIN: return 24
      case WeatherType.HEAVY_RAIN: return 22
      case WeatherType.FOG: return 20
      case WeatherType.STORM: return 23
    }
  }
  
  private getHumidity(type: WeatherType): number {
    switch (type) {
      case WeatherType.SUNNY: return 60
      case WeatherType.CLOUDY: return 70
      case WeatherType.RAIN: return 85
      case WeatherType.HEAVY_RAIN: return 95
      case WeatherType.FOG: return 90
      case WeatherType.STORM: return 90
    }
  }
  
  getCurrentWeather(): WeatherState {
    return this.currentWeather
  }
  
  isRaining(): boolean {
    return this.currentWeather.type === WeatherType.RAIN || 
           this.currentWeather.type === WeatherType.HEAVY_RAIN ||
           this.currentWeather.type === WeatherType.STORM
  }
  
  isFoggy(): boolean {
    return this.currentWeather.type === WeatherType.FOG
  }
}
