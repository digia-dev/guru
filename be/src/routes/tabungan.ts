import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const tabunganSchema = z.object({
  student_id: z.string().min(1),
  tanggal: z.string(),
  uang_masuk: z.number().optional(),
  uang_keluar: z.number().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { student_id, start_date, end_date } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdm) { conditions.push(`teacher_id = $${idx++}`); params.push(userId); }
    if (student_id) { conditions.push(`student_id = $${idx++}`); params.push(student_id); }
    if (start_date) { conditions.push(`tanggal >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`tanggal <= $${idx++}`); params.push(end_date); }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM tabungan ${whereClause} ORDER BY tanggal DESC, timestamp DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch tabungan' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = tabunganSchema.parse(req.body);
    const result = await query(
      `INSERT INTO tabungan (teacher_id, student_id, tanggal, uang_masuk, uang_keluar) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.userId, data.student_id, data.tanggal, data.uang_masuk || 0, data.uang_keluar || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create tabungan record' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = tabunganSchema.partial().parse(req.body);
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updates.push(`${key} = $${idx++}`);
        params.push(value);
      }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    const isAdm = isAdmin(req);
    params.push(req.params.id);
    if (!isAdm) params.push(req.user!.userId);
    const result = await query(
      `UPDATE tabungan SET ${updates.join(', ')} WHERE id = $${idx}${isAdm ? '' : ` AND teacher_id = $${idx + 1}`} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update tabungan' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('DELETE FROM tabungan WHERE id = $1 RETURNING id', [req.params.id])
      : await query('DELETE FROM tabungan WHERE id = $1 AND teacher_id = $2 RETURNING id', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, message: 'Tabungan record deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete tabungan' });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    const tabungan = isAdm
      ? await query('SELECT student_id, SUM(uang_masuk) - SUM(uang_keluar) as saldo FROM tabungan GROUP BY student_id')
      : await query('SELECT student_id, SUM(uang_masuk) - SUM(uang_keluar) as saldo FROM tabungan WHERE teacher_id = $1 GROUP BY student_id', [userId]);
    const kasUmum = isAdm
      ? await query('SELECT COALESCE(SUM(jumlah), 0) as total_setoran FROM kas_umum_tabungan')
      : await query('SELECT COALESCE(SUM(jumlah), 0) as total_setoran FROM kas_umum_tabungan WHERE teacher_id = $1', [userId]);
    const totalSaldo = tabungan.rows.reduce((acc: number, r: any) => acc + parseFloat(r.saldo || 0), 0);

    res.json({
      success: true,
      data: {
        total_saldo: totalSaldo,
        total_setoran_kas_umum: parseFloat(kasUmum.rows[0].total_setoran),
        per_student: tabungan.rows,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

export default router;
