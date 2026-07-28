import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, getLastPathSegment } from '../_shared/cors.ts';

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
    if (method === 'GET' && getPath(req).includes('/summary')) {
      let tQ = supabase.from('tabungan').select('student_id, uang_masuk, uang_keluar');
      if (!isAdm) tQ = tQ.eq('teacher_id', userId);
      const { data: tabRows } = await tQ;
      const perStudent = new Map<string, number>();
      let totalSaldo = 0;
      (tabRows || []).forEach(r => {
        const s = parseFloat(r.uang_masuk || 0) - parseFloat(r.uang_keluar || 0);
        perStudent.set(r.student_id, (perStudent.get(r.student_id) || 0) + s);
        totalSaldo += s;
      });
      let kQ = supabase.from('kas_umum_tabungan').select('jumlah');
      if (!isAdm) kQ = kQ.eq('teacher_id', userId);
      const { data: kasRows } = await kQ;
      const totalKas = (kasRows || []).reduce((a, r) => a + parseFloat(r.jumlah || 0), 0);
      return json({ success: true, data: { total_saldo: totalSaldo, total_setoran_kas_umum: totalKas, per_student: Array.from(perStudent.entries()).map(([k, v]) => ({ student_id: k, saldo: v })) } });
    }

    const id = getSearchParams(req).get('id') || getLastPathSegment(req);

    if (method === 'GET') {
      const studentId = getSearchParams(req).get('student_id');
      const startDate = getSearchParams(req).get('start_date');
      const endDate = getSearchParams(req).get('end_date');
      let q = supabase.from('tabungan').select('*').order('tanggal', { ascending: false }).order('timestamp', { ascending: false });
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (studentId) q = q.eq('student_id', studentId);
      if (startDate) q = q.gte('tanggal', startDate);
      if (endDate) q = q.lte('tanggal', endDate);
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('tabungan').insert({ teacher_id: userId, ...body }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (method === 'PUT' && id) {
      const body = await req.json();
      let q = supabase.from('tabungan').update(body).eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data, error } = await q.select().single();
      if (error || !data) return json({ success: false, error: 'Record not found' }, 404);
      return json({ success: true, data });
    }

    if (method === 'DELETE' && id) {
      let q = supabase.from('tabungan').delete().eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      await q;
      return json({ success: true, message: 'Tabungan record deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }