import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AuthModalTab = 'login' | 'signup';

type UseAuthModalFormOptions = {
  initialTab: AuthModalTab;
  language: string;
  authRedirectUrl: string;
  resetRedirectUrl: string;
};

function genericAuthError(language: string) {
  return language === 'ar' ? 'حدث خطأ. حاول مجدداً.' : 'Something went wrong. Please try again.';
}

function oauthError(provider: 'Google' | 'Apple', language: string) {
  if (language === 'ar') return `فشل تسجيل الدخول بـ ${provider}. حاول مجدداً.`;
  return `${provider} sign in failed. Please try again.`;
}

function signupErrorMessage(message: string) {
  return message.includes('already registered')
    ? 'An account with this email exists. Try logging in instead.'
    : message;
}

function loginErrorMessage(message: string) {
  if (message.includes('Invalid login')) return 'Incorrect email or password.';
  if (message.includes('not confirmed')) return 'Please confirm your email first.';
  return message;
}

export function useAuthModalForm({
  initialTab,
  language,
  authRedirectUrl,
  resetRedirectUrl,
}: UseAuthModalFormOptions) {
  const [tab, setTab] = useState<AuthModalTab>(initialTab);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = useCallback((nextTab: AuthModalTab = initialTab) => {
    setTab(nextTab);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setShowEmailForm(false);
    setShowForgotPassword(false);
    setError('');
    setSuccessMessage('');
    setLoading(false);
  }, [initialTab]);

  const selectTab = useCallback((nextTab: AuthModalTab) => {
    setTab(nextTab);
    setShowEmailForm(false);
    setShowForgotPassword(false);
    setError('');
    setSuccessMessage('');
  }, []);

  const showEmailOptions = useCallback(() => {
    setShowEmailForm(true);
    setError('');
  }, []);

  const backToOptions = useCallback(() => {
    setShowEmailForm(false);
    setShowForgotPassword(false);
    setError('');
  }, []);

  const openForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
    setShowEmailForm(false);
    setError('');
  }, []);

  const handleOAuth = useCallback(async (provider: 'google' | 'apple') => {
    const providerLabel = provider === 'google' ? 'Google' : 'Apple';
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: authRedirectUrl },
      });
      if (authError) setError(oauthError(providerLabel, language));
    } catch {
      setError(genericAuthError(language));
    } finally {
      setLoading(false);
    }
  }, [authRedirectUrl, language]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (tab === 'signup') {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

      setLoading(true);
      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: authRedirectUrl },
        });
        if (signUpError) {
          setError(signupErrorMessage(signUpError.message));
          return;
        }
        setSuccessMessage('Check your email to confirm your account. Check your spam folder if you don\'t see it.');
      } catch {
        setError(genericAuthError(language));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) { setError('Please enter email and password.'); return; }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(loginErrorMessage(signInError.message));
    } catch {
      setError(genericAuthError(language));
    } finally {
      setLoading(false);
    }
  }, [authRedirectUrl, confirmPassword, email, language, name, password, tab]);

  const handleForgotPassword = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email.'); return; }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSuccessMessage('Password reset link sent. Check your email.');
    } catch {
      setError(genericAuthError(language));
    } finally {
      setLoading(false);
    }
  }, [email, language, resetRedirectUrl]);

  return {
    tab,
    showEmailForm,
    showForgotPassword,
    email,
    password,
    confirmPassword,
    name,
    loading,
    error,
    successMessage,
    setTab,
    setShowEmailForm,
    setShowForgotPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    setName,
    setError,
    setSuccessMessage,
    resetForm,
    selectTab,
    showEmailOptions,
    backToOptions,
    openForgotPassword,
    handleGoogle: () => handleOAuth('google'),
    handleApple: () => handleOAuth('apple'),
    handleSubmit,
    handleForgotPassword,
  };
}
