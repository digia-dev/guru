import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabase';
import { query } from '../db/pool';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: error?.message || 'Invalid token' });
    }

    const result = await query(
      'SELECT id, email, name, role, teacher_classes, teacher_subjects FROM users WHERE auth_user_id = $1',
      [user.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found in application' });
    }

    const appUser = result.rows[0];
    req.user = {
      userId: appUser.id,
      email: appUser.email,
      role: appUser.role,
      authUserId: user.id,
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        const result = await query(
          'SELECT id, email, name, role FROM users WHERE auth_user_id = $1',
          [user.id]
        );
        if (result.rows.length > 0) {
          const appUser = result.rows[0];
          req.user = { userId: appUser.id, email: appUser.email, role: appUser.role, authUserId: user.id };
        }
      }
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}
