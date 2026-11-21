/**
 * Admin Dashboard Screen
 * Analytics, player management, content editor
 */

import { useState } from 'react'

type Tab = 'dashboard' | 'players' | 'content' | 'analytics' | 'logs'

export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  
  const stats = {
    dau: 12400,
    mau: 89000,
    revenue: 45000000,
    newUsersToday: 340,
    retention: { d1: 42, d7: 18, d30: 8 }
  }
  
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Tổng Quan', icon: '📊' },
    { id: 'players', label: 'Người Chơi', icon: '👥' },
    { id: 'content', label: 'Nội Dung', icon: '📝' },
    { id: 'analytics', label: 'Phân Tích', icon: '📈' },
    { id: 'logs', label: 'Nhật Ký', icon: '📋' }
  ]
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0F172A',
      zIndex: 450,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B, #334155)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #475569',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span>
          <div>
            <h1 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
              Admin Dashboard
            </h1>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Hanoi Legends CMS</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#4CAF50',
            boxShadow: '0 0 10px #4CAF50'
          }} />
          <span style={{ color: '#4CAF50', fontSize: '0.85rem', fontWeight: 600 }}>Live</span>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        background: '#1E293B',
        borderBottom: '1px solid #334155',
        padding: '0 2rem',
        flexShrink: 0,
        overflow: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #FFC107' : '3px solid transparent',
              color: activeTab === tab.id ? '#FFC107' : '#94A3B8',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
        {activeTab === 'players' && <PlayersTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'logs' && <LogsTab />}
      </div>
    </div>
  )
}

