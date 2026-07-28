import { Router, Request, Response } from 'express';
import { query } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../utils/isAdmin';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const isAdm = isAdmin(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = (page - 1) * limit;
    const action = req.query.action as string;
    const entityType = req.query.entity_type as string;
    const filterUserId = req.query.user_id as string;

    let sql = 'SELECT al.*, u.name as user_name, u.email as user_email FROM activity_logs al JOIN users u ON u.id = al.user_id';
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (action) { conditions.push(`al.action = $${idx++}`); values.push(action.toUpperCase()); }
    if (entityType) { conditions.push(`al.entity_type = $${idx++}`); values.push(entityType); }
    if (filterUserId && isAdm) { conditions.push(`al.user_id = $${idx++}`); values.push(parseInt(filterUserId)); }
    if (!isAdm) { conditions.push(`al.user_id = $${idx++}`); values.push(userId); }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY al.created_at DESC';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM activity_logs al ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
      values
    );
    values.push(limit);
    values.push(offset);
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;

    const result = await query(sql, values);
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

export default router;
