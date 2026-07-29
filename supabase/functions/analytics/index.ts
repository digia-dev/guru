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

  try {
    const className = getSearchParams(req).get('class');
    const semester = getSearchParams(req).get('semester') || 'Ganjil';
    const subjectId = getSearchParams(req).get('subject_id');
    if (!className || !subjectId) return json({ success: false, error: 'class and subject_id required' }, 400);

    const [subjectResult, studentsResult, gradesResult] = await Promise.all([
      supabase.from('subjects').select('kkm').eq('id', parseInt(subjectId)).single(),
      (() => { let q = supabase.from('students').select('student_id, name, class').eq('class', className).order('name'); if (!isAdm) q = q.eq('teacher_id', userId); return q; })(),
      (() => { let q = supabase.from('grades').select('*').eq('semester', semester).eq('subject_id', parseInt(subjectId)); if (!isAdm) q = q.eq('teacher_id', userId); return q; })(),
    ]);

    const kkm = subjectResult.data?.kkm ?? 75;
    const allStudents = studentsResult.data || [];
    const gradeMap = new Map((gradesResult.data || []).map((g: any) => [g.student_id, g]));

    const raw: any[] = [];
    let totalP = 0, totalK = 0, totalS = 0, totalSts = 0, totalSas = 0;
    let countP = 0, countK = 0, countS = 0, countSts = 0, countSas = 0;
    let belowKkm = 0;
    const parseSikap = (v: string) => { const n = parseFloat(v); return isNaN(n) ? ({ 'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60 } as any)[v] : n; };

    for (const s of allStudents) {
      const g = gradeMap.get(s.student_id);
      let pRata = null, kRata = null, sRata = null, sts = null, sas = null, nRapor = 0;

      if (g) {
        pRata = g.pengetahuan_rata != null ? parseFloat(g.pengetahuan_rata) : null;
        kRata = g.keterampilan_rata != null ? parseFloat(g.keterampilan_rata) : null;
        const sVals = [g.sikap_jujur, g.sikap_disiplin, g.sikap_tgg_jawab].filter(Boolean).map(parseSikap).filter((v: any) => v != null);
        sRata = sVals.length ? Math.round(sVals.reduce((a: number, b: number) => a + b, 0) / sVals.length) : null;
        sts = parseFloat(g.sts) || null;
        sas = parseFloat(g.sas) || null;
        const rata_harian = g.rata_harian != null ? parseFloat(g.rata_harian) : null;
        const kehadiran = g.kehadiran != null ? g.kehadiran : 0;
        nRapor = (rata_harian != null || sts || sas || kehadiran > 0)
          ? Math.round((rata_harian || 0) * 0.5 + (sts || 0) * 0.1 + (sas || 0) * 0.2 + kehadiran * 0.2) : 0;
      }

      if (pRata !== null) { totalP += pRata; countP++; }
      if (kRata !== null) { totalK += kRata; countK++; }
      if (sRata !== null) { totalS += sRata; countS++; }
      if (sts !== null) { totalSts += sts; countSts++; }
      if (sas !== null) { totalSas += sas; countSas++; }
      if (nRapor < kkm) belowKkm++;
      raw.push({ student_id: s.student_id, name: s.name, pengetahuan_rata: pRata, keterampilan_rata: kRata, sikap_rata: sRata, sts, sas, average: nRapor });
    }

    raw.sort((a, b) => b.average - a.average);
    const ranking = raw.map((r, i) => ({ ...r, rank: i + 1 }));

    return json({
      success: true,
      data: {
        kkm,
        total_students: raw.length,
        with_grades: countP,
        below_kkm: belowKkm,
        class_averages: {
          pengetahuan_rata: countP > 0 ? Math.round(totalP / countP) : null,
          keterampilan_rata: countK > 0 ? Math.round(totalK / countK) : null,
          sikap_rata: countS > 0 ? Math.round(totalS / countS) : null,
          sts: countSts > 0 ? Math.round(totalSts / countSts) : null,
          sas: countSas > 0 ? Math.round(totalSas / countSas) : null,
        },
        ranking,
      },
    });
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
