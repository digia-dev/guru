import { supabase } from '../lib/supabase';

const FUNCTIONS_MAP: Record<string, string> = {
  auth: 'auth', students: 'students', classes: 'classes', attendance: 'attendance',
  grades: 'grades', tabungan: 'tabungan', 'kas-umum': 'kas-umum', materi: 'materi',
  agenda: 'agenda', dashboard: 'dashboard', search: 'search', admin: 'admin',
  notifications: 'notifications', semesters: 'semesters', 'calendar-events': 'calendar-events',
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onLogout: (() => void) | null = null;
let asTeacherId: number | null = null;

export function setAsTeacher(id: number | null) { asTeacherId = id; }
export function getAsTeacher(): number | null { return asTeacherId; }

export function setTokens(access: string, refresh: string) {
  accessToken = access; refreshToken = refresh;
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null; refreshToken = null;
  localStorage.removeItem('refreshToken');
}

export function getStoredRefreshToken(): string | null {
  return refreshToken || localStorage.getItem('refreshToken');
}

export function setOnLogout(callback: () => void) { onLogout = callback; }

async function callFn(method: string, path: string, body?: any, params?: any) {
  const [, group, ...rest] = path.split('/');
  const funcName = FUNCTIONS_MAP[group];
  if (!funcName) throw new Error(`Unknown API route: ${path}`);
  const subPath = rest.length ? '/' + rest.join('/') : '';
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';

  const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
  const { data, error } = await supabase.functions.invoke(funcName, {
    method: method as any,
    body,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'x-subpath': subPath + qs,
      ...(asTeacherId ? { 'x-as-teacher': String(asTeacherId) } : {}),
    },
  });

  if (error) throw new Error(error.message);
  if (data && data.success === false) {
    const err = new Error(data.error || 'Request failed') as any;
    err.response = { status: data.status || 400, data };
    throw err;
  }
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as any };
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