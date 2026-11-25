import { useQuery } from '@tanstack/react-query';
import { deliveriesApi } from './api.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
export const useDelivery = (id) =>
  useQuery({
    queryKey: keys.delivery(id),
    queryFn: ({ signal }) => deliveriesApi.get(id, { signal }),
    enabled: Boolean(id),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
export const useSubmitDelivery = (id) =>
  useDomainMutation(
    (status) => deliveriesApi.update(id, status),
    invalidations.delivery,
    'Estado de revisión actualizado.',
  );
export const useEvaluateDelivery = (id) =>
  useDomainMutation(
    (body) => deliveriesApi.evaluate(id, body),
    invalidations.delivery,
    'Evaluación guardada.',
  );
