import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Sparkles, Image, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useApp } from '@/context/AppContext';

const navItems = [
  { id: 'home', route: '/', icon: Home, labelEn: 'Home', labelAr: 'الرئيسية' },
  { id: 'community', route: '/community', icon: Users, labelEn: 'Community', labelAr: 'المجتمع' },
  { id: 'create', route: '/create', icon: Sparkles, labelEn: 'Create', labelAr: 'إنشاء', primary: true },
  { id: 'gallery', route: '/gallery', icon: Image, labelEn: 'Gallery', labelAr: 'المعرض' },
  { id: 'templates', route: '/templates', icon: LayoutGrid, labelEn: 'Library', labelAr: 'المكتبة' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const { activePage, setActivePage } = useApp();
  const isAr = lang === 'ar';

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'create') return location.pathname === '/create';
    if (item.route === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === item.route;
  };

  const handleTap = (item: typeof navItems[0]) => {
    navigate(item.route);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      {/* Safe-area padding for iOS */}
      <div className="relative flex items-end justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => handleTap(item)}
                className="relative flex flex-col items-center gap-0.5 -mt-3"
              >
                <span className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <span className="text-[10px] font-semibold text-primary">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item)}
              className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-[56px] transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.6}
                className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {isAr ? item.labelAr : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
