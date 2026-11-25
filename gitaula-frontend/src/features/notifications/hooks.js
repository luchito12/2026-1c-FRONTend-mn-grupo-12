import { useQuery } from '@tanstack/react-query';
import { academicApi } from '../../shared/api/academic.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
export const useNotifications = ({ page = 0, size = 10, q = '', status = 'ALL' } = {}) =>
  useQuery({
    queryKey: keys.notifications({ page, size, q, status }),
    queryFn: ({ signal }) => academicApi.notifications({ page, size, q, status }, { signal }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
export const useReadNotification = () =>
  useDomainMutation(
    (id) => academicApi.readNotification(id),
    invalidations.notification,
    'Notificación marcada como leída.',
  );
