import { businessHttp } from '../../shared/api/http.js';
import { parseContract, parseId, deliverySchema } from '../../shared/api/contracts';
export const deliveriesApi = {
  get: async (id, options) =>
    parseContract(deliverySchema, await businessHttp(`/deliveries/${parseId(id)}`, options)),
  update: (id, status) =>
    businessHttp(`/deliveries/${parseId(id)}`, { method: 'PATCH', body: { status } }),
  evaluate: (id, body) =>
    businessHttp(`/deliveries/${parseId(id)}/evaluation`, { method: 'PUT', body }),
};
