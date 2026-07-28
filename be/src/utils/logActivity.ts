import { query } from '../db/pool';

export async function logActivity(params: {
  userId: number;
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)`,
      [params.userId, params.action, params.entityType, params.entityId ?? null, params.details ? JSON.stringify(params.details) : null, params.ipAddress ?? null]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
