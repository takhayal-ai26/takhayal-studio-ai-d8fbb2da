import { useLanguage } from '@/i18n/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { switchPathLanguage } from '@/lib/localized-routes';
import type { Language } from '@/i18n/translations';

export function LanguageToggle({ forceLight = false }: { forceLight?: boolean }) {
  const { lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const switchLanguage = (nextLang: Language) => {
    setLang(nextLang);
    navigate(`${switchPathLanguage(location.pathname, nextLang)}${location.search}${location.hash}`);
  };

  return (
    <div className={`flex items-center p-0.5 rounded-full ${forceLight ? 'bg-white/15 backdrop-blur-md' : 'bg-foreground/[0.06]'}`}>
      <button
        onClick={() => switchLanguage('en')}
        className={`h-8 px-2.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
          lang === 'en'
            ? 'bg-primary text-primary-foreground'
            : forceLight ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('ar')}
        className={`h-8 px-2.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
          lang === 'ar'
            ? 'bg-primary text-primary-foreground'
            : forceLight ? 'text-white/90 hover:text-white' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        AR
      </button>
    </div>
  );
}
