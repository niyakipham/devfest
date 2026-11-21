/**
 * Character Creation Screen
 * Avatar customization + Starter companion selection
 */

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

interface AvatarConfig {
  skinTone: string
  hairStyle: string
  hairColor: string
  outfit: string
}

interface CompanionChoice {
  id: string
  name: string
  element: string
  elementIcon: string
  description: string
  stats: { hp: number; atk: number; spd: number }
  color: string
}

const STARTER_COMPANIONS: CompanionChoice[] = [
  {
    id: 'rong_thieng',
    name: 'Rồng Thiêng',
    element: 'Thủy',
    elementIcon: '💧',
    description: 'Linh thú rồng nước, bảo vệ sông hồ. Hậu duệ của Rồng Lạc Long Quân.',
    stats: { hp: 80, atk: 70, spd: 65 },
    color: '#2196F3'
  },
  {
    id: 'rua_than',
    name: 'Rùa Thần',
    element: 'Thủy',
    elementIcon: '🐢',
    description: 'Linh thú ngàn năm tuổi, bảo vệ Hồ Gươm. Từng giúp Lê Lợi đánh giặc.',
    stats: { hp: 100, atk: 50, spd: 30 },
    color: '#4CAF50'
  },
  {
    id: 'phuong_hoang',
    name: 'Phượng Hoàng',
    element: 'Hỏa',
    elementIcon: '🔥',
    description: 'Chim phượng hoàng lửa, biểu tượng của sự tái sinh và may mắn.',
    stats: { hp: 70, atk: 85, spd: 90 },
    color: '#FF5722'
  }
]

export function CharacterCreationScreen({ onComplete }: { onComplete: () => void }) {
  const { setPlayerName, setPlayerId, setCharacterId } = useGameStore()
  
  const [step, setStep] = useState(0) // 0: name, 1: avatar, 2: companion
  const [playerName, setLocalPlayerName] = useState('')
  const [avatar, setAvatar] = useState<AvatarConfig>({
    skinTone: '#FDBCB4',
    hairStyle: 'short',
    hairColor: '#2C1810',
    outfit: 'street'
  })
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionChoice | null>(null)
  
  const skinTones = ['#FDBCB4', '#F5C6A0', '#E0AC69', '#C68642', '#8D5524']
  const hairStyles = ['short', 'long', 'spiky', 'curly', 'mohawk']
  const hairColors = ['#2C1810', '#4A3728', '#D4A574', '#FFD700', '#FF4500', '#9C27B0']
  const outfits = ['street', 'traditional', 'sporty', 'casual']
  
  const handleCreate = () => {
    if (!playerName.trim() || !selectedCompanion) return
    
    const playerId = `player_${Date.now()}`
    const characterId = `char_${Date.now()}`
    
    setPlayerId(playerId)
    setCharacterId(characterId)
    setPlayerName(playerName)
    
    onComplete()
  }
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left: 3D Avatar Preview */}
      <div style={{
        flex: '0 0 60%',
        background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FF 60%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Simple avatar preview */}
        <div style={{
          width: '200px',
          height: '300px',
          position: 'relative'
        }}>
          {/* Body */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: '120px',
            background: avatar.outfit === 'traditional' ? '#E91E63' : 
                       avatar.outfit === 'sporty' ? '#2196F3' : '#FF5722',
            borderRadius: '12px 12px 8px 8px'
          }} />
          {/* Head */}
          <div style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '60px',
            background: avatar.skinTone,
            borderRadius: '50%'
          }} />
          {/* Hair */}
          <div style={{
            position: 'absolute',
            bottom: '155px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: avatar.hairStyle === 'mohawk' ? '20px' : '70px',
            height: avatar.hairStyle === 'long' ? '50px' : '30px',
            background: avatar.hairColor,
            borderRadius: avatar.hairStyle === 'mohawk' ? '10px 10px 0 0' : '50% 50% 0 0'
          }} />
        </div>
        
        {/* Companion preview */}
        {selectedCompanion && (
          <div style={{
            position: 'absolute',
            right: '15%',
            bottom: '20%',
            width: '80px',
            height: '80px',
            background: selectedCompanion.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            {selectedCompanion.elementIcon}
          </div>
        )}
      </div>
      
      {/* Right: Customization Panel */}
      <div style={{
        flex: 1,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {[0, 1, 2].map((s) => (
            <div key={s} style={{
              flex: 1,
              height: '4px',
              background: s <= step ? '#FFC107' : 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>
        
        {/* Step content */}
        {step === 0 && (
          <div>
            <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>
              Tên Nhân Vật
            </h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setLocalPlayerName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              maxLength={20}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.2rem',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontFamily: "'Nunito', sans-serif",
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FFC107'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            />
          </div>
        )}
        
        {step === 1 && (
          <div>
            <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>
              Tùy Chỉnh Ngoại Hình
            </h2>
            
            {/* Skin Tone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>
                Màu Da
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {skinTones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setAvatar({ ...avatar, skinTone: tone })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: tone,
                      border: avatar.skinTone === tone ? '3px solid #FFC107' : '2px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Hair Style */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>
                Kiểu Tóc
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {hairStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setAvatar({ ...avatar, hairStyle: style })}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      background: avatar.hairStyle === style ? '#FFC107' : 'rgba(255,255,255,0.1)',
                      color: avatar.hairStyle === style ? '#1A1A2E' : 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 600
                    }}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Hair Color */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>
                Màu Tóc
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {hairColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatar({ ...avatar, hairColor: color })}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: color,
                      border: avatar.hairColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Outfit */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.5rem' }}>
                Trang Phục
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {outfits.map((outfit) => (
                  <button
                    key={outfit}
                    onClick={() => setAvatar({ ...avatar, outfit })}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      background: avatar.outfit === outfit ? '#FFC107' : 'rgba(255,255,255,0.1)',
                      color: avatar.outfit === outfit ? '#1A1A2E' : 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 600
                    }}
                  >
                    {outfit.charAt(0).toUpperCase() + outfit.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div>
            <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '0.5rem' }}>
              Chọn Linh Thú Đầu Tiên
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              Mỗi linh thú có sức mạnh và tính cách riêng
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {STARTER_COMPANIONS.map((companion) => (
                <div
                  key={companion.id}
                  onClick={() => setSelectedCompanion(companion)}
                  style={{
                    padding: '1rem',
                    borderRadius: '16px',
                    background: selectedCompanion?.id === companion.id 
                      ? 'rgba(255,193,7,0.2)' 
                      : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${selectedCompanion?.id === companion.id ? '#FFC107' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: companion.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem'
                    }}>
                      {companion.elementIcon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
                        {companion.name}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        {companion.element} • HP:{companion.stats.hp} ATK:{companion.stats.atk} SPD:{companion.stats.spd}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {companion.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', paddingTop: '2rem' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              ← Quay Lại
            </button>
          )}
          
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={step === 0 && !playerName.trim()}
            >
              Tiếp Theo →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!selectedCompanion}
            >
              ✨ Tạo Nhân Vật
            </button>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
