import { apiUrl, http } from '../../shared/api/http.js';
import { normalizeSession } from '../../shared/api/contracts';
export const authApi = {
  me: async ({ signal } = {}) =>
    normalizeSession(
      await http('/auth/me', { signal, sessionRequest: true, suppressUnauthorized: true }),
    ),
  exchange: (loginCode) =>
    http('/auth/exchange', {
      method: 'POST',
      body: { loginCode },
      sessionRequest: true,
      suppressUnauthorized: true,
    }),
  logout: () =>
    http('/auth/logout', { method: 'POST', sessionRequest: true, suppressUnauthorized: true }),
  loginUrl: () => apiUrl('/auth/github/login'),
};
