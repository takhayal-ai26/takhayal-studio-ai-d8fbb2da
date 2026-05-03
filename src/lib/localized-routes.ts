import type { Language } from '@/i18n/translations';

const EN_PREFIX = '/en';
const AR_PREFIX = '/ar';

export function stripLocalePrefix(pathname: string) {
  if (pathname === EN_PREFIX) return '/';
  if (pathname.startsWith(`${EN_PREFIX}/`)) return pathname.slice(EN_PREFIX.length) || '/';
  if (pathname === AR_PREFIX) return '/';
  if (pathname.startsWith(`${AR_PREFIX}/`)) return pathname.slice(AR_PREFIX.length) || '/';
  return pathname || '/';
}

export function isEnglishPath(pathname: string) {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`);
}

export function localizePath(pathname: string, lang: Language) {
  const cleanPath = stripLocalePrefix(pathname);
  if (lang === 'en') return cleanPath === '/' ? EN_PREFIX : `${EN_PREFIX}${cleanPath}`;
  return cleanPath === '/' ? AR_PREFIX : `${AR_PREFIX}${cleanPath}`;
}

export function switchPathLanguage(pathname: string, lang: Language) {
  return localizePath(stripLocalePrefix(pathname), lang);
}
