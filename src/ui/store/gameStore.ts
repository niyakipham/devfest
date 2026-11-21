/**
 * Game Store - State Management with Zustand
 * Central state for the entire game
 */

import { create } from 'zustand'
import { GamePhase } from '../../App'

export interface GameState {
  // Game phase
  phase: GamePhase
  setPhase: (phase: GamePhase) => void
  
  // Player data
  playerId: string | null
  characterId: string | null
  playerName: string
  characterLevel: number
  characterXP: number
  currency: number
  premiumCurrency: number
  
  // World state
  currentZoneId: string | null
  timeOfDay: string
  weather: string
  
  // UI state
  activeScreen: string
  notifications: GameNotification[]
  
  // Actions
  initializeGame: () => void
  setPlayerId: (id: string) => void
  setCharacterId: (id: string) => void
  setPlayerName: (name: string) => void
  addXP: (amount: number) => void
  addCurrency: (amount: number) => void
  addNotification: (notification: GameNotification) => void
  removeNotification: (id: string) => void
  setCurrentZone: (zoneId: string) => void
  setActiveScreen: (screen: string) => void
}

export interface GameNotification {
  id: string
  type: 'success' | 'error' | 'info' | 'reward'
  title: string
  message: string
  duration: number // ms, 0 = persistent
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  phase: GamePhase.MAIN_MENU,
  setPhase: (phase) => set({ phase }),
  
  playerId: null,
  characterId: null,
  playerName: '',
  characterLevel: 1,
  characterXP: 0,
  currency: 0,
  premiumCurrency: 0,
  
  currentZoneId: null,
  timeOfDay: '06:00',
  weather: 'SUNNY',
  
  activeScreen: 'game',
  notifications: [],
  
  // Actions
  initializeGame: () => {
    console.log('[GameStore] Game initialized')
    set({
      phase: GamePhase.MAIN_MENU,
      currency: 500,
      premiumCurrency: 50
    })
  },
  
  setPlayerId: (id) => set({ playerId: id }),
  setCharacterId: (id) => set({ characterId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  
  addXP: (amount) => set((state) => {
    const newXp = state.characterXP + amount
    // Simple level up check
    const xpNeeded = state.characterLevel * 100
    if (newXp >= xpNeeded) {
      return {
        characterXP: newXp - xpNeeded,
        characterLevel: state.characterLevel + 1,
        notifications: [...state.notifications, {
          id: `level_up_${Date.now()}`,
          type: 'success',
          title: 'Level Up! 🎉',
          message: `Chúc mừng! Bạn đã lên level ${state.characterLevel + 1}!`,
          duration: 5000
        }]
      }
    }
    return { characterXP: newXp }
  }),
  
  addCurrency: (amount) => set((state) => ({ currency: state.currency + amount })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  setCurrentZone: (zoneId) => set({ currentZoneId: zoneId }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),
}))
