import { useMemo } from 'react'
import { POIS, LAKE } from '@world/data/hoanKiem'
import { DISTRICTS, WORLD_DEPTH, WORLD_WIDTH } from '@world/grid'
import { useGameStore } from '../store'
import { playerRef } from '../world-ref'
import { CloseIcon } from './icons'

const SCALE = 0.064 // 5000 m → 320 px, 4000 m → 256 px
const toX = (x: number): number => x * SCALE
const toY = (z: number): number => z * SCALE

const DOT_COLOR: Record<string, string> = {
  LANDMARK: '#123a4b',
  PHOTO_SPOT: '#0e7fa8',
  QUEST_GIVER: '#e8483f',
  FOOD: '#d9a11f',
  SHOP: '#4e9b2e',
  WORKSHOP: '#9b7ede',
  BENCH: '#6a8b98',
  SHRINE: '#9b7ede',
  TRANSPORT: '#21b4e0',
}

export const MapScreen = () => {
  const toggleMap = useGameStore((s) => s.toggleMap)
  const clock = useGameStore((s) => s.clock)
  const quests = useGameStore((s) => s.quests)

  const pois = useMemo(() => POIS.filter((p) => p.type !== 'BENCH'), [])
  const questPois = useMemo(() => {
    const active = POIS.filter((p) => p.type === 'QUEST_GIVER')
    return active.filter((p) => {
      if (p.id === 'npc-co-hoa') return quests['q-pho']?.state === 'ACTIVE'
      if (p.id === 'npc-lan') return quests['q-photo']?.state === 'ACTIVE' || quests['q-photo']?.state === 'AVAILABLE'
      return true
    })
  }, [quests])

  return (
    <div className="map-screen">
      <div className="panel map-screen__card">
        <div className="map-screen__head">
          <div>
            <h2>Bản đồ Hà Nội · 20 km²</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: 'var(--c-ink-muted)' }}>
              Ngày {clock.day} · {pois.length} địa điểm đã ghi nhận · bạn đang ở ô{' '}
              {Math.floor(playerRef.x / 250)},{Math.floor(playerRef.z / 250)}
            </p>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={toggleMap}>
            <CloseIcon size={16} /> Đóng
          </button>
        </div>

        <svg className="map-canvas" viewBox="0 0 320 256" role="img" aria-label="Bản đồ Hà Nội">
          <rect x="0" y="0" width="320" height="256" rx="10" fill="#eaf7e2" />
          {/* district blocks */}
          {DISTRICTS.map((d) => (
            <rect
              key={d.id}
              x={toX(d.x0)}
              y={toY(d.z0)}
              width={toX(d.x1 - d.x0)}
              height={toY(d.z1 - d.z0)}
              fill={d.id === 'HOAN_KIEM' ? '#d8f0c4' : '#e2f2d8'}
              stroke="#ffffff"
              strokeWidth="0.7"
            />
          ))}
          {/* tile grid */}
          {Array.from({ length: 21 }, (_, i) => (
            <line key={`v${i}`} x1={i * 16} y1={0} x2={i * 16} y2={256} stroke="#ffffff" strokeWidth="0.35" opacity="0.9" />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 16} x2={320} y2={i * 16} stroke="#ffffff" strokeWidth="0.35" opacity="0.9" />
          ))}

          {/* lake + islands */}
          <ellipse cx={toX(LAKE.cx)} cy={toY(LAKE.cz)} rx={toX(LAKE.rx)} ry={toY(LAKE.rz)} fill="#7fd4ef" stroke="#4bb7d8" strokeWidth="0.8" />
          <circle cx={toX(2430)} cy={toY(1700)} r="1.8" fill="#5c8a4a" />
          <circle cx={toX(2400)} cy={toY(1315)} r="2.4" fill="#5c8a4a" />

          {/* POIs */}
          {pois.map((p) => (
            <circle key={p.id} cx={toX(p.x)} cy={toY(p.z)} r="1.15" fill={DOT_COLOR[p.type] ?? '#4e9b2e'} opacity="0.8" />
          ))}

          {/* quest markers */}
          {questPois.map((p) => (
            <g key={`q-${p.id}`}>
              <circle cx={toX(p.x)} cy={toY(p.z)} r="4.2" fill="#e8483f" opacity="0.22" />
              <circle cx={toX(p.x)} cy={toY(p.z)} r="2.4" fill="#e8483f" stroke="#fff" strokeWidth="1" />
            </g>
          ))}

          {/* player */}
          <g transform={`translate(${toX(playerRef.x)} ${toY(playerRef.z)}) rotate(${(playerRef.yaw * 180) / Math.PI})`}>
            <circle r="5" fill="#123a4b" opacity="0.18" />
            <path d="M0 -5 L3.4 3.4 L0 1.8 L-3.4 3.4 Z" fill="#123a4b" stroke="#fff" strokeWidth="0.8" />
          </g>

          <text x={toX(2400)} y={toY(2060)} fontSize="6.4" fontWeight="800" fill="#123a4b" textAnchor="middle">
            Hoàn Kiếm
          </text>
          <text x={toX(1900)} y={toY(700)} fontSize="5.6" fontWeight="700" fill="#3d6474" textAnchor="middle">
            Ba Đình
          </text>
          <text x={toX(3050)} y={toY(1750)} fontSize="5.6" fontWeight="700" fill="#3d6474" textAnchor="middle">
            Hai Bà Trưng
          </text>
          <text x={toX(1300)} y={toY(500)} fontSize="5.6" fontWeight="700" fill="#3d6474" textAnchor="middle">
            Tây Hồ
          </text>
          <text x={toX(4100)} y={toY(900)} fontSize="5.6" fontWeight="700" fill="#3d6474" textAnchor="middle">
            Long Biên
          </text>
        </svg>

        <div className="map-screen__legend">
          <span>
            <i style={{ background: '#e8483f' }} /> Nhiệm vụ
          </span>
          <span>
            <i style={{ background: '#0e7fa8' }} /> Điểm ngắm
          </span>
          <span>
            <i style={{ background: '#123a4b' }} /> Di tích
          </span>
          <span>
            <i style={{ background: '#d9a11f' }} /> Quán ăn
          </span>
          <span>
            <i style={{ background: '#4e9b2e' }} /> Cửa hàng
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--c-ink-muted)' }}>
            {Math.round(WORLD_WIDTH / 1000)} × {Math.round(WORLD_DEPTH / 1000)} km · 320 ô
          </span>
        </div>
      </div>
    </div>
  )
}
