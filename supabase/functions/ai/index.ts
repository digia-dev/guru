import { corsHeaders, handleCors, getPath } from '../_shared/cors.ts';

const OR_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OR_KEY) {
    return 'AI tidak aktif — atur OPENROUTER_API_KEY di Supabase secrets.';
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OR_KEY}`,
      'HTTP-Referer': 'https://appguru.vercel.app',
      'X-Title': 'AppGuru',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
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

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
});