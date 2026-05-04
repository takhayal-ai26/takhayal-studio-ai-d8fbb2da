import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { translations, Language, TranslationKeys } from './translations';
import { useTranslationOverridesStore } from '@/stores/translationOverridesStore';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationKeys;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Deep-set a dot-notation key on a nested object
function deepSet(obj: any, path: string, value: string) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// Deep clone + merge overrides into a translation tree
function mergeOverrides(base: any, overrides: Record<string, string>): any {
  const result = JSON.parse(JSON.stringify(base));
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && value !== '') {
      deepSet(result, key, value);
    }
  }
  return result;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('takhayal-lang');
      if (stored === 'en') return 'en' as Language;
    } catch {
      // ignore blocked storage access
    }
    return 'ar' as Language;
  });

  const overrides = useTranslationOverridesStore((s) => s.overrides);
  const loadRemoteOverrides = useTranslationOverridesStore((s) => s.loadRemoteOverrides);

  const setLang = useCallback((newLang: Language) => {
    // Dispatch event BEFORE state change so consumers can close modals first
    window.dispatchEvent(new CustomEvent('takhayal-lang-change'));
    setLangState(newLang);
    try {
      localStorage.setItem('takhayal-lang', newLang);
    } catch {
      // ignore blocked storage access
    }
  }, []);

  const isRTL = lang === 'ar';

  useEffect(() => {
    loadRemoteOverrides().catch((error) => {
      console.warn('Failed to load translation overrides', error);
    });
  }, [loadRemoteOverrides]);

  const t = useMemo(() => {
    const langOverrides = overrides[lang] || {};
    if (Object.keys(langOverrides).length === 0) {
      return translations[lang] as any;
    }
    return mergeOverrides(translations[lang], langOverrides);
  }, [lang, overrides]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.body.classList.add('arabic');
    } else {
      document.body.classList.remove('arabic');
    }
  }, [lang, isRTL]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
