import { useQuery } from '@tanstack/react-query';
import { teamsApi } from './api.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
export const useTeam = (id) =>
  useQuery({
    queryKey: keys.team(id),
    queryFn: ({ signal }) => teamsApi.get(id, { signal }),
    enabled: Boolean(id),
  });
export const useCreateTeam = (id, onSuccess) =>
  useDomainMutation(
    (body) => teamsApi.create(id, body),
    invalidations.team,
    'Equipo creado. Revisá su estado de repositorio.',
    onSuccess,
  );
export const useConfirmTeam = (onSuccess) =>
  useDomainMutation(
    (id) => teamsApi.confirm(id),
    invalidations.team,
    'Equipo confirmado. Revisá el estado del repositorio.',
    onSuccess,
  );
export const useProvisionRepository = () =>
  useDomainMutation(
    (id) => teamsApi.provisionRepository(id),
    invalidations.team,
    'Solicitud procesada. Revisá repositorio e invitaciones.',
  );
export const useJoinTeam = () =>
  useDomainMutation((id) => teamsApi.join(id), invalidations.team, 'Te uniste al equipo.');
export const useLeaveTeam = (id, onSuccess) =>
  useDomainMutation(() => teamsApi.leave(id), invalidations.team, 'Saliste del equipo.', onSuccess);
export const useReassignMember = (id, onSuccess) =>
  useDomainMutation(
    ({ userId, destination }) => teamsApi.reassign(id, userId, destination),
    invalidations.team,
    'Integrante reasignado. Revisá la sincronización de accesos.',
    onSuccess,
  );
