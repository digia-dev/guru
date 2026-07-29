export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-subpath, x-as-teacher',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders } });
  }
  return null;
}

export function getPath(req: Request): string {
  return req.headers.get('x-subpath') || '';
}

export function getSearchParams(req: Request): URLSearchParams {
  const subpath = getPath(req);
  const fromSubpath = new URLSearchParams(subpath.split('?')[1] || '');
  if (fromSubpath.toString()) return fromSubpath;
  return new URLSearchParams(new URL(req.url).search);
}

export function getLastPathSegment(req: Request): string {
  const path = getPath(req).split('?')[0];
  const parts = path.split('/').filter(Boolean);
  return parts.pop() || '';
}

let _supabase: any = null;
async function getSupabase() {
  if (!_supabase) {
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    _supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  }
  return _supabase;
}

export async function logActivity(userId: number, action: string, entityType: string, entityId?: string, details?: any, ipAddress?: string) {
  try {
    const supabase = await getSupabase();
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
      ip_address: ipAddress || null,
    });
  } catch {
    // silently fail - logging should not break the main operation
  }
}