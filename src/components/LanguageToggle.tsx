import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center p-0.5 rounded-full bg-card border border-surface-border">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-200 ${
          lang === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('ar')}
        className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-200 ${
          lang === 'ar'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        AR
      </button>
    </div>
  );
}
