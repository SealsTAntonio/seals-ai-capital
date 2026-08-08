import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getSupabaseClient } from '@/lib/supabase';

type AuthResult = { error?: string; confirmationRequired?: boolean };

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials'))
    return 'The email or password is incorrect.';
  if (normalized.includes('email not confirmed')) return 'Confirm your email before signing in.';
  if (normalized.includes('already registered')) return 'An account already exists for this email.';
  if (normalized.includes('password'))
    return 'The password does not meet the security requirements.';
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return 'We could not complete that request. Please try again.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (!error) setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      user: session?.user ?? null,
      signIn: async (email, password) => {
        const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
      signUp: async (email, password) => {
        const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
        if (error) return { error: friendlyAuthError(error.message) };
        return { confirmationRequired: !data.session };
      },
      signOut: async () => {
        const { error } = await getSupabaseClient().auth.signOut();
        return error ? { error: friendlyAuthError(error.message) } : {};
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
