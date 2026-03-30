import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const inputClass = 'w-full h-12 bg-[hsl(0,0%,5%)] border border-[hsl(0,0%,16%)] rounded-xl px-4 text-sm text-foreground placeholder:text-[hsl(0,0%,42%)] focus:border-primary focus:outline-none transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
        setError('This link has expired. Please request a new password reset.');
      } else {
        setError(updateError.message);
      }
      return;
    }

    toast({ title: 'Password updated. Welcome back.' });
    navigate('/studio', { replace: true });
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[hsl(0,0%,7%)] border border-[hsl(0,0%,14%)] rounded-2xl p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <LogoMark size={28} />
          <span className="text-[17px] font-medium text-foreground tracking-tight">
            Takhayal<span className="text-primary">.ai</span>
          </span>
        </div>
        <h2 className="text-[22px] font-extralight text-foreground mb-6">Set new password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-foreground/80 block mb-1.5">New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground/80 block mb-1.5">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:brightness-90 text-primary-foreground rounded-xl text-[15px] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
        {error && error.includes('expired') && (
          <button onClick={() => navigate('/?auth=login')} className="mt-4 text-[12px] text-primary hover:underline w-full text-center">
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
