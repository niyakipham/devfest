import { useEffect, useState } from 'react'
import { useGameStore } from '../store'

interface Item {
  id: string
  label: string
  icon: string
  disabled?: boolean
  action: () => void
}

export const TitleScreen = () => {
  const setPhase = useGameStore((s) => s.setPhase)
  const continueGame = useGameStore((s) => s.continueGame)
  const hasSave = useGameStore((s) => s.hasSave)
  const addToast = useGameStore((s) => s.addToast)
  const [index, setIndex] = useState(0)

  const items: Item[] = [
    { id: 'new', label: 'Chơi mới', icon: '▶', action: () => setPhase('CREATOR') },
    {
      id: 'continue',
      label: 'Tiếp tục',
      icon: '⏵',
      disabled: !hasSave,
      action: () => continueGame(),
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: '⚙',
      action: () => addToast({ title: 'Cài đặt', message: 'Đồ hoạ, âm thanh và phím tắt — Phase 2.', tone: 'info' }),
    },
    {
      id: 'credits',
      label: 'Giới thiệu',
      icon: '★',
      action: () =>
        addToast({
          title: 'Hanoi Legends',
          message: 'Thế giới mở 20 km² về Hà Nội. Bản dựng Phase 1 — Hoàn Kiếm.',
          tone: 'info',
        }),
    },
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGameStore.getState().phase !== 'TITLE') return
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault()
        setIndex((i) => (i + 1) % items.length)
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        setIndex((i) => (i - 1 + items.length) % items.length)
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        const item = items[index]
        if (item && !item.disabled) item.action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="title">
      <div className="title__logo">
        {/* the lake-teardrop mark: azure petal + gold star — our own emblem */}
        <div className="title__pin" aria-hidden="true">
          <svg viewBox="0 0 48 60" width="46" height="58" focusable="false">
            <path
              className="title__pin-body"
              d="M24 2C13.5 2 5 10.5 5 21c0 13.4 19 37 19 37s19-23.6 19-37C43 10.5 34.5 2 24 2Z"
              stroke="var(--c-glass-edge)"
              strokeWidth="2.5"
            />
            <path
              className="title__pin-star"
              d="M24 12.4l2.6 6.6 7 0.5-5.3 4.6 1.6 6.8-5.9-3.6-5.9 3.6 1.6-6.8-5.3-4.6 7-.5L24 12.4Z"
            />
          </svg>
        </div>
        <p className="title__over">Hồ Gươm · Phố Cổ · 20 km²</p>
        <h1>
          Hà Nội
          <br />
          <em>Legends</em>
        </h1>
        <h2>Một ngày của người Hà Nội</h2>
      </div>

      <div className="title__menu">
        <div className="panel">
          <div className="title__items">
            {items.map((item, i) => {
              const selected = i === index && !item.disabled
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`btn ${selected ? '' : 'btn--ghost'} ${item.disabled ? 'btn--disabled' : ''}`}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => !item.disabled && item.action()}
                >
                  <span aria-hidden="true" style={{ fontSize: 15, opacity: 0.85 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="title__hint">↑ ↓ chọn · Enter xác nhận · kéo chuột để ngắm thành phố</div>

      <div className="title__select">
        <span className="keycap">A</span> Chọn
      </div>

      <div className="title__build">Phase 1 · Hoàn Kiếm</div>
    </div>
  )
}
