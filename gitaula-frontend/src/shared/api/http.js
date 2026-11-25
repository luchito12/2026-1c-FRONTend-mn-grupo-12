import { errorMessage } from '../lib/errorMessage';
import { isClosingSession, sessionGeneration, trackRequest } from './sessionBoundary';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const BUSINESS_API_BASE_URL = (import.meta.env.VITE_BUSINESS_API_BASE_URL || '').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
export function businessApiUrl(path) {
  return `${BUSINESS_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
async function request(url, options = {}) {
  if (isClosingSession() && !options.sessionRequest)
    throw new ApiError(0, 'Se está cerrando la sesión. Esperá a que termine.');
  const epoch = sessionGeneration();
  const controller = new AbortController();
  const timeout = AbortSignal.timeout(options.timeoutMs ?? (options.method ? 120_000 : 20_000));
  const signal = AbortSignal.any([
    controller.signal,
    timeout,
    ...(options.signal ? [options.signal] : []),
  ]);
  const untrack = trackRequest(controller);
  const headers = new Headers({ Accept: 'application/json', ...options.headers });
  const hasJsonBody = options.body != null && typeof options.body !== 'string';
  if (hasJsonBody) headers.set('Content-Type', 'application/json');
  const {
    sessionRequest: _sessionRequest,
    suppressUnauthorized: _suppressUnauthorized,
    timeoutMs: _timeoutMs,
    ...fetchOptions
  } = options;
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal,
      body: hasJsonBody ? JSON.stringify(options.body) : options.body,
      headers,
      credentials: 'include',
    });
    const raw = await response.text();
    if (epoch !== sessionGeneration() || signal.aborted)
      throw new DOMException('La sesión cambió.', 'AbortError');
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      throw new ApiError(response.status, 'El servidor devolvió una respuesta no válida.');
    }
    if (response.ok) return data;
    if (response.status === 401 && !options.suppressUnauthorized)
      window.dispatchEvent(new Event('gitaula:unauthorized'));
    const defaults = {
      400: 'Revisá los datos ingresados.',
      401: 'Tu sesión expiró. Volvé a iniciar sesión.',
      403: 'No tenés permisos para realizar esta acción.',
      404: 'No encontramos el recurso solicitado.',
      409: 'La operación entra en conflicto con el estado actual.',
    };
    throw new ApiError(
      response.status,
      errorMessage(
        data?.message || data?.error,
        defaults[response.status] || 'No pudimos procesar la solicitud. Reintentá.',
      ),
      data,
    );
  } catch (error) {
    if (timeout.aborted && epoch === sessionGeneration())
      throw new ApiError(
        0,
        'La solicitud demoró demasiado. Comprobá el estado antes de volver a intentar.',
      );
    if (signal.aborted || epoch !== sessionGeneration())
      throw new DOMException('Solicitud cancelada.', 'AbortError');
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'No se pudo conectar con la API. Verificá la conexión y reintentá.');
  } finally {
    untrack();
  }
}
export function http(path, options = {}) {
  return request(apiUrl(path), options);
}
export function businessHttp(path, options = {}) {
  return request(businessApiUrl(path), options);
}
