import { http } from './http.js';
export const githubApi = { repository: (teamId) => http(`/repos/${teamId}`), provision: (request) => http('/repos', { method: 'POST', body: request }), events: () => http('/webhooks/github') };
