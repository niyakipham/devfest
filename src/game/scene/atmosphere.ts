/** Time-of-day palette. Keeps the painterly look consistent across screens. */

export interface Atmosphere {
  sky: string
  fog: string
  sun: string
  sunIntensity: number
  ambient: number
  night: boolean
}

const NIGHT: Atmosphere = {
  sky: '#24425A',
  fog: '#2C4E5E',
  sun: '#A8C2DA',
  sunIntensity: 0.4,
  ambient: 0.48,
  night: true,
}

export const atmosphereAt = (minutes: number): Atmosphere => {
  const h = ((minutes % 1440) + 1440) % 1440 / 60

  if (h < 4.5 || h >= 19.5) return NIGHT
  if (h < 6.5) {
    return {
      sky: '#CDEEF3',
      fog: '#DCEEEC',
      sun: '#FFD9A0',
      sunIntensity: 1.4,
      ambient: 0.62,
      night: false,
    }
  }
  if (h < 10) {
    return {
      sky: '#C6EBF3',
      fog: '#D6EEEC',
      sun: '#FFEBBF',
      sunIntensity: 1.95,
      ambient: 0.68,
      night: false,
    }
  }
  if (h < 16) {
    return {
      sky: '#BFE9F5',
      fog: '#CFEAF2',
      sun: '#FFF7DF',
      sunIntensity: 2.05,
      ambient: 0.72,
      night: false,
    }
  }
  if (h < 18.5) {
    return {
      sky: '#F6D3B0',
      fog: '#EBCFAF',
      sun: '#F7A96E',
      sunIntensity: 1.45,
      ambient: 0.64,
      night: false,
    }
  }
  return {
    sky: '#9FBFC4',
    fog: '#9FBFC4',
    sun: '#E9A377',
    sunIntensity: 0.8,
    ambient: 0.55,
    night: false,
  }
}

export const formatClock = (minutes: number): string => {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export const dayLabel = (day: number, season: string): string => {
  const names: Record<string, string> = { XUAN: 'Xuân', HA: 'Hạ', THU: 'Thu', DONG: 'Đông' }
  return `Ngày ${day} · ${names[season] ?? season}`
}
