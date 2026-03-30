import { useState, useEffect } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useMedia } from '@/hooks/useMedia';

export function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal } = useAuth();
  const { lang } = useLanguage();
  const { getUrlByName } = useMedia();
  const isRTL = lang === 'ar';

  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [view, setView] = useState<'main' | 'email' | 'forgot'>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { setTab(authModalTab); }, [authModalTab]);
  useEffect(() => {
    if (authModalOpen) {
      setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('');
      setError(''); setSuccess(''); setView('main'); setLoading(false);
    }
  }, [authModalOpen]);
  useEffect(() => {
    if (!authModalOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const logoMark = getUrlByName('logo-mark.svg');
  const logoAr = getUrlByName('logo-mark-ar.svg');

  const t = {
    headline: isRTL ? 'ابدأ الإبداع مع تخيّل' : 'Start creating with Takhayal',
    sub: isRTL ? 'حوّل أفكارك إلى صور احترافية في ثوانٍ.' : 'Turn ideas into premium visuals in seconds.',
    signup: isRTL ? 'إنشاء حساب' : 'Sign up',
    login: isRTL ? 'تسجيل الدخول' : 'Log in',
    google: isRTL ? 'المتابعة مع Google' : 'Continue with Google',
    apple: isRTL ? 'المتابعة مع Apple' : 'Continue with Apple',
    or: isRTL ? 'أو' : 'OR',
    emailBtn: isRTL ? 'المتابعة بالبريد الإلكتروني' : 'Continue with email',
    name: isRTL ? 'الاسم الكامل' : 'Full Name',
    email: isRTL ? 'البريد الإلكتروني' : 'Email',
    password: isRTL ? 'كلمة المرور' : 'Password',
    confirmPw: isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password',
    createAccount: isRTL ? 'إنشاء حساب' : 'Create Account',
    creating: isRTL ? 'جارٍ إنشاء الحساب...' : 'Creating account...',
    signingIn: isRTL ? 'جارٍ تسجيل الدخول...' : 'Signing in...',
    forgot: isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?',
    back: isRTL ? '← رجوع' : '← Back',
    noAccount: isRTL ? 'ليس لديك حساب؟' : "Don't have an account?",
    hasAccount: isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    terms: isRTL ? 'الشروط والأحكام' : 'Terms & Conditions',
    privacy: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy',
    legalPre: isRTL ? 'بالمتابعة، أنت توافق على ' : 'By continuing, you agree to our ',
    legalAnd: isRTL ? ' و' : ' and ',
    resetTitle: isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset your password',
    sendReset: isRTL ? 'إرسال رابط الإعادة' : 'Send reset link',
    resetSent: isRTL ? 'تم إرسال رابط إعادة التعيين. تحقق من بريدك الإلكتروني.' : 'Password reset link sent. Check your email.',
    checkEmail: isRTL ? 'تحقق من بريدك الإلكتروني لتأكيد حسابك قبل تسجيل الدخول.' : 'Check your email to confirm your account before signing in.',
    pwMin: isRTL ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.' : 'Password must be at least 8 characters.',
    pwMismatch: isRTL ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.',
    emailInUse: isRTL ? 'البريد مستخدم بالفعل. جرّب تسجيل الدخول.' : 'Email already in use. Try logging in instead.',
    invalidCreds: isRTL ? 'البريد أو كلمة المرور غير صحيحة.' : 'Incorrect email or password. Please try again.',
    tooMany: isRTL ? 'محاولات كثيرة. انتظر بضع دقائق.' : 'Too many attempts. Please wait a few minutes.',
    wait: isRTL ? 'يرجى الانتظار...' : 'Please wait...',
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (error) setError(error.message || 'Google sign-in failed');
    } catch { setError('Google sign-in was cancelled. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleApple = async () => {
    setError(''); setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin });
      if (error) setError(error.message || 'Apple sign-in failed');
    } catch { setError('Apple sign-in was cancelled. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (tab === 'signup') {
      if (password.length < 8) { setError(t.pwMin); return; }
      if (password !== confirmPassword) { setError(t.pwMismatch); return; }
    }
    setLoading(true);
    try {
      if (tab === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) { setError(error.message.includes('already registered') ? t.emailInUse : error.message); }
        else { setSuccess(t.checkEmail); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login')) setError(t.invalidCreds);
          else if (error.status === 429) setError(t.tooMany);
          else setError(error.message);
        }
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (error) setError(error.message); else setSuccess(t.resetSent);
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const inputClass = 'w-full h-[52px] bg-card border border-border rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--cta-primary)/0.4)] focus:outline-none transition-colors';
  const oauthBtnClass = 'w-full h-[52px] rounded-xl border border-border bg-card text-foreground text-[14px] font-medium flex items-center justify-center gap-3 hover:bg-muted/10 transition-all disabled:opacity-60';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={closeAuthModal} />
      <div className="relative w-full max-w-[460px] rounded-2xl bg-card border border-border shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]" style={{ padding: '36px 40px 32px' }}>
        {/* Close button */}
        <button onClick={closeAuthModal}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors`}>
          <X size={16} />
        </button>

        {/* Dual logo header — EN left + AR right */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-medium text-foreground tracking-tight">Takhayal<span style={{ color: 'hsl(var(--cta-primary))' }}>.ai</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <img src={logoAr} alt="تخيّل" style={{ height: 36 }} className="w-auto" />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h2 className="text-[20px] font-semibold text-foreground leading-tight">{t.headline}</h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">{t.sub}</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-full border border-border bg-muted/10 mb-6 w-fit mx-auto">
          {(isRTL ? ['login', 'signup'] as const : ['signup', 'login'] as const).map(tb => (
            <button key={tb} onClick={() => { setTab(tb); setView('main'); setError(''); setSuccess(''); }}
              className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all ${tab === tb ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              style={tab === tb ? { backgroundColor: 'hsl(var(--cta-primary))' } : {}}>
              {tb === 'login' ? t.login : t.signup}
            </button>
          ))}
        </div>

        {view === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <button type="button" onClick={() => { setView('email'); setError(''); setSuccess(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">{t.back}</button>
            <h3 className="text-base font-medium text-foreground">{t.resetTitle}</h3>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email} className={inputClass} required />
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            {success && <p className="text-[13px] text-green-500">{success}</p>}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl text-[15px] font-medium text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: 'hsl(var(--cta-primary))' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.sendReset}
            </button>
          </form>
        ) : view === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <button type="button" onClick={() => { setView('main'); setError(''); setSuccess(''); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-1">{t.back}</button>
            {tab === 'signup' && (
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t.name} className={inputClass} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.email} className={inputClass} required dir="ltr" />
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.password} className={inputClass} required minLength={8} />
              {tab === 'login' && (
                <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                  className="text-[12px] transition-colors mt-1.5 float-right" style={{ color: 'hsl(var(--cta-primary))' }}>{t.forgot}</button>
              )}
            </div>
            {tab === 'signup' && (
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t.confirmPw} className={inputClass} required />
            )}
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            {success && <p className="text-[13px] text-green-500">{success}</p>}
            <button type="submit" disabled={loading}
              className="w-full h-[52px] rounded-xl text-[15px] font-medium text-white transition-all disabled:opacity-60 hover:brightness-90 mt-1"
              style={{ backgroundColor: 'hsl(var(--cta-primary))' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (tab === 'login' ? t.login : t.createAccount)}
            </button>
          </form>
        ) : (
          /* Main view — Google + Apple + Email */
          <div className="space-y-3">
            {/* Google */}
            <button onClick={handleGoogle} disabled={loading} className={oauthBtnClass} dir="ltr">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {t.google}
            </button>

            {/* Apple */}
            <button onClick={handleApple} disabled={loading} className={oauthBtnClass} dir="ltr">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              {t.apple}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{t.or}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email */}
            <button onClick={() => setView('email')} disabled={loading} className={oauthBtnClass}>
              <Mail size={17} />
              {t.emailBtn}
            </button>
            {error && <p className="text-[13px] text-destructive text-center">{error}</p>}
          </div>
        )}

        {/* Footer — switch + legal */}
        <div className="mt-5 space-y-3">
          <p className="text-[12px] text-muted-foreground text-center">
            {tab === 'login' ? t.noAccount : t.hasAccount}{' '}
            <button onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setView('main'); setError(''); setSuccess(''); }}
              className="font-medium hover:underline" style={{ color: 'hsl(var(--cta-primary))' }}>
              {tab === 'login' ? t.signup : t.login}
            </button>
          </p>
          <p className="text-[11px] text-muted-foreground text-center">
            {t.legalPre}
            <a href="/terms" target="_blank" className="hover:underline" style={{ color: 'hsl(var(--cta-primary))' }}>{t.terms}</a>
            {t.legalAnd}
            <a href="/privacy" target="_blank" className="hover:underline" style={{ color: 'hsl(var(--cta-primary))' }}>{t.privacy}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
