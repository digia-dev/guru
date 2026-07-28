import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase, invokeFunction } from '../lib/supabase';

const FUNCTIONS_MAP: Record<string, string> = {
  auth: 'auth',
  students: 'students',
  classes: 'classes',
  attendance: 'attendance',
  grades: 'grades',
  tabungan: 'tabungan',
  'kas-umum': 'kas-umum',
  materi: 'materi',
  agenda: 'agenda',
  dashboard: 'dashboard',
  search: 'search',
  admin: 'admin',
  notifications: 'notifications',
  semesters: 'semesters',
  'calendar-events': 'calendar-events',
};

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const silentClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onLogout: (() => void) | null = null;
let asTeacherId: number | null = null;

export function setAsTeacher(id: number | null) {
  asTeacherId = id;
}

export function getAsTeacher(): number | null {
  return asTeacherId;
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('refreshToken');
}

export function getStoredRefreshToken(): string | null {
  return refreshToken || localStorage.getItem('refreshToken');
}

export function setOnLogout(callback: () => void) {
  onLogout = callback;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (asTeacherId && config.params) {
    config.params.as_teacher = asTeacherId;
  } else if (asTeacherId) {
    config.params = { as_teacher: asTeacherId };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = getStoredRefreshToken();
        if (!token) throw new Error('No refresh token');
        const { data } = await silentClient.post('/auth/refresh', { refreshToken: token });
        if (data.success) {
          setTokens(data.data.accessToken, data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        clearTokens();
        if (onLogout) onLogout();
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };

export async function apiCall(method: string, path: string, body?: any, params?: any) {
  const [, group, ...rest] = path.split('/');
  const funcName = FUNCTIONS_MAP[group];
  const subPath = rest.length ? '/' + rest.join('/') : '';
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';

  const { data, error } = await supabase.functions.invoke(funcName, {
    method: method as any,
    body: body,
    headers: { 'x-subpath': subPath + qs },
  });

  if (error) throw error;
  return data;
}

export default apiClient;