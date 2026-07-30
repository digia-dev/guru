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
    if (method === 'PUT' && path === '/me') return await handleUpdateProfile(req);
    if (method === 'GET' && path === '/grade-weights') return await handleGetGradeWeights(req);
    if (method === 'PUT' && path === '/grade-weights') return await handleUpdateGradeWeights(req);
    if (method === 'GET' && path === '/backup') return await handleBackup(req);
    if (method === 'POST' && path === '/restore') return await handleRestore(req);

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

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } },
  });
  if (authError) return json({ success: false, error: authError.message }, 400);
  if (!authData.user) return json({ success: false, error: 'Gagal mendaftar' }, 500);

  const { data: newUser, error: insertError } = await supabaseAdmin.from('users').insert({
    email, name, role: 'guru', teacher_classes: teacher_classes || [], auth_user_id: authData.user.id,
  }).select().single();
  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return json({ success: false, error: insertError.message }, 500);
  }

  if (newUser?.id) await logActivity(newUser.id, 'REGISTER', 'user', newUser.id?.toString(), { name, email });

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

async function handleUpdateProfile(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return json({ success: false, error: 'Unauthorized' }, 401);

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (userError || !user) return json({ success: false, error: 'Unauthorized' }, 401);

  const appUser = await getAppUser(user.id);
  if (!appUser) return json({ success: false, error: 'User not found' }, 404);

  const { currentPassword, name, email } = await req.json();

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
  if (signInError) return json({ success: false, error: 'Password saat ini salah' }, 400);

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined && email !== appUser.email) updates.email = email;

  if (Object.keys(updates).length === 0) return json({ success: false, error: 'Tidak ada data yang diubah' }, 400);

  if (updates.email) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { email: updates.email });
    if (authUpdateError) return json({ success: false, error: 'Gagal mengupdate email: ' + authUpdateError.message }, 400);
  }

  const { data: updatedUser, error: updateError } = await supabaseAdmin.from('users').update(updates).eq('id', appUser.id).select().single();
  if (updateError) return json({ success: false, error: 'Gagal mengupdate profil' }, 500);

  return json({ success: true, data: updatedUser });
}

async function handleGetGradeWeights(req: Request) {
  const appUser = await getAuthedUser(req);
  if (!appUser) return json({ success: false, error: 'Unauthorized' }, 401);

  let { data } = await supabaseAdmin.from('grade_weights').select('*').eq('teacher_id', appUser.id).single();
  if (!data) {
    data = { teacher_id: appUser.id, bobot_harian: 40, bobot_sts: 30, bobot_sas: 30 };
  }
  return json({ success: true, data });
}

async function handleUpdateGradeWeights(req: Request) {
  const appUser = await getAuthedUser(req);
  if (!appUser) return json({ success: false, error: 'Unauthorized' }, 401);

  const { bobot_harian, bobot_sts, bobot_sas } = await req.json();
  if (bobot_harian + bobot_sts + bobot_sas !== 100) return json({ success: false, error: 'Total bobot harus 100%' }, 400);

  const { data, error } = await supabaseAdmin.from('grade_weights').upsert({
    teacher_id: appUser.id, bobot_harian, bobot_sts, bobot_sas, updated_at: new Date().toISOString(),
  }).select().single();
  if (error) return json({ success: false, error: 'Gagal menyimpan bobot' }, 500);

  return json({ success: true, data });
}

async function getAuthedUser(req: Request) {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(auth.slice(7));
  if (!user) return null;
  return await getAppUser(user.id);
}

async function handleBackup(req: Request) {
  const appUser = await getAuthedUser(req);
  if (!appUser) return json({ success: false, error: 'Unauthorized' }, 401);

  const [students, attendance, grades, tabungan, kasUmum, materi, activities] = await Promise.all([
    supabaseAdmin.from('students').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('attendance').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('grades').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('tabungan').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('kas_umum').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('materi').select('*').eq('teacher_id', appUser.id),
    supabaseAdmin.from('learning_activities').select('*').eq('teacher_id', appUser.id),
  ]);

  const data = {
    teacher: { id: appUser.id, name: appUser.name, email: appUser.email, teacher_classes: appUser.teacher_classes },
    students: students.data || [],
    attendance: attendance.data || [],
    grades: grades.data || [],
    tabungan: tabungan.data || [],
    kas_umum: kasUmum.data || [],
    materi: materi.data || [],
    learning_activities: activities.data || [],
    exported_at: new Date().toISOString(),
  };

  return json({ success: true, data });
}

async function handleRestore(req: Request) {
  const appUser = await getAuthedUser(req);
  if (!appUser) return json({ success: false, error: 'Unauthorized' }, 401);

  const body = await req.json();
  const { students, attendance, grades, tabungan, kas_umum, materi, learning_activities } = body;

  const tid = appUser.id;

  const clearAndInsert = async (table: string, rows: any[], mapRow: (r: any) => any) => {
    await supabaseAdmin.from(table).delete().eq('teacher_id', tid);
    if (rows?.length > 0) {
      const mapped = rows.map(mapRow);
      await supabaseAdmin.from(table).insert(mapped);
    }
  };

  await Promise.all([
    clearAndInsert('students', students, (r: any) => ({ teacher_id: tid, student_id: r.student_id, name: r.name, class: r.class, address: r.address || '', dob: r.dob || '', father_name: r.father_name || '', father_job: r.father_job || '', mother_name: r.mother_name || '', mother_job: r.mother_job || '', phone: r.phone || '', notes: r.notes || '' })),
    clearAndInsert('attendance', attendance, (r: any) => ({ teacher_id: tid, student_id: r.student_id, event_date: r.event_date, class: r.class, keterangan: r.keterangan })),
    clearAndInsert('grades', grades, (r: any) => {
      const g: any = { teacher_id: tid, student_id: r.student_id, semester: r.semester };
      ['bab_1','bab_2','bab_3','bab_4','pengetahuan_rata','keterampilan_rata','sikap_rata','sikap_jujur','sikap_disiplin','sikap_tgg_jawab','sts','sas'].forEach(k => { if (r[k] !== undefined) g[k] = r[k]; });
      return g;
    }),
    clearAndInsert('tabungan', tabungan, (r: any) => ({ teacher_id: tid, student_id: r.student_id, tanggal: r.tanggal, uang_masuk: r.uang_masuk, uang_keluar: r.uang_keluar })),
    clearAndInsert('kas_umum', kas_umum, (r: any) => ({ teacher_id: tid, tanggal: r.tanggal, jumlah: r.jumlah, keterangan: r.keterangan || '' })),
    clearAndInsert('materi', materi, (r: any) => ({ teacher_id: tid, title: r.title, type: r.type, konten: r.konten || '', topik: r.topik || '', mapel: r.mapel || '', kelas: r.kelas || '', tingkat_kesulitan: r.tingkat_kesulitan || '', durasi: r.durasi || 0 })),
    clearAndInsert('learning_activities', learning_activities, (r: any) => ({ teacher_id: tid, event_date: r.event_date, class: r.class, waktu_mulai: r.waktu_mulai, waktu_selesai: r.waktu_selesai, catatan: r.catatan || '', subject_id: r.subject_id || null })),
  ]);

  return json({ success: true, message: 'Data berhasil dipulihkan' });
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