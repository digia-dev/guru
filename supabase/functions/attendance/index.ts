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
  const className = getSearchParams(req).get('class');
  const eventDate = getSearchParams(req).get('event_date');
  const startDate = getSearchParams(req).get('start_date');
  const endDate = getSearchParams(req).get('end_date');
  const subjectId = getSearchParams(req).get('subject_id');

  try {
    if (method === 'GET' && getPath(req).includes('/summary') || method === 'GET' && getPath(req).includes('/trend')) {
      let q = supabase.from('attendance').select('keterangan, count');
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (className) q = q.eq('class', className);
      if (eventDate) q = q.eq('event_date', eventDate);
      if (startDate) q = q.gte('event_date', startDate);
      if (endDate) q = q.lte('event_date', endDate);
      if (subjectId) q = q.eq('subject_id', parseInt(subjectId));
      const { data } = await q;
      const counts: any = { H: 0, S: 0, I: 0, A: 0 };
      (data || []).forEach((r: any) => { counts[r.keterangan] = parseInt(r.count); });
      const total = counts.H + counts.S + counts.I + counts.A;
      return json({ success: true, data: { ...counts, total, persentase: total > 0 ? Math.round((counts.H / total) * 100) : 0 } });
    }

    if (method === 'GET') {
      let q = supabase.from('attendance').select('*').order('event_date').order('student_id');
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (className) q = q.eq('class', className);
      if (eventDate) q = q.eq('event_date', eventDate);
      if (startDate) q = q.gte('event_date', startDate);
      if (endDate) q = q.lte('event_date', endDate);
      if (subjectId) q = q.eq('subject_id', parseInt(subjectId));
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const { class: cls, event_date, subject_id, records } = await req.json();
      for (const rec of records) {
        if (rec.keterangan) {
          const { data: existing } = await supabase.from('attendance').select('id').eq('teacher_id', userId).eq('student_id', rec.student_id).eq('event_date', event_date).maybeSingle();
          if (existing) {
            await supabase.from('attendance').update({ keterangan: rec.keterangan, subject_id: subject_id || null }).eq('id', existing.id);
          } else {
            await supabase.from('attendance').insert({ teacher_id: userId, student_id: rec.student_id, event_date, class: cls, keterangan: rec.keterangan, subject_id: subject_id || null });
          }
        } else {
          await supabase.from('attendance').delete().eq('teacher_id', userId).eq('student_id', rec.student_id).eq('event_date', event_date);
        }
      }
      return json({ success: true, message: 'Attendance saved', count: records.length });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }