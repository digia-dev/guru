import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;

  try {
    if (method === 'GET') {
      let allClasses: string[] = [];
      if (isAdm) {
        const { data: users } = await supabase.from('users').select('teacher_classes');
        users?.forEach(u => { if (u.teacher_classes) allClasses.push(...u.teacher_classes); });
        const { data: stds } = await supabase.from('students').select('class').order('class');
        allClasses.push(...(stds || []).map(s => s.class));
      } else {
        const { data: u } = await supabase.from('users').select('teacher_classes').eq('id', userId).single();
        allClasses = u?.teacher_classes || [];
        const { data: stds } = await supabase.from('students').select('class').eq('teacher_id', userId).order('class');
        allClasses.push(...(stds || []).map(s => s.class));
      }
      const merged = [...new Set(allClasses)].sort();
      const data = await Promise.all(merged.map(async (name) => {
        let q = supabase.from('students').select('id', { count: 'exact', head: true }).eq('class', name);
        if (!isAdm) q = q.eq('teacher_id', userId);
        const { count } = await q;
        return { name, student_count: count || 0 };
      }));
      return json({ success: true, data });
    }

    if (method === 'POST') {
      const { name } = await req.json();
      const { data: u } = await supabase.from('users').select('teacher_classes').eq('id', userId).single();
      const classes: string[] = u?.teacher_classes || [];
      if (!classes.includes(name)) classes.push(name);
      classes.sort();
      await supabase.from('users').update({ teacher_classes: classes }).eq('id', userId);
      return json({ success: true, data: { name } }, 201);
    }

    const pathParts = getPath(req).split('?')[0].split('/').filter(Boolean);
    const name = pathParts[pathParts.length - 1];

    if (method === 'PUT' && name) {
      const newName = pathParts[pathParts.length - 1];
      const oldName = pathParts[pathParts.length - 2];
      const { data: u } = await supabase.from('users').select('teacher_classes').eq('id', userId).single();
      const classes: string[] = u?.teacher_classes || [];
      const updated = classes.map(c => c === oldName ? newName : c);
      await supabase.from('users').update({ teacher_classes: updated }).eq('id', userId);
      let q = supabase.from('students').update({ class: newName });
      if (isAdm) q = q.eq('class', oldName); else q = q.eq('teacher_id', userId).eq('class', oldName);
      await q;
      return json({ success: true, data: { name: newName } });
    }

    if (method === 'DELETE' && name) {
      const { data: u } = await supabase.from('users').select('teacher_classes').eq('id', userId).single();
      const classes: string[] = u?.teacher_classes || [];
      await supabase.from('users').update({ teacher_classes: classes.filter(c => c !== name) }).eq('id', userId);
      return json({ success: true, message: 'Class removed' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }