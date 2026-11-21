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
  sky: '#2E4A50',
  fog: '#33514F',
  sun: '#9FB6C9',
  sunIntensity: 0.35,
  ambient: 0.42,
  night: true,
}

export const atmosphereAt = (minutes: number): Atmosphere => {
  const h = ((minutes % 1440) + 1440) % 1440 / 60

  if (h < 4.5 || h >= 19.5) return NIGHT
  if (h < 6.5) {
    return {
      sky: '#C9DCCB',
      fog: '#D7E4CE',
      sun: '#F3C08A',
      sunIntensity: 1.05,
      ambient: 0.55,
      night: false,
    }
  }
  if (h < 10) {
    return {
      sky: '#D6E8D8',
      fog: '#DCE9D4',
      sun: '#FFE0AE',
      sunIntensity: 1.75,
      ambient: 0.62,
      night: false,
    }
  }
  if (h < 16) {
    return {
      sky: '#DDEEDD',
      fog: '#D8E8D7',
      sun: '#FFF4D6',
      sunIntensity: 1.9,
      ambient: 0.68,
      night: false,
    }
  }
  if (h < 18.5) {
    return {
      sky: '#EBD3B7',
      fog: '#E4CDB4',
      sun: '#F2A76E',
      sunIntensity: 1.35,
      ambient: 0.6,
      night: false,
    }
  }
  return {
    sky: '#8FA6A4',
    fog: '#8FA6A4',
    sun: '#E39A75',
    sunIntensity: 0.7,
    ambient: 0.5,
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
