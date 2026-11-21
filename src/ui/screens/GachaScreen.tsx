/**
 * Gacha/Summon Screen
 * Pull companions with pity system and animations
 */

import { useState } from 'react'

interface GachaSpecies {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  element: string
  icon: string
}

export function GachaScreen({ onClose }: { onClose: () => void }) {
  const [pulling, setPulling] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ species: GachaSpecies; isNew: boolean; isShiny: boolean } | null>(null)
  const [pityCount, setPityCount] = useState(0)
  const [multiPull, setMultiPull] = useState(false)
  const [multiResults, setMultiResults] = useState<Array<{ species: GachaSpecies; isNew: boolean; isShiny: boolean }>>([])
  const [currency] = useState({ xu: 5000, ngoc: 150 })
  
  const banner = {
    name: 'Linh Thú Tết - Giới Hạn',
    type: 'LIMITED',
    daysLeft: 21,
    featured: ['🐲', '🌸']
  }
  
  const rates = [
    { rarity: 'mythic', rate: '0.5%', color: '#E91E63', icon: '🌟' },
    { rarity: 'legendary', rate: '4%', color: '#FF9800', icon: '⭐' },
    { rarity: 'epic', rate: '10%', color: '#9C27B0', icon: '💜' },
    { rarity: 'rare', rate: '25%', color: '#2196F3', icon: '💙' },
    { rarity: 'common', rate: '60.5%', color: '#9E9E9E', icon: '🤍' }
  ]
  
  const speciesPool: GachaSpecies[] = [
    { id: '1', name: 'Rồng Thiêng', rarity: 'legendary', element: 'Thủy', icon: '🐉' },
    { id: '2', name: 'Phượng Hoàng', rarity: 'mythic', element: 'Hỏa', icon: '🔥' },
    { id: '3', name: 'Hoàng Trùng', rarity: 'epic', element: 'Mộc', icon: '🦗' },
    { id: '4', name: 'Cá Chép', rarity: 'rare', element: 'Thủy', icon: '🐟' },
    { id: '5', name: 'Mèo Mun', rarity: 'common', element: 'Thổ', icon: '🐱' },
    { id: '6', name: 'Chim Sẻ', rarity: 'common', element: 'Mộc', icon: '🐦' }
  ]
  
  const doPull = (count: number = 1) => {
    setPulling(true)
    setMultiPull(count > 1)
    
    setTimeout(() => {
      const results = Array.from({ length: count }, () => {
        const roll = Math.random() * 100
        let rarity: GachaSpecies['rarity'] = 'common'
        
        if (roll < 0.5 || pityCount >= 89) rarity = 'mythic'
        else if (roll < 4.5 || pityCount >= 80) rarity = 'legendary'
        else if (roll < 14.5 || pityCount >= 9) rarity = 'epic'
        else if (roll < 39.5) rarity = 'rare'
        
        const species = speciesPool.filter(s => s.rarity === rarity)
        const selected = species[Math.floor(Math.random() * species.length)] || speciesPool[0]
        
        return {
          species: selected,
          isNew: Math.random() < 0.3,
          isShiny: Math.random() < 0.05
        }
      })
      
      if (count === 1) {
        setLastResult(results[0])
        setShowResult(true)
      } else {
        setMultiResults(results)
        setShowResult(true)
      }
      
      setPityCount(prev => {
        const hasLegendary = results.some(r => r.species.rarity === 'legendary' || r.species.rarity === 'mythic')
        return hasLegendary ? 0 : prev + count
      })
      
      setPulling(false)
    }, 1500)
  }
  
  const rarityColors: Record<string, string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
    mythic: '#E91E63'
  }
  
  const rarityBg: Record<string, string> = {
    common: 'linear-gradient(135deg, #616161, #9E9E9E)',
    rare: 'linear-gradient(135deg, #1565C0, #42A5F5)',
    epic: 'linear-gradient(135deg, #6A1B9A, #AB47BC)',
    legendary: 'linear-gradient(135deg, #E65100, #FFA726)',
    mythic: 'linear-gradient(135deg, #880E4F, #F06292)'
  }
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #1A0A2E 0%, #16213E 50%, #0D1B2A 100%)',
      zIndex: 450,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255,193,7,0.3)'
      }}>
        <div>
          <div style={{ color: '#FFC107', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '2px', fontFamily: "'Nunito', sans-serif" }}>
            {banner.type}
          </div>
          <h1 style={{ 
            color: 'white', 
            fontFamily: "'Nunito', sans-serif",
            fontSize: '1.8rem',
            fontWeight: 900,
            margin: '0.25rem 0'
          }}>
            {banner.featured[0]} {banner.name} {banner.featured[1]}
          </h1>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            Còn {banner.daysLeft} ngày
          </div>
        </div>
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
      
      {/* Currency */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 2rem',
        justifyContent: 'flex-end'
      }}>
        <div style={{
          background: 'rgba(255,193,7,0.15)',
          border: '1px solid rgba(255,193,7,0.3)',
          borderRadius: '20px',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#FFC107',
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif"
        }}>
          🪙 {currency.xu.toLocaleString()}
        </div>
        <div style={{
          background: 'rgba(233,30,99,0.15)',
          border: '1px solid rgba(233,30,99,0.3)',
          borderRadius: '20px',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#E91E63',
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif"
        }}>
          💎 {currency.ngoc}
        </div>
      </div>
      
      {/* Pity Counter */}
      <div style={{
        padding: '0 2rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: "'Nunito', sans-serif" }}>
              🎯 Pity Counter (Legendary)
            </span>
            <span style={{ color: '#FFC107', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {pityCount}/90
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${(pityCount / 90) * 100}%`,
              background: 'linear-gradient(90deg, #FF9800, #FFC107)',
              borderRadius: '4px',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>
      
      {/* Summon Circle / Animation Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {!showResult && !pulling && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,193,7,0.3) 0%, rgba(255,193,7,0.05) 70%)',
              border: '3px solid rgba(255,193,7,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
              margin: '0 auto 2rem',
              animation: 'summonPulse 3s ease-in-out infinite',
              boxShadow: '0 0 60px rgba(255,193,7,0.3)'
            }}>
              🎴
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Nunito', sans-serif" }}>
              Nhấn triệu hồi để nhận linh thú!
            </div>
          </div>
        )}
        
        {pulling && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFC107, #FF9800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              animation: 'summonSpin 1s linear infinite',
              boxShadow: '0 0 80px rgba(255,193,7,0.8)'
            }}>
              ✨
            </div>
            <div style={{ color: '#FFC107', marginTop: '2rem', fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '1.2rem' }}>
              Đang triệu hồi...
            </div>
          </div>
        )}
        
        {/* Single result */}
        {showResult && lastResult && !multiPull && (
          <div style={{ textAlign: 'center', animation: 'resultReveal 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
            <div style={{
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: rarityBg[lastResult.species.rarity],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              margin: '0 auto 1.5rem',
              boxShadow: `0 0 60px ${rarityColors[lastResult.species.rarity]}80`,
              border: `4px solid ${rarityColors[lastResult.species.rarity]}`,
              position: 'relative'
            }}>
              {lastResult.isShiny && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '2rem' }}>✨</div>
              )}
              {lastResult.isNew && (
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: '#FF5722',
                  color: 'white',
                  padding: '2px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif"
                }}>
                  MỚI!
                </div>
              )}
              {lastResult.species.icon}
            </div>
            <div style={{ color: rarityColors[lastResult.species.rarity], fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Nunito', sans-serif", marginBottom: '0.25rem' }}>
              {lastResult.species.name.toUpperCase()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              {lastResult.species.element} • {lastResult.species.rarity.toUpperCase()}
              {lastResult.isShiny && ' • ✨ SHINY!'}
            </div>
            <button 
              onClick={() => setShowResult(false)}
              className="btn btn-primary"
              style={{ marginTop: '2rem' }}
            >
              Tiếp Tục
            </button>
          </div>
        )}
        
        {/* Multi-pull results */}
        {showResult && multiPull && multiResults.length > 0 && (
          <div style={{ padding: '0 2rem', animation: 'resultReveal 0.5s' }}>
            <h2 style={{ color: '#FFC107', textAlign: 'center', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>
              Kết Quả 10 Lần Triệu Hồi!
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', maxWidth: '700px', margin: '0 auto' }}>
              {multiResults.map((result, i) => (
                <div key={i} style={{
                  background: rarityBg[result.species.rarity],
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  border: `3px solid ${rarityColors[result.species.rarity]}`,
                  boxShadow: `0 0 20px ${rarityColors[result.species.rarity]}40`,
                  animation: `cardReveal 0.3s ${i * 0.1}s both`
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {result.species.icon}
                    {result.isShiny && '✨'}
                  </div>
                  <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
                    {result.species.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>
                    {result.species.rarity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowResult(false)}
              className="btn btn-primary"
              style={{ marginTop: '2rem', display: 'block', margin: '2rem auto 0' }}
            >
              Tiếp Tục
            </button>
          </div>
        )}
      </div>
      
      {/* Pull Buttons */}
      <div style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        borderTop: '2px solid rgba(255,193,7,0.2)'
      }}>
        <button
          onClick={() => doPull(1)}
          disabled={pulling}
          style={{
            padding: '1rem 2.5rem',
            borderRadius: '24px',
            background: pulling ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #FF9800, #FFC107)',
            border: 'none',
            color: pulling ? 'rgba(255,255,255,0.5)' : '#1A1A2E',
            fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            fontSize: '1.1rem',
            cursor: pulling ? 'not-allowed' : 'pointer',
            boxShadow: pulling ? 'none' : '0 4px 15px rgba(255,193,7,0.4)',
            transition: 'all 0.2s'
          }}
        >
          🎴 Triệu Hồi x1
          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
            150 Ngọc / 15.000 Xu
          </div>
        </button>
        
        <button
          onClick={() => doPull(10)}
          disabled={pulling}
          style={{
            padding: '1rem 2.5rem',
            borderRadius: '24px',
            background: pulling ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #E91E63, #FF5722)',
            border: 'none',
            color: pulling ? 'rgba(255,255,255,0.5)' : 'white',
            fontWeight: 900,
            fontFamily: "'Nunito', sans-serif",
            fontSize: '1.1rem',
            cursor: pulling ? 'not-allowed' : 'pointer',
            boxShadow: pulling ? 'none' : '0 4px 15px rgba(233,30,99,0.4)',
            transition: 'all 0.2s'
          }}
        >
          🎴 Triệu Hồi x10
          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>
            1350 Ngọc / 135.000 Xu
          </div>
        </button>
      </div>
      
      {/* Rates Info */}
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        {rates.map(r => (
          <div key={r.rarity} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{r.icon}</span>
            <span style={{ color: r.color, fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {r.rarity.toUpperCase()}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              {r.rate}
            </span>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes summonPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(255,193,7,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 80px rgba(255,193,7,0.5); }
        }
        @keyframes summonSpin {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          to { transform: rotate(360deg) scale(1); }
        }
        @keyframes resultReveal {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes cardReveal {
          from { transform: scale(0) rotate(180deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
