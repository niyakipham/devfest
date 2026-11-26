import { useEffect, useState } from 'react'
import { useGameStore } from '../store'
import { formatClock } from '../scene/atmosphere'
import { QUESTS } from '../content/quests'
import { COMPANION_SPECIES_BY_CODE, type CompanionSpeciesCode } from '@shared/companion'
import type { Persona } from '@shared/contracts'
import {
  BookIcon,
  CameraIcon,
  CycloIcon,
  GearIcon,
  HelpIcon,
  MapIcon,
  PinIcon,
  PotIcon,
} from './icons'
import { SettingsPanel } from './SettingsPanel'

/**
 * HUD — ADR-005 “Phố cổ Legends” (Genshin/Pokopia-flavoured): floating white glyphs,
 * a deep-leaf target pill up top, companion portraits + circular tool buttons in the
 * bottom-right dock, slim needs on the left. Gameplay wiring is unchanged — only
 * presentation moved.
 */

const TOOLS = [
  { id: 'food', Icon: PotIcon, label: 'Bánh mì dọc đường' },
  { id: 'camera', Icon: CameraIcon, label: 'Máy ảnh' },
  { id: 'cyclo', Icon: CycloIcon, label: 'Xích lô' },
] as const

/** Persona → AI portrait (see public/portraits). Original art, no third-party IP. */
const PERSONA_PORTRAIT: Record<Persona, string> = {
  STUDENT: '/portraits/persona-student.jpg',
  SILVERSMITH: '/portraits/persona-silversmith.jpg',
  PHO_VENDOR: '/portraits/persona-pho-vendor.jpg',
  CYCLO_DRIVER: '/portraits/persona-cyclo-driver.jpg',
  PHOTOGRAPHER: '/portraits/persona-photographer.jpg',
  FOLK_SINGER: '/portraits/persona-folk-singer.jpg',
}

const COMPANION_PORTRAIT: Record<string, string> = {
  'ho-guom-crane': '/portraits/companion-crane.jpg',
  'ho-tay-bird': '/portraits/companion-bird.jpg',
  'pho-co-cat': '/portraits/companion-cat.jpg',
  'bat-trang-potter': '/portraits/companion-turtle.jpg',
}

const POI_TYPE_LABEL: Record<string, string> = {
  FOOD: 'Quán ăn',
  SHOP: 'Cửa hàng',
  LANDMARK: 'Di tích',
  QUEST_GIVER: 'Người quen',
  PHOTO_SPOT: 'Điểm ngắm',
  BENCH: 'Chỗ nghỉ',
  SHRINE: 'Miếu',
  WORKSHOP: 'Xưởng nghề',
  TRANSPORT: 'Đi lại',
}

const NeedsRow = ({
  icon,
  label,
  value,
  kind,
}: {
  icon: string
  label: string
  value: number
  kind: 'energy' | 'hunger' | 'mood' | 'hygiene'
}) => (
  <div className="need">
    <span className="need__icon" aria-hidden="true">
      {icon}
    </span>
    <span>{label}</span>
    <span className="need__track" role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span className={`need__fill need__fill--${kind}`} style={{ width: `${Math.round(value)}%` }} />
    </span>
  </div>
)

