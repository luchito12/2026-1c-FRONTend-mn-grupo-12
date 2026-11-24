const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error { constructor(status, message, details = null) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; } }
export function apiUrl(path) { return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`; }
export async function http(path, options = {}) {
  const headers = new Headers({ Accept: 'application/json', ...options.headers });
  const hasJsonBody = options.body != null && typeof options.body !== 'string';
  if (hasJsonBody) headers.set('Content-Type', 'application/json');
  let response;
  try { response = await fetch(apiUrl(path), { ...options, body: hasJsonBody ? JSON.stringify(options.body) : options.body, headers, credentials: 'include' }); }
  catch { throw new ApiError(0, 'No se pudo conectar con la API. Verificá que el backend esté disponible.'); }
  const raw = await response.text(); let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw || null; }
  if (response.ok) return data;
  const serverMessage = typeof data === 'object' ? data?.message || data?.error : data;
  const defaults = { 401: 'Tu sesión expiró. Volvé a iniciar sesión.', 403: 'No tenés permisos para realizar esta acción.', 404: 'El recurso solicitado no existe o la API aún no expone esta operación.', 409: 'La operación entra en conflicto con el estado actual.' };
  throw new ApiError(response.status, serverMessage || defaults[response.status] || `La API respondió ${response.status}.`, data);
}
