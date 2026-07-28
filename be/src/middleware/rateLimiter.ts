import { Request, Response, NextFunction } from 'express';

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.',
      });
    }
    entry.count++;
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now >= entry.resetAt) attempts.delete(ip);
  }
}, 60 * 1000);
