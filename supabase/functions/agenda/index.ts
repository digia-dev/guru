import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, getLastPathSegment, logActivity } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;
  const id = getSearchParams(req).get('id') || getLastPathSegment(req);

  try {
    if (method === 'GET') {
      const startDate = getSearchParams(req).get('start_date');
      const endDate = getSearchParams(req).get('end_date');
      const className = getSearchParams(req).get('class');
      let q = supabase.from('learning_activities').select('*').order('event_date').order('waktu_mulai');
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (startDate) q = q.gte('event_date', startDate);
      if (endDate) q = q.lte('event_date', endDate);
      if (className) q = q.eq('class', className);
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST' && getPath(req).includes('/duplicate')) {
      const { start_date, end_date } = await req.json();
      let q = supabase.from('learning_activities').select('*').gte('event_date', start_date).lte('event_date', end_date);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data: activities } = await q;
      let count = 0;
      for (const act of activities || []) {
        const d = new Date(act.event_date); d.setDate(d.getDate() + 7);
        await supabase.from('learning_activities').insert({ teacher_id: userId, event_date: d.toISOString().slice(0, 10), class: act.class, waktu_mulai: act.waktu_mulai, waktu_selesai: act.waktu_selesai, catatan: act.catatan, subject_id: act.subject_id });
        count++;
      }
      return json({ success: true, message: 'Activities duplicated', count });
    }

    if (method === 'POST' && getPath(req).includes('/batch')) {
      const activities = await req.json();
      for (const act of activities) {
        await supabase.from('learning_activities').insert({ teacher_id: userId, ...act });
      }
      await supabase.from('notifications').insert({ user_id: userId, title: `${activities.length} agenda ditambahkan`, message: activities.map((a: any) => `${a.class} (${a.event_date})`).join(', '), type: 'agenda', link: '/agenda' });
      return json({ success: true, message: 'Activities created', count: activities.length }, 201);
    }

    if (method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('learning_activities').insert({ teacher_id: userId, ...body }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      await supabase.from('notifications').insert({ user_id: userId, title: `Agenda ${body.class}`, message: `${body.event_date} — ${body.waktu_mulai}-${body.waktu_selesai}`, type: 'agenda', link: '/agenda' });
      await logActivity(appUser.id, 'CREATE', 'activity', data.id?.toString(), { catatan: body.catatan, class: body.class, date: body.event_date });
      return json({ success: true, data }, 201);
    }

    if (method === 'PUT' && id) {
      const body = await req.json();
      let q = supabase.from('learning_activities').update(body).eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data, error } = await q.select().single();
      if (error || !data) return json({ success: false, error: 'Activity not found' }, 404);
      await logActivity(appUser.id, 'UPDATE', 'activity', id, { catatan: body.catatan });
      return json({ success: true, data });
    }

    if (method === 'DELETE' && id) {
      let q = supabase.from('learning_activities').delete().eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      await q;
      await logActivity(appUser.id, 'DELETE', 'activity', id, {});
      return json({ success: true, message: 'Activity deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }