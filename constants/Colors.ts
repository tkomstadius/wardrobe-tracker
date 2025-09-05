/**
 * Wardrobe Tracker - Dark Mode with Warm Accents
 * A sophisticated dark theme with cozy warm accent colors
 */

export const Colors = {
  // Primary warm accent - Soft coral/salmon
  primary: '#ff8a80',        // Warm coral
  primaryLight: '#ffbcaf',   // Light coral
  primaryDark: '#c85854',    // Deep coral
  
  // Secondary warm accent - Golden amber
  secondary: '#ffb74d',      // Warm amber
  secondaryLight: '#ffe97d', // Light amber
  secondaryDark: '#c88719',  // Deep amber
  
  // Tertiary warm accent - Soft peach
  tertiary: '#ffcc80',       // Warm peach
  tertiaryLight: '#ffffb0',  // Light peach
  tertiaryDark: '#ca9b52',   // Deep peach
  
  // Dark theme base colors
  black: '#000000',
  white: '#ffffff',
  
  // Dark grays with subtle warm undertones
  gray950: '#0a0a0a',        // Pure black
  gray900: '#121212',        // Rich dark
  gray800: '#1e1e1e',        // Dark surface
  gray700: '#2a2a2a',        // Medium dark
  gray600: '#404040',        // Medium
  gray500: '#6a6a6a',        // Medium light
  gray400: '#888888',        // Light gray
  gray300: '#a8a8a8',        // Lighter gray
  gray200: '#c8c8c8',        // Very light gray
  gray100: '#e8e8e8',        // Almost white
  gray50: '#f8f8f8',         // Near white
  
  // Semantic colors with warm undertones
  success: '#4caf50',        // Warm green
  successLight: '#81c784',
  successDark: '#388e3c',
  
  error: '#f44336',          // Warm red
  errorLight: '#ef5350',
  errorDark: '#d32f2f',
  
  warning: '#ff9800',        // Warm orange
  warningLight: '#ffb74d',
  warningDark: '#f57c00',
  
  info: '#2196f3',           // Cool blue for contrast
  infoLight: '#64b5f6',
  infoDark: '#1976d2',
  
  // Dark theme backgrounds
  background: '#121212',           // Main dark background
  backgroundSecondary: '#1e1e1e',  // Secondary dark background
  backgroundTertiary: '#2a2a2a',   // Cards/elevated surfaces
  
  surface: '#1e1e1e',             // Surface color
  surfaceSecondary: '#2a2a2a',    // Elevated surface
  surfaceElevated: '#404040',     // Highly elevated surface
  
  // Dark theme text colors
  textPrimary: '#ffffff',         // Primary white text
  textSecondary: '#a8a8a8',       // Secondary gray text
  textTertiary: '#6a6a6a',        // Tertiary darker gray text
  textInverse: '#121212',         // Dark text on light backgrounds
  textAccent: '#ff8a80',          // Accent text color
  
  // Dark theme borders
  border: '#404040',              // Standard border
  borderLight: '#2a2a2a',         // Light border
  borderDark: '#6a6a6a',          // Dark border
  borderAccent: '#ff8a80',        // Accent border
  
  // Wardrobe categories with warm, cozy colors
  clothing: {
    tops: '#ff8a80',           // Coral - warm and inviting
    bottoms: '#ffb74d',        // Amber - earthy and warm
    dresses_jumpsuits: '#ffcc80', // Peach - soft and elegant
    shoes: '#a1887f',         // Warm brown - grounding
    accessories: '#ffd54f',    // Golden yellow - luxurious
    outerwear: '#8d6e63',      // Coffee brown - cozy
    underwear: '#f8bbd9',      // Soft pink - gentle
    sleepwear: '#d1c4e9',      // Lavender - calming
    activewear: '#a5d6a7',     // Soft green - energizing
  },
  
  // Occasion colors
  occasions: {
    casual: '#ffcc80',      // Peach - relaxed
    work: '#ff8a80',        // Coral - professional yet warm
    formal: '#ffb74d',      // Amber - elegant
    party: '#ffd54f',       // Gold - celebratory
    date: '#f8bbd9',        // Pink - romantic
    workout: '#a5d6a7',     // Green - active
    sleep: '#d1c4e9',       // Lavender - restful
  },
} as const

// Light theme (for future implementation if needed)
export const LightColors = {
  ...Colors,
  // Override dark theme colors for light mode
  background: '#ffffff',
  backgroundSecondary: '#f8f8f8',
  backgroundTertiary: '#e8e8e8',
  surface: '#ffffff',
  surfaceSecondary: '#f8f8f8',
  surfaceElevated: '#e8e8e8',
  textPrimary: '#121212',
  textSecondary: '#6a6a6a',
  textTertiary: '#a8a8a8',
  textInverse: '#ffffff',
  border: '#e8e8e8',
  borderLight: '#f8f8f8',
  borderDark: '#c8c8c8',
} as const

// Default export is dark theme
export const DarkColors = Colors

// Type for better TypeScript support
export type ColorPalette = typeof Colors
