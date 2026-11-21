import { useGameStore } from '../store'

export const Toasts = () => {
  const toasts = useGameStore((s) => s.toasts)
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone === 'reward' ? 'toast--reward' : ''}`}>
          <strong>{t.title}</strong>
          {t.message && <p>{t.message}</p>}
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
      <div className="cream-card pause__card">
        <h3>Tạm dừng</h3>
        <div className="pause__items">
          <button type="button" className="pill" onClick={resume}>
            Tiếp tục
          </button>
          <button type="button" className="pill pill--ghost" onClick={saveNow}>
            Lưu lại
          </button>
          <button type="button" className="pill pill--ghost" onClick={() => setPhase('TITLE')}>
            Về menu chính
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-ink-muted)', marginBottom: 0, fontWeight: 700 }}>
          Esc để quay lại thành phố
        </p>
      </div>
    </div>
  )
}
