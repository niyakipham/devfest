/**
 * GameScreen - Main Gameplay Hub (Updated with all screens)
 * Integrates Battle, Map, Inventory, Companions, Quests, BattlePass, Gacha, Shop, Chat, Admin
 */

import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { BattleScreen } from './BattleScreen'
import { WorldMapView } from './WorldMapView'
import { BattlePassScreen } from './BattlePassScreen'
import { GachaScreen } from './GachaScreen'
import { AdminDashboard } from './AdminDashboard'

export function GameScreen() {
  const { 
    playerName, characterLevel, characterXP, currency,
    notifications, removeNotification, addXP, addCurrency, addNotification
  } = useGameStore()
  
  const [showInventory, setShowInventory] = useState(false)
  const [showCompanions, setShowCompanions] = useState(false)
  const [showQuests, setShowQuests] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [showBattle, setShowBattle] = useState(false)
  const [showBattlePass, setShowBattlePass] = useState(false)
  const [showGacha, setShowGacha] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  
  const [gameTime, setGameTime] = useState('06:00')
  const [playerHP] = useState(100)
  const [playerEnergy] = useState(80)
  
  const chatMessages = [
    { id: 1, sender: 'RongMaster', content: 'Ai muốn raid boss Rùa Thần ko?', channel: 'global', time: '06:15' },
    { id: 2, sender: 'LinhThuMaster', content: 'Mình đi! Level bao nhiêu?', channel: 'global', time: '06:16' },
    { id: 3, sender: 'SYSTEM', content: '🎉 Player7 đã thu phục Rồng Thiêng!', channel: 'system', time: '06:17' },
    { id: 4, sender: 'HoTayChill', content: 'Cần bán Kiếm Hiếm giá 5000xu', channel: 'global', time: '06:18' }
  ]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(prev => {
        const [h, m] = prev.split(':').map(Number)
        const newM = (m + 2) % 60
        const newH = newM < 2 ? (h + 1) % 24 : h
        return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    if (hour >= 5 && hour < 7) return { label: 'Bình Minh', color: '#FF9800', icon: '🌅' }
    if (hour >= 7 && hour < 11) return { label: 'Sáng', color: '#87CEEB', icon: '☀️' }
    if (hour >= 11 && hour < 13) return { label: 'Trưa', color: '#FFEB3B', icon: '🌞' }
    if (hour >= 13 && hour < 17) return { label: 'Chiều', color: '#FFC107', icon: '🌤️' }
    if (hour >= 17 && hour < 20) return { label: 'Tối', color: '#FF5722', icon: '🌆' }
    return { label: 'Đêm', color: '#1A237E', icon: '🌙' }
  }
  
  const tod = getTimeOfDay(gameTime)
  
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* 3D Game World */}
      <canvas 
        id="game-canvas" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 0,
          background: `linear-gradient(180deg, 
            ${tod.color}30 0%, 
            #87CEEB 25%, 
            #E0F7FF 50%, 
            #4CAF50 80%, 
            #388E3C 100%)`
        }}
      />
      
      {/* Mini-map */}
      <div style={{
        position: 'fixed', top: '1rem', left: '1rem', width: '110px', height: '110px',
        borderRadius: '50%', border: '3px solid #FFC107', overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 60%, #1565C0 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'white', fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ fontSize: '1.3rem' }}>📍</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>Phố Cổ</div>
          <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{tod.icon} {tod.label}</div>
        </div>
      </div>
      
      {/* Top-right: Time + Currency */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', zIndex: 100 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '20px',
          padding: '0.4rem 1rem', color: 'white', fontFamily: "'Nunito', sans-serif", fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
        }}>
          <span>{tod.icon}</span><span>{gameTime}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '20px',
            padding: '0.4rem 0.75rem', color: '#FFC107', fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem'
          }}>
            🪙 {currency.toLocaleString()}
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '20px',
            padding: '0.4rem 0.75rem', color: '#E91E63', fontFamily: "'Nunito', sans-serif", fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem'
          }}>
            💎 50
          </div>
        </div>
      </div>
      
      {/* Quest tracker top-center */}
      <div style={{
        position: 'fixed', top: '0.75rem', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px',
        padding: '0.4rem 1rem', color: 'white', fontFamily: "'Nunito', sans-serif",
        fontSize: '0.8rem', textAlign: 'center', zIndex: 100, border: '1px solid rgba(255,193,7,0.3)'
      }}>
        <div style={{ color: '#FFC107', fontWeight: 700, fontSize: '0.7rem' }}>📜 Ch.1: Thức Tỉnh</div>
        <div className="progress-bar" style={{ marginTop: '0.25rem', height: '4px', width: '200px' }}>
          <div className="progress-fill xp" style={{ width: '33%' }} />
        </div>
      </div>
      
      {/* Left: Player status */}
      <div style={{ position: 'fixed', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 100 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px',
          padding: '0.75rem', color: 'white', fontFamily: "'Nunito', sans-serif", minWidth: '140px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: '0.15rem' }}>{playerName || 'Player'}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.5rem' }}>Lv.{characterLevel}</div>
          
          <HPBar label="HP" value={playerHP} max={100} color="#4CAF50" />
          <div style={{ height: '4px' }} />
          <HPBar label="Energy" value={playerEnergy} max={100} color="#00BCD4" />
          <div style={{ height: '4px' }} />
          <HPBar label="XP" value={characterXP} max={100} color="#2196F3" />
        </div>
        
        {/* Companion quick slots */}
        <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          {['🐉', '🐢', '🔥'].map((icon, i) => (
            <div key={i} style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: i === 0 ? 'linear-gradient(135deg, #2196F3, #1565C0)' : 'rgba(255,255,255,0.08)',
              border: i === 0 ? '2px solid #FFC107' : '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', cursor: 'pointer'
            }}>
              {icon}
            </div>
          ))}
        </div>
      </div>
      
      {/* Right action buttons */}
      <div style={{ position: 'fixed', right: '1rem', bottom: '6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', zIndex: 100 }}>
        {[
          { icon: '⚔️', color: 'linear-gradient(135deg, #FF5722, #E91E63)', action: () => setShowBattle(true) },
          { icon: '✨', color: 'linear-gradient(135deg, #2196F3, #9C27B0)', action: () => {} },
          { icon: '🎒', color: 'linear-gradient(135deg, #4CAF50, #00BCD4)', action: () => setShowInventory(true) },
          { icon: '🏃', color: 'linear-gradient(135deg, #FF9800, #FFC107)', action: () => {} }
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            width: '54px', height: '54px', borderRadius: '50%', background: btn.color,
            border: 'none', cursor: 'pointer', fontSize: '1.4rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.4)', transition: 'transform 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {btn.icon}
          </button>
        ))}
      </div>
      
      {/* Bottom menu bar */}
      <div style={{ position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem', zIndex: 100 }}>
        {[
          { icon: '📋', label: 'Nhiệm Vụ', action: () => setShowQuests(true) },
          { icon: '🎒', label: 'Túi Đồ', action: () => setShowInventory(true) },
          { icon: '🐾', label: 'Linh Thú', action: () => setShowCompanions(true) },
          { icon: '🗺️', label: 'Bản Đồ', action: () => setShowMap(true) },
          { icon: '🎟️', label: 'Battle Pass', action: () => setShowBattlePass(true) },
          { icon: '🎴', label: 'Triệu Hồi', action: () => setShowGacha(true) },
          { icon: '💬', label: 'Chat', action: () => setChatOpen(true) },
          { icon: '⚙️', label: 'Menu', action: () => setShowPause(true) }
        ].map((item, i) => (
          <button key={i} onClick={item.action} style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)', color: 'white',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', padding: 0
          }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#FFC107' }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.5rem', marginTop: '1px', fontWeight: 600 }}>{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* Chat overlay */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '1rem', width: '320px',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          borderRadius: '16px', border: '1px solid rgba(255,193,7,0.3)',
          zIndex: 200, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '400px'
        }}>
          <div style={{
            padding: '0.75rem 1rem', background: 'rgba(255,193,7,0.1)',
            borderBottom: '1px solid rgba(255,193,7,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: '#FFC107', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>💬 Chat Toàn Server</span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {chatMessages.map(msg => (
              <div key={msg.id} style={{
                background: msg.channel === 'system' ? 'rgba(255,193,7,0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px', padding: '0.5rem 0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                  <span style={{ color: msg.channel === 'system' ? '#FFC107' : '#42A5F5', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'Nunito', sans-serif" }}>
                    {msg.sender}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '0.65rem' }}>{msg.time}</span>
                </div>
                <div style={{ color: 'white', fontSize: '0.85rem' }}>{msg.content}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <input placeholder="Nhập tin nhắn..." style={{
              width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', fontFamily: "'Nunito', sans-serif", outline: 'none', fontSize: '0.85rem'
            }} />
          </div>
        </div>
      )}
      
      {/* Shop overlay */}
      {showShop && <ShopOverlay onClose={() => setShowShop(false)} />}
      
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '4rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 300 }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{
            background: notif.type === 'success' ? 'linear-gradient(135deg, #4CAF50, #2E7D32)' :
                       notif.type === 'error' ? 'linear-gradient(135deg, #F44336, #C62828)' :
                       notif.type === 'reward' ? 'linear-gradient(135deg, #FFC107, #FF9800)' :
                       'linear-gradient(135deg, #2196F3, #1565C0)',
            color: 'white', borderRadius: '12px', padding: '0.75rem 1rem',
            minWidth: '250px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontFamily: "'Nunito', sans-serif",
            animation: 'slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{notif.title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{notif.message}</div>
          </div>
        ))}
      </div>
      
      {/* ===== FULL SCREEN OVERLAYS ===== */}
      {showBattle && <BattleScreen onBattleEnd={(won) => { setShowBattle(false); if (won) { addXP(50); addCurrency(100); addNotification({ id: `bw_${Date.now()}`, type: 'success', title: 'Chiến thắng! 🎉', message: '+50 XP, +100 Xu', duration: 4000 }) }}} />}
      {showMap && <WorldMapView onClose={() => setShowMap(false)} />}
      {showBattlePass && <BattlePassScreen onClose={() => setShowBattlePass(false)} />}
      {showGacha && <GachaScreen onClose={() => setShowGacha(false)} />}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      {showInventory && <InventoryOverlay onClose={() => setShowInventory(false)} />}
      {showCompanions && <CompanionsOverlay onClose={() => setShowCompanions(false)} />}
      {showQuests && <QuestsOverlay onClose={() => setShowQuests(false)} />}
      {showPause && <PauseOverlay onClose={() => setShowPause(false)} onAdmin={() => { setShowPause(false); setShowAdmin(true) }} onShop={() => { setShowPause(false); setShowShop(true) }} />}
      
      <style>{`
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}

function HPBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '1px', fontWeight: 600 }}>
        <span>{label}</span><span>{value}/{max}</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value/max)*100}%`, background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function OverlayBase({ title, onClose, children, maxWidth = '600px' }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: '24px', padding: '1.5rem', maxWidth, width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', animation: 'scaleIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.4rem', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InventoryOverlay({ onClose }: { onClose: () => void }) {
  const items = [
    { id: 1, icon: '🗡️', name: 'Kiếm Gỗ', qty: 1, rarity: 'common' },
    { id: 2, icon: '🧪', name: 'Thuốc Hồi Phục', qty: 5, rarity: 'common' },
    { id: 3, icon: '📜', name: 'Bản Đồ Cổ', qty: 1, rarity: 'rare' },
    { id: 4, icon: '🔮', name: 'Ngọc Rùa', qty: 1, rarity: 'legendary' },
    { id: 5, icon: '🍜', name: 'Phở Đặc Biệt', qty: 3, rarity: 'common' },
    { id: 6, icon: '🏮', name: 'Đèn Lồng', qty: 2, rarity: 'common' },
    { id: 7, icon: '⚔️', name: 'Kiếm Sắt', qty: 1, rarity: 'rare' },
    { id: 8, icon: '🛡️', name: 'Khiên Gỗ', qty: 1, rarity: 'common' },
  ]
  
  const rarityColors: Record<string, string> = { common: '#9E9E9E', rare: '#2196F3', epic: '#9C27B0', legendary: '#FF9800', mythic: '#E91E63' }
  
  return (
    <OverlayBase title="🎒 Túi Đồ (8/50)" onClose={onClose} maxWidth="700px">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem' }}>
        {items.map(item => (
          <div key={item.id} style={{
            background: 'white', borderRadius: '12px', padding: '0.75rem',
            border: `2px solid ${rarityColors[item.rarity]}`, aspectRatio: '1',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative', transition: 'transform 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <span style={{ fontSize: '2.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.65rem', textAlign: 'center', fontWeight: 600, marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{item.name}</span>
            {item.qty > 1 && <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#FF5722', color: 'white', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '8px', fontWeight: 700 }}>x{item.qty}</span>}
          </div>
        ))}
      </div>
    </OverlayBase>
  )
}

function CompanionsOverlay({ onClose }: { onClose: () => void }) {
  const companions = [
    { id: '1', name: 'Rồng Thiêng', level: 5, element: '💧', bond: 75, rarity: 'legendary' },
    { id: '2', name: 'Mèo Mun', level: 3, element: '🐱', bond: 40, rarity: 'common' },
    { id: '3', name: 'Chim Lạc', level: 7, element: '🦅', bond: 60, rarity: 'rare' }
  ]
  
  const rarityColors: Record<string, string> = { common: '#9E9E9E', rare: '#2196F3', epic: '#9C27B0', legendary: '#FF9800', mythic: '#E91E63' }
  
  return (
    <OverlayBase title="🐾 Linh Thú (3/150)" onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {companions.map(comp => (
          <div key={comp.id} style={{
            background: 'white', borderRadius: '16px', padding: '1rem', textAlign: 'center',
            border: `3px solid ${rarityColors[comp.rarity]}`, cursor: 'pointer', transition: 'transform 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
             onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `linear-gradient(135deg, ${rarityColors[comp.rarity]}, ${rarityColors[comp.rarity]}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.75rem' }}>
              {comp.element}
            </div>
            <div style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{comp.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#757575' }}>Lv.{comp.level}</div>
            <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${comp.bond}%`, background: 'linear-gradient(90deg, #FFC107, #FF5722)', borderRadius: '3px' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#757575', marginTop: '0.25rem' }}>Bond: {comp.bond}%</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#757575', fontSize: '0.85rem', fontFamily: "'Nunito', sans-serif" }}>
        Đã thu thập: <strong>3/150</strong> linh thú
      </div>
    </OverlayBase>
  )
}

function QuestsOverlay({ onClose }: { onClose: () => void }) {
  const quests = [
    { id: '1', title: 'Ch.1: Thức Tỉnh', progress: 60, type: 'main', reward: '500 XP', desc: 'Nhận linh vật đầu tiên' },
    { id: '2', title: 'Thử Thách Ẩm Thực', progress: 40, type: 'side', reward: '300 XP', desc: 'Thưởng thức 5 món đặc sản' },
    { id: '3', title: 'Thợ Săn Linh Thú', progress: 80, type: 'daily', reward: '200 XP', desc: 'Thu phục 5 linh vật hoang dã' }
  ]
  
  return (
    <OverlayBase title="📜 Nhật Ký Nhiệm Vụ" onClose={onClose} maxWidth="650px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {quests.map(quest => (
          <div key={quest.id} style={{
            background: 'white', borderRadius: '12px', padding: '1rem',
            borderLeft: `4px solid ${quest.type === 'main' ? '#FFC107' : quest.type === 'daily' ? '#4CAF50' : '#2196F3'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{quest.title}</span>
              <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '12px', background: quest.type === 'main' ? '#FFF3E0' : quest.type === 'daily' ? '#E8F5E9' : '#E3F2FD', color: quest.type === 'main' ? '#FF9800' : quest.type === 'daily' ? '#4CAF50' : '#2196F3', fontWeight: 700 }}>
                {quest.type === 'main' ? '✨ CHÍNH' : quest.type === 'daily' ? '🔄 HÀNG NGÀY' : '📌 PHỤ'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#757575', marginBottom: '0.5rem' }}>{quest.desc}</div>
            <div style={{ height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${quest.progress}%`, background: 'linear-gradient(90deg, #2196F3, #9C27B0)', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#757575' }}>{quest.progress}%</span>
              <span style={{ color: '#FF9800', fontWeight: 700 }}>🎁 {quest.reward}</span>
            </div>
          </div>
        ))}
      </div>
    </OverlayBase>
  )
}

function ShopOverlay({ onClose }: { onClose: () => void }) {
  const shopItems = [
    { id: '1', name: 'Thuốc Nhỏ', price: 50, icon: '🧪', category: 'consumable' },
    { id: '2', name: 'Thuốc Lớn', price: 200, icon: '🧪', category: 'consumable' },
    { id: '3', name: 'Lồng Thần', price: 100, icon: '🎯', category: 'companion' },
    { id: '4', name: 'Bản Đồ', price: 150, icon: '🗺️', category: 'equipment' },
    { id: '5', name: 'Áo Yếm', price: 5000, icon: '👘', category: 'cosmetic', currency: 'ngoc' },
    { id: '6', name: 'Cần Câu', price: 800, icon: '🎣', category: 'equipment' }
  ]
  
  return (
    <OverlayBase title="🛒 Cửa Hàng Phố Cổ" onClose={onClose} maxWidth="700px">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {shopItems.map(item => (
          <div key={item.id} style={{
            background: 'white', borderRadius: '12px', padding: '1rem',
            border: '2px solid #E0E0E0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFC107'; e.currentTarget.style.transform = 'translateY(-2px)' }}
             onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>{item.name}</div>
            <div style={{ color: item.currency === 'ngoc' ? '#E91E63' : '#FF9800', fontWeight: 700, marginTop: '0.5rem', fontSize: '0.85rem' }}>
              {item.currency === 'ngoc' ? '💎' : '🪙'} {item.price.toLocaleString()}
            </div>
            <button style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', borderRadius: '16px', background: '#FFC107', border: 'none', color: '#1A1A2E', fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', fontSize: '0.8rem' }}>
              Mua
            </button>
          </div>
        ))}
      </div>
    </OverlayBase>
  )
}

function PauseOverlay({ onClose, onAdmin, onShop }: { onClose: () => void; onAdmin: () => void; onShop: () => void }) {
  return (
    <OverlayBase title="⚙️ Menu" onClose={onClose} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button onClick={onShop} className="btn btn-primary" style={{ width: '100%' }}>🛒 Cửa Hàng</button>
        <button onClick={onAdmin} className="btn" style={{ width: '100%', background: '#2196F3', color: 'white' }}>🛡️ Admin Dashboard</button>
        <button className="btn btn-secondary" style={{ width: '100%' }}>💾 Lưu Game</button>
        <button className="btn btn-secondary" style={{ width: '100%' }}>📊 Thống Kê</button>
        <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>🎵 Âm Nhạc</label>
          <input type="range" defaultValue={70} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>🔊 Hiệu Ứng</label>
          <input type="range" defaultValue={80} style={{ width: '100%' }} />
        </div>
        <button className="btn" style={{ width: '100%', background: '#F44336', color: 'white', marginTop: '0.5rem' }}>🏠 Về Menu</button>
      </div>
    </OverlayBase>
  )
}
