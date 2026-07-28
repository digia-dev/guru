import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const kasUmumSchema = z.object({
  tanggal: z.string(),
  jumlah: z.number().positive(),
  keterangan: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('SELECT * FROM kas_umum_tabungan ORDER BY tanggal DESC, timestamp DESC')
      : await query('SELECT * FROM kas_umum_tabungan WHERE teacher_id = $1 ORDER BY tanggal DESC, timestamp DESC', [req.user!.userId]);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch kas umum' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = kasUmumSchema.parse(req.body);
    const result = await query(
      'INSERT INTO kas_umum_tabungan (teacher_id, tanggal, jumlah, keterangan) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.userId, data.tanggal, data.jumlah, data.keterangan]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create kas umum record' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = kasUmumSchema.partial().parse(req.body);
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
      `UPDATE kas_umum_tabungan SET ${updates.join(', ')} WHERE id = $${idx}${isAdm ? '' : ` AND teacher_id = $${idx + 1}`} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update kas umum' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('DELETE FROM kas_umum_tabungan WHERE id = $1 RETURNING id', [req.params.id])
      : await query('DELETE FROM kas_umum_tabungan WHERE id = $1 AND teacher_id = $2 RETURNING id', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, message: 'Kas umum record deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete kas umum' });
  }
});

export default router;
