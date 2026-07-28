import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM academic_years ORDER BY start_date DESC');
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch academic years' });
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, start_date, end_date } = createSchema.parse(req.body);
    const result = await query(
      'INSERT INTO academic_years (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
      [name, start_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create academic year' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, start_date, end_date } = createSchema.parse(req.body);
    const result = await query(
      'UPDATE academic_years SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *',
      [name, start_date, end_date, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Academic year not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to update academic year' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('DELETE FROM academic_years WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Academic year not found' });
    res.json({ success: true, message: 'Academic year deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete academic year' });
  }
});

router.put('/:id/activate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await query('UPDATE academic_years SET is_active = FALSE');
    await query('UPDATE academic_years SET is_active = TRUE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Academic year activated' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to activate academic year' });
  }
});

export default router;
