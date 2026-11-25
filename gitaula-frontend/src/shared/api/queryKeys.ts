type Id = string | number | undefined;
const resource = (name: string, id: Id) => [name, String(id)] as const;
export const keys = {
  session: ['session'] as const,
  commissions: (id: Id, filters: { page: number; size: number; q: string }) =>
    ['commissions', id, filters] as const,
  commission: (id: Id) => resource('commission', id),
  participants: (id: Id) => resource('participants', id),
  projects: (id: Id) => resource('projects', id),
  project: (id: Id) => resource('project', id),
  team: (id: Id) => resource('team', id),
  delivery: (id: Id) => resource('delivery', id),
  rubric: (id: Id) => resource('rubric', id),
  dashboard: ['dashboard'] as const,
  notifications: (filters: { page: number; size: number; q: string; status: string }) =>
    ['notifications', filters] as const,
  events: ['github-events'] as const,
  repository: (id: Id) => resource('repository', id),
};
export const invalidations = {
  commissions: [['commissions']],
  participant: [
    ['commissions'],
    ['commission'],
    ['participants'],
    ['project'],
    ['team'],
    ['delivery'],
    ['dashboard'],
  ],
  project: [['projects'], ['project'], ['dashboard']],
  team: [['project'], ['team'], ['delivery'], ['repository'], ['dashboard'], ['notifications']],
  rubric: [['rubric'], ['delivery']],
  delivery: [['delivery'], ['project'], ['dashboard'], ['notifications']],
  notification: [['notifications'], ['dashboard']],
} as const;
