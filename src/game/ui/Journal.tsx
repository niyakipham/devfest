import { useGameStore } from '../store'
import { QUESTS } from '../content/quests'
import { dayLabel, formatClock } from '../scene/atmosphere'
import { formatEntryTime, formatKm, type JournalKind } from '@rp/journal'

const KIND_ICON: Record<JournalKind, string> = {
  walk: '👣',
  eat: '🍜',
  craft: '🔥',
  meet: '🙋',
  photo: '📷',
  earn: '🪙',
  day: '🌅',
}

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
  const journal = useGameStore((s) => s.journal)
  const stats = useGameStore((s) => s.stats)

  return (
    <div className="journal">
      <div className="panel journal__card">
        <div className="journal__head">
          <div>
            <h2>Nhật ký của {player.name}</h2>
            <p>
              {dayLabel(clock.day, clock.season)} · {formatClock(clock.minutes)} · ô {tile}
            </p>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={toggleJournal}>
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

          <section>
            <h3>Nhật ký</h3>
            {/* RP-08: self-written from events, newest first, capped at 60 */}
            {journal.length === 0 ? (
              <p className="journal__empty">Chưa có gì để kể. Đi bộ một vòng hồ rồi mở lại.</p>
            ) : (
              <ol className="journal__feed">
                {journal.map((entry) => (
                  <li key={entry.id} className={`journal__entry journal__entry--${entry.kind}`}>
                    <span className="journal__kind" aria-hidden="true">
                      {KIND_ICON[entry.kind]}
                    </span>
                    <div>
                      <p className="journal__text">{entry.text}</p>
                      <time className="journal__time">{formatEntryTime(entry)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
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
                <dt>Đã đi</dt>
                <dd>{formatKm(stats.metresWalked)}</dd>
              </div>
              <div>
                <dt>Bát phở</dt>
                <dd>
                  ăn {stats.bowlsEaten} · nấu {stats.bowlsBrewed}
                </dd>
              </div>
              <div>
                <dt>Gặp gỡ</dt>
                <dd>
                  {stats.npcsMet} người · {stats.photosTaken} tấm ảnh
                </dd>
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
