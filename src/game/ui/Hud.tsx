import { useEffect, useState } from 'react'
import { useGameStore } from '../store'
import { dayLabel, formatClock } from '../scene/atmosphere'
import { QUESTS } from '../content/quests'

const Need = ({ label, value, kind }: { label: string; value: number; kind?: 'warm' | 'mood' }) => (
  <div className="hud__need">
    <span>{label}</span>
    <div className={`hud__bar ${kind === 'warm' ? 'hud__bar--warm' : kind === 'mood' ? 'hud__bar--mood' : ''}`}>
      <span style={{ width: `${Math.round(value)}%` }} />
    </div>
  </div>
)

export const Hud = () => {
  const player = useGameStore((s) => s.player)
  const clock = useGameStore((s) => s.clock)
  const quests = useGameStore((s) => s.quests)
  const prompt = useGameStore((s) => s.prompt)
  const interact = useGameStore((s) => s.interact)
  const pieces = useGameStore((s) => s.pieces)
  const tile = useGameStore((s) => s.tile)
  const loadedTiles = useGameStore((s) => s.loadedTiles)
  const [debug, setDebug] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F9') {
        e.preventDefault()
        setDebug((d) => !d)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const active = QUESTS.find((q) => quests[q.key]?.state === 'ACTIVE')
  const available = QUESTS.find((q) => quests[q.key]?.state === 'AVAILABLE')

  return (
    <div className="hud">
      <div className="hud__clock">
        <div className="hud__time">{formatClock(clock.minutes)}</div>
        <div className="hud__chip">{dayLabel(clock.day, clock.season)}</div>
      </div>

      <div className="hud__wallet">
        <div className="hud__chip">{player.dong}đ</div>
        <div className="hud__chip">{pieces.length} mảnh</div>
      </div>

      {(active ?? available) && (
        <div className="hud__quest">
          <div className="cream-card cream-card--flat cream-card--tiny">
            <h4>{active ? active.title : `Có việc mới: ${available?.title}`}</h4>
            <p>
              {active
                ? active.objectives.map((o) => o.label).join(' · ')
                : 'Mở nhật ký (J) để xem chi tiết.'}
            </p>
          </div>
        </div>
      )}

      <div className="hud__needs">
        <div className="cream-card cream-card--flat cream-card--tiny">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Need label="Năng lượng" value={player.needs.energy} />
            <Need label="No bụng" value={player.needs.hunger} kind="warm" />
            <Need label="An yên" value={player.needs.mood} kind="mood" />
          </div>
        </div>
      </div>

      {prompt && !useGameStore.getState().dialogue && (
        <button type="button" className="hud__prompt" onClick={interact} style={{ pointerEvents: 'auto' }}>
          <span className="hud__keycap">E</span>
          {prompt}
        </button>
      )}

      <div className="hud__controls">
        <div className="hud__chip">
          <span className="hud__key">W</span> Di chuyển · <span className="hud__key">E</span> Tương tác ·{' '}
          <span className="hud__key">J</span> Nhật ký
        </div>
      </div>

      {debug && (
        <div className="debug">
          tile {tile} · loaded {loadedTiles}
          <br />
          pos {player.position.x.toFixed(1)} / {player.position.z.toFixed(1)}
          <br />
          fps target 60 · draw budget 220
        </div>
      )}
    </div>
  )
}
