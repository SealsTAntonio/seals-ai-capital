import { getSupabaseClient } from '@/lib/supabase';

import type { Profile } from './types';

type ProfileRow = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

const selection = 'id, display_name, created_at, updated_at';

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select(selection)
    .eq('id', userId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function initializeProfile(userId: string): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
    .select(selection)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  if (data) return mapProfile(data);

  const existing = await getProfile(userId);
  if (!existing) throw new Error('Profile initialization did not return a profile.');
  return existing;
}

export async function updateProfile(userId: string, displayName: string | null): Promise<Profile> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select(selection)
    .single<ProfileRow>();

  if (error) throw error;
  return mapProfile(data);
}
