// Supabase Client Configured with project credentials
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://efjyppxztryshgnxyagk.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmanlwcHh6dHJ5c2hnbnh5YWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzYwNzksImV4cCI6MjEwNDYxMjA3OX0.20tI7EnufgW1rz1sli3sKko1mfyeEyud6DQhwdex2-k';

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl && savedKey) {
      return { url: savedUrl, anonKey: savedKey, isConfigured: true };
    }
  }

  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: true,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const creds = getSupabaseCredentials();
  if (!supabaseInstance) {
    supabaseInstance = createClient(creds.url, creds.anonKey);
  }
  return supabaseInstance;
}

export function resetSupabaseClient(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
  }
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}
