import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { createNotificationForAll } from '../utils/notifications';

const router = Router();
router.use(authenticate);
router.use(impersonation);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, limit: limitStr } = req.query;
    let sql = 'SELECT * FROM calendar_events WHERE is_global = TRUE';
    const params: any[] = [];
    let paramIdx = 1;

    if (start_date) {
      sql += ` AND event_date >= $${paramIdx++}`;
      params.push(start_date);
    }
    if (end_date) {
      sql += ` AND event_date <= $${paramIdx++}`;
      params.push(end_date);
    }

    sql += ' ORDER BY event_date ASC';

    if (limitStr) {
      sql += ` LIMIT $${paramIdx++}`;
      params.push(parseInt(limitStr as string, 10));
    }

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const schema = z.array(z.object({
      event_date: z.string().min(1),
      jenis: z.string().min(1),
      event_type: z.string().min(1),
      color_class: z.string().optional().default(''),
    }));
    const events = schema.parse(req.body);
    let imported = 0; let updated = 0;

    for (const ev of events) {
      const existing = await query(
        'SELECT id FROM calendar_events WHERE event_date = $1 AND event_type = $2',
        [ev.event_date, ev.event_type]
      );
      if (existing.rows.length > 0) {
        await query(
          'UPDATE calendar_events SET jenis = $1, color_class = $2 WHERE id = $3',
          [ev.jenis, ev.color_class || null, existing.rows[0].id]
        );
        updated++;
      } else {
        await query(
          'INSERT INTO calendar_events (event_date, jenis, event_type, color_class) VALUES ($1, $2, $3, $4)',
          [ev.event_date, ev.jenis, ev.event_type, ev.color_class || null]
        );
        imported++;
      }
    }

    if (imported > 0 || updated > 0) {
      const messages: string[] = [];
      if (imported > 0) messages.push(`${imported} event baru`);
      if (updated > 0) messages.push(`${updated} event diperbarui`);
      createNotificationForAll({
        title: 'Kalender diperbarui',
        message: messages.join(', '),
        type: 'event',
        link: '/kalender',
      });
    }

    res.json({ success: true, data: { imported, updated, total: events.length } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: err.message || 'Gagal import kalender' });
  }
});

export default router;
