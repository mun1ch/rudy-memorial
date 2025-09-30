export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    destructive: string;
    destructiveForeground: string;
    gradientStart: string;
    gradientEnd: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'warm-amber',
    name: 'Warm Amber & Gold',
    description: 'Rich amber and golden tones - elegant and warm',
    colors: {
      primary: '#D97706',
      secondary: '#F59E0B',
      accent: '#FCD34D',
      background: '#FFFBEB',
      foreground: '#92400E',
      muted: '#FEF3C7',
      mutedForeground: '#A16207',
      border: '#FDE68A',
      input: '#FEF3C7',
      ring: '#D97706',
      card: '#FFFBEB',
      cardForeground: '#92400E',
      popover: '#FFFBEB',
      popoverForeground: '#92400E',
      destructive: '#DC2626',
      destructiveForeground: '#FEF2F2',
      gradientStart: '#D97706',
      gradientEnd: '#F59E0B',
    },
  },
  {
    id: 'sage-mist',
    name: 'Sage Mist & Cream',
    description: 'Soft sage greens with warm cream - peaceful and serene',
    colors: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      accent: '#D1D5DB',
      background: '#F9FAFB',
      foreground: '#374151',
      muted: '#F3F4F6',
      mutedForeground: '#6B7280',
      border: '#E5E7EB',
      input: '#F3F4F6',
      ring: '#6B7280',
      card: '#FFFFFF',
      cardForeground: '#374151',
      popover: '#FFFFFF',
      popoverForeground: '#374151',
      destructive: '#DC2626',
      destructiveForeground: '#FEF2F2',
      gradientStart: '#6B7280',
      gradientEnd: '#9CA3AF',
    },
  },
  {
    id: 'deep-emerald',
    name: 'Deep Emerald & Bronze',
    description: 'Rich emerald greens with bronze accents - sophisticated',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#34D399',
      background: '#ECFDF5',
      foreground: '#064E3B',
      muted: '#D1FAE5',
      mutedForeground: '#047857',
      border: '#A7F3D0',
      input: '#D1FAE5',
      ring: '#059669',
      card: '#F0FDF4',
      cardForeground: '#064E3B',
      popover: '#F0FDF4',
      popoverForeground: '#064E3B',
      destructive: '#DC2626',
      destructiveForeground: '#FEF2F2',
      gradientStart: '#059669',
      gradientEnd: '#10B981',
    },
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta & Sand',
    description: 'Earthy terracotta with warm sand tones - cozy and inviting',
    colors: {
      primary: '#C2410C',
      secondary: '#EA580C',
      accent: '#FB923C',
      background: '#FFF7ED',
      foreground: '#9A3412',
      muted: '#FED7AA',
      mutedForeground: '#C2410C',
      border: '#FDBA74',
      input: '#FED7AA',
      ring: '#C2410C',
      card: '#FFF7ED',
      cardForeground: '#9A3412',
      popover: '#FFF7ED',
      popoverForeground: '#9A3412',
      destructive: '#DC2626',
      destructiveForeground: '#FEF2F2',
      gradientStart: '#C2410C',
      gradientEnd: '#EA580C',
    },
  },
  {
    id: 'slate-blue',
    name: 'Slate Blue & Silver',
    description: 'Cool slate blues with silver accents - calm and professional',
    colors: {
      primary: '#475569',
      secondary: '#64748B',
      accent: '#94A3B8',
      background: '#F8FAFC',
      foreground: '#334155',
      muted: '#E2E8F0',
      mutedForeground: '#475569',
      border: '#CBD5E1',
      input: '#E2E8F0',
      ring: '#475569',
      card: '#FFFFFF',
      cardForeground: '#334155',
      popover: '#FFFFFF',
      popoverForeground: '#334155',
      destructive: '#DC2626',
      destructiveForeground: '#FEF2F2',
      gradientStart: '#475569',
      gradientEnd: '#64748B',
    },
  },
];

export const defaultTheme = themes[0]; // Warm Amber & Gold

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (key === 'gradientStart') {
      root.style.setProperty(`--gradient-start`, `rgba(${hexToRgb(value)}, 0.1)`);
    } else if (key === 'gradientEnd') {
      root.style.setProperty(`--gradient-end`, `rgba(${hexToRgb(value)}, 0.1)`);
    } else {
      root.style.setProperty(`--${key}`, value);
    }
  });
  
  // Store theme preference
  localStorage.setItem('rudy-memorial-theme', theme.id);
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return '0, 0, 0';
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  
  const stored = localStorage.getItem('rudy-memorial-theme');
  const theme = themes.find(t => t.id === stored);
  return theme || defaultTheme;
}
