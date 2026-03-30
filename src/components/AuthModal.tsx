import { useState, useEffect } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import { useMedia } from '@/hooks/useMedia';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';

export function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal } = useApp();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { getUrlByName } = useMedia();
  const navigate = useNavigate();
  const authVisual = getUrlByName('auth-visual.jpg');
  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { setTab(authModalTab); }, [authModalTab]);
  useEffect(() => {
    if (authModalOpen) {
      setEmail(''); setPassword(''); setConfirmPassword(''); setName('');
      setShowEmailForm(false); setShowForgotPassword(false);
      setError(''); setSuccessMessage(''); setLoading(false);
    }
  }, [authModalOpen]);
  useEffect(() => {
    if (!authModalOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [authModalOpen, closeAuthModal]);

  // Auto-close modal when user signs in
  useEffect(() => {
    if (user && authModalOpen) {
      closeAuthModal();
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect || '/studio', { replace: true });
    }
  }, [user, authModalOpen, closeAuthModal, navigate]);

  if (!authModalOpen) return null;

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oauthError) {
        setError('Google sign in failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError('Apple sign in failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (tab === 'signup') {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

      setLoading(true);
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email exists. Try logging in instead.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setSuccessMessage('Check your email to confirm your account. Check your spam folder if you don\'t see it.');
    } else {
      if (!email || !password) { setError('Please enter email and password.'); return; }
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          setError('Incorrect email or password. Please try again.');
        } else if (signInError.message.includes('not confirmed')) {
          setError('Please confirm your email first. Check your inbox.');
        } else {
          setError(signInError.message);
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setSuccessMessage('Password reset link sent. Check your email.');
  };

  const inputClass = 'w-full h-12 bg-background border border-border rounded-xl px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/65 animate-fade-in" onClick={closeAuthModal} />
      <div className="relative w-full max-w-[1040px] h-[660px] max-h-[90vh] rounded-3xl overflow-hidden flex animate-scale-in bg-card">
        <button onClick={closeAuthModal} className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-black/30 dark:bg-black/50 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"><X size={16} /></button>
        <div className="w-full lg:w-[46%] flex flex-col p-8 lg:p-10 overflow-y-auto bg-card">
          <div className="flex items-center gap-2.5 mb-10"><LogoMark size={28} /><span className="text-[17px] font-medium text-foreground tracking-tight">Takhayal<span className="text-primary">.ai</span></span></div>
          <div className="mb-8">
            <h2 className="text-[26px] font-extralight text-foreground leading-tight">{t.auth.startCreatingWith}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t.auth.turnIdeas}</p>
          </div>
          <div className="flex p-1 rounded-full bg-muted mb-7 w-fit">
            {(['signup', 'login'] as const).map(tb => (
              <button key={tb} onClick={() => { setTab(tb); setShowEmailForm(false); setShowForgotPassword(false); setError(''); setSuccessMessage(''); }} className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${tab === tb ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {tb === 'login' ? t.auth.logIn : t.auth.signUp}
              </button>
            ))}
          </div>

          {successMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail size={24} className="text-primary" />
              </div>
              <p className="text-[14px] text-foreground font-medium mb-2">
                {successMessage.includes('reset') ? 'Reset link sent!' : 'Check your email'}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">{successMessage}</p>
            </div>
          ) : showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-3.5 flex-1">
              <button type="button" onClick={() => { setShowForgotPassword(false); setError(''); }} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-1">{t.auth.backToOptions}</button>
              <div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} /></div>
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary hover:brightness-90 text-primary-foreground rounded-[14px] text-[15px] font-medium transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          ) : !showEmailForm ? (
            <div className="space-y-3 flex-1">
              <button onClick={handleGoogle} disabled={loading} className="w-full h-[52px] rounded-[14px] border border-border bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-muted hover:border-border transition-all duration-150 disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {t.auth.continueWithGoogle}
                  </>
                )}
              </button>
              <button onClick={handleApple} disabled={loading} className="w-full h-[52px] rounded-[14px] border border-border bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-muted hover:border-border transition-all duration-150 disabled:opacity-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {t.auth.continueWithApple}
              </button>
              <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted-foreground uppercase tracking-wider">{t.auth.or}</span><div className="flex-1 h-px bg-border" /></div>
              <button onClick={() => { setShowEmailForm(true); setError(''); }} className="w-full h-[52px] rounded-[14px] border border-border bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-muted hover:border-border transition-all duration-150"><Mail size={17} />{t.auth.continueWithEmail}</button>
              {error && <p className="text-[12px] text-red-400 text-center">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
              <button type="button" onClick={() => { setShowEmailForm(false); setError(''); }} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-1">{t.auth.backToOptions}</button>
              {tab === 'signup' && (<div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.name}</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.auth.yourName} className={inputClass} /></div>)}
              <div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} /></div>
              <div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.password}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>
              {tab === 'signup' && (<div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.confirmPassword}</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>)}
              {error && <p className="text-[12px] text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="w-full h-[52px] bg-primary hover:brightness-90 text-primary-foreground rounded-[14px] text-[15px] font-medium transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : (tab === 'login' ? t.auth.logIn : t.auth.createAccount)}
              </button>
              {tab === 'login' && (
                <button type="button" onClick={() => { setShowForgotPassword(true); setShowEmailForm(false); setError(''); }} className="text-[12px] text-primary hover:underline w-full text-center mt-2">
                  Forgot password?
                </button>
              )}
            </form>
          )}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[12px] text-muted-foreground text-center">
              {tab === 'login' ? (<>{t.auth.dontHaveAccount}{' '}<button onClick={() => { setTab('signup'); setShowEmailForm(false); setError(''); setSuccessMessage(''); }} className="text-primary hover:underline">{t.auth.signUp}</button></>) : (<>{t.auth.alreadyHaveAccount}{' '}<button onClick={() => { setTab('login'); setShowEmailForm(false); setError(''); setSuccessMessage(''); }} className="text-primary hover:underline">{t.auth.logIn}</button></>)}
            </p>
            <p className="text-[10px] text-muted-foreground/70 text-center mt-3 leading-relaxed">
              {lang === 'ar' ? 'بالمتابعة، أنت توافق على ' : 'By continuing, you agree to our '}
              <a href="/terms" target="_blank" className="text-primary hover:underline">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</a>
              {lang === 'ar' ? ' و' : ' and '}
              <a href="/privacy" target="_blank" className="text-primary hover:underline">{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
            </p>
          </div>
        </div>
        <div className="hidden lg:block w-[54%] relative">
          <img src={authVisual} alt="AI generated visual" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-medium mb-4">{t.auth.arabicFirstBadge}</span>
            <h3 className="text-[22px] font-extralight text-foreground leading-snug max-w-[320px]">{t.auth.brandTagline}</h3>
            <div className="flex gap-4 mt-5">
              {[t.auth.productShots, t.auth.socialVisuals, t.auth.campaignCreatives].map(f => (<span key={f} className="text-[11px] text-white/50">{f}</span>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
