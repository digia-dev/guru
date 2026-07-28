import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/current', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT s.*, ay.name as academic_year_name FROM semesters s JOIN academic_years ay ON ay.id = s.academic_year_id WHERE s.is_active = TRUE AND ay.is_active = TRUE LIMIT 1');
    if (result.rows.length > 0) {
      res.json({ success: true, data: { semester: result.rows[0].name, ...result.rows[0] } });
    } else {
      const month = new Date().getMonth() + 1;
      const semester = month >= 7 ? 'Ganjil' : 'Genap';
      res.json({ success: true, data: { semester } });
    }
  } catch {
    const month = new Date().getMonth() + 1;
    const semester = month >= 7 ? 'Ganjil' : 'Genap';
    res.json({ success: true, data: { semester } });
  }
});

router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT s.*, ay.name as academic_year_name FROM semesters s JOIN academic_years ay ON ay.id = s.academic_year_id ORDER BY ay.start_date DESC, s.start_date ASC');
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch semesters' });
  }
});

router.use(authenticate);
router.use(requireRole('admin'));

const createSchema = z.object({
  academic_year_id: z.number(),
  name: z.enum(['Ganjil', 'Genap']),
  start_date: z.string(),
  end_date: z.string(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { academic_year_id, name, start_date, end_date } = createSchema.parse(req.body);
    const result = await query(
      'INSERT INTO semesters (academic_year_id, name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [academic_year_id, name, start_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create semester' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { academic_year_id, name, start_date, end_date } = createSchema.parse(req.body);
    const result = await query(
      'UPDATE semesters SET academic_year_id = $1, name = $2, start_date = $3, end_date = $4 WHERE id = $5 RETURNING *',
      [academic_year_id, name, start_date, end_date, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Semester not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to update semester' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('DELETE FROM semesters WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Semester not found' });
    res.json({ success: true, message: 'Semester deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete semester' });
  }
});

router.put('/:id/activate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await query('UPDATE semesters SET is_active = FALSE');
    await query('UPDATE semesters SET is_active = TRUE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Semester activated' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to activate semester' });
  }
});

export default router;
