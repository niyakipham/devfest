/**
 * Main Game App Component
 * Entry point for Hanoi Legends RPG
 */

import { useEffect, useState } from 'react'
import { useGameStore } from './ui/store/gameStore'
import { MainScreen } from './ui/screens/MainScreen'
import { CharacterCreationScreen } from './ui/screens/CharacterCreationScreen'
import { GameScreen } from './ui/screens/GameScreen'
import './shared/styles/global.css'

export enum GamePhase {
  MAIN_MENU = 'MAIN_MENU',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

function App() {
  const { phase, setPhase, initializeGame } = useGameStore()
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Initialize game engine on mount
    initializeGame()
  }, [initializeGame])
  
  const handleStartGame = () => {
    setPhase(GamePhase.CHARACTER_CREATION)
  }
  
  const handleCharacterCreated = () => {
    setLoading(true)
    setPhase(GamePhase.LOADING)
    
    // Simulate loading world
    setTimeout(() => {
      setLoading(false)
      setPhase(GamePhase.PLAYING)
    }, 2000)
  }
  
  return (
    <div className="app-container">
      {phase === GamePhase.MAIN_MENU && (
        <MainScreen onStart={handleStartGame} />
      )}
      
      {phase === GamePhase.CHARACTER_CREATION && (
        <CharacterCreationScreen onComplete={handleCharacterCreated} />
      )}
      
      {phase === GamePhase.LOADING && (
        <LoadingScreen />
      )}
      
      {phase === GamePhase.PLAYING && (
        <GameScreen />
      )}
      
      {phase === GamePhase.PAUSED && (
        <PauseMenu />
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500
    }}>
      <h1 style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '3rem',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #FF5722, #FFC107)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '2rem'
      }}>
        HÀ NỘI LEGENDS
      </h1>
      
      <div style={{
        width: '300px',
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '9999px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '60%',
          height: '100%',
          background: 'linear-gradient(90deg, #FF5722, #FFC107)',
          borderRadius: '9999px',
          animation: 'loading 1.5s ease-in-out infinite'
        }} />
      </div>
      
      <p style={{
        color: 'rgba(255,255,255,0.7)',
        marginTop: '1rem',
        fontFamily: "'Nunito', sans-serif"
      }}>
        Đang tải thế giới Hà Nội...
      </p>
    </div>
  )
}

function PauseMenu() {
  const { setPhase } = useGameStore()
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 400
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '24px',
        padding: '2rem',
        minWidth: '300px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
      }}>
        <h2 style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#212121',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          Tạm Dừng
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setPhase(GamePhase.PLAYING)} style={{ width: '100%' }}>
            Tiếp Tục
          </button>
          <button className="btn btn-secondary" style={{ width: '100%' }}>
            Cài Đặt
          </button>
          <button className="btn btn-secondary" style={{ width: '100%' }}>
            Lưu Game
          </button>
          <button className="btn" style={{ 
            width: '100%', 
            background: '#F44336', 
            color: 'white' 
          }} onClick={() => setPhase(GamePhase.MAIN_MENU)}>
            Về Menu Chính
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
