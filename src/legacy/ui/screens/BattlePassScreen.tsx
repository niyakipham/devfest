/**
 * Battle Pass Screen
 * Seasonal rewards, free/premium tracks, progression
 */

import { useState } from 'react'

interface BattlePassTier {
  tier: number
  freeReward: { type: string; name: string; icon: string }
  premiumReward: { type: string; name: string; icon: string }
}

export function BattlePassScreen({ onClose }: { onClose: () => void }) {
  const [isPremium] = useState(false)
  const [playerLevel] = useState(23)
  const [playerXP] = useState(450)
  const xpToNext = 500
  
  const season = {
    name: 'Mùa Xuân - Tết Nguyên Đán',
    theme: 'Tết',
    daysLeft: 45,
    hoursLeft: 12,
    icon: '🧧'
  }
  
  const generateTiers = (): BattlePassTier[] => {
    const tiers: BattlePassTier[] = []
    const icons = ['🪙', '🧪', '⚔️', '🛡️', '👘', '🐉', '🎆', '🏮', '💎', '🏆']
    
    for (let i = 1; i <= 30; i++) {
      tiers.push({
        tier: i,
        freeReward: {
          type: i % 10 === 0 ? 'currency' : 'item',
          name: i % 10 === 0 ? '500 Xu' : 'Thuốc',
          icon: i % 10 === 0 ? '🪙' : icons[i % icons.length]
        },
        premiumReward: {
          type: i % 5 === 0 ? 'skin' : i % 10 === 0 ? 'currency' : 'item',
          name: i % 5 === 0 ? 'Skin Rồng' : i % 10 === 0 ? '50 Ngọc' : 'Hộp quà',
          icon: i % 5 === 0 ? '🐉' : i % 10 === 0 ? '💎' : '🎁'
        }
      })
    }
    return tiers
  }
  
  const tiers = generateTiers()
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(12px)',
      zIndex: 450,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #C62828, #FF5722)',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid #FFC107'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{season.icon}</span>
            <div>
              <h1 style={{ 
                color: 'white', 
                fontFamily: "'Nunito', sans-serif",
                fontSize: '1.8rem',
                fontWeight: 900,
                margin: 0
              }}>
                {season.name}
              </h1>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                Còn {season.daysLeft} ngày {season.hoursLeft} giờ
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Player Progress */}
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        padding: '1rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFC107, #FF9800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#1A1A2E',
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 0 20px rgba(255,193,7,0.5)'
            }}>
              {playerLevel}
            </div>
            <div>
              <div style={{ color: 'white', fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '1.1rem' }}>
                Cấp độ Battle Pass
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                {playerXP}/{xpToNext} XP đến cấp tiếp theo
              </div>
            </div>
          </div>
          
          {!isPremium && (
            <button style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #FFC107, #FF9800)',
              border: 'none',
              color: '#1A1A2E',
              fontWeight: 900,
              fontFamily: "'Nunito', sans-serif",
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,193,7,0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ⭐ Mở Khóa Premium - 299.000₫
            </button>
          )}
        </div>
        
        {/* XP Progress Bar */}
        <div style={{
          height: '12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '6px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${(playerXP / xpToNext) * 100}%`,
            background: 'linear-gradient(90deg, #FFC107, #FF9800)',
            borderRadius: '6px',
            transition: 'width 0.5s ease-out',
            boxShadow: '0 0 10px rgba(255,193,7,0.5)'
          }} />
          {/* Level marker */}
          <div style={{
            position: 'absolute',
            top: '-5px',
            left: `${(playerXP / xpToNext) * 100}%`,
            transform: 'translateX(-50%)',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#FFC107',
            border: '3px solid white',
            boxShadow: '0 0 10px rgba(255,193,7,0.8)',
            animation: 'markerPulse 1.5s ease-in-out infinite'
          }} />
        </div>
      </div>
      
      {/* Track Toggle */}
      <div style={{
        display: 'flex',
        padding: '1rem 2rem',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button style={{
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          background: '#4CAF50',
          border: 'none',
          color: 'white',
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif"
        }}>
          🆓 Miễn Phí
        </button>
        <button style={{
          padding: '0.5rem 1.5rem',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.1)',
          border: '2px dashed rgba(255,193,7,0.5)',
          color: '#FFC107',
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif"
        }}>
          ⭐ Premium
        </button>
      </div>
      
      {/* Tier Track - Horizontal Scroll */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content' }}>
          {tiers.map(tier => {
            const isUnlocked = tier.tier <= playerLevel
            const isCurrent = tier.tier === playerLevel + 1
            
            return (
              <div key={tier.tier} style={{
                width: '120px',
                flexShrink: 0,
                position: 'relative'
              }}>
                {/* Connector line */}
                {tier.tier < tiers.length && (
                  <div style={{
                    position: 'absolute',
                    top: '30px',
                    left: '100%',
                    width: '1rem',
                    height: '4px',
                    background: isUnlocked ? '#FFC107' : 'rgba(255,255,255,0.2)',
                    zIndex: 1
                  }} />
                )}
                
                {/* Tier number */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  color: isCurrent ? '#FFC107' : 'rgba(255,255,255,0.5)',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  Cấp {tier.tier}
                </div>
                
                {/* Free reward */}
                <div style={{
                  background: isUnlocked ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isUnlocked ? '#4CAF50' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  padding: '0.75rem',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                  opacity: isUnlocked ? 1 : 0.5
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{tier.freeReward.icon}</div>
                  <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{tier.freeReward.name}</div>
                  {isUnlocked && <div style={{ color: '#4CAF50', fontSize: '0.7rem', marginTop: '0.25rem' }}>✅ Đã nhận</div>}
                </div>
                
                {/* Premium reward */}
                <div style={{
                  background: isPremium && isUnlocked ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.03)',
                  border: `2px solid ${isPremium && isUnlocked ? '#FFC107' : 'rgba(255,193,7,0.3)'}`,
                  borderRadius: '12px',
                  padding: '0.75rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {!isPremium && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#1A1A2E',
                      border: '2px solid #FFC107',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem'
                    }}>
                      🔒
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '0.25rem', opacity: isPremium ? 1 : 0.4 }}>
                    {tier.premiumReward.icon}
                  </div>
                  <div style={{ color: isPremium ? '#FFC107' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {tier.premiumReward.name}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* How to earn XP */}
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-around',
        color: 'white',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '0.85rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>⚔️</div>
          <div>Thắng trận đấu</div>
          <div style={{ color: '#FFC107', fontWeight: 700 }}>+30 XP</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>📜</div>
          <div>Hoàn thành nhiệm vụ</div>
          <div style={{ color: '#FFC107', fontWeight: 700 }}>+50 XP</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>🎯</div>
          <div>Nhiệm vụ hàng ngày</div>
          <div style={{ color: '#FFC107', fontWeight: 700 }}>+20 XP</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem' }}>🏆</div>
          <div>Sự kiện đặc biệt</div>
          <div style={{ color: '#FFC107', fontWeight: 700 }}>+100 XP</div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes markerPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(255,193,7,0.8); }
          50% { box-shadow: 0 0 20px rgba(255,193,7,1); }
        }
      `}</style>
    </div>
  )
}
