/**
 * World Map Screen
 * Full Hà Nội map with fog of war, POIs, fast travel
 */

import { useState } from 'react'

interface POIMarker {
  id: string
  name: string
  type: 'landmark' | 'shop' | 'quest' | 'boss' | 'fast_travel' | 'undiscovered'
  x: number
  y: number
  discovered: boolean
  level?: number
}

interface Zone {
  id: string
  name: string
  unlocked: boolean
  level: number
  color: string
}

export function WorldMapView({ onClose }: { onClose: () => void }) {
  const [selectedPOI, setSelectedPOI] = useState<POIMarker | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [selectedZone, setSelectedZone] = useState<string>('zone_pho_co')
  
  const zones: Zone[] = [
    { id: 'zone_pho_co', name: 'Phố Cổ', unlocked: true, level: 1, color: '#4CAF50' },
    { id: 'zone_ho_tay', name: 'Hồ Tây', unlocked: true, level: 10, color: '#2196F3' },
    { id: 'zone_new_urban', name: 'Khu Mới', unlocked: false, level: 20, color: '#FF9800' }
  ]
  
  const pois: POIMarker[] = [
    { id: 'poi_1', name: 'Hồ Hoàn Kiếm', type: 'landmark', x: 50, y: 50, discovered: true },
    { id: 'poi_2', name: 'Đền Ngọc Sơn', type: 'landmark', x: 53, y: 48, discovered: true },
    { id: 'poi_3', name: 'Chợ Đêm', type: 'shop', x: 45, y: 55, discovered: true },
    { id: 'poi_4', name: 'Rùa Thần', type: 'boss', x: 51, y: 51, discovered: true, level: 10 },
    { id: 'poi_5', name: '???', type: 'undiscovered', x: 60, y: 45, discovered: false },
    { id: 'poi_6', name: '???', type: 'undiscovered', x: 40, y: 40, discovered: false },
    { id: 'poi_7', name: 'Bến xe', type: 'fast_travel', x: 35, y: 35, discovered: true },
    { id: 'poi_8', name: 'Nhiệm vụ', type: 'quest', x: 55, y: 55, discovered: true },
    { id: 'poi_9', name: 'Chùa Trấn Quốc', type: 'landmark', x: 70, y: 50, discovered: false },
    { id: 'poi_10', name: '???', type: 'undiscovered', x: 75, y: 55, discovered: false }
  ]
  
  const getPOIIcon = (type: POIMarker['type']) => {
    switch (type) {
      case 'landmark': return '🏛️'
      case 'shop': return '🛒'
      case 'quest': return '📜'
      case 'boss': return '⚔️'
      case 'fast_travel': return '🚌'
      case 'undiscovered': return '❓'
    }
  }
  
  const getPOIColor = (type: POIMarker['type']) => {
    switch (type) {
      case 'landmark': return '#2196F3'
      case 'shop': return '#FF9800'
      case 'quest': return '#FFC107'
      case 'boss': return '#E91E63'
      case 'fast_travel': return '#4CAF50'
      case 'undiscovered': return '#9E9E9E'
    }
  }
  
  const filteredPOIs = pois.filter(poi => {
    if (filter === 'all') return true
    return poi.type === filter
  })
  
  const discoveredCount = pois.filter(p => p.discovered).length
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 400,
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ 
          color: 'white', 
          fontFamily: "'Nunito', sans-serif",
          fontSize: '2rem',
          fontWeight: 900,
          margin: 0
        }}>
          🗺️ Bản Đồ Hà Nội
        </h2>
        <button 
          onClick={onClose}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Zone selector */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => zone.unlocked && setSelectedZone(zone.id)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '20px',
              background: selectedZone === zone.id ? zone.color : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: zone.unlocked ? 'none' : '2px dashed rgba(255,255,255,0.3)',
              cursor: zone.unlocked ? 'pointer' : 'not-allowed',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700,
              opacity: zone.unlocked ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {zone.name}
            {!zone.unlocked && <span style={{ fontSize: '0.75rem' }}>🔒 Lv.{zone.level}</span>}
          </button>
        ))}
      </div>
      
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Tất cả', icon: '📍' },
          { id: 'landmark', label: 'Địa danh', icon: '🏛️' },
          { id: 'shop', label: 'Cửa hàng', icon: '🛒' },
          { id: 'quest', label: 'Nhiệm vụ', icon: '📜' },
          { id: 'boss', label: 'Boss', icon: '⚔️' },
          { id: 'fast_travel', label: 'Di chuyển', icon: '🚌' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              background: filter === tab.id ? '#FFC107' : 'rgba(255,255,255,0.1)',
              color: filter === tab.id ? '#1A1A2E' : 'white',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Map Area */}
      <div style={{
        position: 'relative',
        flex: 1,
        minHeight: '400px',
        background: 'linear-gradient(135deg, #1A3A1A 0%, #2E5A2E 30%, #1A4A6A 70%, #0D2B45 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '3px solid rgba(255,193,7,0.5)',
        boxShadow: '0 0 30px rgba(255,193,7,0.2)'
      }}>
        {/* Grid overlay */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Fog of war overlay (circular mask around discovered areas) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 15%, rgba(0,0,0,0.7) 40%)',
          pointerEvents: 'none'
        }} />
        
        {/* POI Markers */}
        {filteredPOIs.map(poi => (
          <button
            key={poi.id}
            onClick={() => setSelectedPOI(poi)}
            style={{
              position: 'absolute',
              left: `${poi.x}%`,
              top: `${poi.y}%`,
              transform: 'translate(-50%, -50%)',
              width: poi.type === 'boss' ? '48px' : '36px',
              height: poi.type === 'boss' ? '48px' : '36px',
              borderRadius: '50%',
              background: getPOIColor(poi.type),
              border: poi.discovered ? '3px solid white' : '2px dashed rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: poi.type === 'boss' ? '0 0 20px rgba(233,30,99,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
              animation: poi.type === 'quest' ? 'pulse 2s ease-in-out infinite' : 'none',
              fontSize: poi.type === 'boss' ? '1.5rem' : '1.1rem',
              zIndex: 10,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
          >
            {getPOIIcon(poi.type)}
          </button>
        ))}
        
        {/* Player position indicator */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#FFC107',
          border: '3px solid white',
          boxShadow: '0 0 15px rgba(255,193,7,0.8)',
          zIndex: 11,
          animation: 'playerPulse 1.5s ease-in-out infinite'
        }} />
        
        {/* Selected POI detail */}
        {selectedPOI && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            color: 'white',
            minWidth: '300px',
            border: '2px solid rgba(255,193,7,0.5)',
            zIndex: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: getPOIColor(selectedPOI.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {getPOIIcon(selectedPOI.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem' }}>
                  {selectedPOI.discovered ? selectedPOI.name : 'Chưa khám phá'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                  {selectedPOI.type === 'boss' && `Cấp độ yêu cầu: ${selectedPOI.level}`}
                  {selectedPOI.type === 'landmark' && 'Địa danh lịch sử'}
                  {selectedPOI.type === 'shop' && 'Mua bán trao đổi'}
                  {selectedPOI.type === 'quest' && 'Có nhiệm vụ mới'}
                  {selectedPOI.type === 'fast_travel' && 'Di chuyển nhanh'}
                  {selectedPOI.type === 'undiscovered' && 'Khám phá để biết thêm'}
                </div>
              </div>
            </div>
            
            {selectedPOI.discovered && selectedPOI.type === 'fast_travel' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                🚌 Di Chuyển Đến Đây
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Stats bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        color: 'white',
        fontFamily: "'Nunito', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFC107' }}>
            {discoveredCount}/{pois.length}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Đã khám phá</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4CAF50' }}>3</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Zones</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2196F3' }}>2</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Fast Travel</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#E91E63' }}>1</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Boss</div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,193,7,0.7); }
          50% { box-shadow: 0 0 0 10px rgba(255,193,7,0); }
        }
        @keyframes playerPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(255,193,7,0.8); }
          50% { box-shadow: 0 0 25px rgba(255,193,7,1); }
        }
      `}</style>
    </div>
  )
}
