/**
 * Battle Screen - Turn-based companion battle
 * Stylized cartoon battle UI
 */

import { useState, useEffect } from 'react'
import { Element } from '../../modules/companion/CompanionManager'

interface BattleCompanion {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  element: Element
  moves: BattleMove[]
  sprite: string
}

interface BattleMove {
  id: string
  name: string
  element: Element
  power: number
  pp: number
  maxPp: number
}

interface BattleLog {
  id: string
  message: string
  type: 'info' | 'damage' | 'effectiveness' | 'heal'
}

export function BattleScreen({ onBattleEnd }: { onBattleEnd: (won: boolean) => void }) {
  const [playerCompanion, setPlayerCompanion] = useState<BattleCompanion>({
    id: 'p1',
    name: 'Rồng Thiêng',
    level: 8,
    hp: 85,
    maxHp: 100,
    element: Element.THUY,
    moves: [
      { id: 'm1', name: 'Thủy Long Quyền', element: Element.THUY, power: 60, pp: 20, maxPp: 20 },
      { id: 'm2', name: 'Rồng Cuốn', element: Element.THUY, power: 40, pp: 30, maxPp: 30 },
      { id: 'm3', name: 'Thủy Trị', element: Element.THUY, power: 80, pp: 10, maxPp: 10 },
      { id: 'm4', name: ' Né', element: Element.THO, power: 0, pp: 15, maxPp: 15 }
    ],
    sprite: '🐉'
  })
  
  const [enemyCompanion, setEnemyCompanion] = useState<BattleCompanion>({
    id: 'e1',
    name: 'Ma Cà Rồng',
    level: 7,
    hp: 70,
    maxHp: 90,
    element: Element.HOA,
    moves: [
      { id: 'e1', name: 'Hỏa Phượng', element: Element.HOA, power: 55, pp: 20, maxPp: 20 }
    ],
    sprite: '👹'
  })
  
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([
    { id: '1', message: 'Ma Cà Rồng hoang dã xuất hiện!', type: 'info' }
  ])
  
  const [selectedMove, setSelectedMove] = useState<number | null>(null)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [battleEnded, setBattleEnded] = useState(false)
  const [showEffectiveness, setShowEffectiveness] = useState<string | null>(null)
  
  // Element advantage: Thủy > Hỏa
  const getElementAdvantageText = (atkElement: Element, defElement: Element): { text: string; multiplier: number } => {
    const advantages: Record<Element, Element> = {
      [Element.KIM]: Element.MOC,
      [Element.MOC]: Element.THUY,
      [Element.THUY]: Element.HOA,
      [Element.HOA]: Element.THO,
      [Element.THO]: Element.KIM
    }
    
    if (advantages[atkElement] === defElement) return { text: 'Hiệu quả lắm! 💥', multiplier: 2 }
    if (advantages[defElement] === atkElement) return { text: 'Không hiệu quả... 😔', multiplier: 0.5 }
    return { text: '', multiplier: 1 }
  }
  
  const addLog = (message: string, type: BattleLog['type'] = 'info') => {
    setBattleLogs(prev => [...prev.slice(-5), { id: `${Date.now()}`, message, type }])
  }
  
  const playerAttack = (move: BattleMove) => {
    if (!isPlayerTurn || isAnimating || move.pp <= 0) return
    
    setIsAnimating(true)
    
    setTimeout(() => {
      const advantage = getElementAdvantageText(move.element, enemyCompanion.element)
      const damage = Math.floor(move.power * advantage.multiplier * (0.9 + Math.random() * 0.2))
      
      addLog(`${playerCompanion.name} dùng ${move.name}!`, 'info')
      
      setTimeout(() => {
        const newHp = Math.max(0, enemyCompanion.hp - damage)
        setEnemyCompanion(prev => ({ ...prev, hp: newHp }))
        addLog(`Gây ${damage} sát thương!`, 'damage')
        
        if (advantage.text) {
          setShowEffectiveness(advantage.text)
          setTimeout(() => setShowEffectiveness(null), 1500)
        }
        
        // Reduce PP
        setPlayerCompanion(prev => ({
          ...prev,
          moves: prev.moves.map(m => m.id === move.id ? { ...m, pp: m.pp - 1 } : m)
        }))
        
        if (newHp <= 0) {
          setTimeout(() => {
            addLog('Chiến thắng! 🎉', 'info')
            setBattleEnded(true)
            setTimeout(() => onBattleEnd(true), 2000)
          }, 500)
        } else {
          setIsPlayerTurn(false)
          setTimeout(() => enemyAttack(), 1000)
        }
        
        setIsAnimating(false)
      }, 600)
    }, 300)
  }
  
  const enemyAttack = () => {
    if (battleEnded) return
    
    const move = enemyCompanion.moves[0]
    const advantage = getElementAdvantageText(move.element, playerCompanion.element)
    const damage = Math.floor(move.power * advantage.multiplier * (0.9 + Math.random() * 0.2))
    
    addLog(`${enemyCompanion.name} dùng ${move.name}!`, 'info')
    
    setTimeout(() => {
      const newHp = Math.max(0, playerCompanion.hp - damage)
      setPlayerCompanion(prev => ({ ...prev, hp: newHp }))
      addLog(`Nhận ${damage} sát thương!`, 'damage')
      
      if (advantage.text) {
        setShowEffectiveness(advantage.text)
        setTimeout(() => setShowEffectiveness(null), 1500)
      }
      
      if (newHp <= 0) {
        addLog('Bị đánh bại... 😢', 'info')
        setBattleEnded(true)
        setTimeout(() => onBattleEnd(false), 2000)
      } else {
        setIsPlayerTurn(true)
      }
    }, 600)
  }
  
  const useItem = () => {
    if (!isPlayerTurn || isAnimating) return
    setIsAnimating(true)
    
    setTimeout(() => {
      const heal = 30
      const newHp = Math.min(playerCompanion.maxHp, playerCompanion.hp + heal)
      setPlayerCompanion(prev => ({ ...prev, hp: newHp }))
      addLog(`Hồi phục ${heal} HP! 💚`, 'heal')
      setIsPlayerTurn(false)
      setTimeout(() => enemyAttack(), 1000)
      setIsAnimating(false)
    }, 300)
  }
  
  const tryCapture = () => {
    if (!isPlayerTurn || isAnimating) return
    setIsAnimating(true)
    
    setTimeout(() => {
      addLog('Ném Lồng Thần... 🎯', 'info')
      
      setTimeout(() => {
        const hpPercent = enemyCompanion.hp / enemyCompanion.maxHp
        const captureRate = (1 - hpPercent) * 0.8 + 0.1
        const success = Math.random() < captureRate
        
        if (success) {
          addLog('Thu phục thành công! 🎉', 'info')
          setBattleEnded(true)
          setTimeout(() => onBattleEnd(true), 2000)
        } else {
          addLog('Thu phục thất bại! 😔', 'info')
          setIsPlayerTurn(false)
          setTimeout(() => enemyAttack(), 1000)
        }
        
        setIsAnimating(false)
      }, 800)
    }, 300)
  }
  
  const runAway = () => {
    addLog('Chạy thoát! 🏃', 'info')
    setTimeout(() => onBattleEnd(false), 500)
  }
  
  const hpPercent = (hp: number, max: number) => (hp / max) * 100
  const hpColor = (percent: number) => 
    percent > 50 ? '#4CAF50' : percent > 20 ? '#FF9800' : '#F44336'
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #FF9800 0%, #FF5722 30%, #4CAF50 70%, #2E7D32 100%)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 500,
      overflow: 'hidden'
    }}>
      {/* Battle Arena */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem'
      }}>
        {/* Enemy (top right) */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '15%',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '0.75rem 1.25rem',
            color: 'white',
            marginBottom: '1rem',
            minWidth: '200px',
            textAlign: 'left',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
                {enemyCompanion.name}
              </span>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                Lv.{enemyCompanion.level}
              </span>
            </div>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div className="progress-fill hp" style={{ 
                width: `${hpPercent(enemyCompanion.hp, enemyCompanion.maxHp)}%`,
                background: hpColor(hpPercent(enemyCompanion.hp, enemyCompanion.maxHp))
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
              {enemyCompanion.hp}/{enemyCompanion.maxHp} HP
            </div>
          </div>
          
          <div style={{
            fontSize: '6rem',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            animation: isAnimating && !isPlayerTurn ? 'shake 0.5s' : 'float 3s ease-in-out infinite'
          }}>
            {enemyCompanion.sprite}
          </div>
        </div>
        
        {/* Player companion (bottom left) */}
        <div style={{
          position: 'absolute',
          bottom: '35%',
          left: '10%',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '7rem',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            animation: isAnimating && isPlayerTurn ? 'attack 0.5s' : 'float 3s ease-in-out infinite'
          }}>
            {playerCompanion.sprite}
          </div>
        </div>
        
        {/* Player HP Bar (top left) */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          padding: '0.75rem 1.25rem',
          color: 'white',
          minWidth: '250px',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {playerCompanion.name}
            </span>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Lv.{playerCompanion.level}
            </span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <div className="progress-fill hp" style={{ 
              width: `${hpPercent(playerCompanion.hp, playerCompanion.maxHp)}%`,
              background: hpColor(hpPercent(playerCompanion.hp, playerCompanion.maxHp)),
              transition: 'width 0.5s ease-out'
            }} />
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
            {playerCompanion.hp}/{playerCompanion.maxHp} HP
          </div>
        </div>
        
        {/* Effectiveness popup */}
        {showEffectiveness && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#FFC107',
            padding: '1rem 2rem',
            borderRadius: '16px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '1.5rem',
            animation: 'popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            zIndex: 10
          }}>
            {showEffectiveness}
          </div>
        )}
      </div>
      
      {/* Battle Log */}
      <div style={{
        position: 'absolute',
        top: '45%',
        left: '1rem',
        width: '300px',
        maxHeight: '120px',
        overflow: 'auto',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        borderRadius: '12px',
        padding: '0.75rem',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '0.85rem',
        color: 'white'
      }}>
        {battleLogs.map((log) => (
          <div key={log.id} style={{
            marginBottom: '0.25rem',
            color: log.type === 'damage' ? '#FF5722' :
                   log.type === 'heal' ? '#4CAF50' :
                   log.type === 'effectiveness' ? '#FFC107' : 'white',
            fontWeight: log.type !== 'info' ? 700 : 400
          }}>
            {log.message}
          </div>
        ))}
      </div>
      
      {/* Bottom Action Panel */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
        borderTop: '3px solid rgba(255,255,255,0.2)'
      }}>
        {!selectedMove ? (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedMove(0)}
              disabled={!isPlayerTurn || isAnimating || battleEnded}
              className="btn btn-primary"
              style={{ minWidth: '140px' }}
            >
              ⚔️ Đánh
            </button>
            <button
              onClick={useItem}
              disabled={!isPlayerTurn || isAnimating || battleEnded}
              className="btn"
              style={{ 
                minWidth: '140px',
                background: '#4CAF50',
                color: 'white'
              }}
            >
              🎒 Vật Phẩm
            </button>
            <button
              onClick={tryCapture}
              disabled={!isPlayerTurn || isAnimating || battleEnded}
              className="btn"
              style={{ 
                minWidth: '140px',
                background: '#FFC107',
                color: '#1A1A2E'
              }}
            >
              🎯 Lồng Thần
            </button>
            <button
              onClick={runAway}
              disabled={!isPlayerTurn || isAnimating || battleEnded}
              className="btn btn-secondary"
              style={{ minWidth: '140px' }}
            >
              🏃 Chạy
            </button>
          </div>
        ) : (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.75rem',
              color: 'white',
              fontFamily: "'Nunito', sans-serif"
            }}>
              <span style={{ fontWeight: 700 }}>Chọn chiêu thức:</span>
              <button 
                onClick={() => setSelectedMove(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FFC107', 
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif"
                }}
              >
                ← Quay lại
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {playerCompanion.moves.map((move, i) => (
                <button
                  key={move.id}
                  onClick={() => {
                    playerAttack(move)
                    setSelectedMove(null)
                  }}
                  disabled={move.pp <= 0 || !isPlayerTurn || isAnimating}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: move.pp <= 0 ? 'rgba(255,255,255,0.1)' : 
                               move.element === Element.THUY ? '#2196F3' :
                               move.element === Element.HOA ? '#FF5722' :
                               move.element === Element.MOC ? '#4CAF50' :
                               move.element === Element.KIM ? '#9E9E9E' : '#8D6E63',
                    color: 'white',
                    border: 'none',
                    cursor: move.pp <= 0 ? 'not-allowed' : 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 600,
                    textAlign: 'left',
                    opacity: move.pp <= 0 ? 0.5 : 1
                  }}
                >
                  <div>{move.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    PP: {move.pp}/{move.maxPp} • POW: {move.power}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes attack {
          0% { transform: translateX(0); }
          50% { transform: translateX(30px); }
          100% { transform: translateX(0); }
        }
        @keyframes popIn {
          from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes damageFloat {
          from { transform: translate(-50%, -50%); opacity: 1; }
          to { transform: translate(-50%, -100px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
