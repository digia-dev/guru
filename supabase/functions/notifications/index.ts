import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, getPath, getSearchParams, getLastPathSegment, logActivity } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@appguru.com';

Deno.serve(async (req) => {
  const cors = handleCors(req); if (cors) return cors;
  const method = req.method;
  const { data: { user }, error: authErr } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') || '');
  if (authErr || !user) return json({ success: false, error: 'Unauthorized' }, 401);
  const { data: appUser } = await supabase.from('users').select('*').eq('auth_user_id', user.id).single();
  if (!appUser) return json({ success: false, error: 'User not found' }, 401);
  const userId = appUser.id;
  const path = getPath(req).split('?')[0].replace(/\/+$/, '') || '/';
  const id = getSearchParams(req).get('id') || getLastPathSegment(req);
  const searchParams = getSearchParams(req);

  try {
    // Push subscription
    if (path === '/push/subscribe' && method === 'POST') {
      const { endpoint, p256dh, auth } = await req.json();
      const ua = req.headers.get('user-agent') || '';
      const { error } = await supabase.from('push_subscriptions').upsert(
        { user_id: userId, endpoint, p256dh, auth, user_agent: ua },
        { onConflict: 'user_id,endpoint', ignoreDuplicates: false },
      );
      if (error) return json({ success: false, error: error.message }, 500);
      await logActivity(userId, 'UPDATE', 'push_subscription', undefined, { action: 'subscribe' });
      return json({ success: true });
    }

    if (path === '/push/subscribe' && method === 'DELETE') {
      const { endpoint } = await req.json();
      await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint);
      return json({ success: true });
    }

    if (path === '/push/subscribe' && method === 'GET') {
      const { data } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
      return json({ success: true, data: (data || []).length > 0 });
    }

    // Send push (admin only)
    if (path === '/push/send' && method === 'POST') {
      if (appUser.role !== 'admin') return json({ success: false, error: 'Forbidden' }, 403);
      const { title, body, url, targetUserIds, targetRole } = await req.json();
      let q = supabase.from('push_subscriptions').select('*');
      if (targetUserIds && targetUserIds.length > 0) {
        q = q.in('user_id', targetUserIds);
      } else if (targetRole) {
        const { data: ids } = await supabase.from('users').select('id').eq('role', targetRole);
        if (ids && ids.length > 0) q = q.in('user_id', ids.map((r: any) => r.id));
        else return json({ success: true, sent: 0 });
      }
      const { data: subs } = await q;
      if (!subs || subs.length === 0) return json({ success: true, sent: 0 });

      let sent = 0;
      for (const sub of subs) {
        try {
          await sendWebPush(sub.endpoint, sub.p256dh, sub.auth, { title, body, url });
          sent++;
        } catch { /* individual failure */ }
      }

      await logActivity(userId, 'CREATE', 'push_notification', undefined, { title, targetRole, sent });
      return json({ success: true, sent });
    }

    // Normal notification endpoints
    if (method === 'GET' && path === '/notifications' || (path === '' || path === '/') && method === 'GET') {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      return json({ success: true, data: data || [] });
    }

    if (method === 'GET' && path === '/unread-count') {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
      return json({ success: true, data: { count: count || 0 } });
    }

    if (method === 'PATCH' && path === '/read-all') {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      return json({ success: true });
    }

    if (method === 'PATCH' && path.endsWith('/read')) {
      const notifId = path.split('/').filter(Boolean).slice(-2, -1)[0];
      if (notifId) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', parseInt(notifId)).eq('user_id', userId);
      }
      return json({ success: true });
    }

    if (method === 'PATCH' && id) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId);
      return json({ success: true });
    }

    // Announcements CRUD (admin)
    if (path === '/announcements' && method === 'GET') {
      const { data } = await supabase.from('announcements').select('*, created_by_user:users!created_by(name)').order('created_at', { ascending: false }).limit(50);
      return json({ success: true, data: data || [] });
    }

    if (path === '/announcements' && method === 'POST') {
      if (appUser.role !== 'admin') return json({ success: false, error: 'Forbidden' }, 403);
      const { title, content, targetRole, sendPush } = await req.json();
      const { data, error } = await supabase.from('announcements').insert({
        title, content, target_role: targetRole || null, created_by: userId,
      }).select().single();
      if (error) return json({ success: false, error: error.message }, 500);
      await logActivity(userId, 'CREATE', 'announcement', data.id?.toString(), { title, targetRole });

      // Add recipient records
      let userQuery = supabase.from('users').select('id');
      if (targetRole) userQuery = userQuery.eq('role', targetRole);
      const { data: users } = await userQuery;
      if (users && users.length > 0) {
        const recipients = users.map((u: any) => ({ announcement_id: data.id, user_id: u.id }));
        await supabase.from('announcement_recipients').insert(recipients);
      }

      // Send push notifications if requested
      if (sendPush && users && users.length > 0) {
        const userIds = users.map((u: any) => u.id);
        const { data: subs } = await supabase.from('push_subscriptions').select('*').in('user_id', userIds);
        if (subs && subs.length > 0) {
          for (const sub of subs) {
            try {
              await sendWebPush(sub.endpoint, sub.p256dh, sub.auth, {
                title: 'Pengumuman: ' + title,
                body: content?.slice(0, 200),
                url: '/app',
              });
            } catch { /* individual failure */ }
          }
        }
        await supabase.from('announcements').update({ sent_at: new Date().toISOString() }).eq('id', data.id);
      }

      return json({ success: true, data }, 201);
    }

    if (path.startsWith('/announcements/') && method === 'DELETE' && id) {
      if (appUser.role !== 'admin') return json({ success: false, error: 'Forbidden' }, 403);
      await supabase.from('announcements').delete().eq('id', id);
      return json({ success: true, message: 'Announcement deleted' });
    }

    // My announcements (for current user)
    if (path === '/my-announcements' && method === 'GET') {
      const { data } = await supabase
        .from('announcement_recipients')
        .select('*, announcement:announcements(*)')
        .eq('user_id', userId)
        .order('announcement_id', { ascending: false });
      return json({ success: true, data: data?.map((r: any) => ({ ...r.announcement, read_at: r.read_at })) || [] });
    }

    if (path.startsWith('/my-announcements/') && method === 'PATCH' && id) {
      await supabase.from('announcement_recipients').update({ read_at: new Date().toISOString() })
        .eq('announcement_id', id).eq('user_id', userId);
      return json({ success: true });
    }

    return json({ success: false, error: 'Not found' }, 404);
  } catch (err: any) { return json({ success: false, error: err.message }, 500); }
});

let _wp: any = null;
async function getWebPush() {
  if (!_wp) {
    const mod = await import('npm:web-push@3.6.7');
    mod.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    _wp = mod;
  }
  return _wp;
}

async function sendWebPush(endpoint: string, p256dh: string, auth: string, payload: { title: string; body?: string; url?: string }) {
  const wp = await getWebPush();
  await wp.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload));
}

function json(data: any, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
