import { z } from 'zod';
import { businessHttp } from '../../shared/api/http.js';
import {
  parseContract,
  parseId,
  teamSchema,
  roleSchema,
  idSchema,
} from '../../shared/api/contracts';
const detail = teamSchema.extend({
  projectId: idSchema,
  commissionId: idSchema,
  currentRole: roleSchema,
  members: z.array(z.object({ userId: idSchema, githubLogin: z.string() })),
  canLeave: z.boolean(),
  canConfirm: z.boolean(),
  canReassign: z.boolean(),
  otherTeams: z.array(z.object({ teamId: idSchema, teamName: z.string() })),
});
export const teamsApi = {
  get: async (id, options) =>
    parseContract(detail, await businessHttp(`/teams/${parseId(id)}`, options)),
  create: (id, team) =>
    businessHttp(`/projects/${parseId(id)}/teams`, { method: 'POST', body: team }),
  join: (id) => businessHttp(`/teams/${parseId(id)}/members/me`, { method: 'PUT' }),
  leave: (id) => businessHttp(`/teams/${parseId(id)}/members/me`, { method: 'DELETE' }),
  confirm: (id) => businessHttp(`/teams/${parseId(id)}/confirmation`, { method: 'POST' }),
  provisionRepository: (id) => businessHttp(`/teams/${parseId(id)}/repository`, { method: 'POST' }),
  reassign: (id, userId, destinationTeamId) =>
    businessHttp(`/teams/${parseId(id)}/members/${parseId(userId)}`, {
      method: 'PATCH',
      body: { teamId: parseId(destinationTeamId) },
    }),
};
