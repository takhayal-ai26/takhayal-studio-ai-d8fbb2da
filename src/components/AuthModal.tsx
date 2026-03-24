import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LogoMark } from '@/components/Logo';
import authVisual from '@/assets/auth-visual.jpg';

export function AuthModal() {
  const { authModalOpen, authModalTab, login, closeAuthModal } = useApp();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => { setTab(authModalTab); }, [authModalTab]);
  useEffect(() => { if (authModalOpen) { setEmail(''); setPassword(''); setConfirmPassword(''); setName(''); setShowEmailForm(false); } }, [authModalOpen]);
  useEffect(() => { if (!authModalOpen) return; const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); }; window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey); }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!email || !password) return; if (tab === 'signup' && password !== confirmPassword) return; login(email, tab === 'signup' ? name : undefined); };
  const handleGoogle = () => login('user@gmail.com', 'User');
  const handleApple = () => login('user@icloud.com', 'User');
  const inputClass = 'w-full h-12 bg-[hsl(0,0%,5%)] border border-[hsl(0,0%,16%)] rounded-xl px-4 text-sm text-foreground placeholder:text-[hsl(0,0%,42%)] focus:border-primary focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[hsl(0,0%,0%/0.65)] animate-fade-in" onClick={closeAuthModal} />
      <div className="relative w-full max-w-[1040px] h-[660px] max-h-[90vh] rounded-3xl overflow-hidden flex animate-scale-in bg-[hsl(0,0%,7%)]">
        <button onClick={closeAuthModal} className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-[hsl(0,0%,0%/0.5)] flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"><X size={16} /></button>
        <div className="w-full lg:w-[46%] flex flex-col p-8 lg:p-10 overflow-y-auto">
          <div className="flex items-center gap-2.5 mb-10"><LogoMark size={28} /><span className="text-[17px] font-medium text-foreground tracking-tight">Takhayal<span className="text-primary">.ai</span></span></div>
          <div className="mb-8">
            <h2 className="text-[26px] font-extralight text-foreground leading-tight">{t.auth.startCreatingWith}</h2>
            <p className="text-sm text-[hsl(0,0%,42%)] mt-2">{t.auth.turnIdeas}</p>
          </div>
          <div className="flex p-1 rounded-full bg-[hsl(0,0%,10%)] mb-7 w-fit">
            {(['signup', 'login'] as const).map(tb => (
              <button key={tb} onClick={() => { setTab(tb); setShowEmailForm(false); }} className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${tab === tb ? 'bg-primary text-primary-foreground' : 'text-[hsl(0,0%,42%)] hover:text-foreground'}`}>
                {tb === 'login' ? t.auth.logIn : t.auth.signUp}
              </button>
            ))}
          </div>
          {!showEmailForm ? (
            <div className="space-y-3 flex-1">
              <button onClick={handleGoogle} className="w-full h-[52px] rounded-[14px] border border-[hsl(0,0%,16%)] bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-[hsl(0,0%,10%)] hover:border-[hsl(0,0%,22%)] transition-all duration-150">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t.auth.continueWithGoogle}
              </button>
              <button onClick={handleApple} className="w-full h-[52px] rounded-[14px] border border-[hsl(0,0%,16%)] bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-[hsl(0,0%,10%)] hover:border-[hsl(0,0%,22%)] transition-all duration-150">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {t.auth.continueWithApple}
              </button>
              <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-[hsl(0,0%,14%)]" /><span className="text-[11px] text-[hsl(0,0%,36%)] uppercase tracking-wider">{t.auth.or}</span><div className="flex-1 h-px bg-[hsl(0,0%,14%)]" /></div>
              <button onClick={() => setShowEmailForm(true)} className="w-full h-[52px] rounded-[14px] border border-[hsl(0,0%,16%)] bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-3 hover:bg-[hsl(0,0%,10%)] hover:border-[hsl(0,0%,22%)] transition-all duration-150"><Mail size={17} />{t.auth.continueWithEmail}</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
              <button type="button" onClick={() => setShowEmailForm(false)} className="text-[12px] text-[hsl(0,0%,42%)] hover:text-foreground transition-colors mb-1">{t.auth.backToOptions}</button>
              {tab === 'signup' && (<div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.name}</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.auth.yourName} className={inputClass} /></div>)}
              <div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.email}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} className={inputClass} /></div>
              <div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.password}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>
              {tab === 'signup' && (<div><label className="text-[12px] font-medium text-foreground/80 block mb-1.5">{t.auth.confirmPassword}</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} /></div>)}
              <button type="submit" className="w-full h-[52px] bg-primary hover:brightness-90 text-primary-foreground rounded-[14px] text-[15px] font-medium transition-all duration-150 active:scale-[0.98] mt-2">{tab === 'login' ? t.auth.logIn : t.auth.createAccount}</button>
            </form>
          )}
          <div className="mt-6 pt-5 border-t border-[hsl(0,0%,12%)]">
            <p className="text-[12px] text-[hsl(0,0%,42%)] text-center">
              {tab === 'login' ? (<>{t.auth.dontHaveAccount}{' '}<button onClick={() => { setTab('signup'); setShowEmailForm(false); }} className="text-primary hover:underline">{t.auth.signUp}</button></>) : (<>{t.auth.alreadyHaveAccount}{' '}<button onClick={() => { setTab('login'); setShowEmailForm(false); }} className="text-primary hover:underline">{t.auth.logIn}</button></>)}
            </p>
            <p className="text-[10px] text-[hsl(0,0%,30%)] text-center mt-3 leading-relaxed">{t.auth.termsAndPrivacy}</p>
          </div>
        </div>
        <div className="hidden lg:block w-[54%] relative">
          <img src={authVisual} alt="AI generated visual" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,7%)] via-[hsl(0,0%,7%/0.4)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%/0.7)] via-transparent to-[hsl(0,0%,0%/0.3)]" />
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-medium mb-4">{t.auth.arabicFirstBadge}</span>
            <h3 className="text-[22px] font-extralight text-foreground leading-snug max-w-[320px]">{t.auth.brandTagline}</h3>
            <div className="flex gap-4 mt-5">
              {[t.auth.productShots, t.auth.socialVisuals, t.auth.campaignCreatives].map(f => (<span key={f} className="text-[11px] text-foreground/50">{f}</span>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
