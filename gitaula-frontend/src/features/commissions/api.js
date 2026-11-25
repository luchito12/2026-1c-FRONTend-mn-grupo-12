import { z } from 'zod';
import { businessHttp } from '../../shared/api/http.js';
import {
  commissionSchema,
  pageSchema,
  participantSchema,
  parseContract,
  parseId,
} from '../../shared/api/contracts';
export const commissionsApi = {
  list: async (userId, { page = 0, size = 10, q = '' } = {}, options) =>
    parseContract(
      pageSchema(commissionSchema),
      await businessHttp(
        `/commissions?${new URLSearchParams({ userId: String(parseId(userId)), page: String(page), size: String(size), q })}`,
        options,
      ),
    ),
  create: (commission) => businessHttp('/commissions', { method: 'POST', body: commission }),
  get: async (id, options) =>
    parseContract(commissionSchema, await businessHttp(`/commissions/${parseId(id)}`, options)),
  participants: async (id, options) =>
    parseContract(
      z.array(participantSchema),
      await businessHttp(`/commissions/${parseId(id)}/participants`, options),
    ),
  enroll: (id, enrollment) =>
    businessHttp(`/commissions/${parseId(id)}/enrollments`, { method: 'POST', body: enrollment }),
  updateParticipant: (id, userId, participant) =>
    businessHttp(`/commissions/${parseId(id)}/participants/${parseId(userId)}`, {
      method: 'PATCH',
      body: participant,
    }),
};
