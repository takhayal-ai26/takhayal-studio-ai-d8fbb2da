import { useApp, NavPage } from '@/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X, Crown, ChevronDown, Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TOOLS } from '@/data/tools';

const navItems: { id: string; label: string; route: string }[] = [
  { id: 'canvas', label: 'Studio', route: '/studio' },
  { id: 'community', label: 'Community', route: '/community' },
  { id: 'gallery', label: 'Gallery', route: '/studio' },
  { id: 'templates', label: 'Templates', route: '/studio' },
];

export function TopNavbar() {
  const { activePage, setActivePage, credits, userName, isAuthenticated, plan, openAuthModal, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close tools dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'home') return location.pathname === '/home';
    if (item.id === 'pricing') return location.pathname === '/pricing';
    return activePage === item.id && location.pathname === '/studio';
  };

  const isToolsActive = location.pathname.startsWith('/tools');

  const handleNav = (item: typeof navItems[0]) => {
    setMobileOpen(false);
    setToolsOpen(false);
    if (item.id !== 'pricing') setActivePage(item.id as NavPage);
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

          {/* Tools dropdown */}
          <div ref={toolsRef} className="relative">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`relative px-4 h-16 text-[13px] font-medium transition-colors flex items-center gap-1 ${
                isToolsActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tools
              <ChevronDown size={12} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
              {isToolsActive && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>

            {/* Dropdown panel */}
            {toolsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[340px] bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <span className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Image Tools</span>
                  <div className="mt-1 space-y-0.5">
                    {TOOLS.map(tool => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setToolsOpen(false);
                            navigate(tool.route);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-primary/[0.06] group ${
                            location.pathname === tool.route ? 'bg-primary/[0.08]' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/[0.1] flex items-center justify-center flex-shrink-0 group-hover:bg-primary/[0.15] transition-colors">
                            <Icon size={14} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium text-foreground block">{tool.name}</span>
                            <span className="text-[11px] text-muted-foreground">{tool.shortDesc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
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

            {/* Mobile Tools section */}
            <div className="mt-2 mb-1">
              <span className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Tools</span>
            </div>
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(tool.route);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    location.pathname === tool.route
                      ? 'text-foreground bg-primary/[0.08]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <Icon size={14} className="text-primary" />
                  <span className="text-[15px] font-medium">{tool.name}</span>
                </button>
              );
            })}

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
