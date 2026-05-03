import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Sparkles, Image, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { localizePath, stripLocalePrefix } from '@/lib/localized-routes';

const navItems = [
  { id: 'home', route: '/', icon: Home, labelEn: 'Home', labelAr: 'الرئيسية' },
  { id: 'community', route: '/community', icon: Users, labelEn: 'Community', labelAr: 'المجتمع' },
  { id: 'create', route: '/create', icon: Sparkles, labelEn: 'Create', labelAr: 'إنشاء', primary: true },
  { id: 'gallery', route: '/gallery', icon: Image, labelEn: 'Gallery', labelAr: 'المعرض' },
  { id: 'templates', route: '/templates', icon: LayoutGrid, labelEn: 'Templates', labelAr: 'القوالب' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const isActive = (item: typeof navItems[0]) => {
    const path = stripLocalePrefix(location.pathname);
    if (item.route === '/') return path === '/' || path === '/home';
    return path === item.route || path.startsWith(item.route + '/');
  };

  const handleTap = (item: typeof navItems[0]) => {
    navigate(localizePath(item.route, lang));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/94 backdrop-blur-xl border-t border-border/30" />
      {/* Safe-area padding for iOS */}
      <div className="relative flex items-end justify-around px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => handleTap(item)}
                className="relative flex min-h-11 min-w-[52px] flex-col items-center justify-center gap-0.5 -mt-1.5 px-1"
                aria-current={active ? 'page' : undefined}
              >
                <span className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 transition-transform active:scale-95">
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <span className="text-[9px] font-semibold text-primary leading-none">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              className="flex min-h-11 min-w-[52px] flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-colors"
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.6}
                className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-[9px] font-medium leading-none transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
