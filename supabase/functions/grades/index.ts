import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, logActivity } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function parseSikap(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? ({ 'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60 } as any)[v] : n;
}

function hitungRataHarian(g: any) {
  const pRata = g.pengetahuan_rata != null ? parseFloat(g.pengetahuan_rata) : null;
  const kRata = g.keterampilan_rata != null ? parseFloat(g.keterampilan_rata) : null;
  const sVals = [g.sikap_jujur, g.sikap_disiplin, g.sikap_tgg_jawab].filter(Boolean).map(parseSikap).filter(v => v != null);
  const sRata = sVals.length ? Math.round(sVals.reduce((a: number, b: number) => a + b, 0) / sVals.length) : null;
  const has3 = pRata != null && kRata != null && sRata != null;
  if (has3) return Math.round((pRata! + kRata! + sRata!) / 3);
  if (pRata != null || kRata != null) return Math.round(((pRata || 0) + (kRata || 0)) / ((pRata ? 1 : 0) + (kRata ? 1 : 0)));
  return null;
}

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;

  try {
    if (method === 'GET' && getPath(req).includes('/semester')) {
      const className = getSearchParams(req).get('class');
      const semester = getSearchParams(req).get('semester') || 'Ganjil';
      const subjectId = getSearchParams(req).get('subject_id');

      const [studentsResult, gradesResult] = await Promise.all([
        (() => { let q = supabase.from('students').select('*').eq('class', className).order('name'); if (!isAdm) q = q.eq('teacher_id', userId); return q; })(),
        (() => { let q = supabase.from('grades').select('*').eq('semester', semester); if (!isAdm) q = q.eq('teacher_id', userId); if (subjectId) q = q.eq('subject_id', parseInt(subjectId)); return q; })(),
      ]);

      const students = studentsResult.data;
      if (!students?.length) return json({ success: true, data: [] });

      const gradeMap = new Map((gradesResult.data || []).map((g: any) => [g.student_id, g]));

      const data = students.map((s: any) => {
        const g = gradeMap.get(s.student_id) || {};
        const rata_harian = g.rata_harian != null ? parseFloat(g.rata_harian) : hitungRataHarian(g);
        const kehadiran = g.kehadiran != null ? g.kehadiran : 0;
        const sts = g.sts || null; const sas = g.sas || null;
        const nRapor = (rata_harian != null || sts || sas || kehadiran > 0)
          ? Math.round((rata_harian || 0) * 0.5 + (sts || 0) * 0.1 + (sas || 0) * 0.2 + kehadiran * 0.2) : null;
        return { student_id: s.student_id, name: s.name, class: s.class, rata_harian, rata_kehadiran: `${kehadiran}%`, sts, sas, nilai_rapor: nRapor, grade_id: g.id || null };
      });
      return json({ success: true, data });
    }

    if (method === 'GET' && getPath(req).includes('/kehadiran')) {
      const semester = getSearchParams(req).get('semester') || 'Ganjil';
      const studentIdsParam = getSearchParams(req).get('student_ids');
      if (!studentIdsParam) return json({ success: true, data: [] });
      const ids = studentIdsParam.split(',');
      const now = new Date(); const year = now.getFullYear();
      const sd = semester === 'Ganjil' ? `${year}-07-01` : `${year}-01-01`;
      const ed = semester === 'Ganjil' ? `${year}-12-31` : `${year}-06-30`;
      let aq = supabase.from('attendance').select('student_id, keterangan').in('student_id', ids).gte('event_date', sd).lte('event_date', ed);
      if (!isAdm) aq = aq.eq('teacher_id', userId);
      const { data: rows } = await aq;
      const map = new Map<string, { H: number; total: number }>();
      (rows || []).forEach((r: any) => {
        if (!map.has(r.student_id)) map.set(r.student_id, { H: 0, total: 0 });
        const e = map.get(r.student_id)!; e.total++;
        if (r.keterangan === 'H') e.H++;
      });
      const result = Array.from(map.entries()).map(([student_id, d]) => ({ student_id, kehadiran: d.total > 0 ? Math.round((d.H / d.total) * 100) : 0 }));
      return json({ success: true, data: result });
    }

    if (method === 'GET') {
      const semester = getSearchParams(req).get('semester');
      const className = getSearchParams(req).get('class');
      const studentIds = getSearchParams(req).get('student_ids');
      const subjectId = getSearchParams(req).get('subject_id');
      let q = supabase.from('grades').select('*');
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (semester) q = q.eq('semester', semester);
      if (className) {
        const { data: stds } = await supabase.from('students').select('student_id').eq('class', className);
        if (stds?.length) q = q.in('student_id', stds.map((s: any) => s.student_id));
      }
      if (studentIds) q = q.in('student_id', studentIds.split(','));
      if (subjectId) q = q.eq('subject_id', parseInt(subjectId));
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const grades = await req.json();
      const studentIds = [...new Set(grades.map((g: any) => g.student_id))];
      const semester = grades[0]?.semester || 'Ganjil';

      const now = new Date(); const year = now.getFullYear();
      const sd = semester === 'Ganjil' ? `${year}-07-01` : `${year}-01-01`;
      const ed = semester === 'Ganjil' ? `${year}-12-31` : `${year}-06-30`;
      let aq = supabase.from('attendance').select('student_id, keterangan').in('student_id', studentIds).gte('event_date', sd).lte('event_date', ed);
      if (!isAdm) aq = aq.eq('teacher_id', userId);
      const { data: attRows } = await aq;
      const kehadiranMap = new Map<string, number>();
      (attRows || []).forEach((r: any) => {
        if (!kehadiranMap.has(r.student_id)) kehadiranMap.set(r.student_id, { H: 0, total: 0 });
        const e = kehadiranMap.get(r.student_id)!; e.total++;
        if (r.keterangan === 'H') e.H++;
      });
      const kehadiranResult = new Map<string, number>();
      kehadiranMap.forEach((d: any, sid: string) => {
        kehadiranResult.set(sid, d.total > 0 ? Math.round((d.H / d.total) * 100) : 0);
      });

      for (const g of grades) {
        let lookup = supabase.from('grades').select('id').eq('student_id', g.student_id).eq('semester', g.semester);
        if (!isAdm) lookup = lookup.eq('teacher_id', userId);
        if (g.subject_id) lookup = lookup.eq('subject_id', g.subject_id);
        const { data: existing } = await lookup.maybeSingle();
        let targetTeacherId = userId;
        if (isAdm) {
          const { data: stu } = await supabase.from('students').select('teacher_id').eq('student_id', g.student_id).maybeSingle();
          if (stu) targetTeacherId = stu.teacher_id;
        }
        if (existing) {
          const upd: any = {};
          if (g.bab_1 !== undefined) upd.bab_1 = g.bab_1;
          if (g.bab_2 !== undefined) upd.bab_2 = g.bab_2;
          if (g.bab_3 !== undefined) upd.bab_3 = g.bab_3;
          if (g.bab_4 !== undefined) upd.bab_4 = g.bab_4;
          if (g.pengetahuan_rata !== undefined) upd.pengetahuan_rata = g.pengetahuan_rata;
          if (g.keterampilan_rata !== undefined) upd.keterampilan_rata = g.keterampilan_rata;
          if (g.sikap_rata !== undefined) upd.sikap_rata = g.sikap_rata;
          if (g.sikap_jujur !== undefined) upd.sikap_jujur = g.sikap_jujur;
          if (g.sikap_disiplin !== undefined) upd.sikap_disiplin = g.sikap_disiplin;
          if (g.sikap_tgg_jawab !== undefined) upd.sikap_tgg_jawab = g.sikap_tgg_jawab;
          if (g.sts !== undefined) upd.sts = g.sts;
          if (g.sas !== undefined) upd.sas = g.sas;
          if (g.subject_id !== undefined) upd.subject_id = g.subject_id;
          if (g.pengetahuan_rata !== undefined || g.keterampilan_rata !== undefined || g.sikap_jujur !== undefined || g.sikap_disiplin !== undefined || g.sikap_tgg_jawab !== undefined) {
            const merged = { ...(existing && g.pengetahuan_rata === undefined ? { pengetahuan_rata: existing.pengetahuan_rata } : g), ...upd };
            upd.rata_harian = hitungRataHarian(merged);
          }
          upd.kehadiran = kehadiranResult.get(g.student_id) || 0;
          if (Object.keys(upd).length) await supabase.from('grades').update(upd).eq('id', existing.id);
        } else {
          const insertData: any = {
            teacher_id: targetTeacherId, student_id: g.student_id, semester: g.semester,
            bab_1: g.bab_1 || {}, bab_2: g.bab_2 || {}, bab_3: g.bab_3 || {}, bab_4: g.bab_4 || {},
            pengetahuan_rata: g.pengetahuan_rata, keterampilan_rata: g.keterampilan_rata, sikap_rata: g.sikap_rata,
            sikap_jujur: g.sikap_jujur, sikap_disiplin: g.sikap_disiplin, sikap_tgg_jawab: g.sikap_tgg_jawab,
            sts: g.sts, sas: g.sas, subject_id: g.subject_id || null,
          };
          insertData.rata_harian = hitungRataHarian(insertData);
          insertData.kehadiran = kehadiranResult.get(g.student_id) || 0;
          await supabase.from('grades').insert(insertData);
        }
      }
      await logActivity(appUser.id, 'CREATE', 'grade', null, { count: grades.length, semester: grades[0]?.semester });
      return json({ success: true, message: 'Grades saved', count: grades.length });
    }

    if (method === 'PUT') {
      const body = await req.json();
      const { data, error } = await supabase.from('grades').update(body).eq('id', body.id).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      await logActivity(appUser.id, 'UPDATE', 'grade', body.id, { student_id: body.student_id });
      return json({ success: true, data });
    }

    if (method === 'DELETE') {
      const id = getSearchParams(req).get('id');
      if (!id) return json({ success: false, error: 'Missing id' }, 400);
      const { error } = await supabase.from('grades').delete().eq('id', id);
      if (error) return json({ success: false, error: error.message }, 500);
      await logActivity(appUser.id, 'DELETE', 'grade', id, {});
      return json({ success: true, message: 'Deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
