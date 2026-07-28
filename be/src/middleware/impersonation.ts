import { Request, Response, NextFunction } from 'express';

export function impersonation(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role === 'admin' && req.query.as_teacher) {
    const targetId = parseInt(req.query.as_teacher as string);
    if (!isNaN(targetId) && targetId > 0) {
      (req.user as any)._originalRole = 'admin';
      (req.user as any)._impersonating = true;
      req.user.userId = targetId;
      req.user.role = 'guru';
    }
  }
  next();
}
