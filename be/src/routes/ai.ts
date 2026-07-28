import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const OR_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OR_MODEL = 'openai/gpt-3.5-turbo';

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not configured');
  return key;
}

async function callOpenRouter(prompt: string) {
  const apiKey = getApiKey();
  const res = await fetch(OR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://appguru.app',
    },
    body: JSON.stringify({
      model: OR_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  });
  const result: any = await res.json();
  return result?.choices?.[0]?.message?.content?.trim() || 'Gagal mendapatkan respons AI.';
}

const activitySchema = z.object({
  class: z.string(),
  date: z.string(),
  subject: z.string().optional(),
});

router.post('/activity-ideas', async (req: Request, res: Response) => {
  try {
    const { class: kelas, date, subject } = activitySchema.parse(req.body);
    const prompt = `Berikan 3-5 ide kegiatan pembelajaran yang menarik dan sesuai untuk siswa kelas ${kelas} SMP pada tanggal ${date}.${subject ? ` Mata pelajaran: ${subject}.` : ''} Berikan dalam format singkat dan praktis dalam Bahasa Indonesia.`;
    const text = await callOpenRouter(prompt);
    res.json({ success: true, data: text });
  } catch (err: any) {
    console.error('AI activity error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal menghubungi AI' });
  }
});

const raporSchema = z.object({
  name: z.string(),
  pRata: z.number().nullable(),
  kRata: z.number().nullable(),
  sRata: z.number().nullable(),
  hadir: z.number(),
  totalHadir: z.number(),
});

router.post('/rapor-note', async (req: Request, res: Response) => {
  try {
    const { name, pRata, kRata, sRata, hadir, totalHadir } = raporSchema.parse(req.body);
    const kehadiranPct = totalHadir > 0 ? Math.round((hadir / totalHadir) * 100) : 0;
    const prompt = `Buatkan catatan rapor yang positif dan konstruktif untuk siswa bernama ${name} dengan data:
- Nilai Pengetahuan: ${pRata ?? '-'}
- Nilai Keterampilan: ${kRata ?? '-'}
- Nilai Sikap: ${sRata ?? '-'}
- Kehadiran: ${kehadiranPct}%
Buat dalam 2-3 kalimat dalam Bahasa Indonesia yang memotivasi.`;
    const text = await callOpenRouter(prompt);
    res.json({ success: true, data: text });
  } catch (err: any) {
    console.error('AI rapor error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal menghubungi AI' });
  }
});

const summarySchema = z.object({
  studentId: z.number(),
  name: z.string(),
  class: z.string(),
  pRata: z.number().nullable(),
  kRata: z.number().nullable(),
  sRata: z.number().nullable(),
  hadir: z.number(),
  sakit: z.number(),
  izin: z.number(),
  alfa: z.number(),
  totalHadir: z.number(),
  tabungan: z.number().optional(),
});

router.post('/student-summary', async (req: Request, res: Response) => {
  try {
    const data = summarySchema.parse(req.body);
    const kehadiranPct = data.totalHadir > 0 ? Math.round((data.hadir / data.totalHadir) * 100) : 0;
    const tabunganStr = data.tabungan !== undefined ? `Rp ${data.tabungan.toLocaleString('id-ID')}` : '-';
    const prompt = `Buat ringkasan singkat (3-4 kalimat) untuk siswa dengan data berikut:

Nama: ${data.name}
Kelas: ${data.class}
Nilai Pengetahuan: ${data.pRata ?? '-'}
Nilai Keterampilan: ${data.kRata ?? '-'}
Nilai Sikap: ${data.sRata ?? '-'}
Kehadiran: ${data.hadir} hadir, ${data.sakit} sakit, ${data.izin} izin, ${data.alfa} alfa (${kehadiranPct}%)
Tabungan: ${tabunganStr}

Beri analisis singkat dan saran motivasi dalam Bahasa Indonesia.`;
    const text = await callOpenRouter(prompt);
    res.json({ success: true, data: text });
  } catch (err: any) {
    console.error('AI summary error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal menghubungi AI' });
  }
});

export default router;
