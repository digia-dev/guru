import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const createStudentSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
  class: z.string().min(1),
  address: z.string().optional(),
  dob: z.preprocess(v => (v === '' || v === undefined) ? null : v, z.string().nullable().optional()),
  father_name: z.string().optional(),
  father_job: z.string().optional(),
  mother_name: z.string().optional(),
  mother_job: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  teacher_id: z.number().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { class: className, search } = req.query;
    const isAdm = isAdmin(req);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (!isAdm) {
      conditions.push(`teacher_id = $${paramIdx++}`);
      params.push(userId);
    }

    if (className) {
      conditions.push(`class = $${paramIdx++}`);
      params.push(className);
    }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR student_id ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `SELECT * FROM students ${whereClause} ORDER BY name ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const result = isAdm
      ? await query('SELECT * FROM students WHERE id = $1', [req.params.id])
      : await query('SELECT * FROM students WHERE id = $1 AND teacher_id = $2', [req.params.id, req.user!.userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
});

router.get('/:id/detail', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    const studentResult = isAdm
      ? await query('SELECT * FROM students WHERE id = $1', [req.params.id])
      : await query('SELECT * FROM students WHERE id = $1 AND teacher_id = $2', [req.params.id, userId]);
    if (studentResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
    const student = studentResult.rows[0];

    const gradesResult = await query(
      `SELECT * FROM grades WHERE ${isAdm ? 'student_id = $1' : 'teacher_id = $1 AND student_id = $2'} ORDER BY semester`,
      isAdm ? [student.student_id] : [userId, student.student_id]
    );

    const attClause = isAdm ? 'student_id = $1' : 'teacher_id = $1 AND student_id = $2';
    const attParams = isAdm ? [student.student_id] : [userId, student.student_id];
    const attendanceResult = await query(
      `SELECT CASE WHEN EXTRACT(MONTH FROM event_date) >= 7 THEN 'Ganjil' ELSE 'Genap' END AS semester,
              COUNT(*) FILTER (WHERE keterangan = 'H') AS hadir,
              COUNT(*) FILTER (WHERE keterangan = 'S') AS sakit,
              COUNT(*) FILTER (WHERE keterangan = 'I') AS izin,
              COUNT(*) FILTER (WHERE keterangan = 'A') AS alfa,
              COUNT(*) AS total
       FROM attendance
       WHERE ${attClause}
         AND event_date >= CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7
           THEN MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT, 7, 1)
           ELSE MAKE_DATE(EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1, 7, 1) END
       GROUP BY semester`,
      attParams
    );

    const currentMonth = new Date().getMonth() + 1;
    const currentSemester = currentMonth >= 7 ? 'Ganjil' : 'Genap';

    const tabunganResult = await query(
      `SELECT COALESCE(SUM(uang_masuk), 0) - COALESCE(SUM(uang_keluar), 0) as saldo FROM tabungan WHERE ${attClause}`,
      attParams
    );
    const tabunganSaldo = parseFloat(tabunganResult.rows[0]?.saldo) || 0;

    const semesters = ['Ganjil', 'Genap'].map(sem => {
      const grade = gradesResult.rows.find((g: any) => g.semester === sem);
      const att = attendanceResult.rows.find((a: any) => a.semester === sem);
      const pRata = grade?.pengetahuan_rata ?? null;
      const kRata = grade?.keterampilan_rata ?? null;
      const sRata = grade?.sikap_rata ?? null;
      return {
        semester: sem,
        is_active: sem === currentSemester,
        grade: grade || null,
        attendance: att ? {
          hadir: parseInt(att.hadir) || 0,
          sakit: parseInt(att.sakit) || 0,
          izin: parseInt(att.izin) || 0,
          alfa: parseInt(att.alfa) || 0,
          total: parseInt(att.total) || 0,
        } : { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 },
      };
    });

    res.json({ success: true, data: { student: { ...student, tabungan_saldo: tabunganSaldo }, semesters } });
  } catch (err: any) {
    console.error('Student detail error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch student detail' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createStudentSchema.parse(req.body);
    const isAdm = isAdmin(req);
    const targetTeacherId = isAdm && data.teacher_id ? data.teacher_id : req.user!.userId;
    const existing = await query(
      'SELECT id FROM students WHERE teacher_id = $1 AND student_id = $2',
      [targetTeacherId, data.student_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Student ID already exists' });
    }
    const result = await query(
      `INSERT INTO students (teacher_id, student_id, name, class, address, dob, father_name, father_job, mother_name, mother_job, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [targetTeacherId, data.student_id, data.name, data.class, data.address, data.dob,
       data.father_name, data.father_job, data.mother_name, data.mother_job, data.phone, data.notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    console.error('Create student error:', err.message, err.details || '');
    res.status(500).json({ success: false, error: err.message || 'Failed to create student' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const fields = ['student_id', 'name', 'class', 'address', 'dob', 'father_name', 'father_job', 'mother_name', 'mother_job', 'phone', 'notes'];
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        let val = req.body[field];
        if (field === 'dob' && val === '') val = null;
        updates.push(`${field} = $${idx++}`);
        params.push(val);
      }
    }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields to update' });

    updates.push(`updated_at = NOW()`);
    const isAdm = isAdmin(req);
    params.push(req.params.id);
    if (!isAdm) params.push(req.user!.userId);
    const result = await query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${idx}${isAdm ? '' : ` AND teacher_id = $${idx + 1}`} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update student' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const isAdm = isAdmin(req);
    const studentResult = isAdm
      ? await query('SELECT student_id FROM students WHERE id = $1', [req.params.id])
      : await query('SELECT student_id FROM students WHERE id = $1 AND teacher_id = $2', [req.params.id, req.user!.userId]);
    if (studentResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
    const studentId = studentResult.rows[0].student_id;
    const userId = req.user!.userId;
    await query('DELETE FROM attendance WHERE teacher_id = $1 AND student_id = $2', [userId, studentId]);
    await query('DELETE FROM grades WHERE teacher_id = $1 AND student_id = $2', [userId, studentId]);
    await query('DELETE FROM tabungan WHERE teacher_id = $1 AND student_id = $2', [userId, studentId]);
    const result = isAdm
      ? await query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id])
      : await query('DELETE FROM students WHERE id = $1 AND teacher_id = $2 RETURNING id', [req.params.id, userId]);
    res.json({ success: true, message: 'Student deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

export default router;
