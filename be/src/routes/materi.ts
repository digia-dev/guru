import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const materiSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('SELECT * FROM materi ORDER BY uploaded_at DESC')
      : await query('SELECT * FROM materi WHERE teacher_id = $1 ORDER BY uploaded_at DESC', [req.user!.userId]);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch materi' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = materiSchema.parse(req.body);
    const result = await query(
      'INSERT INTO materi (teacher_id, title, url, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user!.userId, data.title, data.url, data.type || 'link']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create materi' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('DELETE FROM materi WHERE id = $1 RETURNING id', [req.params.id])
      : await query('DELETE FROM materi WHERE id = $1 AND teacher_id = $2 RETURNING id', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Materi not found' });
    res.json({ success: true, message: 'Materi deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete materi' });
  }
});

export default router;
