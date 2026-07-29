import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getSearchParams } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '') || '';
  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth);
  if (authErr || !user) return html('<p>Unauthorized</p>', 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return html('<p>User not found</p>', 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;
  const teacherName = appUser.name;

  const studentId = getSearchParams(req).get('student_id');
  const semester = getSearchParams(req).get('semester') || 'Ganjil';
  if (!studentId) return html('<p>student_id required</p>', 400);

  const { data: student } = await supabase.from('students').select('*').eq('id', parseInt(studentId)).single();
  if (!student) return html('<p>Student not found</p>', 404);
  if (!isAdm && student.teacher_id !== userId) return html('<p>Unauthorized</p>', 401);

  const { data: grades } = await supabase.from('grades')
    .select('*, subjects(name, code, kkm)')
    .eq('student_id', student.student_id)
    .eq('semester', semester);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const startDate = month >= 7 ? `${year}-07-01` : `${year - 1}-07-01`;
  const endDate = month >= 7 ? `${year + 1}-06-30` : `${year}-06-30`;

  const { data: attRows } = await supabase.from('attendance')
    .select('keterangan')
    .eq('student_id', student.student_id)
    .gte('event_date', startDate)
    .lte('event_date', endDate);

  const counts = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
  (attRows || []).forEach((r: any) => {
    if (r.keterangan === 'H') counts.hadir++;
    else if (r.keterangan === 'S') counts.sakit++;
    else if (r.keterangan === 'I') counts.izin++;
    else if (r.keterangan === 'A') counts.alfa++;
  });
  const totalHadir = counts.hadir + counts.sakit + counts.izin + counts.alfa;

  let rows = '';
  for (const g of grades || []) {
    const subj = (g as any).subjects;
    const pRata = g.pengetahuan_rata ?? '-';
    const kRata = g.keterampilan_rata ?? '-';
    const sRata = g.sikap_rata ?? '-';
    const sts = g.sts ?? '-';
    const sas = g.sas ?? '-';
    const akhir = g.pengetahuan_rata && g.keterampilan_rata
      ? Math.round((parseFloat(g.pengetahuan_rata) + parseFloat(g.keterampilan_rata)) / 2)
      : g.pengetahuan_rata ?? g.keterampilan_rata ?? '-';
    rows += `<tr>
      <td>${subj?.name || '-'}</td>
      <td class="c">${pRata}</td>
      <td class="c">${kRata}</td>
      <td class="c">${sRata}</td>
      <td class="c">${sts}</td>
      <td class="c">${sas}</td>
      <td class="c">${akhir}</td>
    </tr>`;
  }

  const attPct = totalHadir > 0 ? Math.round((counts.hadir / totalHadir) * 100) : 0;

  const doc = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Rapor - ${student.name}</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; padding: 20px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h2 { font-size: 16pt; margin-bottom: 4px; }
  .header h3 { font-size: 14pt; margin-bottom: 4px; }
  .header p { font-size: 11pt; }
  hr { border: none; border-top: 2px solid #000; margin: 12px 0; }
  .info { margin-bottom: 16px; }
  .info td { padding: 2px 8px; font-size: 12pt; }
  .info td:first-child { width: 120px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; }
  th { background: #e0e0e0; font-weight: bold; text-align: center; }
  .c { text-align: center; }
  .att { margin-bottom: 16px; }
  .att td { padding: 3px 12px; }
  .sign { display: flex; justify-content: space-between; margin-top: 40px; }
  .sign div { text-align: center; width: 200px; }
  .sign .name { margin-top: 60px; font-weight: bold; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h2>PEMERINTAH KOTA TANGERANG SELATAN</h2>
    <h3>SMP NEGERI 3 KOTA TANGERANG SELATAN</h3>
    <p>Jl. Raya Pendidikan No. 1, Tangerang Selatan</p>
    <hr>
    <h3>LAPORAN HASIL BELAJAR</h3>
    <p>Semester ${semester} Tahun Pelajaran ${year - (month >= 7 ? 0 : 1)}/${year + (month >= 7 ? 1 : 0)}</p>
  </div>

  <table class="info">
    <tr><td>Nama</td><td>: <b>${student.name}</b></td></tr>
    <tr><td>NIS</td><td>: ${student.student_id}</td></tr>
    <tr><td>Kelas</td><td>: ${student.class}</td></tr>
  </table>

  <table>
    <thead>
      <tr><th>Mata Pelajaran</th><th>Pengetahuan</th><th>Keterampilan</th><th>Sikap</th><th>STS</th><th>SAS</th><th>Nilai Akhir</th></tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" class="c">Belum ada nilai</td></tr>'}
    </tbody>
  </table>

  <div class="att">
    <b>Kehadiran:</b>
    <table>
      <tr><td>Hadir</td><td class="c">${counts.hadir}</td><td>Sakit</td><td class="c">${counts.sakit}</td><td>Izin</td><td class="c">${counts.izin}</td><td>Alfa</td><td class="c">${counts.alfa}</td><td>% Kehadiran</td><td class="c">${attPct}%</td></tr>
    </table>
  </div>

  <div class="sign">
    <div>
      <p>Mengetahui,</p>
      <p>Kepala Sekolah</p>
      <p class="name">( ______________________ )</p>
      <p>NIP. ________________</p>
    </div>
    <div>
      <p>Tangerang Selatan, ${new Date().toLocaleDateString('id-ID')}</p>
      <p>Wali Kelas</p>
      <p class="name">( ${teacherName} )</p>
      <p>NIP. ________________</p>
    </div>
  </div>

  <div class="no-print" style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;background:#4f46e5;color:#fff;border:none;border-radius:6px;">
      Cetak / Simpan PDF
    </button>
  </div>
</body>
</html>`;

  return new Response(doc, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
});

function html(body: string, status = 200) {
  return new Response(`<!DOCTYPE html><html><body>${body}</body></html>`, {
    status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
}