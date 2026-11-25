import { z } from 'zod';
import { businessHttp, http } from './http.js';
import {
  parseContract,
  parseId,
  idSchema,
  notificationSchema,
  pageSchema,
  projectSummarySchema,
  roleSchema,
  statusSchema,
  rubricSchema,
} from './contracts';
const dashboardSchema = z.object({
  projects: z.array(
    projectSummarySchema.extend({
      role: roleSchema,
      commissionName: z.string(),
      dueDate: z.string().nullable(),
    }),
  ),
  deliveries: z.array(
    z.object({
      id: idSchema,
      status: statusSchema,
      projectTitle: z.string(),
      teamName: z.string(),
      dueDate: z.string().nullable(),
    }),
  ),
  unreadNotificationCount: z.number().int().nonnegative(),
});
export const academicApi = {
  dashboard: async (options) => parseContract(dashboardSchema, await http('/dashboard', options)),
  notifications: async ({ page = 0, size = 10, q = '', status = 'ALL' } = {}, options) =>
    parseContract(
      pageSchema(notificationSchema),
      await http(
        `/notifications?${new URLSearchParams({ page: String(page), size: String(size), q, status })}`,
        options,
      ),
    ),
  readNotification: (id) => http(`/notifications/${parseId(id)}/read`, { method: 'PATCH' }),
  rubric: async (id, options) =>
    parseContract(
      rubricSchema.nullable(),
      await businessHttp(`/projects/${parseId(id)}/rubric`, options),
    ),
  saveRubric: (id, body) =>
    businessHttp(`/projects/${parseId(id)}/rubric`, { method: 'PUT', body }),
};
