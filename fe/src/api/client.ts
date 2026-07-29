import { supabase } from '../lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipvkqzpxstugemftmhem.supabase.co';

const FUNCTIONS_MAP: Record<string, string> = {
  auth: 'auth', students: 'students', classes: 'classes', attendance: 'attendance',
  grades: 'grades', tabungan: 'tabungan', 'kas-umum': 'kas-umum', materi: 'materi',
  agenda: 'agenda', dashboard: 'dashboard', search: 'search', admin: 'admin',
  notifications: 'notifications', announcements: 'notifications', 'my-announcements': 'notifications',
  semesters: 'admin', 'calendar-events': 'calendar-events',
  subjects: 'admin', activities: 'agenda', 'academic-years': 'admin', logs: 'admin', ai: 'ai',
  timetable: 'timetable', analytics: 'analytics', rapor: 'rapor',
};

let accessToken: string | null = null;
let onLogout: (() => void) | null = null;
let asTeacherId: number | null = null;

export function setAsTeacher(id: number | null) { asTeacherId = id; }
export function getAsTeacher(): number | null { return asTeacherId; }

export function setTokens(access: string) {
  accessToken = access;
}

export function clearTokens() {
  accessToken = null;
}

export function setOnLogout(callback: () => void) { onLogout = callback; }

async function callFn(method: string, path: string, body?: any, params?: any) {
  const qsIdx = path.indexOf('?');
  const qsFromPath = qsIdx >= 0 ? path.slice(qsIdx) : '';
  const cleanPath = qsIdx >= 0 ? path.slice(0, qsIdx) : path;
  const [, group, ...rest] = cleanPath.split('/');
  const funcName = FUNCTIONS_MAP[group];
  if (!funcName) throw new Error(`Unknown API route: ${path}`);
  const subPath = rest.length ? '/' + (group !== funcName ? group + '/' : '') + rest.join('/') : (group !== funcName ? '/' + group : '');

  const mergedParams = { ...Object.fromEntries(new URLSearchParams(qsFromPath).entries()), ...params };
  const qs = Object.keys(mergedParams).length ? '?' + new URLSearchParams(mergedParams).toString() : '';

  const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
  const url = `${supabaseUrl}/functions/v1/${funcName}`;

  const headers: Record<string, string> = {
    Authorization: token ? `Bearer ${token}` : '',
    'x-subpath': subPath + qs,
  };
  if (asTeacherId) headers['x-as-teacher'] = String(asTeacherId);

  const res = await fetch(url, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok || data?.success === false) {
    const err = new Error(data?.error || 'Request failed') as any;
    err.response = { status: res.status, data };
    throw err;
  }
  return { data, status: res.status, statusText: res.statusText, headers: {}, config: {} as any };
}

function createApiClient() {
  const handler: ProxyHandler<object> = {
    get(_, method: string) {
      return async (path: string, dataOrConfig?: any, config?: any) => {
        if (method === 'request') return;
        const body = (method === 'post' || method === 'put' || method === 'patch') ? dataOrConfig : undefined;
        const params = (method === 'get' || method === 'delete') ? dataOrConfig : config?.params;
        return callFn(method.toUpperCase(), path, body, params);
      };
    },
  };
  return new Proxy({}, handler) as any;
}

const apiClient = createApiClient();

export { apiClient };
export default apiClient;