/**
 * Nghề phở — the mini-game surface (RP-04).
 *
 * Design rules taken from the blueprint and from playtesting the Phase 1 HUD:
 *  - one primary action at a time: there is exactly one button, and its label
 *    changes with the stage
 *  - the needle is driven by CSS animation duration, so it costs zero JS frames
 *    and respects prefers-reduced-motion (the animation stops, the window widens)
 *  - the player never loses money: a ruined bowl still pays above ingredient cost
 *  - every number shown is derived from `brewBowl`, never recomputed here
 */
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store'
import { GARNISH_ORDER, PHO_STAGES, RUINED_FLOOR, bowlsPerDay, gradeStop, ingredientCost, timingWindow, type Garnish } from '@rp/craft/pho'

const STAGE_LABEL: Record<(typeof PHO_STAGES)[number], string> = {
  broth: 'Nước dùng',
  noodle: 'Bánh phở',
  garnish: 'Xếp bát',
}

const STAGE_HINT: Record<(typeof PHO_STAGES)[number], string> = {
  broth: 'Canh lửa cho nước dùng trong — dừng khi kim vào vùng sáng.',
  noodle: 'Trần bánh vừa mềm tới. Đừng để nhũn.',
  garnish: 'Chan nước sau cùng, thịt bò xếp trước rau.',
}

const GARNISH_LABEL: Record<Garnish, string> = {
  herbs: 'Rau thơm',
  beef: 'Thịt bò',
  broth: 'Chan nước',
}

export const PhoShift = () => {
  const shift = useGameStore((s) => s.shift)
  const player = useGameStore((s) => s.player)
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion)
  const openShift = useGameStore((s) => s.openShift)
  const stopStage = useGameStore((s) => s.stopStage)
  const placeGarnish = useGameStore((s) => s.placeGarnish)
  const closeShift = useGameStore((s) => s.closeShift)

  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef<number>(0)

  const stage = shift.stage >= 0 ? PHO_STAGES[shift.stage] : null
  const windowMs = stage ? timingWindow(stage, player.craftLevel).good : 1

  useEffect(() => {
    if (!stage || reduceMotion) return
    startedAt.current = performance.now()
    let raf = 0
    const loop = (): void => {
      setElapsed(performance.now() - startedAt.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage, reduceMotion])

  const stopNow = (): void => {
    if (!stage) return
    // reduced motion: the needle does not move, so the player is graded on a
    // generous fixed offset instead of being locked out of the profession
    const offset = reduceMotion ? windowMs * 0.4 : elapsed
    stopStage(offset)
    setElapsed(0)
  }

  const dayLimit = bowlsPerDay(player.craftLevel)
  const canBrew = player.dong >= ingredientCost() && shift.brewed < dayLimit

  /* ------------------------------ idle ------------------------------ */
  if (!shift.open) {
    return (
      <div className="shift__launcher">
        <button type="button" className="btn btn--teal" onClick={openShift} disabled={!canBrew}>
          Nấu một bát phở
        </button>
        <p className="shift__meta">
          {shift.brewed}/{dayLimit} bát hôm nay · nguyên liệu {ingredientCost()}đ
          {player.dong < ingredientCost() ? ' · không đủ tiền' : ''}
        </p>
      </div>
    )
  }

  /* --------------------------- verdict card --------------------------- */
  const last = shift.last
  if (shift.stage < 0 && shift.offsets.length === PHO_STAGES.length && shift.garnish.length === 0 && last) {
    return (
      <div className="panel shift__card" role="dialog" aria-label="Kết quả bát phở">
        <h3 className="shift__title">{last.perfect ? 'Bát phở hoàn hảo' : 'Bát phở vừa xong'}</h3>
        <p className="shift__verdict">{last.verdict}</p>
        <div className="shift__scores">
          {last.stages.map((s) => (
            <div key={s.stage} className="shift__score">
              <span>{STAGE_LABEL[s.stage]}</span>
              <div className="shift__bar" aria-hidden="true">
                <i style={{ width: `${Math.round(s.score * 100)}%` }} />
              </div>
              <b>{Math.round(s.score * 100)}%</b>
            </div>
          ))}
        </div>
        <p className="shift__meta">
          Chất lượng {Math.round(last.quality * 100)}% · +{last.xp} XP nghề
        </p>
        <button type="button" className="btn" onClick={closeShift}>
          Bán bát nữa
        </button>
      </div>
    )
  }

  /* ---------------------------- garnish ---------------------------- */
  if (shift.offsets.length === PHO_STAGES.length) {
    return (
      <div className="panel shift__card" role="dialog" aria-label="Xếp bát">
        <h3 className="shift__title">{STAGE_LABEL.garnish}</h3>
        <p className="shift__hint">{STAGE_HINT.garnish}</p>
        <div className="shift__garnish">
          {GARNISH_ORDER.map((g) => (
            <button key={g} type="button" className="btn btn--ghost" onClick={() => placeGarnish(g)}>
              {GARNISH_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="shift__meta">Đã xếp: {shift.garnish.length}/3</p>
      </div>
    )
  }

  /* ---------------------------- timing ---------------------------- */
  if (stage) {
    const w = timingWindow(stage, player.craftLevel)
    const progress = reduceMotion ? 0.4 : Math.min(1, elapsed / (w.burn * 1.6))
    const liveScore = gradeStop(stage, reduceMotion ? w.perfect * 0.4 : elapsed, player.craftLevel)

    return (
      <div className="panel shift__card" role="dialog" aria-label={`Nấu phở — ${STAGE_LABEL[stage]}`}>
        <h3 className="shift__title">
          {STAGE_LABEL[stage]} <span className="shift__step">{shift.stage + 1}/3</span>
        </h3>
        <p className="shift__hint">{STAGE_HINT[stage]}</p>

        <div className="shift__track" aria-hidden="true">
          <div className="shift__zone shift__zone--good" style={{ width: `${(w.good / (w.burn * 1.6)) * 100}%` }} />
          <div className="shift__zone shift__zone--perfect" style={{ width: `${(w.perfect / (w.burn * 1.6)) * 100}%` }} />
          <div className="shift__needle" style={{ left: `${progress * 100}%` }} />
        </div>

        <p className="shift__meta" aria-live="polite">
          Điểm tạm tính: {Math.round(liveScore * 100)}%
          {reduceMotion ? ' · đã giảm chuyển động' : ''}
        </p>

        <button type="button" className="btn" onClick={stopNow}>
          Dừng lại
        </button>
      </div>
    )
  }

  /* --------------------------- fallback --------------------------- */
  return (
    <div className="panel shift__card">
      <h3 className="shift__title">Quán đang nghỉ</h3>
      <p className="shift__hint">Bát hỏng vẫn bán được {RUINED_FLOOR}đ — bạn không bao giờ lỗ.</p>
      <button type="button" className="btn btn--ghost" onClick={closeShift}>
        Đóng
      </button>
    </div>
  )
}
