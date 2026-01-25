import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LS_URL_KEY = 'mindgarden_sb_url';
const LS_KEY_KEY = 'mindgarden_sb_key';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  // 1. Try Environment Variables
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_KEY;

  // 2. Try Local Storage (User Settings)
  const lsUrl = localStorage.getItem(LS_URL_KEY);
  const lsKey = localStorage.getItem(LS_KEY_KEY);

  const url = envUrl || lsUrl;
  const key = envKey || lsKey;

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

export const updateSupabaseConfig = (url: string, key: string) => {
  if (!url || !key) {
    localStorage.removeItem(LS_URL_KEY);
    localStorage.removeItem(LS_KEY_KEY);
    supabaseInstance = null;
  } else {
    localStorage.setItem(LS_URL_KEY, url);
    localStorage.setItem(LS_KEY_KEY, key);
    // Force recreation
    supabaseInstance = createClient(url, key);
  }
};

export const getStoredConfig = () => ({
  url: localStorage.getItem(LS_URL_KEY) || process.env.SUPABASE_URL || '',
  key: localStorage.getItem(LS_KEY_KEY) || process.env.SUPABASE_KEY || ''
});