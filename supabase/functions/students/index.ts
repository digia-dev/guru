import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, getLastPathSegment } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { user, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const appUser = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (appUser.error) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.data.role === 'admin';
  const userId = appUser.data.id;

  try {
    if (method === 'GET' && !getSearchParams(req).has('id') && !getPath(req).includes('/detail')) {
      const className = getSearchParams(req).get('class');
      const search = getSearchParams(req).get('search');
      let query = supabase.from('students').select('*');
      if (!isAdm) query = query.eq('teacher_id', userId);
      if (className) query = query.eq('class', className);
      if (search) query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%`);
      query = query.order('name');
      const { data } = await query;
      return json({ success: true, data: data || [] });
    }

    const id = getSearchParams(req).get('id') || getLastPathSegment(req);
    if (method === 'GET' && id) {
      if (getPath(req).includes('/detail')) return await getStudentDetail(id, userId, isAdm);
      let q = supabase.from('students').select('*').eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data } = await q.single();
      if (!data) return json({ success: false, error: 'Student not found' }, 404);
      return json({ success: true, data });
    }

    if (method === 'POST') {
      const body = await req.json();
      const tid = isAdm && body.teacher_id ? body.teacher_id : userId;
      const { data: existing } = await supabase.from('students').select('id').eq('teacher_id', tid).eq('student_id', body.student_id).maybeSingle();
      if (existing) return json({ success: false, error: 'Student ID already exists' }, 409);
      const { data, error } = await supabase.from('students').insert({ ...body, teacher_id: tid }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (method === 'PUT' && id) {
      const body = await req.json();
      delete body.id; delete body.teacher_id; delete body.created_at; delete body.updated_at;
      let q = supabase.from('students').update(body).eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data, error } = await q.select().single();
      if (error || !data) return json({ success: false, error: 'Student not found' }, 404);
      return json({ success: true, data });
    }

    if (method === 'DELETE' && id) {
      const { data: s } = await supabase.from('students').select('student_id').eq('id', id).single();
      if (!s) return json({ success: false, error: 'Student not found' }, 404);
      await supabase.from('attendance').delete().eq('teacher_id', userId).eq('student_id', s.student_id);
      await supabase.from('grades').delete().eq('teacher_id', userId).eq('student_id', s.student_id);
      await supabase.from('tabungan').delete().eq('teacher_id', userId).eq('student_id', s.student_id);
      await supabase.from('students').delete().eq('id', id);
      return json({ success: true, message: 'Student deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

async function getStudentDetail(id: string, userId: number, isAdm: boolean) {
  let q = supabase.from('students').select('*').eq('id', id);
  if (!isAdm) q = q.eq('teacher_id', userId);
  const { data: student } = await q.single();
  if (!student) return json({ success: false, error: 'Student not found' }, 404);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const startDate = month >= 7 ? `${year}-07-01` : `${year - 1}-07-01`;
  const endDate = month >= 7 ? `${year + 1}-06-30` : `${year}-06-30`;

  let attQ = supabase.from('attendance').select('keterangan').eq('student_id', student.student_id).gte('event_date', startDate).lte('event_date', endDate);
  if (!isAdm) attQ = attQ.eq('teacher_id', userId);
  const { data: attRows } = await attQ;

  let tabQ = supabase.from('tabungan').select('uang_masuk, uang_keluar').eq('student_id', student.student_id);
  if (!isAdm) tabQ = tabQ.eq('teacher_id', userId);
  const { data: tabRows } = await tabQ;

  let gradeQ = supabase.from('grades').select('*').eq('student_id', student.student_id);
  if (!isAdm) gradeQ = gradeQ.eq('teacher_id', userId);
  const { data: gradeRows } = await gradeQ;

  const tabunganSaldo = (tabRows || []).reduce((acc, r) => acc + (r.uang_masuk || 0) - (r.uang_keluar || 0), 0);
  const currentSem = month >= 7 ? 'Ganjil' : 'Genap';
  const semesters = ['Ganjil', 'Genap'].map(sem => {
    const att = (attRows || []).filter((r: any) => r.semester === sem);
    const counts = { hadir: att.filter((r: any) => r.keterangan === 'H').length, sakit: att.filter((r: any) => r.keterangan === 'S').length, izin: att.filter((r: any) => r.keterangan === 'I').length, alfa: att.filter((r: any) => r.keterangan === 'A').length };
    const total = counts.hadir + counts.sakit + counts.izin + counts.alfa;
    return { semester: sem, is_active: sem === currentSem, grade: (gradeRows || []).find((g: any) => g.semester === sem) || null, attendance: { ...counts, total } };
  });

  return json({ success: true, data: { student: { ...student, tabungan_saldo: tabunganSaldo }, semesters } });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}