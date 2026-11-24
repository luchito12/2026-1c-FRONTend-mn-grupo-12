import { http } from './http.js';
export const projectsApi = { list: (commissionId) => http(`/comisiones/${commissionId}/tps`), create: (commissionId, project) => http(`/comisiones/${commissionId}/tps`, { method: 'POST', body: project }), get: (id) => http(`/tps/${id}`) };
