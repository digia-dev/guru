import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, anonKey);

export async function invokeFunction(name: string, options?: { body?: any; headers?: Record<string, string> }) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const { data, error } = await supabase.functions.invoke(name, {
    ...options,
    headers: { ...options?.headers, Authorization: token ? `Bearer ${token}` : '' },
  });
  if (error) throw error;
  return data;
}