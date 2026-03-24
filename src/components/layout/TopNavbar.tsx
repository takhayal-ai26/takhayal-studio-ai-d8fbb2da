import { useApp, NavPage } from '@/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems: { id: NavPage; label: string; route: string }[] = [
  { id: 'home', label: 'Home', route: '/home' },
  { id: 'canvas', label: 'Canvas', route: '/canvas' },
  { id: 'gallery', label: 'Gallery', route: '/canvas' },
  { id: 'templates', label: 'Templates', route: '/canvas' },
  { id: 'credits', label: 'Credits', route: '/canvas' },
];

export function TopNavbar() {
  const { activePage, setActivePage, credits, userName, isAuthenticated, openAuthModal, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'home') return location.pathname === '/home';
    return activePage === item.id && location.pathname === '/canvas';
  };

  const handleNav = (item: typeof navItems[0]) => {
    setMobileOpen(false);
    setActivePage(item.id);
    navigate(item.route);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-surface-border flex items-center px-5 md:px-6">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-1 mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative px-4 h-16 text-[13px] font-medium transition-colors ${
                isActive(item)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              {isActive(item) && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Right: Auth-dependent */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-surface-border rounded-lg">
                <Flame size={14} className="text-primary" />
                <span className="text-[13px] font-medium text-foreground">{credits} credits</span>
              </div>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-full bg-card border border-surface-border flex items-center justify-center text-xs font-medium text-foreground hover:border-primary transition-colors"
                title="Log out"
              >
                {initials}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Log in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-ember-hover transition-colors"
              >
                Sign up
              </button>
            </>
          )}
        </div>

        {/* Mobile: Menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden ml-auto text-foreground p-2"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-16 flex flex-col md:hidden">
          <div className="flex flex-col p-6 gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`text-left px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                  isActive(item)
                    ? 'text-foreground bg-primary/[0.08]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-auto p-6 border-t border-surface-border">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-card border border-surface-border flex items-center justify-center text-xs font-medium text-foreground">
                  {initials}
                </div>
                <span className="text-[13px] text-muted-foreground">{userName}</span>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-card border border-surface-border rounded-lg">
                  <Flame size={14} className="text-primary" />
                  <span className="text-[13px] font-medium text-foreground">{credits}</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setMobileOpen(false); openAuthModal('login'); }}
                  className="flex-1 h-11 rounded-lg border border-surface-border text-foreground text-[14px] font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => { setMobileOpen(false); openAuthModal('signup'); }}
                  className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