function DashboardTab({ stats }: { stats: any }) {
  const statCards = [
    { icon: '👥', label: 'DAU (Hôm nay)', value: stats.dau.toLocaleString(), color: '#2196F3', change: '+12%' },
    { icon: '📊', label: 'MAU', value: stats.mau.toLocaleString(), color: '#9C27B0', change: '+8%' },
    { icon: '💰', label: 'Doanh Thu', value: `${(stats.revenue / 1000000).toFixed(1)}M ₫`, color: '#4CAF50', change: '+15%' },
    { icon: '🆕', label: 'User Mới', value: stats.newUsersToday.toString(), color: '#FF9800', change: '+5%' },
    { icon: '⏱️', label: 'Retention D1', value: `${stats.retention.d1}%`, color: '#00BCD4', change: '-2%' },
    { icon: '📅', label: 'Retention D7', value: `${stats.retention.d7}%`, color: '#FF5722', change: '+1%' }
  ]
  
  return (
    <div>
      <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>Tổng Quan Hệ Thống</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, #1E293B, #334155)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: `1px solid ${card.color}30`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{card.icon}</span>
              <span style={{ 
                color: card.change.startsWith('+') ? '#4CAF50' : '#F44336', 
                fontSize: '0.8rem', 
                fontWeight: 700,
                background: card.change.startsWith('+') ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}>
                {card.change}
              </span>
            </div>
            <div style={{ color: card.color, fontSize: '1.8rem', fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
              {card.value}
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{card.label}</div>
          </div>
        ))}
      </div>
      
      {/* Top Zones */}
      <div style={{ background: '#1E293B', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155' }}>
        <h3 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1rem' }}>🏆 Top Zones</h3>
        {[
          { name: 'Phố Cổ', players: 6200, percentage: 50 },
          { name: 'Hồ Tây', players: 3720, percentage: 30 },
          { name: 'Khu Mới', players: 2480, percentage: 20 }
        ].map((zone, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'white', fontFamily: "'Nunito', sans-serif" }}>
              <span>{zone.name}</span>
              <span style={{ color: '#94A3B8' }}>{zone.players.toLocaleString()} players</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${zone.percentage}%`,
                background: `linear-gradient(90deg, #FFC107, #FF9800)`,
                borderRadius: '5px',
                transition: 'width 1s ease-out'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBanned, setFilterBanned] = useState<'all' | 'active' | 'banned'>('all')
  
  const players = Array.from({ length: 15 }, (_, i) => ({
    id: `user_${i + 1}`,
    username: `Player${i + 1}`,
    level: Math.floor(Math.random() * 50) + 1,
    zone: ['Phố Cổ', 'Hồ Tây', 'Khu Mới'][Math.floor(Math.random() * 3)],
    lastLogin: `${Math.floor(Math.random() * 24)}h ago`,
    isBanned: Math.random() < 0.1,
    playtime: `${Math.floor(Math.random() * 200)}h`
  }))
  
  const filtered = players.filter(p => {
    if (filterBanned === 'active' && p.isBanned) return false
    if (filterBanned === 'banned' && !p.isBanned) return false
    if (searchTerm && !p.username.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", margin: 0 }}>Quản Lý Người Chơi</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: '#1E293B',
              border: '1px solid #475569',
              color: 'white',
              fontFamily: "'Nunito', sans-serif",
              outline: 'none'
            }}
          />
          <select
            value={filterBanned}
            onChange={e => setFilterBanned(e.target.value as any)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '12px',
              background: '#1E293B',
              border: '1px solid #475569',
              color: 'white',
              fontFamily: "'Nunito', sans-serif"
            }}
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>
      
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              {['Player', 'Level', 'Zone', 'Playtime', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  color: '#94A3B8', 
                  fontSize: '0.8rem',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(player => (
              <tr key={player.id} style={{ borderBottom: '1px solid #1E293B' }}>
                <td style={{ padding: '0.75rem', color: 'white', fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
                  {player.username}
                </td>
                <td style={{ padding: '0.75rem', color: '#FFC107', fontWeight: 700 }}>Lv.{player.level}</td>
                <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{player.zone}</td>
                <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{player.playtime}</td>
                <td style={{ padding: '0.75rem', color: '#94A3B8' }}>{player.lastLogin}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: player.isBanned ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
                    color: player.isBanned ? '#F44336' : '#4CAF50'
                  }}>
                    {player.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      background: player.isBanned ? '#4CAF50' : '#F44336',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: "'Nunito', sans-serif"
                    }}>
                      {player.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '8px',
                      background: '#2196F3',
                      border: 'none',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: "'Nunito', sans-serif"
                    }}>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ContentTab() {
  const contentItems = [
    { id: '1', type: 'Quest', name: 'Ch.1: Thức Tỉnh', status: 'Published', modified: '2 hours ago' },
    { id: '2', type: 'Quest', name: 'Ch.2: Bí Mật Phố Cổ', status: 'Published', modified: '5 hours ago' },
    { id: '3', type: 'NPC', name: 'Thầy Giáo', status: 'Published', modified: '1 day ago' },
    { id: '4', type: 'Item', name: 'Thuốc Hồi Phục Lớn', status: 'Draft', modified: '2 days ago' },
    { id: '5', type: 'Event', name: 'Tết 2026', status: 'Draft', modified: '3 days ago' },
    { id: '6', type: 'Companion', name: 'Rồng Thiêng', status: 'Published', modified: '1 week ago' }
  ]
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", margin: 0 }}>Quản Lý Nội Dung</h2>
        <button style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '12px',
          background: '#FFC107',
          border: 'none',
          color: '#1A1A2E',
          fontWeight: 700,
          fontFamily: "'Nunito', sans-serif",
          cursor: 'pointer'
        }}>
          ➕ Tạo Mới
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {contentItems.map(item => (
          <div key={item.id} style={{
            background: '#1E293B',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {item.type === 'Quest' ? '📜' : item.type === 'NPC' ? '👤' : item.type === 'Item' ? '🎒' : item.type === 'Event' ? '🎉' : '🐉'}
              </span>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontFamily: "'Nunito', sans-serif" }}>{item.name}</div>
                <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{item.type} • {item.modified}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                padding: '3px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: item.status === 'Published' ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
                color: item.status === 'Published' ? '#4CAF50' : '#FF9800'
              }}>
                {item.status}
              </span>
              <button style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}>
                ✏️ Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsTab() {
  const revenueData = Array.from({ length: 14 }, (_, i) => ({
    day: `D${i + 1}`,
    revenue: Math.floor(Math.random() * 5000000) + 1000000
  }))
  
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
  
  return (
    <div>
      <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>Phân Tích Doanh Thu</h2>
      
      {/* Revenue Chart */}
      <div style={{ background: '#1E293B', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155', marginBottom: '2rem' }}>
        <h3 style={{ color: '#94A3B8', fontFamily: "'Nunito', sans-serif", marginBottom: '1rem' }}>Doanh Thu 14 Ngày Qua</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px' }}>
          {revenueData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                {(d.revenue / 1000000).toFixed(1)}M
              </div>
              <div style={{
                width: '100%',
                maxWidth: '40px',
                height: `${(d.revenue / maxRevenue) * 160}px`,
                background: 'linear-gradient(180deg, #4CAF50, #2E7D32)',
                borderRadius: '6px 6px 0 0',
                transition: 'height 1s ease-out'
              }} />
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Retention */}
      <div style={{ background: '#1E293B', borderRadius: '16px', padding: '1.5rem', border: '1px solid #334155' }}>
        <h3 style={{ color: '#94A3B8', fontFamily: "'Nunito', sans-serif", marginBottom: '1rem' }}>Tỷ Lệ Giữ Chân</h3>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { day: 'D1', rate: 42, color: '#4CAF50' },
            { day: 'D3', rate: 27, color: '#FFC107' },
            { day: 'D7', rate: 18, color: '#FF9800' },
            { day: 'D14', rate: 12, color: '#FF5722' },
            { day: 'D30', rate: 8, color: '#F44336' }
          ].map(r => (
            <div key={r.day} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: `conic-gradient(${r.color} ${r.rate * 3.6}deg, #1E293B 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: r.color,
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  fontFamily: "'Nunito', sans-serif"
                }}>
                  {r.rate}%
                </div>
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontFamily: "'Nunito', sans-serif" }}>{r.day}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LogsTab() {
  const logs = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    admin: 'Admin',
    action: ['BAN_PLAYER', 'UNBAN_PLAYER', 'UPDATE_CONTENT', 'CREATE_QUEST', 'GIVE_ITEM'][Math.floor(Math.random() * 5)],
    target: `user_${Math.floor(Math.random() * 100)}`,
    time: `${Math.floor(Math.random() * 24)}h ago`,
    details: 'Admin action performed'
  }))
  
  return (
    <div>
      <h2 style={{ color: 'white', fontFamily: "'Nunito', sans-serif", marginBottom: '1.5rem' }}>Nhật Ký Hành Động</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {logs.map(log => (
          <div key={log.id} style={{
            background: '#1E293B',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid #334155',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.time}</span>
            <span style={{ color: '#FFC107', fontWeight: 700, fontFamily: "'Nunito', sans-serif", minWidth: '140px' }}>{log.action}</span>
            <span style={{ color: '#94A3B8' }}>by {log.admin}</span>
            <span style={{ color: '#2196F3' }}>→ {log.target}</span>
            <span style={{ color: '#64748B', marginLeft: 'auto' }}>{log.details}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
