import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate, requireRole } from '../middleware/auth';
import { logActivity } from '../utils/logActivity';

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, name, role, teacher_classes, teacher_subjects, created_at FROM users ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['guru', 'admin']),
  teacher_classes: z.array(z.string()).optional(),
  teacher_subjects: z.array(z.string()).optional(),
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, teacher_classes, teacher_subjects } = createUserSchema.parse(req.body);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, name, role, teacher_classes, teacher_subjects) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role, teacher_classes, teacher_subjects',
      [email, password_hash, name, role, teacher_classes || [], teacher_subjects || []]
    );
    await logActivity({ userId: req.user!.userId, action: 'CREATE', entityType: 'user', entityId: result.rows[0].id, details: { email, role } });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['guru', 'admin']).optional(),
  teacher_classes: z.array(z.string()).optional(),
  teacher_subjects: z.array(z.string()).optional(),
  password: z.string().min(8).optional(),
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const body = updateUserSchema.parse(req.body);
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.name) { sets.push(`name = $${idx++}`); values.push(body.name); }
    if (body.email) { sets.push(`email = $${idx++}`); values.push(body.email); }
    if (body.role) { sets.push(`role = $${idx++}`); values.push(body.role); }
    if (body.teacher_classes !== undefined) { sets.push(`teacher_classes = $${idx++}`); values.push(body.teacher_classes); }
    if (body.teacher_subjects !== undefined) { sets.push(`teacher_subjects = $${idx++}`); values.push(body.teacher_subjects); }
    if (body.password) { sets.push(`password_hash = $${idx++}`); values.push(await bcrypt.hash(body.password, 12)); }
    sets.push(`updated_at = NOW()`);

    if (sets.length === 1) return res.status(400).json({ success: false, error: 'No fields to update' });

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, teacher_classes, teacher_subjects`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    await logActivity({ userId: req.user!.userId, action: 'UPDATE', entityType: 'user', entityId: userId, details: body });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    console.error('Update user error:', err.message, err.stack);
    res.status(500).json({ success: false, error: err.message || 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user!.userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    const studentCount = await query('SELECT COUNT(*) as c FROM students WHERE teacher_id = $1', [userId]);
    if (parseInt(studentCount.rows[0].c) > 0) {
      return res.status(400).json({ success: false, error: 'Guru masih memiliki siswa. Pindahkan siswa ke guru lain terlebih dahulu.' });
    }

    await query('DELETE FROM activity_logs WHERE user_id = $1', [userId]);
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    await query('DELETE FROM notifications WHERE user_id = $1', [userId]);

    await query('DELETE FROM attendance WHERE teacher_id = $1', [userId]);
    await query('DELETE FROM grades WHERE teacher_id = $1', [userId]);
    await query('DELETE FROM tabungan WHERE teacher_id = $1', [userId]);
    await query('DELETE FROM kas_umum_tabungan WHERE teacher_id = $1', [userId]);
    await query('DELETE FROM materi WHERE teacher_id = $1', [userId]);
    await query('DELETE FROM learning_activities WHERE teacher_id = $1', [userId]);

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email, name', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    await logActivity({ userId: req.user!.userId, action: 'DELETE', entityType: 'user', entityId: userId, details: { email: result.rows[0].email } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [userCount, studentCount, classResult, attendanceToday, tabunganTotal] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM students'),
      query('SELECT COUNT(DISTINCT class) as total FROM students'),
      query('SELECT COUNT(*) as total FROM attendance WHERE event_date = $1 AND keterangan = $2', [new Date().toLocaleDateString('en-CA'), 'H']),
      query(`SELECT COALESCE((SELECT SUM(uang_masuk) FROM tabungan), 0) - COALESCE((SELECT SUM(uang_keluar) FROM tabungan), 0) as total`),
    ]);

    const [teachersByClass, totalGurus] = await Promise.all([
      query(`
        SELECT u.id, u.name, u.email, COUNT(s.id) as student_count
        FROM users u LEFT JOIN students s ON s.teacher_id = u.id
        WHERE u.role = 'guru'
        GROUP BY u.id, u.name, u.email ORDER BY u.name
      `),
      query(`SELECT COUNT(*) as total FROM users WHERE role = 'guru'`),
    ]);

    const recentLogs = await query('SELECT al.*, u.name as user_name FROM activity_logs al JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 20');

    res.json({
      success: true,
      data: {
        total_users: parseInt(userCount.rows[0].total),
        total_gurus: parseInt(totalGurus.rows[0].total),
        total_students: parseInt(studentCount.rows[0].total),
        total_classes: parseInt(classResult.rows[0].total),
        hadir_hari_ini: parseInt(attendanceToday.rows[0].total),
        total_tabungan: parseFloat(tabunganTotal.rows[0].total) || 0,
        teachers: teachersByClass.rows,
        recent_logs: recentLogs.rows,
      },
    });
  } catch (err: any) {
    console.error('Admin dashboard error:', err?.message || err);
    res.status(500).json({ success: false, error: 'Failed to get admin dashboard' });
  }
});

export default router;
