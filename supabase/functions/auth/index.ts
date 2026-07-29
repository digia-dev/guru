import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, logActivity } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

function pgQuery(text: string, params?: any[]) {
  return supabaseAdmin.rpc('exec_sql', { query_text: text, query_params: JSON.stringify(params || []) });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const method = req.method;
  const path = req.headers.get('x-subpath') || '';

  try {
    if (method === 'POST' && path === '/login') return await handleLogin(req);
    if (method === 'POST' && path === '/register') return await handleRegister(req);
    if (method === 'POST' && path === '/refresh') return await handleRefresh(req);
    if (method === 'POST' && path === '/logout') return await handleLogout(req);
    if (method === 'GET' && path === '/me') return await handleMe(req);
    if (method === 'POST' && path === '/forgot-password') return await handleForgotPassword(req);
    if (method === 'POST' && path === '/reset-password') return await handleResetPassword(req);
    if (method === 'GET' && path === '/users') return await handleUsers(req);
    if (method === 'POST' && path === '/change-password') return await handleChangePassword(req);

    return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
});

async function getAppUser(authUserId: string) {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('auth_user_id', authUserId).single();
  if (error || !data) return null;
  return data;
}

async function getAppUserById(id: number) {
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
  return data;
}

async function getUserIdByAuth(authHeader: string): Promise<number | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (!user) return null;
  const appUser = await getAppUser(user.id);
  return appUser?.id || null;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleLogin(req: Request) {
  const { email, password } = await req.json();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) return json({ success: false, error: 'Invalid email or password' }, 401);

  const appUser = await getAppUser(authData.user.id);
  if (!appUser) {
    await supabaseAdmin.auth.admin.signOut(authData.user.id);
    return json({ success: false, error: 'User not found in application' }, 401);
  }

  const userId = appUser?.id;
  if (userId) await logActivity(userId, 'LOGIN', 'auth', undefined, { email }, req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '');

  return json({
    success: true,
    data: {
      user: appUser,
      accessToken: authData.session?.access_token,
      refreshToken: authData.session?.refresh_token,
    },
  });
}

async function handleRegister(req: Request) {
  const { email, password, name, teacher_classes } = await req.json();
  const { data: existing } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) return json({ success: false, error: 'Email already registered' }, 409);

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: false, user_metadata: { full_name: name },
  });
  if (authError) return json({ success: false, error: authError.message }, 400);

  const { data: newUser, error: insertError } = await supabaseAdmin.from('users').insert({
    email, name, role: 'guru', teacher_classes: teacher_classes || [], auth_user_id: authData.user.id,
  }).select().single();
  if (insertError) return json({ success: false, error: insertError.message }, 500);

  if (newUser?.id) await logActivity(newUser.id, 'REGISTER', 'user', newUser.id?.toString(), { name: body.name, email: body.email });

  return json({ success: true, data: { id: newUser.id, email: newUser.email, name: newUser.name } }, 201);
}

async function handleRefresh(req: Request) {
  const { refreshToken } = await req.json();
  if (!refreshToken) return json({ success: false, error: 'Refresh token required' }, 400);
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return json({ success: false, error: 'Invalid or expired refresh token' }, 401);
  return json({ success: true, data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token } });
}

async function handleLogout(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(auth.slice(7));
    if (user) await supabaseAdmin.auth.admin.signOut(user.id);
  }
  const uid = await getUserIdByAuth(auth);
  if (uid) await logActivity(uid, 'LOGOUT', 'auth', undefined, undefined, req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '');
  return json({ success: true, message: 'Logged out' });
}

async function handleMe(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (error || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const appUser = await getAppUser(user.id);
  if (!appUser) return json({ success: false, error: 'User not found' }, 404);
  return json({ success: true, data: appUser });
}

async function handleForgotPassword(req: Request) {
  const { email } = await req.json();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${Deno.env.get('CORS_ORIGIN') || 'http://localhost:5173'}/reset-password`,
  });
  return json({ success: true, message: 'Jika email terdaftar, link reset akan dikirim' });
}

async function handleResetPassword(req: Request) {
  const { password } = await req.json();
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Token required' }, 401);
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (userError || !user) return json({ success: false, error: 'Invalid or expired token' }, 401);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
  if (error) return json({ success: false, error: 'Gagal mereset password' }, 400);
  return json({ success: true, message: 'Password berhasil direset' });
}

async function handleChangePassword(req: Request) {
  const { currentPassword, newPassword } = await req.json();
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (userError || !user) return json({ success: false, error: 'Unauthorized' }, 401);

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
  if (signInError) return json({ success: false, error: 'Password saat ini salah' }, 400);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return json({ success: false, error: 'Gagal mengubah password' }, 400);

  return json({ success: true, message: 'Password berhasil diubah' });
}

async function handleUsers(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: { user } } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401);
  const appUser = await getAppUser(user.id);
  if (appUser?.role !== 'admin') return json({ success: false, error: 'Forbidden' }, 403);
  const { data: users } = await supabaseAdmin.from('users').select('id, email, name, role, teacher_classes').order('name');
  return json({ success: true, data: users || [] });
}