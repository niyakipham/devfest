/**
 * Audio bus (CORE-07).
 *
 * Why this exists at all: the blueprint asks for a Master/Music/SFX/Ambience
 * graph with ducking during dialogue, and for district+hour ambience ("còi xe,
 * tàu, chuông chùa" — the Hanoi signature). Phase 1 shipped no sound at all,
 * which is why 20 minutes of play felt like a screensaver.
 *
 * Why no audio files: a cozy prototype must not ship 12 MB of mp3 that nobody
 * can license-check. Every sound here is synthesised in Web Audio (oscillator +
 * filtered noise), so it is a few kB of code, works offline, and can be tuned by
 * numbers instead of re-recording.
 *
 * Rules:
 *  - the graph is built lazily on the first user gesture (browsers block autoplay)
 *  - `sfx: false` in settings mutes SFX but never the music, and vice versa
 *  - ducking is a single ramp on the music bus, so dialogue never fights ambience
 *  - nothing here is random per frame: ambience is a timed scheduler
 */

export type BusName = 'music' | 'sfx' | 'ambience'

export interface AudioSettings {
  master: number
  music: number
  sfx: number
  ambience: number
}

const DEFAULT_SETTINGS: AudioSettings = { master: 0.8, music: 0.5, sfx: 0.75, ambience: 0.6 }

type Ctor = typeof AudioContext

const getCtor = (): Ctor | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/**
 * A small wrapper so callers never touch the raw context. Created once, then
 * reused; if the context is suspended (autoplay policy) callers can `resume()`.
 */
export class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buses = new Map<BusName, GainNode>()
  private settings: AudioSettings = { ...DEFAULT_SETTINGS }
  private ducked = false

  /** true when the browser gave us a context; false in jsdom / SSR */
  get ready(): boolean {
    return this.ctx !== null
  }

  init(): boolean {
    if (this.ctx) return true
    const Ctor = getCtor()
    if (!Ctor) return false
    try {
      const ctx = new Ctor()
      const master = ctx.createGain()
      master.gain.value = this.settings.master
      master.connect(ctx.destination)

      for (const name of ['music', 'sfx', 'ambience'] as BusName[]) {
        const gain = ctx.createGain()
        gain.gain.value = this.settings[name]
        gain.connect(master)
        this.buses.set(name, gain)
      }

      this.ctx = ctx
      this.master = master
      return true
    } catch {
      return false
    }
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  setSettings(patch: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...patch }
    if (!this.ctx) return
    this.master!.gain.setTargetAtTime(this.settings.master, this.ctx.currentTime, 0.05)
    for (const name of ['music', 'sfx', 'ambience'] as BusName[]) {
      this.buses.get(name)!.gain.setTargetAtTime(patch[name] ?? this.busLevel(name), this.ctx.currentTime, 0.05)
    }
  }

  private busLevel(name: BusName): number {
    return this.settings[name] * (this.ducked && name !== 'sfx' ? 0.25 : 1)
  }

  /** Dialogue ducking: music and ambience drop to 25% while someone is talking. */
  setDuck(on: boolean): void {
    if (this.ducked === on) return
    this.ducked = on
    if (!this.ctx) return
    for (const name of ['music', 'ambience'] as BusName[]) {
      this.buses.get(name)!.gain.setTargetAtTime(this.busLevel(name), this.ctx.currentTime, 0.12)
    }
  }

  /* ------------------------------ voices ------------------------------ */

  /** Short filtered-noise burst — steps, cloth, paper. */
  noise(duration = 0.06, freq = 1800, gain = 0.15, bus: BusName = 'sfx'): void {
    if (!this.init()) return
    const ctx = this.ctx!
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i += 1) {
      // deterministic decay envelope, no Math.random in the audio path
      data[i] = (1 - i / frames) * (i % 2 === 0 ? 1 : -1)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    const env = ctx.createGain()
    env.gain.value = gain
    src.connect(filter).connect(env).connect(this.buses.get(bus)!)
    src.start()
  }

  /**
   * A single pitched note. Vietnamese pentatonic degrees by default: the five
   * notes of a đàn tranh (D E F# A B), so UI blips never sound "western game-y".
   */
  tone(
    semitonesFromD4: number,
    duration = 0.18,
    gain = 0.12,
    bus: BusName = 'sfx',
    type: OscillatorType = 'sine',
  ): void {
    if (!this.init()) return
    const ctx = this.ctx!
    const base = 293.66 // D4
    const freq = base * Math.pow(2, semitonesFromD4 / 12)
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, ctx.currentTime)
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(env).connect(this.buses.get(bus)!)
    osc.start()
    osc.stop(ctx.currentTime + duration + 0.02)
  }

  /* ----------------------------- cues ----------------------------- */

  /** The five named sounds the game actually uses. */
  cue(name: 'step' | 'confirm' | 'coin' | 'perfect' | 'page'): void {
    switch (name) {
      case 'step':
        this.noise(0.045, 900, 0.05)
        return
      case 'confirm':
        this.tone(7, 0.12, 0.1)
        return
      case 'coin':
        this.tone(12, 0.1, 0.1)
        setTimeout(() => this.tone(16, 0.14, 0.09), 70)
        return
      case 'perfect': {
        // pentatonic run: D E F# A, one note every 90 ms
        const run = [0, 2, 4, 7]
        run.forEach((n, i) => setTimeout(() => this.tone(n + 12, 0.22, 0.1, 'sfx', 'triangle'), i * 90))
        return
      }
      case 'page':
        this.noise(0.08, 2600, 0.06)
        return
    }
  }

  /** Temple bell for shrines: long decay, two inharmonic partials. */
  bell(): void {
    if (!this.init()) return
    const ctx = this.ctx!
    for (const [ratio, gain] of [
      [1, 0.12],
      [2.76, 0.05],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 196 * ratio
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, ctx.currentTime)
      env.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02)
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2)
      osc.connect(env).connect(this.buses.get('ambience')!)
      osc.start()
      osc.stop(ctx.currentTime + 3.3)
    }
  }
}

