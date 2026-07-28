import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const emptyToNull = z.preprocess(v => (v === '' || v === undefined) ? null : v, z.string().nullable());

const importStudentSchema = z.array(z.object({
  student_id: z.coerce.string().min(1),
  name: z.string().min(1),
  class: z.string().min(1),
  address: z.string().optional().default(''),
  dob: emptyToNull.optional(),
  father_name: z.string().optional().default(''),
  father_job: z.string().optional().default(''),
  mother_name: z.string().optional().default(''),
  mother_job: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  teacher_id: z.coerce.number().optional(),
}));

router.post('/students', async (req: Request, res: Response) => {
  try {
    const students = importStudentSchema.parse(req.body);
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    let imported = 0; let updated = 0;

    for (const s of students) {
      const tid = isAdm && s.teacher_id ? s.teacher_id : userId;
      const existing = await query('SELECT id FROM students WHERE student_id = $1 AND teacher_id = $2', [s.student_id, tid]);
      if (existing.rows.length > 0) {
        await query(
          `UPDATE students SET name = $1, class = $2, address = $3, dob = $4, father_name = $5, father_job = $6, mother_name = $7, mother_job = $8, phone = $9, notes = $10, updated_at = NOW() WHERE id = $11`,
          [s.name, s.class, s.address, s.dob, s.father_name, s.father_job, s.mother_name, s.mother_job, s.phone, s.notes, existing.rows[0].id]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO students (teacher_id, student_id, name, class, address, dob, father_name, father_job, mother_name, mother_job, phone, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [tid, s.student_id, s.name, s.class, s.address, s.dob, s.father_name, s.father_job, s.mother_name, s.mother_job, s.phone, s.notes]
        );
        imported++;
      }
    }

    res.json({ success: true, data: { imported, updated, total: students.length } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') });
    console.error('Import students error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal import siswa' });
  }
});

const importAttendanceSchema = z.array(z.object({
  student_id: z.coerce.string().min(1),
  event_date: z.string().min(1),
  keterangan: z.enum(['H', 'S', 'I', 'A']),
  class: z.string().min(1),
  subject_id: z.coerce.number().nullable().optional(),
}));

router.post('/attendance', async (req: Request, res: Response) => {
  try {
    const records = importAttendanceSchema.parse(req.body);
    const userId = req.user!.userId;
    let imported = 0;

    for (const r of records) {
      await query(
         `INSERT INTO attendance (teacher_id, student_id, event_date, class, keterangan, subject_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (teacher_id, student_id, event_date)
         DO UPDATE SET keterangan = $5, subject_id = $6, timestamp = NOW()`,
        [userId, r.student_id, r.event_date, r.class, r.keterangan, r.subject_id || null]
      );
      imported++;
    }

    res.json({ success: true, data: { imported, total: records.length } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') });
    console.error('Import attendance error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal import absensi' });
  }
});

const importGradeSchema = z.array(z.object({
  student_id: z.coerce.string().min(1),
  semester: z.enum(['Ganjil', 'Genap']),
  subject_id: z.coerce.number().nullable().optional(),
  pengetahuan_rata: z.coerce.number().nullable().optional(),
  keterampilan_rata: z.coerce.number().nullable().optional(),
  sikap_rata: z.coerce.number().nullable().optional(),
  sikap_jujur: z.string().nullable().optional(),
  sikap_disiplin: z.string().nullable().optional(),
  sikap_tgg_jawab: z.string().nullable().optional(),
  sts: z.coerce.number().nullable().optional(),
  sas: z.coerce.number().nullable().optional(),
}));

router.post('/grades', async (req: Request, res: Response) => {
  try {
    const grades = importGradeSchema.parse(req.body);
    const userId = req.user!.userId;
    let imported = 0; let updated = 0;

    for (const g of grades) {
      const existing = await query(
        'SELECT id FROM grades WHERE teacher_id = $1 AND student_id = $2 AND semester = $3',
        [userId, g.student_id, g.semester]
      );
      if (existing.rows.length > 0) {
        const updates: string[] = []; const params: any[] = []; let idx = 1;
        for (const key of ['pengetahuan_rata', 'keterampilan_rata', 'sikap_rata', 'sikap_jujur', 'sikap_disiplin', 'sikap_tgg_jawab', 'sts', 'sas', 'subject_id'] as const) {
          if (g[key] !== undefined) {
            updates.push(`${key} = $${idx++}`);
            params.push(g[key]);
          }
        }
        if (updates.length > 0) {
          params.push(existing.rows[0].id);
          await query(`UPDATE grades SET ${updates.join(', ')} WHERE id = $${idx}`, params);
          updated++;
        }
      } else {
        await query(
          `INSERT INTO grades (teacher_id, student_id, semester, pengetahuan_rata, keterampilan_rata, sikap_rata, sikap_jujur, sikap_disiplin, sikap_tgg_jawab, sts, sas, subject_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [userId, g.student_id, g.semester, g.pengetahuan_rata || null, g.keterampilan_rata || null, g.sikap_rata || null, g.sikap_jujur || null, g.sikap_disiplin || null, g.sikap_tgg_jawab || null, g.sts || null, g.sas || null, g.subject_id || null]
        );
        imported++;
      }
    }

    res.json({ success: true, data: { imported, updated, total: grades.length } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') });
    console.error('Import grades error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Gagal import nilai' });
  }
});

export default router;
