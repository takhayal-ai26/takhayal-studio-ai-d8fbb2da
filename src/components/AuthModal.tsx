import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LogoMark } from '@/components/Logo';

export function AuthModal() {
  const { authModalOpen, authModalTab, login, closeAuthModal } = useApp();
  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    setTab(authModalTab);
  }, [authModalTab]);

  useEffect(() => {
    if (authModalOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (tab === 'signup' && password !== confirmPassword) return;
    login(email, tab === 'signup' ? name : undefined);
  };

  const handleGoogle = () => {
    login('user@gmail.com', 'User');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55" onClick={closeAuthModal} />

      {/* Modal */}
      <div className="relative w-[420px] max-w-[92vw] bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,16.5%)] rounded-2xl p-8 animate-in zoom-in-95 fade-in duration-200">
        {/* Close */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-5">
          <LogoMark size={36} />
        </div>

        {/* Header */}
        <h2 className="text-xl font-medium text-foreground text-center">Welcome to Takhayal</h2>
        <p className="text-sm text-muted-foreground text-center mt-1.5">Create professional visuals in seconds</p>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 mb-6 border-b border-[hsl(0,0%,16.5%)]">
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-[46px] bg-background border border-[hsl(0,0%,16.5%)] rounded-[10px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-[46px] bg-background border border-[hsl(0,0%,16.5%)] rounded-[10px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-foreground block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-[46px] bg-background border border-[hsl(0,0%,16.5%)] rounded-[10px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          {tab === 'signup' && (
            <div>
              <label className="text-[13px] font-medium text-foreground block mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[46px] bg-background border border-[hsl(0,0%,16.5%)] rounded-[10px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-ember-hover text-primary-foreground rounded-[10px] text-[15px] font-medium transition-colors mt-1"
          >
            {tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[hsl(0,0%,16.5%)]" />
          <span className="text-[12px] text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-[hsl(0,0%,16.5%)]" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full h-12 rounded-[10px] border border-[hsl(0,0%,16.5%)] bg-transparent text-foreground text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-card transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Footer switch */}
        <p className="text-[13px] text-muted-foreground text-center mt-5">
          {tab === 'login' ? (
            <>Don't have an account?{' '}<button onClick={() => setTab('signup')} className="text-primary hover:underline">Sign up</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => setTab('login')} className="text-primary hover:underline">Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
