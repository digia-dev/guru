import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, getLastPathSegment } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const path = getPath(req).split('?')[0].replace(/\/+$/, '') || '/';
  const id = getSearchParams(req).get('id') || getLastPathSegment(req);
  const isAdmin = appUser.role === 'admin';

  try {
    // Subjects (accessible by all authenticated users)
    if (path === '/subjects' && method === 'GET') {
      const { data } = await supabase.from('subjects').select('*').order('name');
      return json({ success: true, data: data || [] });
    }

    // Academic Years (accessible by all authenticated users)
    if (path === '/academic-years' && method === 'GET') {
      const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false });
      return json({ success: true, data: data || [] });
    }

    // Semesters (accessible by all authenticated users)
    if (path === '/semesters' && method === 'GET') {
      const { data } = await supabase.from('semesters').select('*').order('start_date');
      return json({ success: true, data: data || [] });
    }

    // ── Admin-only endpoints below ──
    if (!isAdmin) return json({ success: false, error: 'Forbidden' }, 403);

    // Users CRUD
    if (path === '/users' && method === 'GET') {
      const { data } = await supabase.from('users').select('id, email, name, role, teacher_classes, teacher_subjects, created_at').order('name');
      return json({ success: true, data: data || [] });
    }

    if (path === '/users' && method === 'POST') {
      const body = await req.json();
      const { data: existing } = await supabase.from('users').select('id').eq('email', body.email).maybeSingle();
      if (existing) return json({ success: false, error: 'Email already registered' }, 409);
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.name } });
      if (authErr) return json({ success: false, error: authErr.message }, 400);
      const { data, error } = await supabase.from('users').insert({ email: body.email, name: body.name, role: body.role || 'guru', teacher_classes: body.teacher_classes || [], teacher_subjects: body.teacher_subjects || [], auth_user_id: authData.user.id }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (path.startsWith('/users/') && method === 'PUT' && id) {
      const body = await req.json();
      const updates: any = {};
      if (body.name) updates.name = body.name;
      if (body.email) updates.email = body.email;
      if (body.role) updates.role = body.role;
      if (body.teacher_classes !== undefined) updates.teacher_classes = body.teacher_classes;
      if (body.teacher_subjects !== undefined) updates.teacher_subjects = body.teacher_subjects;
      const { data } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (!data) return json({ success: false, error: 'User not found' }, 404);
      return json({ success: true, data });
    }

    if (path.startsWith('/users/') && method === 'DELETE' && id) {
      const { count } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', id);
      if (count && count > 0) return json({ success: false, error: 'Guru masih memiliki siswa. Pindahkan siswa ke guru lain terlebih dahulu.' }, 400);
      await supabase.from('activity_logs').delete().eq('user_id', id);
      await supabase.from('notifications').delete().eq('user_id', id);
      await supabase.from('attendance').delete().eq('teacher_id', id);
      await supabase.from('grades').delete().eq('teacher_id', id);
      await supabase.from('tabungan').delete().eq('teacher_id', id);
      await supabase.from('kas_umum_tabungan').delete().eq('teacher_id', id);
      await supabase.from('materi').delete().eq('teacher_id', id);
      await supabase.from('learning_activities').delete().eq('teacher_id', id);
      const { data: targetUser } = await supabase.from('users').select('auth_user_id').eq('id', id).single();
      if (targetUser) await supabase.auth.admin.deleteUser(targetUser.auth_user_id);
      await supabase.from('users').delete().eq('id', id);
      return json({ success: true, message: 'User deleted' });
    }

    // Dashboard
    if (path === '/dashboard' && method === 'GET') {
      const [stQ, clsQ, attQ, tabQ, usrQ, guruQ, logQ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('class'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('event_date', new Date().toISOString().slice(0, 10)).eq('keterangan', 'H'),
        supabase.from('tabungan').select('uang_masuk, uang_keluar'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'guru'),
        supabase.rpc('exec_sql', { sql_query: 'SELECT al.*, u.name as user_name FROM activity_logs al JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 20' }),
      ]);
      const classes = [...new Set((clsQ.data || []).map(r => r.class))];
      const totalTab = (tabQ.data || []).reduce((a, r) => a + parseFloat(r.uang_masuk || 0) - parseFloat(r.uang_keluar || 0), 0);
      const { data: teachers } = await supabase.rpc('exec_sql', { sql_query: 'SELECT u.id, u.name, u.email, COUNT(s.id) as student_count FROM users u LEFT JOIN students s ON s.teacher_id = u.id WHERE u.role = \'guru\' GROUP BY u.id, u.name, u.email ORDER BY u.name' });
      return json({ success: true, data: { total_users: usrQ.count || 0, total_gurus: guruQ.count || 0, total_students: stQ.count || 0, total_classes: classes.length, hadir_hari_ini: attQ.count || 0, total_tabungan: totalTab, teachers: teachers || [], recent_logs: logQ?.data || [] } });
    }

    // Logs
    if (path === '/logs' && method === 'GET') {
      const page = parseInt(getSearchParams(req).get('page') || '1');
      const limit = Math.min(parseInt(getSearchParams(req).get('limit') || '50'), 200);
      const offset = (page - 1) * limit;
      const { data: logs } = await supabase.rpc('exec_sql', { sql_query: `SELECT al.*, u.name as user_name, u.email as user_email FROM activity_logs al JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT ${limit} OFFSET ${offset}` });
      return json({ success: true, data: logs || [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // Subjects CRUD (admin only)
    if (path === '/subjects' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('subjects').insert(body).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (path.startsWith('/subjects/') && method === 'PUT' && id) {
      const body = await req.json();
      const { data, error } = await supabase.from('subjects').update(body).eq('id', id).select().single();
      if (error || !data) return json({ success: false, error: 'Subject not found' }, 404);
      return json({ success: true, data });
    }

    if (path.startsWith('/subjects/') && method === 'DELETE' && id) {
      await supabase.from('subjects').delete().eq('id', id);
      return json({ success: true, message: 'Subject deleted' });
    }

    // Academic Years CRUD (admin only)
    if (path === '/academic-years' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('academic_years').insert(body).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (path.startsWith('/academic-years/') && method === 'PUT' && id) {
      const body = await req.json();
      const { data, error } = await supabase.from('academic_years').update(body).eq('id', id).select().single();
      if (error || !data) return json({ success: false, error: 'Academic year not found' }, 404);
      return json({ success: true, data });
    }

    if (path.startsWith('/academic-years/') && method === 'DELETE' && id) {
      await supabase.from('academic_years').delete().eq('id', id);
      return json({ success: true, message: 'Academic year deleted' });
    }

    // Semesters CRUD (admin only)
    if (path === '/semesters' && method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.from('semesters').insert(body).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    if (path.startsWith('/semesters/') && method === 'PUT' && id) {
      if (path.endsWith('/activate')) {
        await supabase.from('semesters').update({ is_active: false }).neq('id', id);
        const { data, error } = await supabase.from('semesters').update({ is_active: true }).eq('id', id).select().single();
        if (error || !data) return json({ success: false, error: 'Semester not found' }, 404);
        return json({ success: true, data });
      }
      const body = await req.json();
      const { data, error } = await supabase.from('semesters').update(body).eq('id', id).select().single();
      if (error || !data) return json({ success: false, error: 'Semester not found' }, 404);
      return json({ success: true, data });
    }

    if (path.startsWith('/semesters/') && method === 'DELETE' && id) {
      await supabase.from('semesters').delete().eq('id', id);
      return json({ success: true, message: 'Semester deleted' });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }