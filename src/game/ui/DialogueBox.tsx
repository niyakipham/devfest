import { useEffect, useState } from 'react'
import { DIALOGUES } from '../content/dialogue'
import { useGameStore } from '../store'

/** Speaker → portrait art (public/portraits). Original splash art, not game IP. */
const SPEAKER_PORTRAIT: Record<string, string> = {
  'Cô Hoa': '/portraits/persona-pho-vendor.jpg',
  'Chú Bảy': '/portraits/persona-silversmith.jpg',
  'Chị Lan': '/portraits/persona-photographer.jpg',
  'Anh Hùng': '/portraits/persona-cyclo-driver.jpg',
}

export const DialogueBox = () => {
  const dialogue = useGameStore((s) => s.dialogue)
  const choose = useGameStore((s) => s.choose)
  const close = useGameStore((s) => s.closeDialogue)
  const [lineIndex, setLineIndex] = useState(0)
  const [shown, setShown] = useState('')

  const node = dialogue ? DIALOGUES[dialogue.key] : undefined
  const fullLine = node?.lines[Math.min(lineIndex, (node?.lines.length ?? 1) - 1)] ?? ''
  const lineDone = shown.length >= fullLine.length
  const lastLine = node ? lineIndex >= node.lines.length - 1 : true

  useEffect(() => {
    setLineIndex(0)
  }, [dialogue?.key])

  useEffect(() => {
    setShown('')
    let i = 0
    const id = window.setInterval(() => {
      i += 2
      setShown(fullLine.slice(0, i))
      if (i >= fullLine.length) window.clearInterval(id)
    }, 18)
    return () => window.clearInterval(id)
  }, [fullLine])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!dialogue) return
      if (e.code === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogue, close])

  if (!node) return null

  const portrait = SPEAKER_PORTRAIT[node.speaker]

  const advance = () => {
    if (!lineDone) {
      setShown(fullLine)
      return
    }
    if (!lastLine) setLineIndex((i) => i + 1)
  }

  return (
    <div className="dialogue" onClick={advance}>
      <div className="panel dialogue__panel" onClick={(e) => e.stopPropagation()}>
        {portrait && (
          <img className="dialogue__avatar" src={portrait} alt={`Chân dung ${node.speaker}`} draggable={false} />
        )}
        <div className="dialogue__speaker">
          <strong>{node.speaker}</strong>
          <span>{node.role}</span>
        </div>

        <p className="dialogue__line">
          {shown}
          {!lineDone && <span style={{ opacity: 0.45 }}>▍</span>}
        </p>

        <div onClick={(e) => e.stopPropagation()}>
          {lineDone && lastLine && (
            <div className="dialogue__choices">
              {node.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`btn ${i === 0 ? '' : 'btn--ghost'}`}
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => choose(choice.id)}
                >
                  <span>{choice.label}</span>
                  {choice.cost ? (
                    <span style={{ fontSize: 14, opacity: 0.8, fontWeight: 900 }}>{choice.cost}đ</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {lineDone && !lastLine && (
            <div className="dialogue__next">
              <button type="button" className="btn btn--teal btn--small" onClick={advance}>
                Tiếp
              </button>
            </div>
          )}

          {!lineDone && (
            <div className="dialogue__next">
              <button type="button" className="btn btn--ghost btn--small" onClick={advance}>
                Hiện hết
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
