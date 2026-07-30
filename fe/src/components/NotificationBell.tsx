import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Notification } from '../types';
import toast from 'react-hot-toast';

const typeIcons: Record<string, string> = {
  system: 'fa-info-circle text-blue-500',
  agenda: 'fa-calendar-day text-indigo-500',
  event: 'fa-calendar-alt text-orange-500',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { permission, subscribed, requestPermission, subscribe, unsubscribe } = usePushNotifications();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notifRes, countRes] = await Promise.all([
          apiClient.get('/notifications'),
          apiClient.get('/notifications/unread-count'),
        ]);
        if (notifRes.data.success) setNotifications(notifRes.data.data);
        if (countRes.data.success) setUnreadCount(countRes.data.data.count);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (permission === 'granted' && !subscribed) {
      subscribe();
    }
  }, [permission, subscribed, subscribe]);

  const handleMarkRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDeleteAll = async () => {
    try {
      await apiClient.delete('/notifications/delete-all');
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Semua notifikasi dihapus');
    } catch {
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) handleMarkRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  const handlePushToggle = async () => {
    if (permission !== 'granted') {
      const ok = await requestPermission();
      if (ok) await subscribe();
    } else if (subscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        title="Notifikasi"
      >
        <i className="fas fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={handleDeleteAll} className="text-xs text-red-500 hover:text-red-700">
                  Hapus semua
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                  Tandai semua dibaca
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <i className="fas fa-inbox text-3xl mb-2"></i>
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}
                >
                  <i className={`fas mt-1 ${typeIcons[n.type] || typeIcons.system}`}></i>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    {n.message && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></span>}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">
              {subscribed ? 'Push aktif' : permission === 'denied' ? 'Push ditolak' : 'Push nonaktif'}
            </span>
            <button onClick={handlePushToggle} className="text-[10px] text-indigo-600 hover:underline">
              {subscribed ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
