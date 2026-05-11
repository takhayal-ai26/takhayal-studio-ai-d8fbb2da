import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AUTH_CALLBACK_TIMEOUT_MS = 10000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let settled = false;
    let timeout: number | undefined;

    const finish = () => {
      if (settled) return;
      settled = true;
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirect || '/studio', { replace: true });
    };

    const fail = (description?: string) => {
      if (settled) return;
      settled = true;
      sessionStorage.removeItem('redirectAfterLogin');
      toast({
        title: 'Sign in did not complete',
        description: description || 'Please try signing in again.',
        variant: 'destructive',
      });
      navigate('/?auth=login', { replace: true });
    };

    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const authError =
      urlParams.get('error_description') ||
      urlParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error');

    if (authError) {
      fail(authError);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) finish();
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) finish();
      })
      .catch(() => fail());

    timeout = window.setTimeout(() => {
      fail('We could not confirm your session. Please try again.');
    }, AUTH_CALLBACK_TIMEOUT_MS);

    return () => {
      if (timeout) window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <LogoMark size={48} />
      </div>
    </div>
  );
}
