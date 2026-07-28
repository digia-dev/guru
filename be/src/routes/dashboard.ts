import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    const today = new Date().toLocaleDateString('en-CA');

    if (isAdm) {
      const [studentsResult, attendanceResult, tabunganResult, kasUmumResult] = await Promise.all([
        query('SELECT COUNT(*) as total FROM students'),
        query("SELECT COUNT(*) as total FROM attendance WHERE event_date = $1 AND keterangan = $2", [today, 'H']),
        query("SELECT COALESCE(SUM(uang_masuk), 0) - COALESCE(SUM(uang_keluar), 0) as total FROM tabungan"),
        query("SELECT COALESCE(SUM(jumlah), 0) as total FROM kas_umum_tabungan"),
      ]);
      const classesResult = await query('SELECT DISTINCT class FROM students ORDER BY class');
      res.json({
        success: true,
        data: {
          total_students: parseInt(studentsResult.rows[0].total),
          active_classes: classesResult.rows.length,
          hadir_hari_ini: parseInt(attendanceResult.rows[0].total),
          total_tabungan: parseFloat(tabunganResult.rows[0].total) - parseFloat(kasUmumResult.rows[0].total),
          classes: classesResult.rows.map((r: any) => r.class),
        },
      });
    } else {
      const [studentsResult, attendanceResult, tabunganResult, kasUmumResult] = await Promise.all([
        query('SELECT COUNT(*) as total FROM students WHERE teacher_id = $1', [userId]),
        query("SELECT COUNT(*) as total FROM attendance WHERE teacher_id = $1 AND event_date = $2 AND keterangan = $3", [userId, today, 'H']),
        query("SELECT COALESCE(SUM(uang_masuk), 0) - COALESCE(SUM(uang_keluar), 0) as total FROM tabungan WHERE teacher_id = $1", [userId]),
        query("SELECT COALESCE(SUM(jumlah), 0) as total FROM kas_umum_tabungan WHERE teacher_id = $1", [userId]),
      ]);
      const classesResult = await query('SELECT DISTINCT class FROM students WHERE teacher_id = $1 ORDER BY class', [userId]);
      res.json({
        success: true,
        data: {
          total_students: parseInt(studentsResult.rows[0].total),
          active_classes: classesResult.rows.length,
          hadir_hari_ini: parseInt(attendanceResult.rows[0].total),
          total_tabungan: parseFloat(tabunganResult.rows[0].total) - parseFloat(kasUmumResult.rows[0].total),
          classes: classesResult.rows.map((r: any) => r.class),
        },
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get dashboard stats' });
  }
});

export default router;
