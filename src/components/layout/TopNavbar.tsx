import { useApp, NavPage } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X, Crown, CreditCard, Settings, LogOut, Sun, Moon, User } from 'lucide-react';
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

export function TopNavbar({ bannerOffset = false }: { bannerOffset?: boolean }) {
  const { activePage, setActivePage, credits, userName, userAvatarUrl, isAuthenticated, plan, openAuthModal, logout } = useApp();
  const { t, isRTL } = useLanguage();
  const { lang, setLang } = useLanguage();
  const { isAdmin, mode, toggleMode } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    if (item.studioPage) setActivePage(item.studioPage);
    navigate(item.route);
  };

  return (
    <>
      <nav dir="ltr" className={`fixed left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl flex items-center px-5 md:px-6 transition-[top] duration-200 ${bannerOffset ? 'top-[40px]' : 'top-0'}`}>
        <div className={`flex-shrink-0 whitespace-nowrap ${isRTL ? 'order-2 md:order-first' : ''}`}>
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

        {/* Right: Desktop controls */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
          {!isAdmin && <ThemeToggle />}
          <LanguageToggle />
          {isAuthenticated ? (
            <>
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

        {/* ━━━ Mobile header ━━━ */}
        <div className={`flex md:hidden items-center gap-2.5 ${isRTL ? 'order-1 mr-auto ml-0' : 'ml-auto'}`}>
          {isAuthenticated ? (
            <>
              {/* Credits pill */}
              <button
                onClick={() => { setActivePage('credits'); navigate('/studio'); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                  lowCredits ? 'bg-primary/10 text-primary' : 'bg-foreground/[0.05] text-muted-foreground'
                }`}
              >
                <Flame size={12} className={lowCredits ? 'text-primary animate-pulse' : ''} />
                <span className="tabular-nums">{credits}</span>
              </button>

              {/* Avatar */}
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
                    {plan === 'free' && (
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/pricing'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-primary font-medium hover:bg-primary/5 transition-colors"
                      >
                        <Crown size={14} />
                        {t.nav.upgrade}
                      </button>
                    )}
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
                    {/* Language & Theme inside avatar dropdown for logged-in */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-1 p-0.5 rounded-full bg-foreground/[0.04]">
                        <button onClick={() => setLang('en')} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>EN</button>
                        <button onClick={() => setLang('ar')} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>AR</button>
                      </div>
                      <button onClick={toggleMode} className="w-7 h-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
                        {mode === 'dark' ? <Sun size={14} className="text-muted-foreground" /> : <Moon size={14} className="text-muted-foreground" />}
                      </button>
                    </div>
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
              {/* Menu icon → opens drawer (left of CTA) */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu size={18} />
              </button>

              {/* Try Free CTA */}
              <button
                onClick={() => openAuthModal('signup')}
                className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95"
              >
                {isRTL ? 'جرّب مجاناً' : 'Try Free'}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ━━━ Mobile menu drawer (logged-out only) ━━━ */}
      {drawerOpen && !isAuthenticated && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-0 bottom-0 z-[70] w-64 bg-background shadow-2xl p-5 flex flex-col gap-6 animate-slide-in-right md:hidden`}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-foreground">{isRTL ? 'القائمة' : 'Menu'}</span>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Log in */}
            <button
              onClick={() => { setDrawerOpen(false); openAuthModal('login'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-foreground hover:bg-foreground/[0.04] transition-colors"
            >
              <User size={18} className="text-muted-foreground" />
              {t.nav.login}
            </button>

            {/* Language */}
            <div className="flex items-center justify-between px-3">
              <span className="text-[13px] text-muted-foreground">{isRTL ? 'اللغة' : 'Language'}</span>
              <div className="flex items-center gap-1 p-0.5 rounded-full bg-foreground/[0.04]">
                <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>EN</button>
                <button onClick={() => setLang('ar')} className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>AR</button>
              </div>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between px-3">
              <span className="text-[13px] text-muted-foreground">{isRTL ? 'المظهر' : 'Theme'}</span>
              <button
                onClick={toggleMode}
                className="w-9 h-9 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}