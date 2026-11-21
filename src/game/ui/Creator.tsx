import { useState } from 'react'
import { PERSONA_LABEL, type Persona } from '@shared/contracts'
import { useGameStore } from '../store'

const PERSONAS = Object.keys(PERSONA_LABEL) as Persona[]

export const Creator = () => {
  const startNew = useGameStore((s) => s.startNew)
  const setPhase = useGameStore((s) => s.setPhase)
  const [name, setName] = useState('')
  const [persona, setPersona] = useState<Persona>('PHO_VENDOR')

  return (
    <div className="creator">
      <div className="cream-card creator__card">
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
        <div className="creator__personas">
          {PERSONAS.map((p) => (
            <button
              key={p}
              type="button"
              className={`persona ${persona === p ? 'persona--active' : ''}`}
              onClick={() => setPersona(p)}
            >
              <span className="persona__icon">{PERSONA_LABEL[p].icon}</span>
              <span className="persona__label">{PERSONA_LABEL[p].vi}</span>
            </button>
          ))}
        </div>

        <div className="creator__footer">
          <button type="button" className="pill pill--ghost pill--small" onClick={() => setPhase('TITLE')}>
            ← Quay lại
          </button>
          <button type="button" className="pill" onClick={() => startNew(name, persona)}>
            Bắt đầu ngày mới
          </button>
        </div>
      </div>
    </div>
  )
}
