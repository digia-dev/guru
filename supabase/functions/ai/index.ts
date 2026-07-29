import { corsHeaders, handleCors, getPath } from '../_shared/cors.ts';

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_KEY) {
    const templates: Record<string, string> = {
      'ringkasan': `**Ringkasan Siswa**
Berdasarkan data yang tersedia, siswa ini menunjukkan perkembangan yang perlu diperhatikan lebih lanjut. Disarankan untuk melakukan pemantauan rutin terhadap kehadiran dan nilai akademik.`,
      'catatan': `Catatan Rapor:
Siswa menunjukkan partisipasi yang cukup baik dalam kegiatan pembelajaran. Perlu ditingkatkan lagi kedisiplinan dan ketekunan dalam mengerjakan tugas-tugas sekolah.`,
      'ide': `**Ide Kegiatan Pembelajaran:**
1. Diskusi kelompok interaktif
2. Praktik langsung (hands-on)
3. Permainan edukatif
4. Proyek berbasis masalah`,
    };
    if (prompt.includes('ringkasan')) return templates.ringkasan;
    if (prompt.includes('catatan rapor')) return templates.catatan;
    return templates.ide;
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak dapat menghasilkan respon.';
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
      const text = await callGemini(prompt);
      return json({ success: true, data: text });
    }

    if (path === '/rapor-note') {
      const { name, pRata, kRata, sRata, hadir, totalHadir } = body;
      const prompt = `Buat catatan rapor untuk ${name} dalam bahasa Indonesia (2 kalimat).
Nilai: Pengetahuan=${pRata ?? '-'}, Keterampilan=${kRata ?? '-'}, Sikap=${sRata ?? '-'}.
Kehadiran=${hadir}/${totalHadir}.`;
      const text = await callGemini(prompt);
      return json({ success: true, data: text });
    }

    if (path === '/activity-ideas') {
      const { class: cls, date } = body;
      const prompt = `Berikan 3 ide kegiatan pembelajaran menarik untuk kelas ${cls} pada tanggal ${date} dalam bahasa Indonesia.`;
      const text = await callGemini(prompt);
      return json({ success: true, data: text });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});