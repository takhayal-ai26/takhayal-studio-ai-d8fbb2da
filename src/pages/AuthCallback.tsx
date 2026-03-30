import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase client auto-handles the hash/code exchange via onAuthStateChange.
    // We just wait briefly then redirect.
    const timer = setTimeout(() => {
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect || '/studio', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <LogoMark size={48} />
      </div>
    </div>
  );
}
