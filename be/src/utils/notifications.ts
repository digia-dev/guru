import { query } from '../db/pool';

export async function createNotification(params: {
  userId: number;
  title: string;
  message?: string;
  type: 'system' | 'agenda' | 'event';
  link?: string;
}) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)`,
      [params.userId, params.title, params.message ?? null, params.type, params.link ?? null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function createNotificationForAll(params: {
  title: string;
  message?: string;
  type: 'system' | 'agenda' | 'event';
  link?: string;
}) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, link)
       SELECT id, $1, $2, $3, $4 FROM users WHERE role = 'guru'`,
      [params.title, params.message ?? null, params.type, params.link ?? null]
    );
  } catch (err) {
    console.error('Failed to create notifications for all:', err);
  }
}
