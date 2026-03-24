import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LogoMark } from '@/components/Logo';

export function AuthModal() {
  const { isAuthenticated, login } = useApp();
  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [closing, setClosing] = useState(false);

  if (isAuthenticated) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setClosing(true);
    setTimeout(() => login(email, tab === 'signup' ? name : undefined), 200);
  };

  const handleGoogle = () => {
    setClosing(true);
    setTimeout(() => login('user@gmail.com', 'User'), 200);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`relative w-[380px] max-w-[90vw] bg-card border border-surface-border rounded-2xl p-8 pt-10 animate-scale-in`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <LogoMark size={40} />
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-light text-foreground text-center">Start creating</h2>
        <p className="text-sm text-muted-foreground text-center mt-2">10 free images. No credit card needed.</p>

        {/* Tabs */}
        <div className="flex gap-6 mt-6 mb-6 border-b border-surface-border">
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {t === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-11 bg-background border border-surface-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:outline-none transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 bg-background border border-surface-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-background border border-surface-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-ember-hover text-primary-foreground rounded-lg text-[15px] font-medium transition-colors mt-2"
          >
            {tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-[12px] text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogle}
          className="w-full h-12 rounded-lg border border-surface-border text-foreground text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-card transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Fine print */}
        <p className="text-[11px] text-muted-foreground text-center mt-5 leading-relaxed">
          By continuing you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}
