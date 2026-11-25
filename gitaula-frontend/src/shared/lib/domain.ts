export const labels: Record<string, string> = {
  TEACHER: 'Docente',
  STUDENT: 'Alumno',
  FORMING: 'Formándose',
  CONFIRMED: 'Confirmado',
  CREATED: 'Repositorio creado',
  IN_PROGRESS: 'En progreso',
  SUBMITTED: 'Lista para revisión',
  REVIEWING: 'En revisión',
  CHANGES_REQUESTED: 'Cambios solicitados',
  APPROVED: 'Aprobada',
  LATE: 'Fuera de término',
  MANUAL_TEACHER: 'Asignación docente',
  SELF_ORGANIZED_STUDENTS: 'Autoorganización',
  ACTIVE: 'Activo',
  WITHDRAWN: 'Retirado',
  ANNUAL: 'Anual',
  FIRST_TERM: 'Primer cuatrimestre',
  SECOND_TERM: 'Segundo cuatrimestre',
  GROUP: 'Grupal',
  INDIVIDUAL: 'Individual',
};
export const label = (value: string | null | undefined) =>
  value ? (labels[value] ?? `Estado desconocido (${value})`) : 'Sin información';
export function calendarDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Fecha inválida';
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}
export function dateTime(value: string | null | undefined) {
  if (!value) return 'Sin actividad registrada';
  // JDBC timestamps without offset represent UTC per backend configuration.
  const date = new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return `${new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short' }).format(date)} (Argentina)`;
}
export function internalPath(value: unknown, fallback = '/') {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\s]/.test(value)
  )
    return fallback;
  const path = new URL(value, 'https://gitaula.internal');
  if (
    path.origin !== 'https://gitaula.internal' ||
    /^\/(login|auth\/callback)(\/|$)/.test(path.pathname)
  )
    return fallback;
  return `${path.pathname}${path.search}${path.hash}`;
}
