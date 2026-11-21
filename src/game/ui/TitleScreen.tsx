import { useEffect, useState } from 'react'
import { useGameStore } from '../store'

interface Item {
  id: string
  label: string
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
    { id: 'new', label: 'Chơi mới', action: () => setPhase('CREATOR') },
    {
      id: 'continue',
      label: 'Tiếp tục',
      disabled: !hasSave,
      action: () => continueGame(),
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      action: () => addToast({ title: 'Cài đặt', message: 'Đồ hoạ, âm thanh và phím tắt — Phase 2.', tone: 'info' }),
    },
    {
      id: 'credits',
      label: 'Giới thiệu',
      action: () =>
        addToast({
          title: 'Hanoi Legends',
          message: 'Một thế giới mở 20 km² về Hà Nội. Bản dựng Phase 1 — Hoàn Kiếm.',
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
        <h1>
          Hà Nội
          <br />
          Legends
        </h1>
        <h2>Phố cổ · 20 km²</h2>
      </div>

      <div className="title__menu">
        <div className="cream-card">
          <div className="title__items">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`pill ${i === index && !item.disabled ? '' : 'pill--ghost'} ${
                  item.disabled ? 'pill--disabled' : ''
                }`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => !item.disabled && item.action()}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="title__hint">↑ ↓ để chọn · Enter để xác nhận · Chuột kéo để ngắm thành phố</div>

      <div className="title__select">
        <div className="hud__chip">
          <span className="hud__key">A</span> Chọn
        </div>
      </div>
    </div>
  )
}
