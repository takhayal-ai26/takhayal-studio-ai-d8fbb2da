import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo, LogoMark } from '@/components/Logo';
import { useMedia } from '@/hooks/useMedia';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthModalForm } from './auth/useAuthModalForm';

export function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal } = useApp();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { getUrlByName } = useMedia();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const authVisual = getUrlByName('auth-visual.jpg');
  const [sheetVisible, setSheetVisible] = useState(false);
  const authRedirectUrl = `${window.location.origin}/auth/callback`;
  const resetRedirectUrl = `${window.location.origin}/auth/reset`;
  const authForm = useAuthModalForm({
    initialTab: authModalTab,
    language: lang,
    authRedirectUrl,
    resetRedirectUrl,
  });
  const {
    tab,
    showEmailForm,
    showForgotPassword,
    email,
    password,
    confirmPassword,
    name,
    loading,
    error,
    successMessage,
    setEmail,
    setPassword,
    setConfirmPassword,
    setName,
    resetForm,
    selectTab,
    showEmailOptions,
    backToOptions,
    openForgotPassword,
    handleGoogle,
    handleApple,
    handleSubmit,
    handleForgotPassword,
  } = authForm;

  const handleClose = useCallback(() => {
    if (isMobile) {
      setSheetVisible(false);
      setTimeout(closeAuthModal, 300);
    } else {
      closeAuthModal();
    }
  }, [closeAuthModal, isMobile]);

  useEffect(() => {
    if (authModalOpen) {
      resetForm(authModalTab);
      // Animate in
      requestAnimationFrame(() => setSheetVisible(true));
    } else {
      setSheetVisible(false);
    }
  }, [authModalOpen, authModalTab, resetForm]);
  useEffect(() => {
    if (!authModalOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [authModalOpen, handleClose]);

  useEffect(() => {
    if (user && authModalOpen) {
      closeAuthModal();
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect || '/studio', { replace: true });
    }
  }, [user, authModalOpen, closeAuthModal, navigate]);

  if (!authModalOpen) return null;

  const inputClass = 'w-full h-12 rounded-xl border border-border/70 bg-background/95 px-4 text-sm text-foreground shadow-inner shadow-black/5 placeholder:text-muted-foreground/80 transition-colors focus:border-primary focus:bg-background focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.09] dark:text-white dark:placeholder:text-white/45 dark:focus:bg-white/[0.12]';

  const isRTL = lang === 'ar';

  // ─── Shared content pieces ───
  const googleIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  );
  const appleIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
  );

  const legalFooter = (
    <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
      {isRTL ? 'بالمتابعة، أنت توافق على ' : 'By continuing, you agree to our '}
      <a href="/terms" target="_blank" className="text-primary hover:underline">{isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}</a>
      {isRTL ? ' و' : ' and '}
      <a href="/privacy" target="_blank" className="text-primary hover:underline">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
    </p>
  );

  // ━━━━━━━ MOBILE: Bottom Sheet ━━━━━━━
  if (isMobile) {
    return (
      <MobileAuthSheet isRTL={isRTL} sheetVisible={sheetVisible} onClose={handleClose}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Logo size="small" />
              <button onClick={handleClose} className="min-h-11 min-w-11 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground" aria-label={isRTL ? 'إغلاق' : 'Close'}>
                <X size={16} />
              </button>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h2 className="text-[22px] font-semibold text-foreground leading-tight">
                {t.auth.startCreatingWith}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                {t.auth.turnIdeas}
              </p>
            </div>

            {successMessage ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail size={24} className="text-primary" />
                </div>
                <p className="text-[14px] text-foreground font-medium mb-2">
                  {successMessage.includes('reset') ? (isRTL ? 'تم إرسال رابط إعادة التعيين!' : 'Reset link sent!') : (isRTL ? 'تحقق من بريدك الإلكتروني' : 'Check your email')}
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">{successMessage}</p>
              </div>
            ) : showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <button type="button" onClick={backToOptions} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  {t.auth.backToOptions}
                </button>
                <div>
                  <label htmlFor="auth-reset-email" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label>
                  <input id="auth-reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} />
                </div>
                {error && <p className="text-[12px] text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary text-primary-foreground rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (isRTL ? 'إرسال رابط إعادة التعيين' : 'Send reset link')}
                </button>
              </form>
            ) : showEmailForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <button type="button" onClick={backToOptions} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  {t.auth.backToOptions}
                </button>
                {tab === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.name}</label>
                    <input id="auth-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder={t.auth.yourName} className={inputClass} />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label>
                  <input id="auth-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="auth-password" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.password}</label>
                  <input id="auth-password" type="password" autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
                {tab === 'signup' && (
                  <div>
                    <label htmlFor="auth-confirm-password" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.confirmPassword}</label>
                    <input id="auth-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                )}
                {error && <p className="text-[12px] text-destructive">{error}</p>}
                <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary text-primary-foreground rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : (tab === 'login' ? t.auth.logIn : t.auth.createAccount)}
                </button>
                {tab === 'login' && (
                  <button type="button" onClick={openForgotPassword} className="text-[12px] text-primary w-full text-center">
                    {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                )}
              </form>
            ) : (
              /* ── Main CTA screen ── */
              <div className="space-y-3.5">
                {/* Google — PRIMARY */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full h-[58px] rounded-2xl border border-border/40 bg-background text-foreground text-[15px] font-bold flex items-center justify-center gap-3 shadow-sm hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> : (
                    <>{googleIcon}{t.auth.continueWithGoogle}</>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 py-1">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-widest">{t.auth.or}</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Email — TERTIARY */}
                <button
                  onClick={showEmailOptions}
                  className="w-full h-[54px] rounded-2xl border border-border/40 bg-muted/20 text-foreground text-[14px] font-semibold flex items-center justify-center gap-2.5 hover:bg-muted/40 active:scale-[0.97] transition-all"
                >
                  <Mail size={17} className="text-muted-foreground" />
                  {t.auth.continueWithEmail}
                </button>

                {error && <p className="text-[12px] text-destructive text-center">{error}</p>}
              </div>
            )}

            {/* Footer */}
            {!successMessage && !showEmailForm && !showForgotPassword && (
              <div className="mt-8 space-y-3">
                <p className="text-[12px] text-muted-foreground text-center">
                  {tab === 'login'
                    ? <>{t.auth.dontHaveAccount}{' '}<button onClick={() => selectTab('signup')} className="text-primary font-medium">{t.auth.signUp}</button></>
                    : <>{t.auth.alreadyHaveAccount}{' '}<button onClick={() => selectTab('login')} className="text-primary font-medium">{t.auth.logIn}</button></>
                  }
                </p>
                {legalFooter}
              </div>
            )}
      </MobileAuthSheet>
    );
  }

  // ━━━━━━━ DESKTOP: Original centered modal (unchanged) ━━━━━━━
  return (
    <DesktopAuthDialog
      isRTL={isRTL}
      authVisual={authVisual}
      onClose={closeAuthModal}
      t={t}
    >
        <div className="w-full lg:w-[46%] flex flex-col p-8 lg:p-10 overflow-y-auto bg-card">
          <div className="flex items-center gap-2.5 mb-10"><LogoMark size={28} /><span className="text-[17px] font-medium text-foreground tracking-tight">Takhayal<span className="text-primary">.ai</span></span></div>
          <div className="mb-8">
            <h2 className="typo-heading-section leading-tight">{t.auth.startCreatingWith}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t.auth.turnIdeas}</p>
          </div>
          <div className="flex p-1 rounded-full bg-muted mb-7 w-fit">
            {(['signup', 'login'] as const).map(tb => (
              <button key={tb} onClick={() => selectTab(tb)} className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${tab === tb ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {tb === 'login' ? t.auth.logIn : t.auth.signUp}
              </button>
            ))}
          </div>

          {successMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Mail size={24} className="text-primary" /></div>
              <p className="text-[14px] text-foreground font-medium mb-2">{successMessage.includes('reset') ? 'Reset link sent!' : 'Check your email'}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">{successMessage}</p>
            </div>
          ) : showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-3.5 flex-1">
              <button type="button" onClick={backToOptions} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-1">{t.auth.backToOptions}</button>
              <div><label htmlFor="auth-desktop-reset-email" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label><input id="auth-desktop-reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} /></div>
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary hover:brightness-90 text-primary-foreground rounded-[14px] text-[15px] font-medium transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          ) : !showEmailForm ? (
            <div className="space-y-3 flex-1">
              <button onClick={handleGoogle} disabled={loading} className="w-full h-[56px] rounded-2xl border border-border/40 bg-background text-foreground text-sm font-bold flex items-center justify-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : (<>{googleIcon}{t.auth.continueWithGoogle}</>)}
              </button>
              <button onClick={handleApple} disabled={loading} className="w-full h-[56px] rounded-2xl border border-border/40 bg-background text-foreground text-sm font-bold flex items-center justify-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 disabled:opacity-50">
                {appleIcon}{t.auth.continueWithApple}
              </button>
              <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted-foreground uppercase tracking-wider">{t.auth.or}</span><div className="flex-1 h-px bg-border" /></div>
              <button onClick={showEmailOptions} className="w-full h-[54px] rounded-2xl border border-border/40 bg-muted/20 text-foreground text-sm font-semibold flex items-center justify-center gap-3 hover:bg-muted/50 hover:border-primary/30 transition-all duration-150"><Mail size={17} />{t.auth.continueWithEmail}</button>
              {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
              <button type="button" onClick={backToOptions} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-1">{t.auth.backToOptions}</button>
              {tab === 'signup' && (<div><label htmlFor="auth-desktop-name" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.name}</label><input id="auth-desktop-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder={t.auth.yourName} className={inputClass} /></div>)}
              <div><label htmlFor="auth-desktop-email" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label><input id="auth-desktop-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} /></div>
              <div><label htmlFor="auth-desktop-password" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.password}</label><input id="auth-desktop-password" type="password" autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>
              {tab === 'signup' && (<div><label htmlFor="auth-desktop-confirm-password" className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.confirmPassword}</label><input id="auth-desktop-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>)}
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary hover:brightness-90 text-primary-foreground rounded-[14px] text-[15px] font-medium transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : (tab === 'login' ? t.auth.logIn : t.auth.createAccount)}
              </button>
              {tab === 'login' && (
                <button type="button" onClick={openForgotPassword} className="text-[12px] text-primary hover:underline w-full text-center mt-2">Forgot password?</button>
              )}
            </form>
          )}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[12px] text-muted-foreground text-center">
              {tab === 'login' ? (<>{t.auth.dontHaveAccount}{' '}<button onClick={() => selectTab('signup')} className="text-primary hover:underline">{t.auth.signUp}</button></>) : (<>{t.auth.alreadyHaveAccount}{' '}<button onClick={() => selectTab('login')} className="text-primary hover:underline">{t.auth.logIn}</button></>)}
            </p>
            {legalFooter}
          </div>
        </div>
    </DesktopAuthDialog>
  );
}

