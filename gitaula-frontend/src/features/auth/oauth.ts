import { authApi } from './api';
import { normalizeSession, type SessionUser } from '../../shared/api/contracts';
import { internalPath } from '../../shared/lib/domain';
const key = 'gitaula-return-path';
export function saveReturnPath(value: unknown) {
  try {
    sessionStorage.setItem(key, internalPath(value));
  } catch {
    /* Storage is optional. */
  }
}
export function takeReturnPath() {
  try {
    const path = internalPath(sessionStorage.getItem(key));
    sessionStorage.removeItem(key);
    return path;
  } catch {
    return '/';
  }
}
// StrictMode remounts attach to one exchange. Entries are removed when settled;
// the URL is scrubbed immediately and the page keeps its own promise reference.
const exchanges = new Map<string, Promise<SessionUser>>();
export function completeOAuth(code: string): Promise<SessionUser> {
  const existing = exchanges.get(code);
  if (existing) return existing;
  const request = (async () => {
    try {
      await authApi.exchange(code);
    } catch {
      // The server may have issued the cookie despite a lost exchange response.
      // Check /me; never automatically replay a one-time code.
      return normalizeSession(await authApi.me());
    }
    return normalizeSession(await authApi.me());
  })();
  exchanges.set(code, request);
  void request
    .finally(() => {
      setTimeout(() => exchanges.delete(code), 0);
    })
    .catch(() => {});
  return request;
}