export const audioBus = new AudioBus()

/* --------------------------- ambience by hour --------------------------- */

export type AmbienceProfile = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'

/** Hour of the in-game day → ambience profile. 340 in-game minutes = 05:40. */
export const ambienceAt = (minutes: number): AmbienceProfile => {
  const h = Math.floor(minutes / 60)
  if (h < 6) return 'night'
  if (h < 9) return 'dawn'
  if (h < 11) return 'morning'
  if (h < 14) return 'noon'
  if (h < 18) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

export interface AmbienceMix {
  /** 0..1 — birds at dawn, crickets at night */
  nature: number
  /** 0..1 — motorbike traffic, the Hanoi signature */
  traffic: number
  /** 0..1 — voices, vendors */
  crowd: number
  label: string
}

export const AMBIENCE_MIX: Record<AmbienceProfile, AmbienceMix> = {
  dawn: { nature: 0.9, traffic: 0.2, crowd: 0.1, label: 'Sớm tinh mơ, chim hót trên hồ' },
  morning: { nature: 0.5, traffic: 0.7, crowd: 0.5, label: 'Giờ đi làm, phố đông dần' },
  noon: { nature: 0.2, traffic: 0.8, crowd: 0.6, label: 'Trưa nắng, hàng quán rộn ràng' },
  afternoon: { nature: 0.3, traffic: 0.6, crowd: 0.4, label: 'Chiều xuống, phố chậm lại' },
  evening: { nature: 0.4, traffic: 0.9, crowd: 0.8, label: 'Tan tầm, còi xe và quán bia hơi' },
  night: { nature: 0.7, traffic: 0.2, crowd: 0.1, label: 'Đêm, chỉ còn tiếng dế và đèn vàng' },
}

/** District flavour: the Old Quarter is louder than the lake's south shore. */
export const districtGain = (district: string): number => {
  const d = district.toLowerCase()
  if (d.includes('hàng') || d.includes('phố cổ')) return 1.25
  if (d.includes('tràng tiền') || d.includes('lý thái tổ')) return 1.1
  return 0.9
}
