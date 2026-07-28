import { Request } from 'express';

export function isAdmin(req: Request): boolean {
  return req.user?.role === 'admin';
}

export function isGuru(req: Request): boolean {
  return req.user?.role === 'guru';
}

export function teacherFilter(req: Request): { clause: string; params: number[] } {
  if (isAdmin(req)) {
    return { clause: 'TRUE', params: [] };
  }
  return { clause: 'teacher_id = $1', params: [req.user!.userId] };
}

export function teacherParam(req: Request): number | null {
  if (isAdmin(req)) return null;
  return req.user!.userId;
}
