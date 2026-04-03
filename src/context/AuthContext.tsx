import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: {
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    credits: number;
    plan: string;
    language: string;
    theme_preference: string;
  } | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthState['profile']>(null);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, first_name, last_name, email, avatar_url, credits, plan, language, theme_preference')
      .eq('user_id', userId)
      .single();
    if (data) {
      setProfile(data as any);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    sessionStorage.removeItem('redirectAfterLogin');
    toast({ title: 'You have been signed out.' });
  }, [toast]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Defer profile fetch to avoid Supabase deadlock
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        }
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        if (event === 'PASSWORD_RECOVERY') {
          // Will be handled by the reset page
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
      }
      setLoading(false);
    });

    // Timeout fallback — don't block UI forever
    const timeout = setTimeout(() => setLoading(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
