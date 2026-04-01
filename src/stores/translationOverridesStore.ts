import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Stores admin overrides for translation keys.
 * Overrides are merged on top of the static translations at runtime.
 * Structure: { en: { 'nav.home': 'Home' }, ar: { 'nav.home': 'الرئيسية' } }
 */
interface TranslationOverridesState {
  overrides: {
    en: Record<string, string>;
    ar: Record<string, string>;
  };
  setOverride: (lang: 'en' | 'ar', key: string, value: string) => void;
  setBothOverrides: (key: string, en: string, ar: string) => void;
  removeOverride: (key: string) => void;
  addKey: (key: string, en: string, ar: string) => void;
}

export const useTranslationOverridesStore = create<TranslationOverridesState>()(
  persist(
    (set) => ({
      overrides: { en: {}, ar: {} },

      setOverride: (lang, key, value) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [lang]: { ...state.overrides[lang], [key]: value },
          },
        })),

      setBothOverrides: (key, en, ar) =>
        set((state) => ({
          overrides: {
            en: { ...state.overrides.en, [key]: en },
            ar: { ...state.overrides.ar, [key]: ar },
          },
        })),

      removeOverride: (key) =>
        set((state) => {
          const newEn = { ...state.overrides.en };
          const newAr = { ...state.overrides.ar };
          delete newEn[key];
          delete newAr[key];
          return { overrides: { en: newEn, ar: newAr } };
        }),

      addKey: (key, en, ar) =>
        set((state) => ({
          overrides: {
            en: { ...state.overrides.en, [key]: en },
            ar: { ...state.overrides.ar, [key]: ar },
          },
        })),
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
        };
      },
    }
  )
);
