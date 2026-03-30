import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/Logo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // The auth state change listener in AuthContext handles session setup.
    // This page just waits for auth to be established, then redirects.
    const timer = setTimeout(() => {
      navigate('/studio', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LogoMark size={40} />
        {error ? (
          <>
            <p className="text-red-500 text-sm">{error}</p>
            <a href="/" className="text-sm text-primary hover:underline">Back to home</a>
          </>
        ) : (
          <>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
