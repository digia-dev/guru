import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const batchSchema = z.object({
  class: z.string(),
  event_date: z.string(),
  subject_id: z.number().nullable().optional(),
  records: z.array(z.object({
    student_id: z.string(),
    name: z.string().optional(),
    keterangan: z.enum(['H', 'S', 'I', 'A']).nullable(),
  })),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { class: className, event_date, start_date, end_date, subject_id } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdm) { conditions.push(`teacher_id = $${idx++}`); params.push(userId); }
    if (className) { conditions.push(`class = $${idx++}`); params.push(className); }
    if (event_date) { conditions.push(`event_date = $${idx++}`); params.push(event_date); }
    if (start_date) { conditions.push(`event_date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`event_date <= $${idx++}`); params.push(end_date); }
    if (subject_id) { conditions.push(`subject_id = $${idx++}`); params.push(parseInt(subject_id as string)); }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM attendance ${whereClause} ORDER BY event_date ASC, student_id ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { class: className, event_date, subject_id, records } = batchSchema.parse(req.body);
    const userId = req.user!.userId;

    for (const record of records) {
      if (record.keterangan) {
        await query(
          `INSERT INTO attendance (teacher_id, student_id, event_date, class, keterangan, subject_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (teacher_id, student_id, event_date)
           DO UPDATE SET keterangan = $5, subject_id = $6, timestamp = NOW()`,
          [userId, record.student_id, event_date, className, record.keterangan, subject_id || null]
        );
      } else {
        await query(
          'DELETE FROM attendance WHERE teacher_id = $1 AND student_id = $2 AND event_date = $3',
          [userId, record.student_id, event_date]
        );
      }
    }

    res.json({ success: true, message: 'Attendance saved', count: records.length });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to save attendance' });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { event_date, start_date, end_date, class: className, subject_id } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdm) { conditions.push(`teacher_id = $${idx++}`); params.push(userId); }
    if (className) { conditions.push(`class = $${idx++}`); params.push(className); }
    if (event_date) { conditions.push(`event_date = $${idx++}`); params.push(event_date); }
    if (start_date) { conditions.push(`event_date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`event_date <= $${idx++}`); params.push(end_date); }
    if (subject_id) { conditions.push(`subject_id = $${idx++}`); params.push(parseInt(subject_id as string)); }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT keterangan, COUNT(*) as count FROM attendance ${whereClause} GROUP BY keterangan`;

    const result = await query(sql, params);
    const counts: any = { H: 0, S: 0, I: 0, A: 0 };
    result.rows.forEach((r: any) => { counts[r.keterangan] = parseInt(r.count); });
    const total = counts.H + counts.S + counts.I + counts.A;

    res.json({
      success: true,
      data: { ...counts, total, persentase: total > 0 ? Math.round((counts.H / total) * 100) : 0 },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

router.get('/trend', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { start_date, end_date, class: className, subject_id } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdm) { conditions.push(`teacher_id = $${idx++}`); params.push(userId); }
    if (start_date) { conditions.push(`event_date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`event_date <= $${idx++}`); params.push(end_date); }
    if (className) { conditions.push(`class = $${idx++}`); params.push(className); }
    if (subject_id) { conditions.push(`subject_id = $${idx++}`); params.push(parseInt(subject_id as string)); }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT event_date, keterangan, COUNT(*) as count FROM attendance ${whereClause} GROUP BY event_date, keterangan ORDER BY event_date ASC`;

    const result = await query(sql, params);
    const trendMap = new Map<string, any>();

    result.rows.forEach((r: any) => {
      if (!trendMap.has(r.event_date)) {
        trendMap.set(r.event_date, { date: r.event_date, H: 0, S: 0, I: 0, A: 0 });
      }
      trendMap.get(r.event_date)![r.keterangan] = parseInt(r.count);
    });

    res.json({ success: true, data: Array.from(trendMap.values()) });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get trend' });
  }
});

export default router;
