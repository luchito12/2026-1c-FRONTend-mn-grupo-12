import { http } from './http.js';
export const githubApi = { repository: (teamId) => http(`/repos/${teamId}`), events: () => http('/webhooks/github') };
