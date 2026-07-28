import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const isAdm = appUser.role === 'admin'; const userId = appUser.id;
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (isAdm) {
      const [stQ, attQ, tabQ, kasQ, clsQ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('event_date', today).eq('keterangan', 'H'),
        supabase.from('tabungan').select('uang_masuk, uang_keluar'),
        supabase.from('kas_umum_tabungan').select('jumlah'),
        supabase.from('students').select('class'),
      ]);
      const totalTab = (tabQ.data || []).reduce((a, r) => a + parseFloat(r.uang_masuk || 0) - parseFloat(r.uang_keluar || 0), 0);
      const totalKas = (kasQ.data || []).reduce((a, r) => a + parseFloat(r.jumlah || 0), 0);
      const classes = [...new Set((clsQ.data || []).map(r => r.class))].sort();
      return json({ success: true, data: { total_students: stQ.count || 0, active_classes: classes.length, hadir_hari_ini: attQ.count || 0, total_tabungan: totalTab - totalKas, classes } });
    } else {
      const [stQ, attQ, tabQ, kasQ, clsQ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', userId),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('teacher_id', userId).eq('event_date', today).eq('keterangan', 'H'),
        supabase.from('tabungan').select('uang_masuk, uang_keluar').eq('teacher_id', userId),
        supabase.from('kas_umum_tabungan').select('jumlah').eq('teacher_id', userId),
        supabase.from('students').select('class').eq('teacher_id', userId),
      ]);
      const totalTab = (tabQ.data || []).reduce((a, r) => a + parseFloat(r.uang_masuk || 0) - parseFloat(r.uang_keluar || 0), 0);
      const totalKas = (kasQ.data || []).reduce((a, r) => a + parseFloat(r.jumlah || 0), 0);
      const classes = [...new Set((clsQ.data || []).map(r => r.class))].sort();
      return json({ success: true, data: { total_students: stQ.count || 0, active_classes: classes.length, hadir_hari_ini: attQ.count || 0, total_tabungan: totalTab - totalKas, classes } });
    }
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }