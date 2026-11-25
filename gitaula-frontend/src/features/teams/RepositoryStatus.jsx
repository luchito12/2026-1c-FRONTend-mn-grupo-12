import { Alert, Button, Stack, Typography } from '@mui/material';
const states = {
  COMPLETO:
    'Repositorio listo. Invitaciones o accesos procesados; cada integrante debe aceptar su invitación si está pendiente.',
  ERROR: 'No se pudo completar el repositorio o sus accesos.',
  INVITACIONES_INCOMPLETAS:
    'Repositorio creado; hay invitaciones o accesos pendientes de sincronizar.',
  REPO_CREADO: 'Repositorio creado; sincronización de accesos incompleta.',
  PENDIENTE: 'Creación del repositorio pendiente.',
};
export function RepositoryStatus({ team, action }) {
  if (team.teamStatus !== 'CONFIRMED')
    return (
      <Typography variant="body2" color="text.secondary">
        El repositorio se intentará crear al confirmar el equipo.
      </Typography>
    );
  const status = team.repoProvisioningStatus;
  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        {status
          ? (states[status] ?? `Estado de repositorio no reconocido: ${status}`)
          : 'Repositorio todavía sin crear'}
      </Typography>
      {team.repoError && <Alert severity="warning">{team.repoError}</Alert>}
      {team.repoUrl && (
        <Button
          component="a"
          href={team.repoUrl}
          target="_blank"
          rel="noreferrer"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        >
          Abrir repositorio
        </Button>
      )}
      {action}
    </Stack>
  );
}
