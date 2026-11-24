import { http } from './http.js';
export const deliveriesApi = { get: (id) => http(`/entregas/${id}`) };
