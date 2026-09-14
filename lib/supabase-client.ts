'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client for the browser.
 * Uses NEXT_PUBLIC_ env vars so it's safe for client-side use.
 * Returns null if env vars are not configured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }

  supabaseClient = createClient(url, key, {
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  });

  return supabaseClient;
}
