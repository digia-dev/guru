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
    if (method === 'GET' && getPath(req).includes('/semester')) {
      const className = getSearchParams(req).get('class');
      const semester = getSearchParams(req).get('semester') || 'Ganjil';
      const subjectId = getSearchParams(req).get('subject_id');
      let stQ = supabase.from('students').select('*').eq('class', className).order('name');
      if (!isAdm) stQ = stQ.eq('teacher_id', userId);
      const { data: students } = await stQ;
      if (!students?.length) return json({ success: true, data: [] });

      const ids = students.map(s => s.student_id);
      let gQ = supabase.from('grades').select('*').in('student_id', ids).eq('semester', semester);
      if (!isAdm) gQ = gQ.eq('teacher_id', userId);
      if (subjectId) gQ = gQ.eq('subject_id', parseInt(subjectId));
      const { data: grades } = await gQ;
      const gradeMap = new Map((grades || []).map(g => [g.student_id, g]));

      const now = new Date(); const year = now.getFullYear();
      const sd = semester === 'Ganjil' ? `${year}-07-01` : `${year}-01-01`;
      const ed = semester === 'Ganjil' ? `${year}-12-31` : `${year}-06-30`;
      let aQ = supabase.from('attendance').select('student_id, keterangan').in('student_id', ids).gte('event_date', sd).lte('event_date', ed);
      if (!isAdm) aQ = aQ.eq('teacher_id', userId);
      const { data: attRows } = await aQ;
      const attMap = new Map<string, any>();
      (attRows || []).forEach((r: any) => {
        if (!attMap.has(r.student_id)) attMap.set(r.student_id, { H: 0, S: 0, I: 0, A: 0 });
        attMap.get(r.student_id)![r.keterangan]++;
      });

      const data = students.map(s => {
        const g = gradeMap.get(s.student_id) || {};
        const a = attMap.get(s.student_id) || { H: 0, S: 0, I: 0, A: 0 };
        const totalH = a.H + a.S + a.I + a.A;
        const kehadiran = totalH > 0 ? Math.round((a.H / totalH) * 100) : 0;

        const babAvg = (bab: any, type: string) => {
          if (bab?.[`${type}_rata`] != null) return parseFloat(bab[`${type}_rata`]);
          const vals = [1, 2, 3, 4, 5].map(i => { const v = bab?.[`${type}_${i}`]; return v != null ? parseFloat(v) : null; }).filter(v => v != null);
          return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
        };
        const pRatas: number[] = []; const kRatas: number[] = [];
        for (let b = 1; b <= 4; b++) {
          const bp = babAvg(g[`bab_${b}`], 'pengetahuan');
          const bk = babAvg(g[`bab_${b}`], 'keterampilan');
          if (bp != null) pRatas.push(bp);
          if (bk != null) kRatas.push(bk);
        }
        const pRata = pRatas.length ? Math.round(pRatas.reduce((a, b) => a + b, 0) / pRatas.length) : null;
        const kRata = kRatas.length ? Math.round(kRatas.reduce((a, b) => a + b, 0) / kRatas.length) : null;
        const sMap: any = { 'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60 };
        const sVals = [g.sikap_jujur, g.sikap_disiplin, g.sikap_tgg_jawab].filter(Boolean).map((v: string) => sMap[v]).filter(v => v != null);
        const sikapRata = sVals.length ? Math.round(sVals.reduce((a, b) => a + b, 0) / sVals.length) : null;

        const hasAll3 = pRata != null && kRata != null && sikapRata != null;
        const nHarian = hasAll3 ? Math.round((pRata! + kRata! + sikapRata!) / 3) : (pRata != null || kRata != null ? Math.round(((pRata || 0) + (kRata || 0)) / ((pRata ? 1 : 0) + (kRata ? 1 : 0))) : null);
        const sts = g.sts || null; const sas = g.sas || null;
        const nRapor = (nHarian != null || sts || sas || kehadiran > 0)
          ? Math.round((nHarian || 0) * 0.5 + (sts || 0) * 0.1 + (sas || 0) * 0.2 + kehadiran * 0.2) : null;

        return { student_id: s.student_id, name: s.name, class: s.class, rata_harian: nHarian, rata_kehadiran: `${kehadiran}%`, sts, sas, nilai_rapor: nRapor, grade_id: g.id || null };
      });
      return json({ success: true, data });
    }

    if (method === 'GET') {
      const semester = getSearchParams(req).get('semester');
      const className = getSearchParams(req).get('class');
      const studentIds = getSearchParams(req).get('student_ids');
      const subjectId = getSearchParams(req).get('subject_id');
      let q = supabase.from('grades').select('*');
      if (!isAdm) q = q.eq('teacher_id', userId);
      if (semester) q = q.eq('semester', semester);
      if (className) { const { data: stds } = await supabase.from('students').select('student_id').eq('class', className); if (stds?.length) q = q.in('student_id', stds.map(s => s.student_id)); }
      if (studentIds) q = q.in('student_id', studentIds.split(','));
      if (subjectId) q = q.eq('subject_id', parseInt(subjectId));
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const grades = await req.json();
      for (const g of grades) {
        let lookup = supabase.from('grades').select('id').eq('teacher_id', userId).eq('student_id', g.student_id).eq('semester', g.semester);
        if (g.subject_id) lookup = lookup.eq('subject_id', g.subject_id);
        const { data: existing } = await lookup.maybeSingle();
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
          if (Object.keys(upd).length) await supabase.from('grades').update(upd).eq('id', existing.id);
        } else {
          await supabase.from('grades').insert({
            teacher_id: userId, student_id: g.student_id, semester: g.semester,
            bab_1: g.bab_1 || {}, bab_2: g.bab_2 || {}, bab_3: g.bab_3 || {}, bab_4: g.bab_4 || {},
            pengetahuan_rata: g.pengetahuan_rata, keterampilan_rata: g.keterampilan_rata, sikap_rata: g.sikap_rata,
            sikap_jujur: g.sikap_jujur, sikap_disiplin: g.sikap_disiplin, sikap_tgg_jawab: g.sikap_tgg_jawab,
            sts: g.sts, sas: g.sas, subject_id: g.subject_id || null,
          });
        }
      }
      return json({ success: true, message: 'Grades saved', count: grades.length });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }