import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';
import { createNotification } from '../utils/notifications';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const activitySchema = z.object({
  event_date: z.string(),
  class: z.string(),
  waktu_mulai: z.string(),
  waktu_selesai: z.string(),
  catatan: z.string().optional(),
  subject_id: z.number().nullable().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { start_date, end_date, class: className } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdm) { conditions.push(`teacher_id = $${idx++}`); params.push(userId); }
    if (start_date) { conditions.push(`event_date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`event_date <= $${idx++}`); params.push(end_date); }
    if (className) { conditions.push(`class = $${idx++}`); params.push(className); }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM learning_activities ${whereClause} ORDER BY event_date ASC, waktu_mulai ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('SELECT * FROM learning_activities WHERE id = $1', [req.params.id])
      : await query('SELECT * FROM learning_activities WHERE id = $1 AND teacher_id = $2', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Activity not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch activity' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = activitySchema.parse(req.body);
    const result = await query(
      `INSERT INTO learning_activities (teacher_id, event_date, class, waktu_mulai, waktu_selesai, catatan, subject_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user!.userId, data.event_date, data.class, data.waktu_mulai, data.waktu_selesai, data.catatan, data.subject_id || null]
    );
    const activity = result.rows[0];
    createNotification({
      userId: req.user!.userId,
      title: `Agenda ${activity.class}`,
      message: `${activity.event_date} — ${activity.waktu_mulai}-${activity.waktu_selesai}`,
      type: 'agenda',
      link: '/agenda',
    });

    res.status(201).json({ success: true, data: activity });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const activities = z.array(activitySchema).parse(req.body);
    const userId = req.user!.userId;

    for (const act of activities) {
      await query(
        `INSERT INTO learning_activities (teacher_id, event_date, class, waktu_mulai, waktu_selesai, catatan, subject_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, act.event_date, act.class, act.waktu_mulai, act.waktu_selesai, act.catatan, act.subject_id || null]
      );
    }

    createNotification({
      userId,
      title: `${activities.length} agenda ditambahkan`,
      message: activities.map(a => `${a.class} (${a.event_date})`).join(', '),
      type: 'agenda',
      link: '/agenda',
    });

    res.status(201).json({ success: true, message: 'Activities created', count: activities.length });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create activities' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = activitySchema.partial().parse(req.body);
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updates.push(`${key} = $${idx++}`);
        params.push(value);
      }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields to update' });

    const isAdm = isAdmin(req);
    params.push(req.params.id);
    if (!isAdm) params.push(req.user!.userId);
    const result = await query(
      `UPDATE learning_activities SET ${updates.join(', ')} WHERE id = $${idx}${isAdm ? '' : ` AND teacher_id = $${idx + 1}`} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Activity not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to update activity' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('DELETE FROM learning_activities WHERE id = $1 RETURNING id', [req.params.id])
      : await query('DELETE FROM learning_activities WHERE id = $1 AND teacher_id = $2 RETURNING id', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Activity not found' });
    res.json({ success: true, message: 'Activity deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete activity' });
  }
});

router.post('/duplicate', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { start_date, end_date } = req.body;
    const isAdm = isAdmin(req);
    if (!start_date || !end_date) return res.status(400).json({ success: false, error: 'start_date and end_date required' });

    const activities = isAdm
      ? await query('SELECT * FROM learning_activities WHERE event_date >= $1 AND event_date <= $2', [start_date, end_date])
      : await query('SELECT * FROM learning_activities WHERE teacher_id = $1 AND event_date >= $2 AND event_date <= $3', [userId, start_date, end_date]);

    if (activities.rows.length === 0) {
      return res.status(200).json({ success: true, message: 'No activities to duplicate', count: 0 });
    }

    let count = 0;

    for (const act of activities.rows) {
      const originalDate = new Date(act.event_date);
      const nextWeek = new Date(originalDate);
      nextWeek.setDate(originalDate.getDate() + 7);
      const nextWeekStr = nextWeek.toLocaleDateString('en-CA');

      await query(
        `INSERT INTO learning_activities (teacher_id, event_date, class, waktu_mulai, waktu_selesai, catatan, subject_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, nextWeekStr, act.class, act.waktu_mulai, act.waktu_selesai, act.catatan, act.subject_id]
      );
      count++;
    }

    res.json({ success: true, message: 'Activities duplicated', count });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to duplicate activities' });
  }
});

export default router;
