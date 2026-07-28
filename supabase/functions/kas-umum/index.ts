import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const url = new URL(req.url); const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;
  const id = url.searchParams.get('id') || url.pathname.split('/').pop();

  try {
    if (method === 'GET') {
      let q = supabase.from('kas_umum_tabungan').select('*').order('tanggal', { ascending: false }).order('timestamp', { ascending: false });
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('kas_umum_tabungan').insert({ teacher_id: userId, ...body }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (method === 'PUT' && id) {
      const body = await req.json();
      let q = supabase.from('kas_umum_tabungan').update(body).eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data, error } = await q.select().single();
      if (error || !data) return json({ success: false, error: 'Record not found' }, 404);
      return json({ success: true, data });
    }

    if (method === 'DELETE' && id) {
      let q = supabase.from('kas_umum_tabungan').delete().eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      await q;
      return json({ success: true, message: 'Kas umum record deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }