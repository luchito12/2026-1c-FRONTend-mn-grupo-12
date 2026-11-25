import { http } from '../../shared/api/http.js';
import { parseId } from '../../shared/api/contracts';
export const githubApi = {
  repository: (teamId, options) => http(`/repos/${parseId(teamId)}`, options),
  provision: (request) =>
    http('/repos', { method: 'POST', body: { ...request, teamId: parseId(request.teamId) } }),
  events: (options) => http('/webhooks/github', options),
};
