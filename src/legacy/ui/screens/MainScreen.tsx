/**
 * Main Menu Screen
 * Animated Hà Nội skyline at golden hour with parallax layers
 */

import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

export function MainScreen({ onStart }: { onStart: () => void }) {
  const [showCredits, setShowCredits] = useState(false)
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FF 40%, #4CAF50 70%, #388E3C 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      zIndex: 0
    }}>
      {/* Animated background layers */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,235,59,0.3) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite'
      }} />
      
      {/* Cloud layer */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: 0,
        right: 0,
        height: '100px',
        background: 'repeating-linear-gradient(90deg, transparent, transparent 200px, rgba(255,255,255,0.3) 200px, rgba(255,255,255,0.3) 400px)',
        animation: 'cloudMove 30s linear infinite'
      }} />
      
      {/* Logo */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          fontSize: '1rem',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          color: 'rgba(255,255,255,0.8)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}>
          Chào mừng đến với
        </div>
        
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 50%, #FFC107 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          lineHeight: 1.1,
          margin: 0
        }}>
          HÀ NỘI
        </h1>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          lineHeight: 1.1,
          margin: 0,
          marginTop: '-0.5rem'
        }}>
          LEGENDS
        </h1>
        
        <div style={{
          fontSize: '1rem',
          fontFamily: "'Nunito', sans-serif",
          color: 'rgba(255,255,255,0.9)',
          marginTop: '1rem',
          fontStyle: 'italic'
        }}>
          Khám phá linh thú giữa lòng thủ đô
        </div>
      </div>
      
      {/* Menu Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: 'min(320px, 80vw)',
        position: 'relative',
        zIndex: 10
      }}>
        <button
          onClick={onStart}
          className="btn btn-primary"
          style={{
            width: '100%',
            height: '64px',
            fontSize: '1.2rem',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        >
          ▶ CHƠI NGAY
        </button>
        
        <button className="btn btn-secondary" style={{ width: '100%', height: '56px' }}>
          NHÂN VẬT
        </button>
        
        <button className="btn btn-secondary" style={{ width: '100%', height: '56px' }}>
          CÀI ĐẶT
        </button>
        
        <button 
          onClick={() => setShowCredits(!showCredits)}
          className="btn"
          style={{ 
            width: '100%', 
            height: '48px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            fontSize: '0.9rem'
          }}
        >
          GIỚI THIỆU
        </button>
      </div>
      
      {/* Bottom info */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.8rem',
        fontFamily: "'Nunito', sans-serif"
      }}>
        <span>v1.0.0</span>
        <span>•</span>
        <span>© 2026 Hanoi Legends Studio</span>
        <span>•</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span>🐦</span>
          <span>📘</span>
          <span>📸</span>
        </div>
      </div>
      
      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
      
      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes cloudMove {
          from { transform: translateX(0); }
          to { transform: translateX(400px); }
        }
      `}</style>
    </div>
  )
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem' }}>Giới Thiệu</h2>
        <p style={{ lineHeight: 1.6, color: '#757575' }}>
          <strong>Hà Nội Legends</strong> là game nhập vai thế giới mở lấy bối cảnh thủ đô Hà Nội.
          Khám phá 20km² bản đồ, thu thập 150+ linh thú dựa trên thần thoại Việt Nam,
          và bảo vệ thành phố khỏi thế lực bóng tối.
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}
