type SupabaseEnvironment = {
  supabaseAnonKey: string;
  supabaseUrl: string;
};

export type MarketDataEnvironment = {
  mode: 'demo' | 'backend';
};

function requirePublicVariable(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return value;
}

/** Read and validate Supabase configuration only when the integration is used. */
export function getSupabaseEnvironment(): SupabaseEnvironment {
  return {
    supabaseAnonKey: requirePublicVariable(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseUrl: requirePublicVariable(
      'EXPO_PUBLIC_SUPABASE_URL',
      process.env.EXPO_PUBLIC_SUPABASE_URL,
    ),
  };
}

/** Read and validate the trusted API origin only when a network request is made. */
export function getApiBaseUrl(): string {
  return requirePublicVariable(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL,
  ).replace(/\/$/, '');
}

/** Only selects an adapter. Provider secrets must remain behind EXPO_PUBLIC_API_BASE_URL. */
export function getMarketDataEnvironment(): MarketDataEnvironment {
  const mode = process.env.EXPO_PUBLIC_MARKET_DATA_MODE ?? 'demo';
  if (mode !== 'demo' && mode !== 'backend') {
    throw new Error('EXPO_PUBLIC_MARKET_DATA_MODE must be "demo" or "backend".');
  }
  return { mode };
}
