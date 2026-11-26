import { useQuery } from '@tanstack/react-query';
import { commissionsApi } from './api.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
import { useCurrentUser } from '../auth/useCurrentUser.js';
export function useCommissions({ page = 0, size = 10, q = '', role } = {}) {
  const filters = { page, size, q, role };
  const user = useCurrentUser();
  return useQuery({
    queryKey: keys.commissions(user?.userId, filters),
    queryFn: ({ signal }) => commissionsApi.list(user.userId, filters, { signal }),
    enabled: Boolean(user?.userId),
  });
}
export const useCommission = (id) =>
  useQuery({
    queryKey: keys.commission(id),
    queryFn: ({ signal }) => commissionsApi.get(id, { signal }),
    enabled: Boolean(id),
  });
export const useParticipants = (id, enabled = true) =>
  useQuery({
    queryKey: keys.participants(id),
    queryFn: ({ signal }) => commissionsApi.participants(id, { signal }),
    enabled: Boolean(id) && enabled,
  });
export function useCreateCommission(onSuccess) {
  const user = useCurrentUser();
  return useDomainMutation(
    (values) => commissionsApi.create({ ...values, creatorUserId: user.userId }),
    invalidations.commissions,
    'Comisión creada.',
    onSuccess,
  );
}
export const useEnrollParticipant = (id, onSuccess) =>
  useDomainMutation(
    (body) => commissionsApi.enroll(id, body),
    invalidations.participant,
    'Participante agregado.',
    onSuccess,
  );
export const useUpdateParticipant = (id, onSuccess) =>
  useDomainMutation(
    ({ userId, body }) => commissionsApi.updateParticipant(id, userId, body),
    invalidations.participant,
    'Participación actualizada.',
    onSuccess,
  );
