import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdmtxenB4c3R1Z2VtZnRtaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzI4NTMsImV4cCI6MjEwMDIwODg1M30.KcJNH9ieLPIAkbGD9Y3zLxsziZ_evyY0KAFIUJ30cTs';

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