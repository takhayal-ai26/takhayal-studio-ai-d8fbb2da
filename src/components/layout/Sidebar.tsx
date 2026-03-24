import { Home, Wand2, Grid3X3, LayoutTemplate, Coins, Settings, Flame } from 'lucide-react';
import { useApp, NavPage } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';

const navItems: { id: NavPage; label: string; icon: typeof Wand2; route?: string }[] = [
  { id: 'home', label: 'Home', icon: Home, route: '/' },
  { id: 'canvas', label: 'Canvas', icon: Wand2 },
  { id: 'gallery', label: 'Gallery', icon: Grid3X3 },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'credits', label: 'Credits', icon: Coins },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activePage, setActivePage, credits, userName } = useApp();
  const navigate = useNavigate();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';

  const handleNav = (item: typeof navItems[0]) => {
    if (item.route) {
      navigate(item.route);
    } else {
      setActivePage(item.id);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] min-h-screen border-r border-border bg-background flex-shrink-0">
        <div className="px-4 py-5">
          <Logo />
        </div>
        <div className="h-px bg-border" />

        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {navItems.map(item => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                  active
                    ? 'text-foreground bg-primary/[0.08] border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <item.icon size={18} className={active ? 'text-primary' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mx-2 mb-2 p-2.5 px-3 bg-card border border-surface-border rounded-lg">
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-primary" />
              <span className="text-[13px] font-medium text-foreground">{credits} credits</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 ml-[22px]">≈ {Math.floor(credits / 2)} images</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-card border border-surface-border flex items-center justify-center text-xs font-medium text-foreground">
              {initials}
            </div>
            <span className="text-[13px] text-muted-foreground truncate flex-1">{userName || 'Guest'}</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background border-t border-border h-14">
        {navItems.map(item => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`flex flex-col items-center gap-0.5 p-1 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
