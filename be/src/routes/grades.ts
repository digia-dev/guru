import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { impersonation } from '../middleware/impersonation';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);
router.use(impersonation);

const batchGradeSchema = z.array(z.object({
  student_id: z.string(),
  semester: z.enum(['Ganjil', 'Genap']),
  subject_id: z.number().nullable().optional(),
  bab_1: z.any().optional(),
  bab_2: z.any().optional(),
  bab_3: z.any().optional(),
  bab_4: z.any().optional(),
  pengetahuan_rata: z.number().nullable().optional(),
  keterampilan_rata: z.number().nullable().optional(),
  sikap_rata: z.number().nullable().optional(),
  sikap_jujur: z.string().nullable().optional(),
  sikap_disiplin: z.string().nullable().optional(),
  sikap_tgg_jawab: z.string().nullable().optional(),
  sts: z.number().nullable().optional(),
  sas: z.number().nullable().optional(),
}));

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { class: className, semester, student_ids, subject_id } = req.query;
    const isAdm = isAdmin(req);
    const joinClause = isAdm ? 'g.student_id = s.student_id' : 'g.student_id = s.student_id AND g.teacher_id = s.teacher_id';
    const whereClause = isAdm ? '1=1' : 'g.teacher_id = $1';
    const params: any[] = isAdm ? [] : [userId];
    let idx = isAdm ? 1 : 2;
    let sql = `SELECT g.* FROM grades g JOIN students s ON ${joinClause} WHERE ${whereClause}`;

    if (semester) { sql += ` AND g.semester = $${idx++}`; params.push(semester); }
    if (className) { sql += ` AND s.class = $${idx++}`; params.push(className); }
    if (student_ids) {
      const ids = (student_ids as string).split(',');
      sql += ` AND g.student_id = ANY($${idx++})`;
      params.push(ids);
    }
    if (subject_id) { sql += ` AND g.subject_id = $${idx++}`; params.push(parseInt(subject_id as string)); }

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch grades' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const grades = batchGradeSchema.parse(req.body);
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);

    for (const grade of grades) {
      const existingQuery = isAdm
        ? 'SELECT id FROM grades WHERE student_id = $1 AND semester = $2'
        : 'SELECT id FROM grades WHERE teacher_id = $1 AND student_id = $2 AND semester = $3';
      const existingParams = isAdm
        ? [grade.student_id, grade.semester]
        : [userId, grade.student_id, grade.semester];
      const existing = await query(existingQuery, existingParams);

      if (existing.rows.length > 0) {
        const updates: string[] = [];
        const params: any[] = [];
        let idx = 1;

        for (const key of ['bab_1', 'bab_2', 'bab_3', 'bab_4', 'pengetahuan_rata', 'keterampilan_rata', 'sikap_rata', 'sikap_jujur', 'sikap_disiplin', 'sikap_tgg_jawab', 'sts', 'sas', 'subject_id'] as const) {
          if (grade[key] !== undefined) {
            updates.push(`${key} = $${idx++}`);
            params.push(grade[key]);
          }
        }
        if (updates.length > 0) {
          params.push(existing.rows[0].id);
          await query(
            `UPDATE grades SET ${updates.join(', ')} WHERE id = $${idx}`,
            params
          );
        }
      } else {
        const { bab_1, bab_2, bab_3, bab_4, pengetahuan_rata, keterampilan_rata, sikap_rata, sikap_jujur, sikap_disiplin, sikap_tgg_jawab, sts, sas } = grade;
        await query(
          `INSERT INTO grades (teacher_id, student_id, semester, bab_1, bab_2, bab_3, bab_4, pengetahuan_rata, keterampilan_rata, sikap_rata, sikap_jujur, sikap_disiplin, sikap_tgg_jawab, sts, sas, subject_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [userId, grade.student_id, grade.semester, bab_1 || {}, bab_2 || {}, bab_3 || {}, bab_4 || {},
           pengetahuan_rata, keterampilan_rata, sikap_rata, sikap_jujur, sikap_disiplin, sikap_tgg_jawab, sts, sas,
           grade.subject_id || null]
        );
      }
    }

    res.json({ success: true, message: 'Grades saved', count: grades.length });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Failed to save grades' });
  }
});

function nilaiKeAngka(val: any): number | null {
  if (val == null || val === '') return null;
  const num = parseFloat(val);
  if (!isNaN(num)) return num;
  const mapping: Record<string, number> = { 'Sangat Baik': 90, 'Baik': 80, 'Cukup': 70, 'Kurang': 60 };
  return mapping[val] ?? null;
}

function rata(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null && !isNaN(v));
  return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

function hitungBabRata(babData: any, type: 'pengetahuan' | 'keterampilan') {
  const val = [1, 2, 3, 4, 5].map(i => nilaiKeAngka(babData?.[`${type}_${i}`]));
  return rata(val);
}

function hitungOverallRata(grade: any) {
  const pRatas: number[] = [];
  const kRatas: number[] = [];
  for (let b = 1; b <= 4; b++) {
    const babData = grade?.[`bab_${b}`] || {};
    const p = hitungBabRata(babData, 'pengetahuan');
    const k = hitungBabRata(babData, 'keterampilan');
    if (p != null) pRatas.push(p);
    if (k != null) kRatas.push(k);
  }
  return { pengetahuan_rata: rata(pRatas), keterampilan_rata: rata(kRatas) };
}

function hitungSikapRata(grade: any) {
  return rata([nilaiKeAngka(grade?.sikap_jujur), nilaiKeAngka(grade?.sikap_disiplin), nilaiKeAngka(grade?.sikap_tgg_jawab)]);
}

router.get('/semester', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { class: className, semester, subject_id } = req.query;
    const isAdm = isAdmin(req);
    const sem = semester || 'Ganjil';

    const students = isAdm
      ? await query('SELECT * FROM students WHERE class = $1 ORDER BY name ASC', [className])
      : await query('SELECT * FROM students WHERE teacher_id = $1 AND class = $2 ORDER BY name ASC', [userId, className]);

    const studentIds = students.rows.map((s: any) => s.student_id);
    if (studentIds.length === 0) return res.json({ success: true, data: [] });

    const grades = isAdm
      ? await query('SELECT g.* FROM grades g WHERE g.student_id = ANY($1) AND g.semester = $2' + (subject_id ? ' AND g.subject_id = $3' : ''), subject_id ? [studentIds, sem, parseInt(subject_id as string)] : [studentIds, sem])
      : await query('SELECT g.* FROM grades g WHERE g.teacher_id = $1 AND g.student_id = ANY($2) AND g.semester = $3' + (subject_id ? ' AND g.subject_id = $4' : ''), subject_id ? [userId, studentIds, sem, parseInt(subject_id as string)] : [userId, studentIds, sem]);
    const gradeMap = new Map(grades.rows.map((g: any) => [g.student_id, g]));

    const now = new Date();
    const year = now.getFullYear();
    const startDate = sem === 'Ganjil' ? `${year}-07-01` : `${year}-01-01`;
    const endDate = sem === 'Ganjil' ? `${year}-12-31` : `${year}-06-30`;

    const attendanceResult = isAdm
      ? await query(
          `SELECT student_id, keterangan, COUNT(*) as count FROM attendance
           WHERE student_id = ANY($1) AND event_date >= $2 AND event_date <= $3
           GROUP BY student_id, keterangan`,
          [studentIds, startDate, endDate]
        )
      : await query(
          `SELECT student_id, keterangan, COUNT(*) as count FROM attendance
           WHERE teacher_id = $1 AND student_id = ANY($2) AND event_date >= $3 AND event_date <= $4
           GROUP BY student_id, keterangan`,
          [userId, studentIds, startDate, endDate]
        );

    const attendanceMap = new Map<string, any>();
    attendanceResult.rows.forEach((r: any) => {
      if (!attendanceMap.has(r.student_id)) {
        attendanceMap.set(r.student_id, { H: 0, S: 0, I: 0, A: 0 });
      }
      attendanceMap.get(r.student_id)![r.keterangan] = parseInt(r.count);
    });

    const data = students.rows.map((student: any) => {
      const grade = gradeMap.get(student.student_id) || {};
      const att = attendanceMap.get(student.student_id) || { H: 0, S: 0, I: 0, A: 0 };
      const totalHadir = att.H;
      const totalAbsen = att.S + att.I + att.A;
      const totalEfektif = totalHadir + totalAbsen;
      const rataKehadiran = totalEfektif > 0 ? Math.round((totalHadir / totalEfektif) * 100) : 0;

      const overall = hitungOverallRata(grade);
      const pengetahuan_rata = overall.pengetahuan_rata || 0;
      const keterampilan_rata = overall.keterampilan_rata || 0;
      const sikap_rata = hitungSikapRata(grade) || 0;
      const nilaiHarian = (pengetahuan_rata > 0 && keterampilan_rata > 0 && sikap_rata > 0)
        ? Math.round((pengetahuan_rata + keterampilan_rata + sikap_rata) / 3) : 0;
      const sts = grade.sts || 0;
      const sas = grade.sas || 0;
      const nilaiRapor = Math.round((nilaiHarian * 0.5) + (sts * 0.1) + (sas * 0.2) + (rataKehadiran * 0.2));

      return {
        student_id: student.student_id,
        name: student.name,
        class: student.class,
        rata_harian: nilaiHarian,
        rata_kehadiran: `${rataKehadiran}%`,
        sts: sts || null,
        sas: sas || null,
        nilai_rapor: nilaiRapor,
        grade_id: grade.id || null,
      };
    });

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch semester grades' });
  }
});

export default router;