export const Hud = () => {
  const player = useGameStore((s) => s.player)
  const clock = useGameStore((s) => s.clock)
  const quests = useGameStore((s) => s.quests)
  const prompt = useGameStore((s) => s.prompt)
  const promptPoi = useGameStore((s) => s.promptPoi)
  const interact = useGameStore((s) => s.interact)
  const pieces = useGameStore((s) => s.pieces)
  const tile = useGameStore((s) => s.tile)
  const loadedTiles = useGameStore((s) => s.loadedTiles)
  const toggleMap = useGameStore((s) => s.toggleMap)
  const toggleJournal = useGameStore((s) => s.toggleJournal)
  const photoAttempt = useGameStore((s) => s.photoAttempt)
  const quickEat = useGameStore((s) => s.quickEat)
  const addToast = useGameStore((s) => s.addToast)
  const companion = useGameStore((s) => s.companion)
  const careCompanion = useGameStore((s) => s.careCompanion)
  const [activeTool, setActiveTool] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [debug, setDebug] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F9') {
        e.preventDefault()
        setDebug((d) => !d)
      }
      if (e.code === 'KeyQ') setActiveTool((i) => (i - 1 + TOOLS.length) % TOOLS.length)
      if (e.code === 'KeyR') setActiveTool((i) => (i + 1) % TOOLS.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const active = TOOLS[activeTool]
  const activeQuest = QUESTS.find((q) => quests[q.key]?.state === 'ACTIVE')
  const available = QUESTS.find((q) => quests[q.key]?.state === 'AVAILABLE')

  const plateName = promptPoi?.name ?? activeQuest?.title ?? available?.title ?? 'Phố cổ Hà Nội'
  const plateType = promptPoi ? POI_TYPE_LABEL[promptPoi.type] ?? 'Địa điểm' : activeQuest ? 'Nhiệm vụ' : 'Tự do'
  const dayProgress = (clock.minutes / 1440) * 100
  const energy = player.needs.energy
  const filledSegments = Math.max(0, Math.min(10, Math.round(energy / 10)))

  const personaPortrait = PERSONA_PORTRAIT[player.persona]
  const species = companion ? COMPANION_SPECIES_BY_CODE.get(companion.speciesCode as CompanionSpeciesCode) : undefined
  const companionPortrait = companion ? COMPANION_PORTRAIT[companion.speciesCode] : undefined

  const runTool = (index: number) => {
    setActiveTool(index)
    if (TOOLS[index].id === 'food') quickEat()
    else if (TOOLS[index].id === 'camera') photoAttempt()
    else
      addToast({
        title: 'Xích lô chưa mở',
        message: 'Nghề xích lô thuộc Phase 2 của roadmap.',
        tone: 'info',
      })
  }

  return (
    <div className="hud">
      <div className="plate">
        <div className="plate__level">
          <span>Ngày {clock.day}</span>
          {formatClock(clock.minutes)} · {clock.season}
        </div>
        <div className="plate__name">
          {plateName}
          <span className="plate__type">{plateType}</span>
        </div>
        <div className="plate__bar" aria-hidden="true">
          <span style={{ width: `${dayProgress}%` }} />
        </div>
      </div>

      <nav className="rail" aria-label="Bảng điều khiển">
        <button type="button" className="rail__btn rail__btn--map" title="Bản đồ (M)" onClick={toggleMap} aria-label="Bản đồ">
          <MapIcon size={30} />
        </button>
        <button
          type="button"
          className="rail__btn"
          title="Nhật ký (J)"
          onClick={toggleJournal}
          aria-label="Nhật ký"
        >
          <BookIcon />
        </button>
        <button type="button" className="rail__btn" title="Chụp ảnh" onClick={photoAttempt} aria-label="Chụp ảnh">
          <CameraIcon />
        </button>
        <button
          type="button"
          className="rail__btn"
          title="Cài đặt"
          aria-label="Cài đặt"
          onClick={() => setSettingsOpen(true)}
        >
          <GearIcon />
        </button>
        <button
          type="button"
          className="rail__btn"
          title="Trợ giúp"
          aria-label="Trợ giúp"
          onClick={() =>
            addToast({
              title: 'Điều khiển',
              message: 'WASD đi · E tương tác · Q/R đổi công cụ · J nhật ký · M bản đồ · Esc dừng',
              tone: 'info',
            })
          }
        >
          <HelpIcon />
        </button>
      </nav>

      <div className="needs">
        <NeedsRow icon="⚡" label="Sức" value={player.needs.energy} kind="energy" />
        <NeedsRow icon="🍚" label="Bụng" value={player.needs.hunger} kind="hunger" />
        <NeedsRow icon="🌤" label="Lòng" value={player.needs.mood} kind="mood" />
        {/* RP-03: hygiene used to decay with no meter and no way to restore it.
            It is now visible and refillable at the hồ tắm / giếng POIs. */}
        <NeedsRow icon="💧" label="Sạch" value={player.needs.hygiene} kind="hygiene" />
      </div>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}

      {/* -------- bottom-right dock: portraits → circular tools → L/R pill -------- */}
      <div className="dock">
        <div className="mates">
          {companion && species && companionPortrait && (
            <button
              type="button"
              className="mate mate--companion"
              onClick={() => careCompanion('groom')}
              aria-label={`Vỗ về ${species.viName}`}
              title={`${species.viName} · vỗ về mỗi ngày một lần`}
            >
              <img src={companionPortrait} alt={species.viName} draggable={false} />
              <span className="mate__lv">{companion.level}</span>
            </button>
          )}
          <figure className="mate mate--player" title={player.name}>
            <img src={personaPortrait} alt={`Chân dung ${player.name}`} draggable={false} />
          </figure>
        </div>

        <div className="party">
          {TOOLS.map((tool, i) => {
            const { Icon } = tool
            return (
              <button
                key={tool.id}
                type="button"
                className={`slot ${i === activeTool ? 'slot--active' : ''}`}
                onClick={() => runTool(i)}
                aria-label={tool.label}
                title={tool.label}
              >
                <Icon size={i === activeTool ? 30 : 24} />
                {tool.id === 'camera' && pieces.length > 0 && <span className="slot__badge">{pieces.length}</span>}
                {i === activeTool && (
                  <span className="slot__hints" aria-hidden="true">
                    <span className="keycap">E</span>
                    <span className="keycap">J</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="switch">
          <div className="switch__row">
            <button
              type="button"
              className="switch__btn"
              aria-label="Công cụ trước"
              onClick={() => setActiveTool((i) => (i - 1 + TOOLS.length) % TOOLS.length)}
            >
              L
            </button>
            <span className="switch__label">{active.label}</span>
            <button
              type="button"
              className="switch__btn"
              aria-label="Công cụ sau"
              onClick={() => setActiveTool((i) => (i + 1) % TOOLS.length)}
            >
              R
            </button>
          </div>
          <div className="switch__bar" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`switch__seg ${i < filledSegments ? 'switch__seg--on' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {prompt && !useGameStore.getState().dialogue && (
        <button type="button" className="prompt" onClick={interact}>
          <span className="prompt__key">E</span>
          {prompt}
          <PinIcon size={18} />
        </button>
      )}

      {debug && (
        <div className="debug">
          tile {tile} · loaded {loadedTiles}
          <br />
          pos {player.position.x.toFixed(1)} / {player.position.z.toFixed(1)}
          <br />
          tool {active.id} · pieces {pieces.length}
        </div>
      )}
    </div>
  )
}
