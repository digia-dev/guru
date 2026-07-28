import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getSearchParams } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;
  const q = getSearchParams(req).get('q');
  if (!q || q.length < 2) return json({ success: true, data: { students: [], classes: [] } });
  const pattern = `%${q}%`;

  try {
    let stQ = supabase.from('students').select('id, student_id, name, class').or(`name.ilike.${pattern},student_id.ilike.${pattern},class.ilike.${pattern}`).limit(5).order('name');
    if (!isAdm) stQ = stQ.eq('teacher_id', userId);
    const { data: students } = await stQ;

    const { data: clsRows } = await supabase.from('students').select('class').ilike('class', pattern).limit(5);
    const classes = [...new Set((clsRows || []).map(r => r.class))];

    return json({ success: true, data: { students: students || [], classes } });
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }