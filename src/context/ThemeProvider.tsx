import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ThemeColors {
  'cta-primary': string;
  'cta-primary-hover': string;
  'cta-primary-text': string;
  'cta-secondary': string;
  'cta-secondary-hover': string;
  'cta-secondary-text': string;
  accent: string;
  'accent-muted': string;
  'accent-border': string;
  'nav-active': string;
  'nav-active-bg': string;
  'sidebar-bg': string;
  'panel-bg': string;
  'card-bg': string;
  border: string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
}

const THEME_KEY_MAP: Record<string, keyof ThemeColors> = {
  theme_cta_primary: 'cta-primary',
  theme_cta_primary_hover: 'cta-primary-hover',
  theme_cta_primary_text: 'cta-primary-text',
  theme_cta_secondary: 'cta-secondary',
  theme_cta_secondary_hover: 'cta-secondary-hover',
  theme_cta_secondary_text: 'cta-secondary-text',
  theme_accent: 'accent',
  theme_accent_muted: 'accent-muted',
  theme_accent_border: 'accent-border',
  theme_nav_active: 'nav-active',
  theme_nav_active_bg: 'nav-active-bg',
  theme_sidebar_bg: 'sidebar-bg',
  theme_panel_bg: 'panel-bg',
  theme_card_bg: 'card-bg',
  theme_border: 'border',
  theme_text_primary: 'text-primary',
  theme_text_secondary: 'text-secondary',
  theme_text_muted: 'text-muted',
};

export const DEFAULT_THEME: ThemeColors = {
  'cta-primary': '#F03E1B',
  'cta-primary-hover': '#D4330F',
  'cta-primary-text': '#FFFFFF',
  'cta-secondary': '#1E1E1E',
  'cta-secondary-hover': '#252525',
  'cta-secondary-text': '#FFFFFF',
  accent: '#F03E1B',
  'accent-muted': 'rgba(240,62,27,0.12)',
  'accent-border': 'rgba(240,62,27,0.4)',
  'nav-active': '#F03E1B',
  'nav-active-bg': 'rgba(240,62,27,0.08)',
  'sidebar-bg': '#000000',
  'panel-bg': '#111111',
  'card-bg': '#1E1E1E',
  border: '#2A2A2A',
  'text-primary': '#FFFFFF',
  'text-secondary': '#6B6969',
  'text-muted': '#444444',
};

interface ThemeContextType {
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  applyToDOM: (colors: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DEFAULT_THEME,
  setColors: () => {},
  applyToDOM: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function hexToHSL(hex: string): string | null {
  // Only convert #RRGGBB or #RGB, skip rgba etc.
  if (!hex.startsWith('#')) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    return null;
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyThemeToDOM(colors: ThemeColors) {
  const root = document.documentElement;
  // Set raw theme vars for components that read them directly
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Bridge ONLY accent/primary colors to shadcn HSL variables.
  // Background/foreground/surface colors are handled by [data-theme] in CSS
  // and must NOT be overridden here to allow light/dark mode switching.
  const primaryHSL = hexToHSL(colors['cta-primary']);
  const primaryHoverHSL = hexToHSL(colors['cta-primary-hover']);
  const ctaTextHSL = hexToHSL(colors['cta-primary-text']);

  if (primaryHSL) {
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--ring', primaryHSL);
    root.style.setProperty('--sidebar-primary', primaryHSL);
    root.style.setProperty('--sidebar-ring', primaryHSL);
  }
  if (primaryHoverHSL) {
    root.style.setProperty('--ember-hover', primaryHoverHSL);
  }
  if (ctaTextHSL) {
    root.style.setProperty('--primary-foreground', ctaTextHSL);
    root.style.setProperty('--sidebar-primary-foreground', ctaTextHSL);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME);

  // Fetch on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('platform_config' as any)
        .select('config_key, config_value')
        .like('config_key', 'theme_%');
      
      if (data && data.length > 0) {
        const loaded = { ...DEFAULT_THEME };
        (data as any[]).forEach((row: any) => {
          const cssKey = THEME_KEY_MAP[row.config_key];
          if (cssKey) {
            (loaded as any)[cssKey] = row.config_value;
          }
        });
        setColors(loaded);
        applyThemeToDOM(loaded);
      } else {
        applyThemeToDOM(DEFAULT_THEME);
      }
    };
    load();
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'platform_config',
      }, (payload: any) => {
        const row = payload.new;
        if (row?.config_key?.startsWith('theme_')) {
          const cssKey = THEME_KEY_MAP[row.config_key];
          if (cssKey) {
            setColors(prev => {
              const next = { ...prev, [cssKey]: row.config_value };
              applyThemeToDOM(next);
              return next;
            });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSetColors = useCallback((newColors: ThemeColors) => {
    setColors(newColors);
    applyThemeToDOM(newColors);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, setColors: handleSetColors, applyToDOM: applyThemeToDOM }}>
      {children}
    </ThemeContext.Provider>
  );
}
