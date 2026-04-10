import { useApp, NavPage } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Flame, Menu, X, Crown, CreditCard, Settings, LogOut, Sun, Moon, User, Sparkles, Image as ImageIcon, LayoutGrid, Users, Mail } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppTheme } from '@/context/AppThemeContext';

const navItemDefs: { id: string; labelKey: string; route: string; studioPage?: NavPage }[] = [
  { id: 'home', labelKey: 'home', route: '/home' },
  { id: 'image', labelKey: 'image', route: '/image' },
  { id: 'video', labelKey: 'video', route: '/video' },
  { id: 'gallery', labelKey: 'gallery', route: '/gallery' },
  { id: 'templates', labelKey: 'templates', route: '/templates' },
  { id: 'community', labelKey: 'community', route: '/community' },
  { id: 'pricing', labelKey: 'pricing', route: '/pricing' },
];

export function TopNavbar({ bannerOffset = false }: { bannerOffset?: boolean }) {
  const { activePage, setActivePage, credits, userName, userAvatarUrl, isAuthenticated, plan, openAuthModal, logout } = useApp();
  const { t, isRTL } = useLanguage();
  const { lang, setLang } = useLanguage();
  const { isAdmin, mode, toggleMode } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isHeroPage = location.pathname === '/' || location.pathname === '/home';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHeroPage) { setScrolled(false); return; }
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHeroPage]);
  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'U';
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const desktopAvatarRef = useRef<HTMLDivElement>(null);
  const mobileAvatarRef = useRef<HTMLDivElement>(null);

  const lowCredits = credits <= 5 && credits > 0;

  const navLabels: Record<string, string> = {
    home: t.nav.home,
    image: t.nav.image || 'Image',
    video: t.nav.video || 'Video',
    community: t.nav.community,
    gallery: t.nav.gallery,
    templates: t.nav.templates,
    pricing: t.nav.pricing,
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedDesktopMenu = !!desktopAvatarRef.current?.contains(target);
      const clickedMobileMenu = !!mobileAvatarRef.current?.contains(target);

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        setAvatarOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const closeTransientPanels = () => {
      setAvatarOpen(false);
      setDrawerOpen(false);
    };

    window.addEventListener('takhayal-lang-change', closeTransientPanels);
    return () => window.removeEventListener('takhayal-lang-change', closeTransientPanels);
  }, []);

  useEffect(() => {
    setAvatarOpen(false);
    setDrawerOpen(false);
  }, [lang]);

  const getAvatarMenuStyle = (triggerRef: React.RefObject<HTMLDivElement>) => {
    const rect = triggerRef.current?.getBoundingClientRect();

    if (!rect) {
      return {
        zIndex: 9999,
        top: 64,
        ...(isRTL ? { left: 16 } : { right: 16 }),
      };
    }

    return {
      zIndex: 9999,
      top: rect.bottom + 8,
      ...(isRTL
        ? { left: Math.max(rect.left, 16) }
        : { right: Math.max(window.innerWidth - rect.right, 16) }),
    };
  };

  const isActive = (item: typeof navItemDefs[0]) => {
    if (item.route === '/home') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === item.route || (item.route !== '/' && location.pathname.startsWith(item.route));
  };

  const handleNav = (item: typeof navItemDefs[0]) => {
    navigate(item.route);
  };

  return (
    <>
      <nav dir={isRTL ? 'rtl' : 'ltr'} className={`fixed left-0 right-0 z-50 h-14 flex items-center px-5 md:px-6 transition-[top,background] duration-300 ${bannerOffset ? 'top-[40px]' : 'top-0'} ${isHeroPage ? 'bg-transparent' : 'bg-background/80 backdrop-blur-xl'}`}>
        <div className="flex-shrink-0 whitespace-nowrap">
          <Logo />
        </div>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-1 mx-auto">
          {navItemDefs.filter(item => !(isAuthenticated && item.id === 'pricing')).map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={`relative px-3.5 py-1.5 text-base font-extrabold rounded-lg transition-all duration-200 ${
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

              <div ref={desktopAvatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : initials}
                </button>

                {avatarOpen && (
                  <div
                    className={`fixed ${isRTL ? 'left-auto right-auto' : ''} w-56 bg-popover/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl shadow-black/20 animate-fade-in`}
                    style={getAvatarMenuStyle(desktopAvatarRef)}
                  >
                    {/* User info */}
                    <div className="px-3 py-3 mb-1">
                      <p className="text-[13px] font-semibold text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{plan === 'pro' ? t.avatar.proPlan : t.avatar.freePlan}</p>
                    </div>

                    <div className="h-px bg-foreground/[0.06] mx-2 mb-1" />

                    {/* Menu items */}
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('credits'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <CreditCard size={15} className="text-muted-foreground" />
                      {t.avatar.billingCredits}
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('settings'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      {t.avatar.settings}
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); navigate('/contact'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <Mail size={15} className="text-muted-foreground" />
                      {isRTL ? 'تواصل معنا' : 'Contact Us'}
                    </button>

                    {/* Language & Theme */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-foreground/[0.05]">
                        <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
                        <button onClick={() => setLang('ar')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>AR</button>
                      </div>
                      <button onClick={toggleMode} className="w-8 h-8 rounded-full bg-foreground/[0.05] flex items-center justify-center hover:bg-foreground/[0.08] transition-colors">
                        {mode === 'dark' ? <Sun size={14} className="text-muted-foreground" /> : <Moon size={14} className="text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="h-px bg-foreground/[0.06] mx-2 my-1" />

                    {/* Upgrade CTA */}
                    {plan === 'free' && (
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/pricing'); }}
                        className="w-full mt-1 mb-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #FF6B35 50%, #F03E1B 100%)' }}
                      >
                        <Crown size={14} />
                        {t.nav.upgrade}
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      onClick={() => { setAvatarOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut size={14} />
                      {t.avatar.logout}
                    </button>
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
        <div className="flex md:hidden items-center gap-2.5 ms-auto">
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
              <div ref={mobileAvatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="w-8 h-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                >
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : initials}
                </button>
                {avatarOpen && (
                  <div
                    className={`fixed w-56 bg-popover/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl shadow-black/20 animate-fade-in`}
                    style={getAvatarMenuStyle(mobileAvatarRef)}
                  >
                    {/* User info */}
                    <div className="px-3 py-3 mb-1">
                      <p className="text-[13px] font-semibold text-foreground">{userName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{plan === 'pro' ? t.avatar.proPlan : t.avatar.freePlan}</p>
                    </div>

                    <div className="h-px bg-foreground/[0.06] mx-2 mb-1" />

                    {/* Menu items */}
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('credits'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <CreditCard size={15} className="text-muted-foreground" />
                      {t.avatar.billingCredits}
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); setActivePage('settings'); navigate('/studio'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      {t.avatar.settings}
                    </button>
                    <button
                      onClick={() => { setAvatarOpen(false); navigate('/contact'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-foreground hover:bg-foreground/[0.05] transition-colors"
                    >
                      <Mail size={15} className="text-muted-foreground" />
                      {isRTL ? 'تواصل معنا' : 'Contact Us'}
                    </button>

                    {/* Language & Theme */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-foreground/[0.05]">
                        <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>EN</button>
                        <button onClick={() => setLang('ar')} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>AR</button>
                      </div>
                      <button onClick={toggleMode} className="w-8 h-8 rounded-full bg-foreground/[0.05] flex items-center justify-center hover:bg-foreground/[0.08] transition-colors">
                        {mode === 'dark' ? <Sun size={14} className="text-muted-foreground" /> : <Moon size={14} className="text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="h-px bg-foreground/[0.06] mx-2 my-1" />

                    {/* Upgrade CTA - gradient button */}
                    {plan === 'free' && (
                      <button
                        onClick={() => { setAvatarOpen(false); navigate('/pricing'); }}
                        className="w-full mx-auto mt-1 mb-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #FF6B35 50%, #F03E1B 100%)' }}
                      >
                        <Crown size={14} />
                        {t.nav.upgrade}
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      onClick={() => { setAvatarOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut size={14} />
                      {t.avatar.logout}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Try Free CTA */}
              <button
                onClick={() => openAuthModal('signup')}
                className="h-8 px-4 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold shadow-lg shadow-primary/20 transition-all duration-200 active:scale-95"
              >
                {isRTL ? 'جرّب مجاناً' : 'Try Free'}
              </button>

              {/* Menu icon */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu size={18} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ━━━ Mobile menu drawer (logged-out only) ━━━ */}
      {drawerOpen && !isAuthenticated && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm animate-fade-in md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div dir={isRTL ? 'rtl' : 'ltr'} className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-0 bottom-0 z-[70] w-72 bg-background shadow-2xl flex flex-col animate-slide-in-right md:hidden`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-[14px] font-semibold text-foreground">{isRTL ? 'القائمة' : 'Menu'}</span>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {/* Log in */}
              <button
                onClick={() => { setDrawerOpen(false); openAuthModal('login'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <User size={18} className="text-muted-foreground" />
                {isRTL ? 'تسجيل الدخول' : 'Log in'}
              </button>

              <div className="h-px bg-foreground/[0.06] my-2" />

              {/* Navigation */}
              {[
                { label: isRTL ? 'استكشاف الأدوات' : 'Explore Tools', icon: Sparkles, route: '/tools' },
                { label: isRTL ? 'المعرض' : 'Gallery', icon: ImageIcon, route: '/gallery' },
                { label: isRTL ? 'القوالب' : 'Templates', icon: LayoutGrid, route: '/templates' },
                { label: isRTL ? 'المجتمع' : 'Community', icon: Users, route: '/community' },
              ].map(item => (
                <button
                  key={item.route}
                  onClick={() => { setDrawerOpen(false); navigate(item.route); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground hover:bg-foreground/[0.04] transition-colors"
                >
                  <item.icon size={18} className="text-muted-foreground" />
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-foreground/[0.06] my-2" />

              {/* Pricing */}
              <button
                onClick={() => { setDrawerOpen(false); navigate('/pricing'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <CreditCard size={18} className="text-muted-foreground" />
                {isRTL ? 'الأسعار' : 'Pricing'}
              </button>
              <button
                onClick={() => { setDrawerOpen(false); navigate('/contact'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <Mail size={18} className="text-muted-foreground" />
                {isRTL ? 'تواصل معنا' : 'Contact Us'}
              </button>

              <div className="h-px bg-foreground/[0.06] my-2" />

              {/* Settings row */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[12px] text-muted-foreground">{isRTL ? 'اللغة' : 'Language'}</span>
                <div className="flex items-center gap-1 p-0.5 rounded-full bg-foreground/[0.04]">
                  <button onClick={() => setLang('en')} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>EN</button>
                  <button onClick={() => setLang('ar')} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>AR</button>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[12px] text-muted-foreground">{isRTL ? 'الوضع' : 'Theme'}</span>
                <button onClick={toggleMode} className="w-8 h-8 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>
            </div>

            {/* Bottom sticky CTA */}
            <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              <p className="text-center text-[11px] text-muted-foreground mb-2">✨ {isRTL ? 'احصل على رصيد مجاني فوراً' : 'Get free credits instantly'}</p>
              <button
                onClick={() => { setDrawerOpen(false); openAuthModal('signup'); }}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 active:scale-[0.97]"
              >
                {isRTL ? 'جرّب مجاناً' : 'Try Free'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}