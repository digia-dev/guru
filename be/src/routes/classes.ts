import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    let teacherClasses: string[] = [];
    let studentClasses: string[] = [];

    if (isAdm) {
      const usersResult = await query('SELECT teacher_classes FROM users');
      usersResult.rows.forEach((r: any) => {
        if (r.teacher_classes) teacherClasses.push(...r.teacher_classes);
      });
      const studentResult = await query('SELECT DISTINCT class FROM students ORDER BY class');
      studentClasses = studentResult.rows.map((r: any) => r.class);
    } else {
      const userResult = await query('SELECT teacher_classes FROM users WHERE id = $1', [userId]);
      teacherClasses = userResult.rows[0]?.teacher_classes || [];
      const studentResult = await query('SELECT DISTINCT class FROM students WHERE teacher_id = $1 ORDER BY class', [userId]);
      studentClasses = studentResult.rows.map((r: any) => r.class);
    }

    const merged = [...new Set([...teacherClasses, ...studentClasses])].sort();
    const classesWithCount = await Promise.all(merged.map(async (name) => {
      const countResult = isAdm
        ? await query('SELECT COUNT(*) as count FROM students WHERE class = $1', [name])
        : await query('SELECT COUNT(*) as count FROM students WHERE teacher_id = $1 AND class = $2', [userId, name]);
      return { name, student_count: parseInt(countResult.rows[0]?.count || '0') };
    }));
    res.json({ success: true, data: classesWithCount });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

const addSchema = z.object({ name: z.string().min(1) });

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = addSchema.parse(req.body);
    const userId = req.user!.userId;
    const userResult = await query('SELECT teacher_classes FROM users WHERE id = $1', [userId]);
    const classes: string[] = userResult.rows[0]?.teacher_classes || [];
    if (classes.includes(name)) return res.json({ success: true, data: { name } });
    classes.push(name);
    classes.sort();
    await query('UPDATE users SET teacher_classes = $1 WHERE id = $2', [classes, userId]);
    res.status(201).json({ success: true, data: { name } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to add class' });
  }
});

router.put('/:name/:newName', async (req: Request, res: Response) => {
  try {
    const { name, newName } = req.params;
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    const userResult = await query('SELECT teacher_classes FROM users WHERE id = $1', [userId]);
    const classes: string[] = userResult.rows[0]?.teacher_classes || [];
    if (!isAdm && !classes.includes(name)) return res.status(404).json({ success: false, error: 'Class not found' });
    const updated = classes.map(c => c === name ? newName : c);
    await query('UPDATE users SET teacher_classes = $1 WHERE id = $2', [updated, userId]);
    if (isAdm) {
      await query('UPDATE students SET class = $1 WHERE class = $2', [newName, name]);
    } else {
      await query('UPDATE students SET class = $1 WHERE teacher_id = $2 AND class = $3', [newName, userId, name]);
    }
    res.json({ success: true, data: { name: newName } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to rename class' });
  }
});

router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const userId = req.user!.userId;
    const userResult = await query('SELECT teacher_classes FROM users WHERE id = $1', [userId]);
    const classes: string[] = userResult.rows[0]?.teacher_classes || [];
    const updated = classes.filter(c => c !== name);
    await query('UPDATE users SET teacher_classes = $1 WHERE id = $2', [updated, userId]);
    res.json({ success: true, message: 'Class removed' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to remove class' });
  }
});

export default router;