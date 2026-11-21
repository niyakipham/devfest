import { useGameStore } from '../store'

export const Toasts = () => {
  const toasts = useGameStore((s) => s.toasts)
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone === 'reward' ? 'toast--reward' : ''}`}>
          <span className="toast__icon" aria-hidden="true">
            {t.tone === 'reward' ? '★' : '●'}
          </span>
          <div>
            <strong>{t.title}</strong>
            {t.message && <p>{t.message}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export const PauseOverlay = () => {
  const resume = useGameStore((s) => s.resume)
  const saveNow = useGameStore((s) => s.saveNow)
  const setPhase = useGameStore((s) => s.setPhase)

  return (
    <div className="pause">
      <div className="panel pause__card">
        <h3>Tạm dừng</h3>
        <div className="pause__items">
          <button type="button" className="btn" onClick={resume}>
            Tiếp tục
          </button>
          <button type="button" className="btn btn--ghost" onClick={saveNow}>
            Lưu lại
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setPhase('TITLE')}>
            Về menu chính
          </button>
        </div>
        <p
          style={{
            margin: '14px 0 0',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--c-ink-muted)',
          }}
        >
          Esc để quay lại thành phố
        </p>
      </div>
    </div>
  )
}
