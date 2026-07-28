import { corsHeaders, handleCors, getPath, getSearchParams } from '../_shared/cors.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const authHeader = req.headers.get('Authorization') || '';
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const path = getPath(req).split('?')[0].replace(/\/+$/, '') || '/';
  const method = req.method;

  if (method === 'GET' && path === '/') {
    const params = getSearchParams(req);
    const startDate = params.get('start_date');
    const endDate = params.get('end_date');
    const limitParam = params.get('limit');
    let limit = limitParam ? parseInt(limitParam, 10) : 100;
    if (isNaN(limit) || limit < 1) limit = 100;
    if (limit > 365) limit = 365;

    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(limit);

    if (startDate) {
      query = query.gte('event_date', startDate);
    }
    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data: rows, error } = await query;
    if (error) {
      return json({ success: false, error: error.message }, 500);
    }
    return json({ success: true, data: rows });
  }

  if (method === 'POST' && path === '/import') {
    let body: any[];
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    if (!Array.isArray(body) || body.length === 0) {
      return json({ success: false, error: 'Body must be a non-empty array' }, 400);
    }

    let imported = 0;
    let updated = 0;

    for (const item of body) {
      const { event_date, jenis, event_type, is_global } = item;
      let color_class = item.color_class ?? null;
      const globalFlag = is_global !== undefined ? is_global : true;

      const { data: existing } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('event_date', event_date)
        .eq('event_type', event_type)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ jenis, color_class, is_global: globalFlag })
          .eq('id', existing.id);
        if (!updateError) updated++;
      } else {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert({ event_date, jenis, event_type, color_class, is_global: globalFlag });
        if (!insertError) imported++;
      }
    }

    return json({
      success: true,
      data: { imported, updated, total: body.length },
    });
  }

  return json({ success: false, error: 'Not found' }, 404);
});
