type SupabaseEnvironment = {
  supabaseAnonKey: string;
  supabaseUrl: string;
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
