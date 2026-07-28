import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { supabaseAdmin, supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { logActivity } from '../utils/logActivity';
import { sendVerificationEmail } from '../utils/email';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  teacher_classes: z.array(z.string()).optional(),
});

router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const result = await query(
      'SELECT id, email, name, role, teacher_classes, teacher_subjects FROM users WHERE auth_user_id = $1',
      [authData.user.id]
    );

    if (result.rows.length === 0) {
      await supabaseAdmin.auth.admin.signOut(authData.user.id);
      return res.status(401).json({ success: false, error: 'User not found in application' });
    }

    const user = result.rows[0];
    await logActivity({ userId: user.id, action: 'LOGIN', entityType: 'auth', details: { email }, ipAddress: req.ip });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, teacher_classes: user.teacher_classes, teacher_subjects: user.teacher_subjects },
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/register', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name, teacher_classes } = registerSchema.parse(req.body);

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name },
    });

    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    const result = await query(
      `INSERT INTO users (email, name, role, teacher_classes, auth_user_id)
       VALUES ($1, $2, 'guru', $3, $4)
       RETURNING id, email, name, role, teacher_classes`,
      [email, name, teacher_classes || [], authData.user.id]
    );

    const user = result.rows[0];
    await logActivity({ userId: user.id, action: 'REGISTER', entityType: 'user', entityId: String(user.id), details: { email } });

    const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });
    if (!linkError && linkData?.properties?.action_link) {
      sendVerificationEmail(email, name, linkData.properties.action_link).catch(() => {});
    }

    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token required' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    res.json({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (token) {
      await supabaseAdmin.auth.admin.signOut(req.user!.authUserId);
    }
    await logActivity({ userId: req.user!.userId, action: 'LOGOUT', entityType: 'auth' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.json({ success: true, message: 'Logged out' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, teacher_classes, teacher_subjects FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

router.post('/forgot-password', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password`,
    });
    if (error) {
      console.error('[ForgotPassword]', error.message);
    }
    res.json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim' });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Gagal memproses reset password' });
  }
});

router.post('/reset-password', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { password } = z.object({
      password: z.string().min(8),
    }).parse(req.body);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
    if (error) {
      return res.status(400).json({ success: false, error: 'Gagal mereset password' });
    }

    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') });
    res.status(500).json({ success: false, error: 'Gagal mereset password' });
  }
});

router.get('/users', authenticate, requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, name, role, teacher_classes FROM users ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

export default router;
