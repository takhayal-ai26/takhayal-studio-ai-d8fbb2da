import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';
import { Loader2, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/studio', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message);
      else setSuccess(true);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full h-11 bg-card border border-border rounded-[10px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--cta-primary)/0.4)] focus:outline-none transition-colors';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-card border border-border p-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <LogoMark size={24} />
            <span className="text-[15px] font-medium text-foreground tracking-tight">Takhayal<span style={{ color: 'hsl(var(--cta-primary))' }}>.ai</span></span>
          </div>
          <h2 className="text-xl font-medium text-foreground">Set a new password</h2>
        </div>

        {success ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-10 h-10 mx-auto" style={{ color: 'hsl(var(--cta-primary))' }} />
            <p className="text-sm text-foreground font-medium">Password updated successfully.</p>
            <p className="text-xs text-muted-foreground">Redirecting to studio...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className={inputClass} required minLength={8} />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={inputClass} required />
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-[10px] text-[15px] font-medium text-white transition-all disabled:opacity-60 hover:brightness-90"
              style={{ backgroundColor: 'hsl(var(--cta-primary))' }}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
