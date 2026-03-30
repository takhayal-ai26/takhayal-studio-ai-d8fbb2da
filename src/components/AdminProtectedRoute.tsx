import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogoMark } from '@/components/Logo';

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Check admin role via RLS-protected user_roles table
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/', { replace: true });
        }
      });
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="animate-pulse">
          <LogoMark size={48} />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
