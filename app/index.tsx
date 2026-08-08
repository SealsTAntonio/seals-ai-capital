import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';

export default function IndexScreen() {
  const { session } = useAuth();
  return <Redirect href={session ? '/(tabs)' : '/welcome'} />;
}
