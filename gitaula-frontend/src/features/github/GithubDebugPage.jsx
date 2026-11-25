import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { githubApi } from './api.js';
import { useTeam } from '../teams/hooks.js';
import { keys, invalidations } from '../../shared/api/queryKeys';
import { useDomainMutation } from '../../shared/api/useDomainMutation';
import { parseId } from '../../shared/api/contracts';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { dateTime } from '../../shared/lib/domain';
const blank = {
  targetOrg: '',
  templateOwner: '',
  templateRepo: '',
  repoName: '',
  githubUsernames: '',
};
export function GithubDebugPage() {
  const [teamId, setTeamId] = useState('');
  const [requestedId, setRequestedId] = useState(null);
  const [validation, setValidation] = useState('');
  const [values, setValues] = useState(blank);
  const events = useQuery({
    queryKey: keys.events,
    queryFn: ({ signal }) => githubApi.events({ signal }),
  });
  const team = useTeam(requestedId);
  const repository = useQuery({
    queryKey: keys.repository(requestedId),
    queryFn: ({ signal }) => githubApi.repository(requestedId, { signal }),
    enabled: Boolean(requestedId) && team.isSuccess,
  });
  const provision = useDomainMutation(
    (body) => githubApi.provision(body),
    [...invalidations.team, keys.events],
    'Solicitud procesada. Revisá el estado del repositorio.',
  );
  const dirty = Object.values(values).some(Boolean);
  useUnsavedChanges(dirty && !provision.isSuccess);
  function lookup(event) {
    event.preventDefault();
    try {
      setRequestedId(parseId(teamId));
      setValidation('');
    } catch {
      setValidation('Ingresá un ID de equipo entero y mayor que cero.');
    }
  }
  function submit(event) {
    event.preventDefault();
    if (!provision.isPending)
      provision.mutate({
        ...values,
        teamId: requestedId,
        githubUsernames: values.githubUsernames
          .split(/[\s,]+/)
          .map((name) => name.trim())
          .filter(Boolean),
      });
  }
  return (
    <Stack spacing={3}>
      <PageHeader eyebrow="HERRAMIENTA SECUNDARIA" title="Diagnóstico de GitHub">
        Consultá el estado técnico de un equipo autorizado. Para el recorrido habitual, usá la
        pantalla del equipo.
      </PageHeader>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack component="form" spacing={2} onSubmit={lookup}>
          <Typography variant="h2">Consultar repositorio</Typography>
          <TextField
            label="ID de equipo"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <Button type="submit" variant="contained">
            Consultar repositorio
          </Button>
          {validation && <Alert severity="error">{validation}</Alert>}
        </Stack>
      </Paper>
      {requestedId && (team.isPending || repository.isFetching) && <LoadingState />}
      {team.isError && <ErrorState error={team.error} retry={team.refetch} />}
      {repository.isError && <ErrorState error={repository.error} retry={repository.refetch} />}
      {repository.data && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h2">Estado: {repository.data.status}</Typography>
          <Typography>
            Webhook: {repository.data.webhookConfigured ? 'Configurado' : 'Pendiente'}
          </Typography>
          {repository.data.repoUrl && (
            <Button component="a" href={repository.data.repoUrl} target="_blank" rel="noreferrer">
              Abrir repositorio
            </Button>
          )}
          {repository.data.invitations?.map((invitation) => (
            <Typography key={invitation.username}>
              {invitation.username} · {invitation.status} {invitation.errorDetail}
            </Typography>
          ))}
        </Paper>
      )}
      {team.data?.currentRole === 'TEACHER' && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack component="form" spacing={3} onSubmit={submit}>
            <Typography variant="h2">Aprovisionamiento manual de {team.data.teamName}</Typography>
            <Alert severity="warning">
              Esta acción puede crear un repositorio y enviar invitaciones reales en GitHub.
              Verificá la configuración antes de continuar.
            </Alert>
            {Object.entries({
              targetOrg: 'Organización destino',
              templateOwner: 'Owner del template',
              templateRepo: 'Repositorio template',
              repoName: 'Nombre del repositorio',
              githubUsernames: 'Usuarios GitHub separados por coma',
            }).map(([field, title]) => (
              <TextField
                key={field}
                label={title}
                required
                value={values[field]}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
              />
            ))}
            <MutationError mutation={provision} />
            <Button
              type="submit"
              variant="contained"
              disabled={provision.isPending || provision.isUncertain}
            >
              {provision.isPending ? 'Procesando…' : 'Aprovisionar repositorio'}
            </Button>
          </Stack>
        </Paper>
      )}
      <Typography variant="h2">Eventos recientes autorizados</Typography>
      {events.isPending ? (
        <LoadingState />
      ) : events.isError ? (
        <ErrorState error={events.error} retry={events.refetch} />
      ) : events.data.length ? (
        events.data.map((event) => (
          <Paper key={event.deliveryId} variant="outlined" sx={{ p: 2 }}>
            <Typography>
              {event.eventType} · {event.repoFullName}
            </Typography>
            <Typography color="text.secondary">{dateTime(event.receivedAt)}</Typography>
          </Paper>
        ))
      ) : (
        <Typography color="text.secondary">Sin eventos.</Typography>
      )}
    </Stack>
  );
}
