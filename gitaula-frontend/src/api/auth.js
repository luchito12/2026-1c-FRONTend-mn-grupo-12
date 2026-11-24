import { apiUrl, http } from './http.js';
export const authApi = { me: () => http('/auth/me'), exchange: (loginCode) => http('/auth/exchange', { method: 'POST', body: { loginCode } }), logout: () => http('/auth/logout', { method: 'POST' }), loginUrl: () => apiUrl('/auth/github/login') };
