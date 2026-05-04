import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, supabaseConfigMissing } from '@/integrations/supabase/client';
import {
  EMPTY_TRANSLATION_OVERRIDES,
  mergeTranslationOverrideRows,
  type TranslationOverrideMap,
  type TranslationOverrideRow,
} from '@/lib/cms';

/**
 * Stores admin overrides for translation keys.
 * Overrides are merged on top of the static translations at runtime.
 * Structure: { en: { 'nav.home': 'Home' }, ar: { 'nav.home': 'الرئيسية' } }
 */
interface TranslationOverridesState {
  overrides: TranslationOverrideMap;
  isRemoteLoaded: boolean;
  loadRemoteOverrides: () => Promise<void>;
  hydrateOverrides: (overrides: TranslationOverrideMap) => void;
  setOverride: (lang: 'en' | 'ar', key: string, value: string, section?: string) => Promise<void>;
  setBothOverrides: (key: string, en: string, ar: string, section?: string) => Promise<void>;
  removeOverride: (key: string) => Promise<void>;
  addKey: (key: string, en: string, ar: string, section?: string) => Promise<void>;
}

function fallbackSection(key: string) {
  const first = key.split('.')[0];
  const map: Record<string, string> = {
    nav: 'Navigation',
    landing: 'Home',
    portal: 'Portal',
    footer: 'Footer',
    about: 'About',
    contact: 'Contact',
    home: 'Home',
    toolsDir: 'Tools',
    toolPage: 'Tool Pages',
    studio: 'Studio',
    gallery: 'Gallery',
    templates: 'Templates',
    community: 'Community',
    auth: 'Auth',
    pricing: 'Billing',
    credits: 'Billing',
    avatar: 'Navigation',
    upgrade: 'Billing',
    settings: 'Settings',
    notFound: 'System',
    creditsView: 'Billing',
  };
  return map[first] || sectionCase(first);
}

function sectionCase(value: string) {
  if (!value) return 'General';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function putLocalOverride(
  set: (fn: (state: TranslationOverridesState) => Partial<TranslationOverridesState>) => void,
  key: string,
  en: string,
  ar: string
) {
  set((state) => ({
    overrides: {
      en: { ...state.overrides.en, [key]: en },
      ar: { ...state.overrides.ar, [key]: ar },
    },
  }));
}

function removeLocalOverride(
  set: (fn: (state: TranslationOverridesState) => Partial<TranslationOverridesState>) => void,
  key: string
) {
  set((state) => {
    const newEn = { ...state.overrides.en };
    const newAr = { ...state.overrides.ar };
    delete newEn[key];
    delete newAr[key];
    return { overrides: { en: newEn, ar: newAr } };
  });
}

export const useTranslationOverridesStore = create<TranslationOverridesState>()(
  persist(
    (set, get) => ({
      overrides: EMPTY_TRANSLATION_OVERRIDES,
      isRemoteLoaded: false,

      hydrateOverrides: (overrides) => set({ overrides, isRemoteLoaded: true }),

      loadRemoteOverrides: async () => {
        if (supabaseConfigMissing) {
          set({ isRemoteLoaded: true });
          return;
        }

        const { data, error } = await supabase
          .from('translation_overrides' as any)
          .select('key, section, value_en, value_ar')
          .order('key');

        if (error) throw error;
        const merged = mergeTranslationOverrideRows(data as TranslationOverrideRow[], get().overrides);
        set({ overrides: merged, isRemoteLoaded: true });
      },

      setOverride: async (lang, key, value, section) => {
        const current = get().overrides;
        const en = lang === 'en' ? value : current.en[key] || '';
        const ar = lang === 'ar' ? value : current.ar[key] || '';
        await get().setBothOverrides(key, en, ar, section);
      },

      setBothOverrides: async (key, en, ar, section) => {
        if (!supabaseConfigMissing) {
          const { error } = await supabase
            .from('translation_overrides' as any)
            .upsert({
              key,
              section: section || fallbackSection(key),
              value_en: en,
              value_ar: ar,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
          if (error) throw error;
        }

        putLocalOverride(set, key, en, ar);
      },

      removeOverride: async (key) => {
        if (!supabaseConfigMissing) {
          const { error } = await supabase
            .from('translation_overrides' as any)
            .delete()
            .eq('key', key);
          if (error) throw error;
        }

        removeLocalOverride(set, key);
      },

      addKey: async (key, en, ar, section) => {
        await get().setBothOverrides(key, en, ar, section);
      },
    }),
    {
      name: 'takhayal-translation-overrides',
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<TranslationOverridesState> | undefined;
        const en = persistedState?.overrides?.en;
        const ar = persistedState?.overrides?.ar;

        return {
          ...current,
          overrides: {
            en: en && typeof en === 'object' ? en : {},
            ar: ar && typeof ar === 'object' ? ar : {},
          },
          isRemoteLoaded: false,
        };
      },
    }
  )
);
