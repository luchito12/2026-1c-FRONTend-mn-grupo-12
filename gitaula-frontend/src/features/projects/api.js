import { z } from 'zod';
import { businessHttp } from '../../shared/api/http.js';
import {
  parseContract,
  parseId,
  projectSchema,
  projectSummarySchema,
} from '../../shared/api/contracts';
export const projectsApi = {
  list: async (id, options) =>
    parseContract(
      z.array(projectSummarySchema),
      await businessHttp(`/commissions/${parseId(id)}/projects`, options),
    ),
  create: (id, project) =>
    businessHttp(`/commissions/${parseId(id)}/projects`, { method: 'POST', body: project }),
  get: async (id, options) =>
    parseContract(projectSchema, await businessHttp(`/projects/${parseId(id)}`, options)),
  update: (id, project) =>
    businessHttp(`/projects/${parseId(id)}`, { method: 'PATCH', body: project }),
};
