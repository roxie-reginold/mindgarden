import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (e) {
      console.error("Failed to initialize Supabase:", e);
      return null;
    }
  }

  return supabaseInstance;
};
