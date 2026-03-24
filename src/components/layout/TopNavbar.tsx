import { useApp, NavPage } from '@/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X, Crown } from 'lucide-react';
import { useState } from 'react';

const navItems: { id: string; label: string; route: string; studioPage?: NavPage }[] = [
  { id: 'home', label: 'Home', route: '/home' },
  { id: 'studio', label: 'Studio', route: '/studio', studioPage: 'canvas' },
  { id: 'tools', label: 'Tools', route: '/tools' },
  { id: 'community', label: 'Community', route: '/community' },
  { id: 'gallery', label: 'Gallery', route: '/studio', studioPage: 'gallery' },
  { id: 'templates', label: 'Templates', route: '/studio', studioPage: 'templates' },
  { id: 'credits', label: 'Credits', route: '/studio', studioPage: 'credits' },
];

export function TopNavbar() {
  const { activePage, setActivePage, credits, userName, isAuthenticated, plan, openAuthModal, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: typeof navItems[0]) => {
    if (item.studioPage) return location.pathname === '/studio' && activePage === item.studioPage;
    return location.pathname === item.route || (item.route !== '/' && location.pathname.startsWith(item.route));
  };

  const handleNav = (item: typeof navItems[0]) => {
    setMobileOpen(false);
    if (item.studioPage) setActivePage(item.studioPage);
    navigate(item.route);
  };

  const lowCredits = credits <= 5 && credits > 0;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-surface-border flex items-center px-5 md:px-6">
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-0.5 mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative px-3.5 h-16 text-[13px] font-medium transition-colors ${
                isActive(item)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              {isActive(item) && (
                <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Right: State-dependent */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {isAuthenticated ? (
            <>
              <div className={`flex items-center gap-2 px-3 py-1.5 bg-card border rounded-lg transition-colors ${
                lowCredits ? 'border-primary/50' : 'border-surface-border'
              }`}>
                <Flame size={14} className={lowCredits ? 'text-primary animate-pulse' : 'text-primary'} />
                <span className={`text-[13px] font-medium ${lowCredits ? 'text-primary' : 'text-foreground'}`}>
                  {credits} credits
                </span>
              </div>
              {plan === 'free' ? (
                <button
                  onClick={() => navigate('/pricing')}
                  className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-ember-hover transition-colors"
                >
                  Upgrade
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/[0.1] border border-primary/20 rounded-lg text-[12px] font-medium text-primary">
                  <Crown size={12} />
                  Pro
                </span>
              )}
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
                onClick={() => navigate('/pricing')}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Pricing
              </button>
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
        <div className="fixed inset-0 z-40 bg-background pt-16 flex flex-col md:hidden overflow-y-auto">
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
            {!isAuthenticated && (
              <button
                onClick={() => { setMobileOpen(false); navigate('/pricing'); }}
                className="text-left px-4 py-3 rounded-lg text-[15px] font-medium text-muted-foreground hover:text-foreground hover:bg-card"
              >
                Pricing
              </button>
            )}
          </div>
          <div className="mt-auto p-6 border-t border-surface-border">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-card border border-surface-border flex items-center justify-center text-xs font-medium text-foreground">
                  {initials}
                </div>
                <div className="flex-1">
                  <span className="text-[13px] text-foreground block">{userName}</span>
                  <span className="text-[11px] text-muted-foreground">{plan === 'pro' ? 'Pro' : 'Free'}</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 bg-card border rounded-lg ${
                  lowCredits ? 'border-primary/50' : 'border-surface-border'
                }`}>
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
