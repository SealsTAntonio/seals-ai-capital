import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/features/auth/AuthProvider';

import { getProfile, initializeProfile, updateProfile } from './profileService';
import type { Profile, ProfileStatus } from './types';

type ProfileContextValue = {
  profile: Profile | null;
  status: ProfileStatus;
  error: string | null;
  retry: () => Promise<void>;
  save: (displayName: string) => Promise<{ error?: string }>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);
const loadError = 'We could not load your profile. Check your connection and try again.';

export function ProfileProvider({ children }: PropsWithChildren) {
  const { isLoading: isAuthLoading, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestId.current;
    if (!user) {
      setProfile(null);
      setError(null);
      setStatus(isAuthLoading ? 'loading' : 'signed-out');
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const existing = await getProfile(user.id);
      if (request !== requestId.current) return;
      if (existing) {
        setProfile(existing);
        setStatus('ready');
        return;
      }

      setStatus('missing');
      const created = await initializeProfile(user.id);
      if (request !== requestId.current) return;
      setProfile(created);
      setStatus('ready');
    } catch {
      if (request !== requestId.current) return;
      setProfile(null);
      setError(loadError);
      setStatus('error');
    }
  }, [isAuthLoading, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      status,
      error,
      retry: load,
      save: async (displayName) => {
        if (!user) return { error: 'Sign in to update your profile.' };
        const normalized = displayName.trim();
        if (normalized.length > 80)
          return { error: 'Display name must be 80 characters or fewer.' };
        try {
          const saved = await updateProfile(user.id, normalized || null);
          setProfile(saved);
          setStatus('ready');
          return {};
        } catch {
          return { error: 'We could not save your profile. Please try again.' };
        }
      },
    }),
    [error, load, profile, status, user],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}
