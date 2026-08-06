import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { getSupabaseEnvironment } from '@/config/env';

let client: SupabaseClient | undefined;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnvironment();
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === 'web',
      persistSession: true,
    },
  });

  if (Platform.OS !== 'web' && !appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }

  return client;
}
