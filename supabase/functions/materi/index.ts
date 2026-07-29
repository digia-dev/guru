import { createClient } from 'jsr:@supabase/supabase-js@2';
import { logActivity } from '../_shared/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-subpath, x-as-teacher',
};
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders } });
  return null;
}
function getSearchParams(req: Request): URLSearchParams {
  const subpath = req.headers.get('x-subpath') || '';
  const fromSubpath = new URLSearchParams(subpath.split('?')[1] || '');
  if (fromSubpath.toString()) return fromSubpath;
  return new URLSearchParams(new URL(req.url).search);
}
function getLastPathSegment(req: Request): string {
  const path = (req.headers.get('x-subpath') || '').split('?')[0];
  const parts = path.split('/').filter(Boolean);
  return parts.pop() || '';
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function soalToHtml(soal: any[], nomorAwal = 1): string {
  if (!soal || soal.length === 0) return '';
  let html = '<div class="soal-section"><h3>Soal Latihan</h3>';
  soal.forEach((s, i) => {
    const no = nomorAwal + i;
    html += `<div class="soal-item"><p class="soal-nomor"><b>${no}.</b> ${s.pertanyaan}</p>`;
    if (s.tipe === 'pilihan_ganda' && s.opsi) {
      html += '<div class="opsi">';
      s.opsi.forEach((o: string) => { html += `<p>${o}</p>`; });
      html += '</div>';
    }
    if (s.tipe === 'pilgan_kompleks' && s.opsi) {
      html += '<div class="opsi">';
      s.opsi.forEach((o: string) => { html += `<p>${o}</p>`; });
      html += '</div>';
    }
    if (s.tipe === 'benar_salah') {
      html += '<div class="opsi"><p>( ) Benar</p><p>( ) Salah</p></div>';
    }
    if (s.tipe === 'isian') {
      html += '<div class="opsi"><p>Jawab: ____________________</p></div>';
    }
    if (s.tipe === 'essay') {
      html += '<div class="opsi"><p>Jawab: ___________________________________________</p><p>______________________________________________________</p><p>______________________________________________________</p></div>';
    }
    if (s.tipe === 'menjodohkan' && s.pasangan_kiri && s.pasangan_kanan) {
      html += '<table class="menjodohkan">';
      const maxLen = Math.max(s.pasangan_kiri.length, s.pasangan_kanan.length);
      for (let j = 0; j < maxLen; j++) {
        const kiri = s.pasangan_kiri[j] || '';
        const kanan = s.pasangan_kanan[j] || '';
        html += `<tr><td class="c" width="40">${j + 1}.</td><td>${kiri}</td><td width="60" class="c">( )</td><td class="c" width="40">${String.fromCharCode(97 + j)}.</td><td>${kanan}</td></tr>`;
      }
      html += '</table>';
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

async function handleExport(materi: any, teacherName: string): Promise<Response> {
  const soalHtml = soalToHtml(materi.soal);
  const doc = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${materi.title}</title>
<style>
  @page { margin: 1.5cm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; padding: 20px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header h2 { font-size: 16pt; margin-bottom: 4px; }
  .header h3 { font-size: 14pt; }
  hr { border: none; border-top: 2px solid #000; margin: 12px 0; }
  .info { margin-bottom: 16px; font-size: 12pt; }
  .info td { padding: 2px 8px; }
  .info td:first-child { width: 100px; }
  .konten { margin-bottom: 20px; line-height: 1.6; text-align: justify; white-space: pre-wrap; }
  .soal-section { margin-top: 20px; }
  .soal-section h3 { font-size: 14pt; margin-bottom: 12px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  .soal-item { margin-bottom: 14px; }
  .soal-nomor { margin-bottom: 4px; }
  .opsi { margin-left: 24px; }
  .opsi p { margin: 2px 0; }
  .menjodohkan { border-collapse: collapse; margin-left: 24px; }
  .menjodohkan td { padding: 4px 8px; border: none; }
  .c { text-align: center; }
  .kunci { margin-top: 30px; page-break-before: always; }
  .kunci h3 { font-size: 14pt; margin-bottom: 12px; border-bottom: 1px solid #000; padding-bottom: 4px; }
  .kunci-item { margin-bottom: 8px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h2>MATERI PEMBELAJARAN</h2>
    <h3>${materi.title}</h3>
    <hr>
  </div>

  <table class="info">
    ${materi.mapel ? `<tr><td>Mapel</td><td>: ${materi.mapel}</td></tr>` : ''}
    ${materi.kelas ? `<tr><td>Kelas</td><td>: ${materi.kelas}</td></tr>` : ''}
    ${materi.tingkat_kesulitan ? `<tr><td>Kesulitan</td><td>: ${materi.tingkat_kesulitan}</td></tr>` : ''}
    ${materi.durasi ? `<tr><td>Durasi</td><td>: ${materi.durasi} menit</td></tr>` : ''}
  </table>

  ${materi.konten ? `<div class="konten">${materi.konten}</div>` : ''}
  ${soalHtml}

  ${(function() { if (!materi.soal || materi.soal.length === 0) return '';
    let kunci = '<div class="kunci"><h3>Kunci Jawaban</h3>';
    materi.soal.forEach((s: any, i: number) => {
      let jawaban = '';
      if (s.tipe === 'pilihan_ganda') jawaban = s.jawaban + '. ' + (s.opsi?.find((o: string) => o.startsWith(s.jawaban + '.')) || '');
      else if (s.tipe === 'pilgan_kompleks') jawaban = Array.isArray(s.jawaban) ? s.jawaban.join(', ') : s.jawaban;
      else if (s.tipe === 'benar_salah') jawaban = s.jawaban ? 'Benar' : 'Salah';
      else if (s.tipe === 'menjodohkan' && s.pasangan_kanan) {
        jawaban = (s.jawaban as { kiri: number; kanan: number }[]).map((j: { kiri: number; kanan: number }) => (j.kiri + 1) + ' -> ' + String.fromCharCode(97 + j.kanan)).join(', ');
      } else jawaban = s.jawaban || '-';
      kunci += '<div class="kunci-item"><b>' + (i + 1) + '.</b> ' + jawaban + '</div>';
    });
    return kunci + '</div>';
  })()}

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
}

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
      const isExport = getSearchParams(req).has('export');
      if (isExport && id) {
        let q = supabase.from('materi').select('*').eq('id', id);
        if (!isAdm) q = q.eq('teacher_id', userId);
        const { data } = await q.single();
        if (!data) return json({ success: false, error: 'Not found' }, 404);
        return await handleExport(data, appUser.name);
      }
      let q = supabase.from('materi').select('*').order('uploaded_at', { ascending: false });
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data } = await q;
      return json({ success: true, data: data || [] });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { title, url: urlMateri, type, konten, soal, topik, mapel, kelas, tingkat_kesulitan, durasi, generate_params } = body;
      const insertData: Record<string, unknown> = { teacher_id: userId, title, type: type || 'link' };
      if (urlMateri !== undefined) insertData.url = urlMateri;
      if (konten !== undefined) insertData.konten = konten;
      if (soal !== undefined) insertData.soal = soal;
      if (topik !== undefined) insertData.topik = topik;
      if (mapel !== undefined) insertData.mapel = mapel;
      if (kelas !== undefined) insertData.kelas = kelas;
      if (tingkat_kesulitan !== undefined) insertData.tingkat_kesulitan = tingkat_kesulitan;
      if (durasi !== undefined) insertData.durasi = durasi;
      if (generate_params !== undefined) insertData.generate_params = generate_params;
      const { data, error } = await supabase.from('materi').insert(insertData).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      logActivity(appUser.id, 'CREATE', 'materi', data.id?.toString(), { title: body.title, type: body.type || 'link' });
      return json({ success: true, data }, 201);
    }

    if (method === 'PUT' && id) {
      const body = await req.json();
      delete body.id; delete body.teacher_id; delete body.uploaded_at;
      let q = supabase.from('materi').update(body).eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      const { data, error } = await q.select().single();
      if (error || !data) return json({ success: false, error: 'Not found' }, 404);
      logActivity(appUser.id, 'UPDATE', 'materi', id, { title: body.title });
      return json({ success: true, data });
    }

    if (method === 'DELETE' && id) {
      let q = supabase.from('materi').delete().eq('id', id);
      if (!isAdm) q = q.eq('teacher_id', userId);
      await q;
      logActivity(appUser.id, 'DELETE', 'materi', id, {});
      return json({ success: true, message: 'Materi deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
