const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-subpath, x-as-teacher',
};
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders } });
  return null;
}
function getPath(req: Request): string {
  return req.headers.get('x-subpath') || '';
}

const OR_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function callOpenRouter(prompt: string, jsonMode = false): Promise<string> {
  if (!OR_KEY) {
    return 'AI tidak aktif atur OPENROUTER_API_KEY di Supabase secrets.';
  }
  const body: Record<string, unknown> = {
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OR_KEY}`,
      'HTTP-Referer': 'https://appguru.vercel.app',
      'X-Title': 'AppGuru',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'Tidak dapat menghasilkan respon.';
}

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const path = getPath(req);
  const method = req.method;

  if (method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();

    if (path === '/student-summary') {
      const { name, class: cls, pRata, kRata, sRata, hadir, sakit, izin, alfa, totalHadir, tabungan } = body;
      const prompt = `Buat ringkasan singkat untuk siswa ${name} dari kelas ${cls} dalam bahasa Indonesia. 
Data: Nilai Pengetahuan=${pRata ?? '-'}, Keterampilan=${kRata ?? '-'}, Sikap=${sRata ?? '-'}, 
Kehadiran: Hadir=${hadir}, Sakit=${sakit}, Izin=${izin}, Alfa=${alfa} dari ${totalHadir} pertemuan.
Tabungan=${tabungan}. Berikan 2-3 kalimat evaluasi dan saran.`;
      const text = await callOpenRouter(prompt);
      return json({ success: true, data: text });
    }

    if (path === '/rapor-note') {
      const { name, pRata, kRata, sRata, hadir, totalHadir } = body;
      const prompt = `Buat catatan rapor untuk ${name} dalam bahasa Indonesia (2 kalimat).
Nilai: Pengetahuan=${pRata ?? '-'}, Keterampilan=${kRata ?? '-'}, Sikap=${sRata ?? '-'}.
Kehadiran=${hadir}/${totalHadir}.`;
      const text = await callOpenRouter(prompt);
      return json({ success: true, data: text });
    }

    if (path === '/activity-ideas') {
      const { class: cls, date } = body;
      const prompt = `Berikan 3 ide kegiatan pembelajaran menarik untuk kelas ${cls} pada tanggal ${date} dalam bahasa Indonesia.`;
      const text = await callOpenRouter(prompt);
      return json({ success: true, data: text });
    }

    if (path === '/generate-materi') {
      const { topik, mapel, kelas, tingkat_kesulitan, jenis_soal, jumlah_soal, durasi, kata_kunci, gaya_bahasa } = body;
      const jenisSoalStr = (jenis_soal || ['pilihan_ganda', 'essay']).join(', ');
      const prompt = `Anda adalah asisten pembuat materi pembelajaran untuk guru SMP di Indonesia. Buatlah materi pembelajaran dan soal-soal berdasarkan topik berikut.

Topik: ${topik}
Mata Pelajaran: ${mapel || '-'}
Kelas: ${kelas || '-'}
Tingkat Kesulitan: ${tingkat_kesulitan || 'sedang'}
Jenis Soal yang diminta: ${jenisSoalStr}
Jumlah Soal per jenis: ${jumlah_soal || 2}
Kata Kunci: ${kata_kunci || '-'}
Gaya Bahasa: ${gaya_bahasa || 'sesuai usia siswa SMP'}

Output HARUS berupa JSON object dengan format EXACT berikut, tanpa teks lain:
{
  "judul": "judul materi",
  "tujuan_pembelajaran": ["tujuan 1", "tujuan 2", "tujuan 3"],
  "konten": "materi pembelajaran lengkap dalam format markdown",
  "soal": [
    {
      "tipe": "pilihan_ganda",
      "pertanyaan": "teks pertanyaan",
      "opsi": ["A. opsi A", "B. opsi B", "C. opsi C", "D. opsi D"],
      "jawaban": "A",
      "poin": 10
    }
  ]
}

Petunjuk tipe soal:
- pilihan_ganda: opsi adalah array string, jawaban adalah huruf (A/B/C/D)
- essay: opsi tidak perlu diisi, jawaban adalah teks jawaban reference, tambah field "pedoman_penskoran"
- pilgan_kompleks: opsi adalah array string, jawaban adalah array huruf (["A", "C"])
- menjodohkan: pakai field "pasangan_kiri" (array) dan "pasangan_kanan" (array), jawaban adalah array index [{kiri:0, kanan:0}]
- benar_salah: jawaban adalah true/false
- isian: jawaban adalah teks jawaban singkat

PENTING: Output HARUS berupa JSON VALID tanpa markdown formatting, tanpa backticks, tanpa teks tambahan.`;
      const text = await callOpenRouter(prompt, true);
      try {
        const parsed = JSON.parse(text);
        return json({ success: true, data: parsed });
      } catch {
        return json({ success: true, data: { judul: `Materi: ${topik}`, konten: text, soal: [] } });
      }
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});
