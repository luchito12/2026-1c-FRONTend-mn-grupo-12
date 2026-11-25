import { useQuery } from '@tanstack/react-query';
import { projectsApi } from './api.js';
import { academicApi } from '../../shared/api/academic.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
export const useProject = (id) =>
  useQuery({
    queryKey: keys.project(id),
    queryFn: ({ signal }) => projectsApi.get(id, { signal }),
    enabled: Boolean(id),
  });
export const useProjects = (id) =>
  useQuery({
    queryKey: keys.projects(id),
    queryFn: ({ signal }) => projectsApi.list(id, { signal }),
    enabled: Boolean(id),
  });
export const useCreateProject = (id, onSuccess) =>
  useDomainMutation(
    (body) => projectsApi.create(id, body),
    invalidations.project,
    'Trabajo práctico creado.',
    onSuccess,
  );
export const useUpdateProject = (id, onSuccess) =>
  useDomainMutation(
    (body) => projectsApi.update(id, body),
    invalidations.project,
    'Trabajo práctico actualizado.',
    onSuccess,
  );
export const useRubric = (id) =>
  useQuery({
    queryKey: keys.rubric(id),
    queryFn: ({ signal }) => academicApi.rubric(id, { signal }),
  });
export const useSaveRubric = (id, onSuccess) =>
  useDomainMutation(
    (body) => academicApi.saveRubric(id, body),
    invalidations.rubric,
    'Rúbrica guardada.',
    onSuccess,
  );
