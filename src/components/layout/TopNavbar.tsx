import { useApp, NavPage } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X, Crown, CreditCard, Settings, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppTheme } from '@/context/AppThemeContext';

const navItemDefs: { id: string; labelKey: string; route: string; studioPage?: NavPage }[] = [
  { id: 'home', labelKey: 'home', route: '/home' },
  { id: 'studio', labelKey: 'studio', route: '/studio', studioPage: 'canvas' },
  { id: 'tools', labelKey: 'tools', route: '/tools' },
  { id: 'community', labelKey: 'community', route: '/community' },
  { id: 'gallery', labelKey: 'gallery', route: '/studio', studioPage: 'gallery' },
  { id: 'templates', labelKey: 'templates', route: '/studio', studioPage: 'templates' },
  { id: 'pricing', labelKey: 'pricing', route: '/pricing' },
];

export function TopNavbar() {
  const { activePage, setActivePage, credits, userName, userAvatarUrl, isAuthenticated, plan, openAuthModal, logout } = useApp();
  const { t, isRTL } = useLanguage();
  const { isAdmin } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const lowCredits = credits <= 5 && credits > 0;

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    studio: t.nav.studio,
    tools: t.nav.tools,
    community: t.nav.community,
    gallery: t.nav.gallery,
    templates: t.nav.templates,
    pricing: t.nav.pricing,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (item: typeof navItemDefs[0]) => {
    if (item.studioPage) return location.pathname === '/studio' && activePage === item.studioPage;
    return location.pathname === item.route || (item.route !== '/' && location.pathname.startsWith(item.route));
  };

  const handleNav = (item: typeof navItemDefs[0]) => {
    setMobileOpen(false);
    if (item.studioPage) setActivePage(item.studioPage);
    navigate(item.route);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-b border-border/40 flex items-center px-5 md:px-6">
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-1 mx-auto">
          {navItemDefs.filter(item => !(isAuthenticated && item.id === 'pricing')).map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                isActive(item)
                  ? 'text-foreground bg-foreground/[0.06]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
              }`}
            >
              {navLabels[item.labelKey]}
            </button>
          ))}
        </div>

        {/* Right: State-dependent */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
          {!isAdmin && <ThemeToggle />}
          <LanguageToggle />
          {isAuthenticated ? (
            <>
              {/* Credit pill */}
              <button
                onClick={() => { setActivePage('credits'); navigate('/studio'); }}
                title={t.common.viewCredits}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                  lowCredits
                    ? 'bg-primary/10 text-primary'
                    : 'bg-foreground/[0.05] hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flame size={13} className={`${lowCredits ? 'text-primary animate-pulse' : ''}`} />
                <span className="text-[13px] font-medium tabular-nums">{credits}</span>
              </button>

              {/* Upgrade or Pro badge */}
              {plan === 'free' ? (
                <button
                  onClick={() => navigate('/pricing')}
                  className="h-8 px-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[12px] font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
                >
                  {t.nav.upgrade}
                </button>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/8 rounded-full text-[11px] font-semibold text-primary">
                  <Crown size={11} />
                  {t.nav.pro}
                </span>
              )}

              {/* Avatar + dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : initials}
                </button>

                {avatarOpen && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-52 bg-popover border border-border/40 rounded-2xl p-1.5 elevation-3 z-50 animate-fade-in`}>
                    <div className="px-3 py-2.5 border-b border-border/30 mb-1">
                      <p className="text-[13px] font-medium text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground">{plan === 'pro' ? t.avatar.proPlan : t.avatar.freePlan}</p>
                    </div>
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('credits'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.04] transition-colors"
                    >
                      <CreditCard size={14} className="text-muted-foreground" />
                      {t.avatar.billingCredits}
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('settings'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.04] transition-colors"
                    >
                      <Settings size={14} className="text-muted-foreground" />
                      {t.avatar.settings}
                    </button>
                    <div className="border-t border-border/30 mt-1 pt-1">
                      <button
                        onClick={() => { setAvatarOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        {t.avatar.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/[0.04]"
              >
                {t.nav.login}
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-200"
              >
                {t.nav.signup}
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden ${isRTL ? 'mr-auto' : 'ml-auto'} text-foreground p-2`}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-14 flex flex-col md:hidden overflow-y-auto animate-fade-in">
          <div className="flex flex-col p-5 gap-0.5">
            <div className="mb-4 flex items-center gap-3">
              {!isAdmin && <ThemeToggle />}
              <LanguageToggle />
            </div>
            {navItemDefs.filter(item => !(isAuthenticated && item.id === 'pricing')).map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`text-${isRTL ? 'right' : 'left'} px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                  isActive(item)
                    ? 'text-foreground bg-foreground/[0.06]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                }`}
              >
                {navLabels[item.labelKey]}
              </button>
            ))}
          </div>
          <div className="mt-auto p-5 border-t border-border/30">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] text-foreground block font-medium">{userName}</span>
                    <span className="text-[11px] text-muted-foreground">{plan === 'pro' ? 'Pro' : t.pricing.free}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                    lowCredits ? 'bg-primary/10 text-primary' : 'bg-foreground/[0.05] text-muted-foreground'
                  }`}>
                    <Flame size={13} className={lowCredits ? 'text-primary' : ''} />
                    <span className="text-[13px] font-medium">{credits}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); setActivePage('credits'); navigate('/studio'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[14px] text-foreground hover:bg-foreground/[0.04] transition-colors"
                >
                  <CreditCard size={16} className="text-muted-foreground" />
                  {t.avatar.billingCredits}
                </button>
                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[14px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  {t.avatar.logout}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setMobileOpen(false); openAuthModal('login'); }}
                  className="flex-1 h-11 rounded-xl bg-foreground/[0.05] text-foreground text-[14px] font-medium"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => { setMobileOpen(false); openAuthModal('signup'); }}
                  className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-[14px] font-semibold"
                >
                  {t.nav.signup}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