function MobileAuthSheet({
  isRTL,
  sheetVisible,
  onClose,
  children,
}: {
  isRTL: boolean;
  sheetVisible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100]" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${sheetVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl transition-transform duration-300 ease-out ${sheetVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-6 pb-8 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 20px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DesktopAuthDialog({
  isRTL,
  authVisual,
  onClose,
  t,
  children,
}: {
  isRTL: boolean;
  authVisual: string;
  onClose: () => void;
  t: ReturnType<typeof useLanguage>['t'];
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/65 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[1040px] h-[660px] max-h-[90vh] rounded-3xl overflow-hidden flex animate-scale-in bg-card">
        <button onClick={onClose} className="absolute top-5 right-5 z-10 min-h-11 min-w-11 rounded-full bg-black/30 dark:bg-black/50 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors" aria-label={isRTL ? 'إغلاق' : 'Close'}><X size={16} /></button>
        {children}
        <div className="hidden lg:block w-[54%] relative">
          <img src={authVisual} alt="AI generated visual" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-medium mb-4">{t.auth.arabicFirstBadge}</span>
            <h3 className="typo-heading-card leading-snug max-w-[320px]">{t.auth.brandTagline}</h3>
            <div className="flex gap-4 mt-5">
              {[t.auth.productShots, t.auth.socialVisuals, t.auth.campaignCreatives].map(f => (<span key={f} className="text-[11px] text-white/50">{f}</span>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
