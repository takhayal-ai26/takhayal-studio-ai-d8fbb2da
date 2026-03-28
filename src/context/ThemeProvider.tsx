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

function applyThemeToDOM(colors: ThemeColors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
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
