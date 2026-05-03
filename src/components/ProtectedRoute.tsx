import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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

  if (!user) return null;

  return <>{children}</>;
}
