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

    const { data: subject } = await supabase.from('subjects').select('kkm').eq('id', parseInt(subjectId)).single();
    const kkm = subject?.kkm ?? 75;

    let sQ = supabase.from('students').select('student_id, name, class').eq('class', className).order('name');
    if (!isAdm) sQ = sQ.eq('teacher_id', userId);
    const { data: allStudents } = await sQ;

    let gQ = supabase.from('grades').select('*').eq('semester', semester).eq('subject_id', parseInt(subjectId));
    if (!isAdm) gQ = gQ.eq('teacher_id', userId);
    const { data: grades } = await gQ;
    const gradeMap = new Map((grades || []).map(g => [g.student_id, g]));

    const raw: any[] = [];
    let totalP = 0, totalK = 0, totalS = 0, totalSts = 0, totalSas = 0;
    let countP = 0, countK = 0, countS = 0, countSts = 0, countSas = 0;
    let belowKkm = 0;

    for (const s of allStudents || []) {
      const g = gradeMap.get(s.student_id);
      if (!g) {
        raw.push({ student_id: s.student_id, name: s.name, pengetahuan_rata: null, keterampilan_rata: null, sikap_rata: null, sts: null, sas: null, average: 0 });
        continue;
      }
      const pRata = parseFloat(g.pengetahuan_rata) || null;
      const kRata = parseFloat(g.keterampilan_rata) || null;
      const sRata = parseFloat(g.sikap_rata) || null;
      const sts = parseFloat(g.sts) || null;
      const sas = parseFloat(g.sas) || null;
      const avg = pRata !== null && kRata !== null ? (pRata + kRata) / 2 : pRata ?? kRata ?? 0;
      if (pRata !== null) { totalP += pRata; countP++; }
      if (kRata !== null) { totalK += kRata; countK++; }
      if (sRata !== null) { totalS += sRata; countS++; }
      if (sts !== null) { totalSts += sts; countSts++; }
      if (sas !== null) { totalSas += sas; countSas++; }
      if (avg < kkm) belowKkm++;
      raw.push({ student_id: s.student_id, name: s.name, pengetahuan_rata: pRata, keterampilan_rata: kRata, sikap_rata: sRata, sts, sas, average: Math.round(avg * 100) / 100 });
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
          pengetahuan_rata: countP > 0 ? Math.round((totalP / countP) * 100) / 100 : null,
          keterampilan_rata: countK > 0 ? Math.round((totalK / countK) * 100) / 100 : null,
          sikap_rata: countS > 0 ? Math.round((totalS / countS) * 100) / 100 : null,
          sts: countSts > 0 ? Math.round((totalSts / countSts) * 100) / 100 : null,
          sas: countSas > 0 ? Math.round((totalSas / countSas) * 100) / 100 : null,
        },
        ranking,
      },
    });
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }