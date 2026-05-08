import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';
import { supabaseConfigMissing } from '@/integrations/supabase/client';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (supabaseConfigMissing) return;
    if (!loading && !user) {
      sessionStorage.setItem('redirectAfterLogin', `${window.location.pathname}${window.location.search}`);
      navigate('/?auth=login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="animate-pulse">
          <LogoMark size={48} />
        </div>
      </div>
    );
  }

  if (supabaseConfigMissing) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 px-5">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-card-foreground space-y-3">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <div className="font-semibold">Backend not configured</div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This route requires Supabase auth, but <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> are missing from <code className="font-mono">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
