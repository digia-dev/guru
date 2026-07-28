import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) {
      return res.json({ success: true, data: { students: [], classes: [] } });
    }
    const search = String(q);
    const pattern = `%${search}%`;
    const userId = req.user!.userId;
    const adm = isAdmin(req);

    const studentWhere = adm
      ? `(name ILIKE $1 OR student_id ILIKE $1 OR class ILIKE $1)`
      : `teacher_id = $2 AND (name ILIKE $1 OR student_id ILIKE $1 OR class ILIKE $1)`;
    const studentParams = adm ? [pattern] : [pattern, userId];

    const students = await query(
      `SELECT id, student_id, name, class FROM students WHERE ${studentWhere} ORDER BY name ASC LIMIT 5`,
      studentParams
    );

    const classes = await query(
      `SELECT DISTINCT class FROM students WHERE class ILIKE $1 ORDER BY class LIMIT 5`,
      [pattern]
    );

    res.json({
      success: true,
      data: {
        students: students.rows,
        classes: classes.rows.map((r: any) => r.class),
      },
    });
  } catch (err: any) {
    console.error('Search error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
