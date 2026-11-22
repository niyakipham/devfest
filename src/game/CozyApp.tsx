import { lazy, Suspense, useEffect, useMemo } from 'react'
import { useGameStore } from './store'
import { TitleScreen } from './ui/TitleScreen'
import { Creator } from './ui/Creator'
import { Hud } from './ui/Hud'
import { DialogueBox } from './ui/DialogueBox'
import { Journal } from './ui/Journal'
import { MapScreen } from './ui/MapScreen'
import { PauseOverlay, Toasts } from './ui/Overlays'
import { ErrorBoundary, WebGLFallback, detectWebGL } from './ui/Boundary'
import './ui/styles.css'

// F8: three.js is 800 kB of the bundle. Lazy-loading the scene lets the title
// screen and HUD paint before the 3D chunk finishes streaming.
const Scene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.Scene })))

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
  const mapOpen = useGameStore((s) => s.mapOpen)

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
    const onKey = (e: KeyboardEvent) => {
      const state = useGameStore.getState()
      if (state.phase !== 'PLAYING' || state.dialogue) return
      if (e.code === 'KeyJ') state.toggleJournal()
      if (e.code === 'KeyM') state.toggleMap()
      if (e.code === 'Escape') {
        if (state.mapOpen) state.toggleMap()
        else if (state.journalOpen) state.toggleJournal()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      const state = useGameStore.getState()
      if (document.hidden && state.phase === 'PLAYING') state.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // F8: check for WebGL before mounting the canvas — a missing context used to
  // produce a white page with no explanation.
  const webglError = useMemo(() => detectWebGL(), [])

  return (
    <div className="app">
      <div className="scene-layer">
        {webglError ? (
          <WebGLFallback reason={webglError} />
        ) : (
          <ErrorBoundary label="scene">
            <Suspense fallback={<div className="scene-loading" aria-live="polite">Đang dựng phố cổ…</div>}>
              <Scene />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
      <div className="vignette" />

      {phase === 'TITLE' && <TitleScreen />}
      {phase === 'CREATOR' && <Creator />}
      {(phase === 'PLAYING' || phase === 'PAUSED') && <Hud />}
      {phase === 'PLAYING' && dialogue && <DialogueBox />}
      {phase === 'PLAYING' && journalOpen && <Journal />}
      {phase === 'PLAYING' && mapOpen && <MapScreen />}
      {phase === 'PAUSED' && <PauseOverlay />}
      <Toasts />
    </div>
  )
}
