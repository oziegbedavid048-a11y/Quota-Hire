/**
 * Quota Hire — Mobile Design Tokens
 * Exactly mirrors web tailwind.config.js + index.css
 */

import { Platform } from 'react-native';

// ─── Brand Palette (exact from tailwind.config.js) ─────────────────────────
export const Palette = {
  // accent = Quota Hire brand green
  accent50:  '#f4fbf2',
  accent100: '#e5f6e2',
  accent200: '#cbedc6',
  accent300: '#a3df9b',
  accent400: '#72dd15', // bright lime-green logo color
  accent500: '#15750a', // deep forest green
  accent600: '#116108', // darkest CTA green
  accent700: '#0e4f06',
  accent800: '#0b3d05',
  accent900: '#082e04',

  // warm = amber gold complementary
  warm50:  '#fffbeb',
  warm100: '#fef3c7',
  warm500: '#f59e0b',
  warm600: '#d97706',
  warm700: '#b45309',
  warm900: '#78350f',

  // neutrals (from tailwind.config.js)
  neutral50:  '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',
  neutral950: '#020617',

  // chart / status colors
  indigo50:  '#eef2ff',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',

  emerald50:  '#ecfdf5',
  emerald500: '#10b981',
  emerald600: '#059669',

  violet50:  '#f5f3ff',
  violet500: '#8b5cf6',
  violet600: '#7c3aed',

  blue50:  '#eff6ff',
  blue400: '#60a5fa',
  blue500: '#3b82f6',
  blue600: '#2563eb',
  blue700: '#1d4ed8',

  amber50:  '#fffbeb',
  amber500: '#f59e0b',
  amber700: '#b45309',

  purple50:  '#faf5ff',
  purple500: '#a855f7',
  purple700: '#7e22ce',

  red50:  '#fef2f2',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',

  brandGreen: '#15750a',

  white: '#ffffff',
  black: '#000000',
} as const;

// ─── Semantic colors ────────────────────────────────────────────────────────
export const Colors = {
  light: {
    text:          Palette.neutral900,
    textSecondary: Palette.neutral500,
    textMuted:     Palette.neutral400,
    background:    'transparent',
    cardBg:        '#ffffff',
    border:        Palette.neutral100,
    borderMid:     Palette.neutral200,
    accent:        Palette.accent500,
    accentDark:    Palette.accent600,
    accentBg:      Palette.accent50,
    warm:          Palette.warm500,
    warmBg:        Palette.warm50,
    backgroundElement: '#F0F0F3',
    backgroundSelected:'#E0E1E6',
  },
  dark: {
    text:          Palette.neutral900,
    textSecondary: Palette.neutral500,
    textMuted:     Palette.neutral400,
    background:    'transparent',
    cardBg:        '#ffffff',
    border:        Palette.neutral100,
    borderMid:     Palette.neutral200,
    accent:        Palette.accent500,
    accentDark:    Palette.accent600,
    accentBg:      Palette.accent50,
    warm:          Palette.warm500,
    warmBg:        Palette.warm50,
    backgroundElement: '#F0F0F3',
    backgroundSelected:'#E0E1E6',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography ─────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    'var(--font-display)',
    serif:   'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono:    'var(--font-mono)',
  },
});

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  lg:   17,
  xl:   20,
  xxl:  26,
  hero: 30,
} as const;

export const FontWeight: Record<string, '400'|'500'|'600'|'700'|'800'> = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────
export const Spacing = {
  half: 2,
  one:  4,
  two:  8,
  three:16,
  four: 24,
  five: 32,
  six:  64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const BorderRadius = {
  sm:     8,
  md:     12,
  lg:     16,
  xl:     20,
  card:   20,
  cardLg: 24,
  button: 14,
  chip:   999,
  avatar: 999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius:  8,
    elevation:     1,
  },
  cardMd: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius:  12,
    elevation:     2,
  },
  tabBar: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius:  16,
    elevation:     10,
  },
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────
export const MaxContentWidth = 800;
export const TabBarHeight = Platform.select({ ios: 80, android: 80 }) ?? 80;
