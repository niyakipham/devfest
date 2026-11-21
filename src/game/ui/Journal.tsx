import { useEffect } from 'react'
import { useGameStore } from '../store'
import { QUESTS } from '../content/quests'
import { dayLabel, formatClock } from '../scene/atmosphere'

const STATE_LABEL: Record<string, string> = {
  LOCKED: 'Chưa mở',
  AVAILABLE: 'Có thể nhận',
  ACTIVE: 'Đang làm',
  COMPLETE: 'Hoàn thành',
  CLAIMED: 'Đã xong',
}

export const Journal = () => {
  const toggleJournal = useGameStore((s) => s.toggleJournal)
  const quests = useGameStore((s) => s.quests)
  const player = useGameStore((s) => s.player)
  const clock = useGameStore((s) => s.clock)
  const pieces = useGameStore((s) => s.pieces)
  const tile = useGameStore((s) => s.tile)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyJ' || e.code === 'Escape') toggleJournal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleJournal])

  return (
    <div className="journal">
      <div className="cream-card journal__card">
        <div className="journal__head">
          <div>
            <h2>Nhật ký của {player.name}</h2>
            <p>
              {dayLabel(clock.day, clock.season)} · {formatClock(clock.minutes)} · ô {tile}
            </p>
          </div>
          <button type="button" className="pill pill--ghost pill--small" onClick={toggleJournal}>
            Đóng (J)
          </button>
        </div>

        <div className="journal__grid">
          <section>
            <h3>Việc đang làm</h3>
            {QUESTS.map((quest) => {
              const state = quests[quest.key]?.state
              if (!state) return null
              return (
                <article key={quest.key} className="journal__quest">
                  <strong>{quest.title}</strong>
                  <span className={`journal__state journal__state--${state.toLowerCase()}`}>
                    {STATE_LABEL[state]}
                  </span>
                  <p>{quest.summary}</p>
                  <ul>
                    {quest.objectives.map((o) => (
                      <li key={o.id}>{o.label}</li>
                    ))}
                  </ul>
                </article>
              )
            })}
            {Object.keys(quests).length === 0 && <p className="journal__empty">Chưa có việc gì. Ra phố thử xem.</p>}
          </section>

          <aside>
            <h3>Hành trang</h3>
            <dl className="journal__stats">
              <div>
                <dt>Đồng</dt>
                <dd>{player.dong}đ</dd>
              </div>
              <div>
                <dt>Tay nghề</dt>
                <dd>
                  Cấp {player.craftLevel} · {player.craftXp} XP
                </dd>
              </div>
              <div>
                <dt>Mảnh ký ức</dt>
                <dd>{pieces.length} / 480</dd>
              </div>
              <div>
                <dt>Danh tiếng</dt>
                <dd>
                  Cư dân {player.reputation.resident ?? 0} · Tiểu thương {player.reputation.merchant ?? 0}
                </dd>
              </div>
            </dl>
            <p className="journal__hint">
              Gợi ý: cô Hoa dựng quán phở ở góc Lê Thái Tổ, ngay bờ hồ. Chị Lan đứng phía nam hồ.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
