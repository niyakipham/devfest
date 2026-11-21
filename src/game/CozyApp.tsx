import { useEffect } from 'react'
import { Scene } from './scene/Scene'
import { useGameStore } from './store'
import { TitleScreen } from './ui/TitleScreen'
import { Creator } from './ui/Creator'
import { Hud } from './ui/Hud'
import { DialogueBox } from './ui/DialogueBox'
import { Journal } from './ui/Journal'
import { PauseOverlay, Toasts } from './ui/Overlays'
import './ui/styles.css'

/**
 * One second of real time = one in-game minute (a full day every 24 minutes).
 * Autosave every 3 minutes, like the blueprint demands.
 */
const TICK_MS = 1000
const AUTOSAVE_MS = 180_000

export const CozyApp = () => {
  const phase = useGameStore((s) => s.phase)
  const dialogue = useGameStore((s) => s.dialogue)
  const journalOpen = useGameStore((s) => s.journalOpen)

  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useGameStore.getState()
      if (state.phase === 'PLAYING') state.tick(1)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useGameStore.getState()
      if (state.phase === 'PLAYING') {
        state.syncTransform()
        state.saveNow()
      }
    }, AUTOSAVE_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      const state = useGameStore.getState()
      if (document.hidden && state.phase === 'PLAYING') state.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <div className="app">
      <div className="scene-layer">
        <Scene />
      </div>
      <div className="vignette" />

      {phase === 'TITLE' && <TitleScreen />}
      {phase === 'CREATOR' && <Creator />}
      {(phase === 'PLAYING' || phase === 'PAUSED') && <Hud />}
      {phase === 'PLAYING' && dialogue && <DialogueBox />}
      {phase === 'PLAYING' && journalOpen && <Journal />}
      {phase === 'PAUSED' && <PauseOverlay />}
      <Toasts />
    </div>
  )
}
