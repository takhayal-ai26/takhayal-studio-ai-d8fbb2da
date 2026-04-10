import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Sparkles, Image, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const navItems = [
  { id: 'home', route: '/', icon: Home, labelEn: 'Home', labelAr: 'الرئيسية' },
  { id: 'community', route: '/community', icon: Users, labelEn: 'Community', labelAr: 'المجتمع' },
  { id: 'create', route: '/create', icon: Sparkles, labelEn: 'Create', labelAr: 'إنشاء', primary: true },
  { id: 'gallery', route: '/gallery', icon: Image, labelEn: 'Gallery', labelAr: 'المعرض' },
  { id: 'templates', route: '/templates', icon: LayoutGrid, labelEn: 'Templates', labelAr: 'القوالب' },
];

export function BottomNav({ navHidden = false }: { navHidden?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const isActive = (item: typeof navItems[0]) => {
    if (item.route === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === item.route || location.pathname.startsWith(item.route + '/');
  };

  const handleTap = (item: typeof navItems[0]) => {
    navigate(item.route);
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-[transform,opacity] duration-300 ${navHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      {/* Safe-area padding for iOS */}
      <div className="relative flex items-end justify-around px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => handleTap(item)}
                className="relative flex flex-col items-center gap-0 -mt-2.5"
              >
                <span className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="text-[9px] font-semibold text-primary mt-0.5">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              className="flex flex-col items-center gap-0 py-0.5 px-2 min-w-[48px] transition-colors"
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.2 : 1.6}
                className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-[9px] font-medium transition-colors mt-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
