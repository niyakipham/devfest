/**
 * Reusable UI Components
 * Design system components for consistent styling
 */

import { useState, useEffect, ReactNode } from 'react'

// === TOAST NOTIFICATION ===
export function Toast({ 
  type, 
  title, 
  message, 
  onDismiss 
}: { 
  type: 'success' | 'error' | 'info' | 'reward'
  title: string
  message: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])
  
  const bgColors = {
    success: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
    error: 'linear-gradient(135deg, #F44336, #C62828)',
    info: 'linear-gradient(135deg, #2196F3, #1565C0)',
    reward: 'linear-gradient(135deg, #FFC107, #FF9800)'
  }
  
  return (
    <div
      className="toast"
      style={{
        background: bgColors[type],
        animation: 'slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        position: 'relative'
      }}
    >
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        ✕
      </button>
      <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontFamily: "'Nunito', sans-serif" }}>
        {title}
      </div>
      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{message}</div>
    </div>
  )
}

// === PROGRESS BAR ===
export function ProgressBar({ 
  value, 
  max, 
  type = 'xp',
  showLabel = true 
}: { 
  value: number
  max: number
  type?: 'hp' | 'xp' | 'bond' | 'energy'
  showLabel?: boolean
}) {
  const percent = (value / max) * 100
  
  const colors = {
    hp: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    xp: 'linear-gradient(90deg, #2196F3, #9C27B0)',
    bond: 'linear-gradient(90deg, #FFC107, #FF5722)',
    energy: 'linear-gradient(90deg, #00BCD4, #2196F3)'
  }
  
  return (
    <div>
      {showLabel && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.75rem',
          marginBottom: '2px',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600
        }}>
          <span>{type.toUpperCase()}</span>
          <span>{Math.floor(value)}/{max}</span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className={`progress-fill ${type}`}
          style={{ 
            width: `${Math.min(100, percent)}%`,
            background: colors[type]
          }} 
        />
      </div>
    </div>
  )
}

// === RARITY BADGE ===
export function RarityBadge({ rarity }: { rarity: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    common: { bg: '#E0E0E0', text: '#616161', border: '#9E9E9E' },
    rare: { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
    epic: { bg: '#F3E5F5', text: '#6A1B9A', border: '#9C27B0' },
    legendary: { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
    mythic: { bg: '#FCE4EC', text: '#C2185B', border: '#E91E63' }
  }
  
  const c = colors[rarity] || colors.common
  
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      fontSize: '0.7rem',
      fontWeight: 700,
      fontFamily: "'Nunito', sans-serif",
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {rarity}
    </span>
  )
}

// === STAT CARD ===
export function StatCard({ 
  icon, 
  label, 
  value, 
  color = '#FFC107' 
}: { 
  icon: string
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '1rem',
      textAlign: 'center',
      border: `1px solid ${color}33`,
      minWidth: '100px'
    }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{icon}</div>
      <div style={{ 
        color, 
        fontSize: '1.25rem', 
        fontWeight: 900, 
        fontFamily: "'Nunito', sans-serif" 
      }}>
        {value}
      </div>
      <div style={{ 
        color: 'rgba(255,255,255,0.6)', 
        fontSize: '0.75rem',
        marginTop: '0.25rem'
      }}>
        {label}
      </div>
    </div>
  )
}

// === MODAL ===
export function Modal({ 
  title, 
  onClose, 
  children,
  maxWidth = '480px'
}: { 
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, width: '90%' }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.5rem', margin: 0 }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// === COMPANION CARD ===
export function CompanionCard({ 
  name, 
  level, 
  element, 
  bond, 
  rarity,
  onClick,
  selected = false
}: {
  name: string
  level: number
  element: string
  bond: number
  rarity: string
  onClick?: () => void
  selected?: boolean
}) {
  const borderColors: Record<string, string> = {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
    mythic: '#E91E63'
  }
  
  return (
    <div 
      className={`companion-card rarity-${rarity}`}
      onClick={onClick}
      style={{
        border: selected ? `3px solid ${borderColors[rarity]}` : `2px solid ${borderColors[rarity]}40`,
        boxShadow: selected ? `0 0 20px ${borderColors[rarity]}60` : 'none',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${borderColors[rarity]}, ${borderColors[rarity]}80)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        margin: '0 auto 0.75rem'
      }}>
        {element}
      </div>
      <div style={{ fontWeight: 700, fontFamily: "'Nunito', sans-serif", marginBottom: '0.25rem' }}>
        {name}
      </div>
      <div style={{ fontSize: '0.8rem', color: '#757575', marginBottom: '0.5rem' }}>
        Lv.{level}
      </div>
      <div className="progress-bar" style={{ height: '6px' }}>
        <div className="progress-fill bond" style={{ width: `${bond}%` }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#757575', marginTop: '0.25rem' }}>
        Bond: {bond}%
      </div>
    </div>
  )
}

// === ELEMENT BADGE ===
export function ElementBadge({ element }: { element: string }) {
  const elementInfo: Record<string, { icon: string; color: string }> = {
    'KIM': { icon: '⚙️', color: '#9E9E9E' },
    'MOC': { icon: '🌿', color: '#4CAF50' },
    'THUY': { icon: '💧', color: '#2196F3' },
    'HOA': { icon: '🔥', color: '#FF5722' },
    'THO': { icon: '🪨', color: '#8D6E63' }
  }
  
  const info = elementInfo[element] || elementInfo['THO']
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '2px 8px',
      borderRadius: '12px',
      background: `${info.color}20`,
      color: info.color,
      fontSize: '0.75rem',
      fontWeight: 700,
      border: `1px solid ${info.color}40`
    }}>
      {info.icon} {element}
    </span>
  )
}

// === NOTIFICATION CONTAINER ===
export function NotificationContainer({ 
  notifications, 
  onDismiss 
}: { 
  notifications: Array<{ id: string; type: 'success' | 'error' | 'info' | 'reward'; title: string; message: string }>
  onDismiss: (id: string) => void
}) {
  return (
    <div className="toast-container">
      {notifications.map(notif => (
        <Toast
          key={notif.id}
          type={notif.type}
          title={notif.title}
          message={notif.message}
          onDismiss={() => onDismiss(notif.id)}
        />
      ))}
    </div>
  )
}

// === TABS ===
export function Tabs({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: Array<{ id: string; label: string; icon?: string }>
  activeTab: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '20px',
            background: activeTab === tab.id ? '#FFC107' : 'rgba(0,0,0,0.1)',
            color: activeTab === tab.id ? '#1A1A2E' : 'inherit',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
