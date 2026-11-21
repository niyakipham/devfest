/**
 * Design System - Hanoi Legends RPG
 * Based on stylized cartoon 3D aesthetic (Pokémon-inspired)
 */

export const designTokens = {
  // === COLOR PALETTE ===
  colors: {
    // Sky & Nature
    skyTop: '#87CEEB',
    skyBottom: '#E0F7FF',
    grass: '#4CAF50',
    grassDark: '#388E3C',
    water: '#2196F3',
    waterDeep: '#1565C0',
    
    // Primary
    primaryRed: '#FF5722',
    primaryOrange: '#FF9800',
    primaryYellow: '#FFEB3B',
    
    // Accents
    accentYellow: '#FFC107',
    accentPink: '#E91E63',
    accentPurple: '#9C27B0',
    accentTeal: '#00BCD4',
    
    // Surfaces
    surfaceDark: 'rgba(0, 0, 0, 0.4)',
    surfaceDarkSolid: '#1A1A2E',
    surfaceLight: 'rgba(255, 255, 255, 0.92)',
    surfaceWhite: '#FFFFFF',
    surfaceCard: '#F5F5F5',
    surfaceTranslucent: 'rgba(26, 26, 46, 0.7)',
    
    // Text
    textOnDark: '#FFFFFF',
    textOnLight: '#212121',
    textSecondary: '#757575',
    textMuted: '#BDBDBD',
    
    // Semantic
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Rarity Colors
    rarityCommon: '#9E9E9E',
    rarityRare: '#2196F3',
    rarityEpic: '#9C27B0',
    rarityLegendary: '#FF9800',
    rarityMythic: '#E91E63',
  },
  
  // === TYPOGRAPHY ===
  typography: {
    fontFamily: {
      display: "'Nunito', 'Poppins', sans-serif",
      body: "'Nunito', 'Poppins', sans-serif",
      mono: "'JetBrains Mono', 'Roboto Mono', monospace",
    },
    fontSize: {
      xs: '11px',
      sm: '13px',
      base: '15px',
      lg: '18px',
      xl: '22px',
      '2xl': '28px',
      '3xl': '36px',
      '4xl': '48px',
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // === SPACING (8px grid) ===
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '24px',
    6: '32px',
    8: '48px',
    10: '64px',
    12: '96px',
  },
  
  // === BORDER RADIUS ===
  borderRadius: {
    none: '0',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },
  
  // === SHADOWS ===
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12)',
    md: '0 4px 12px rgba(0,0,0,0.15)',
    lg: '0 8px 24px rgba(0,0,0,0.18)',
    xl: '0 16px 48px rgba(0,0,0,0.22)',
    glow: '0 0 20px rgba(255,193,7,0.3)',
    glowRed: '0 0 20px rgba(255,87,34,0.3)',
    glowPink: '0 0 20px rgba(233,30,99,0.3)',
  },
  
  // === ANIMATIONS ===
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  
  // === BREAKPOINTS ===
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
  
  // === Z-INDEX ===
  zIndex: {
    base: '0',
    dropdown: '100',
    modal: '200',
    toast: '300',
    tooltip: '400',
  },
} as const

export type DesignTokens = typeof designTokens
