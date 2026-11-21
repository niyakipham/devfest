import { useEffect, useState } from 'react'
import { DIALOGUES } from '../content/dialogue'
import { useGameStore } from '../store'

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

  const advance = () => {
    if (!lineDone) {
      setShown(fullLine)
      return
    }
    if (!lastLine) setLineIndex((i) => i + 1)
  }

  return (
    <div className="dialogue" onClick={advance}>
      <div className="cream-card dialogue__card" onClick={(e) => e.stopPropagation()}>
        <div className="dialogue__speaker">
          <strong>{node.speaker}</strong>
          <span>{node.role}</span>
        </div>
        <p className="dialogue__line">
          {shown}
          {!lineDone && <span style={{ opacity: 0.5 }}>▍</span>}
        </p>

        {lineDone && (
          <div className="dialogue__choices" onClick={(e) => e.stopPropagation()}>
            {lastLine ? (
              node.choices.map((choice, i) => (
                <button
                  key={choice.id}
                  type="button"
                  className={`pill ${i === 0 ? '' : 'pill--ghost'}`}
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => choose(choice.id)}
                >
                  <span>{choice.label}</span>
                  {choice.cost ? <span style={{ opacity: 0.85, fontSize: 15 }}>{choice.cost}đ</span> : null}
                </button>
              ))
            ) : (
              <button type="button" className="pill" onClick={advance}>
                Tiếp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
