import { useState } from 'react'
import { PERSONA_LABEL, type Persona } from '@shared/contracts'
import { LotusIcon } from './icons'
import { useGameStore } from '../store'

const PERSONAS = Object.keys(PERSONA_LABEL) as Persona[]

/** Persona → AI key visual (public/portraits). Original art; no third-party IP. */
const PERSONA_ART: Record<Persona, string> = {
  STUDENT: '/portraits/persona-student.jpg',
  SILVERSMITH: '/portraits/persona-silversmith.jpg',
  PHO_VENDOR: '/portraits/persona-pho-vendor.jpg',
  CYCLO_DRIVER: '/portraits/persona-cyclo-driver.jpg',
  PHOTOGRAPHER: '/portraits/persona-photographer.jpg',
  FOLK_SINGER: '/portraits/persona-folk-singer.jpg',
}

export const Creator = () => {
  const startNew = useGameStore((s) => s.startNew)
  const setPhase = useGameStore((s) => s.setPhase)
  const [name, setName] = useState('')
  const [persona, setPersona] = useState<Persona>('PHO_VENDOR')

  const selected = PERSONA_LABEL[persona]

  return (
    <div className="creator">
      <div className="panel creator__stage">
        {/* ------- left: the hero portrait, Genshin character-screen style ------- */}
        <figure className="creator__preview">
          <img
            className="creator__portrait"
            src={PERSONA_ART[persona]}
            alt={`Chân dung ${selected.vi}`}
            draggable={false}
          />
          <figcaption className="creator__plate">
            <span className="creator__plate-role">
              <LotusIcon size={13} /> {selected.en}
            </span>
            <strong className="creator__plate-name">{name.trim() || 'Bạn'} · {selected.vi}</strong>
          </figcaption>
        </figure>

        {/* ------- right: the form ------- */}
        <div className="creator__form">
          <h2 className="creator__title">Bạn là ai ở Hà Nội?</h2>
          <p className="creator__sub">Chọn một cuộc đời. Bạn có thể đổi nghề sau 7 ngày trong game.</p>

          <label className="creator__label" htmlFor="player-name">
            Tên của bạn
          </label>
          <input
            id="player-name"
            className="creator__name"
            value={name}
            maxLength={24}
            placeholder="Ví dụ: Minh, Hương, Bảo…"
            onChange={(e) => setName(e.target.value)}
          />

          <span className="creator__label">Nghề / xuất thân</span>
          <div className="creator__personas" role="radiogroup" aria-label="Nghề / xuất thân">
            {PERSONAS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={persona === p}
                className={`persona ${persona === p ? 'persona--active' : ''}`}
                onClick={() => setPersona(p)}
                onMouseEnter={() => setPersona(p)}
              >
                <span className="persona__art">
                  <img src={PERSONA_ART[p]} alt="" loading="lazy" draggable={false} />
                </span>
                <span className="persona__label">{PERSONA_LABEL[p].vi}</span>
              </button>
            ))}
          </div>

          <div className="creator__footer">
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setPhase('TITLE')}>
              ← Quay lại
            </button>
            <button type="button" className="btn btn--small" onClick={() => startNew(name, persona)}>
              Bắt đầu ngày mới
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
