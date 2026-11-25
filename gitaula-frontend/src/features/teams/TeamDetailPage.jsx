import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import {
  useTeam,
  useLeaveTeam,
  useConfirmTeam,
  useReassignMember,
  useProvisionRepository,
} from './hooks.js';
import { RepositoryStatus } from './RepositoryStatus.jsx';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { PageHeader } from '../../shared/ui/PageHeader.jsx';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { calendarDate } from '../../shared/lib/domain';
export function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [action, setAction] = useState(null);
  const team = useTeam(teamId);
  const leave = useLeaveTeam(teamId, () => navigate(`/tps/${team.data.projectId}`));
  const confirm = useConfirmTeam(() => setAction(null));
  const move = useReassignMember(teamId, () => setAction(null));
  const provision = useProvisionRepository();
  if (team.isPending) return <LoadingState />;
  if (team.isError && (!team.data || [403, 404].includes(team.error.status)))
    return <ErrorState error={team.error} retry={team.refetch} />;
  const data = team.data;
  const activeMutation =
    action?.type === 'leave' ? leave : action?.type === 'move' ? move : confirm;
  function confirmAction() {
    if (action.type === 'leave') leave.mutate();
    else if (action.type === 'move')
      move.mutate({ userId: action.userId, destination: action.destination });
    else confirm.mutate(data.teamId);
  }
  return (
    <Stack spacing={3}>
      <QueryWarning query={team} />
      <PageHeader
        eyebrow="EQUIPO"
        title={data.teamName}
        actions={<StatusBadge value={data.teamStatus} />}
      >
        Límite de equipos: {calendarDate(data.deadline)} (UTC)
      </PageHeader>
      <Button component={Link} to={`/tps/${data.projectId}`} sx={{ alignSelf: 'flex-start' }}>
        Volver al TP
      </Button>
      <Typography variant="h2">Integrantes</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          {data.members.map((member) => (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              key={member.userId}
              sx={{ alignItems: { sm: 'center' } }}
            >
              <Typography sx={{ flex: 1 }}>@{member.githubLogin}</Typography>
              {data.canReassign && data.otherTeams.length > 0 && (
                <TextField
                  select
                  label={`Mover a ${member.githubLogin}`}
                  value=""
                  sx={{ maxWidth: 300 }}
                  onChange={(event) => {
                    move.reset();
                    setAction({
                      type: 'move',
                      userId: member.userId,
                      login: member.githubLogin,
                      destination: event.target.value,
                    });
                  }}
                >
                  <MenuItem value="" disabled>
                    Elegí un equipo destino
                  </MenuItem>
                  {data.otherTeams.map((t) => (
                    <MenuItem key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>
      <Typography variant="h2">Repositorio y sincronización de accesos</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <RepositoryStatus
          team={data}
          action={
            data.currentRole === 'TEACHER' &&
            data.teamStatus === 'CONFIRMED' &&
            data.repoProvisioningStatus !== 'COMPLETO' && (
              <Button
                disabled={provision.isPending || provision.isUncertain}
                onClick={() => provision.mutate(data.teamId)}
              >
                {provision.isPending
                  ? 'Procesando repositorio…'
                  : data.repoProvisioningStatus
                    ? 'Reintentar repositorio y accesos'
                    : 'Crear repositorio'}
              </Button>
            )
          }
        />
        <MutationError mutation={provision} />
      </Paper>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
        {data.canLeave && (
          <Button
            onClick={() => {
              leave.reset();
              setAction({ type: 'leave' });
            }}
          >
            Salir del equipo
          </Button>
        )}
        {data.canConfirm && (
          <Button
            variant="contained"
            onClick={() => {
              confirm.reset();
              setAction({ type: 'confirm' });
            }}
          >
            Confirmar equipo
          </Button>
        )}
        {data.deliveryId && (
          <Button component={Link} to={`/entregas/${data.deliveryId}`}>
            Ver entrega
          </Button>
        )}
      </Stack>
      <ConfirmDialog
        open={Boolean(action)}
        title={
          action?.type === 'leave'
            ? '¿Salir del equipo?'
            : action?.type === 'move'
              ? `¿Reasignar a @${action.login}?`
              : '¿Confirmar equipo?'
        }
        busy={activeMutation.isPending}
        onCancel={() => setAction(null)}
        onConfirm={confirmAction}
        error={<MutationError mutation={activeMutation} />}
      >
        {action?.type === 'leave'
          ? 'Tu lugar quedará disponible mientras el equipo se está formando.'
          : action?.type === 'move'
            ? 'El integrante pasará al equipo seleccionado. El servidor intentará actualizar su acceso a los repositorios involucrados; revisá los estados de ambos equipos.'
            : 'Se creará la entrega y se intentará generar el repositorio desde el template configurado.'}
      </ConfirmDialog>
    </Stack>
  );
}
