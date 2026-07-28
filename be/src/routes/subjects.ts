import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM subjects ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

router.use(requireRole('admin'));

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code, description } = createSchema.parse(req.body);
    const result = await query(
      'INSERT INTO subjects (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create subject' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description } = createSchema.parse(req.body);
    const result = await query(
      'UPDATE subjects SET name = $1, code = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, code, description || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Subject not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to update subject' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Subject not found' });
    res.json({ success: true, message: 'Subject deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete subject' });
  }
});

export default router;
