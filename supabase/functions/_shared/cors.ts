export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-subpath, x-as-teacher',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders } });
  }
  return null;
}

export function getPath(req: Request): string {
  return req.headers.get('x-subpath') || '';
}

export function getSearchParams(req: Request): URLSearchParams {
  const subpath = getPath(req);
  return new URLSearchParams(subpath.split('?')[1] || '');
}

export function getLastPathSegment(req: Request): string {
  const path = getPath(req).split('?')[0];
  const parts = path.split('/').filter(Boolean);
  return parts.pop() || '';
}