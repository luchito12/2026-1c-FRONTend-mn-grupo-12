import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useConfirmTeam, useJoinTeam, useProvisionRepository } from './hooks.js';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { RepositoryStatus } from './RepositoryStatus.jsx';
export function TeamsTable({ teams, isTeacher, canJoin = false }) {
  return teams.length ? (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>
        Deslizá la tabla para ver repositorio y acciones.
      </Typography>
      <TableContainer
        role="region"
        aria-label="Tabla de equipos desplazable"
        tabIndex={0}
        component={Paper}
        variant="outlined"
      >
        <Table sx={{ minWidth: 720 }} aria-label="Equipos del trabajo práctico">
          <TableHead>
            <TableRow>
              <TableCell>Equipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Repositorio y accesos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TeamRow key={team.teamId} team={team} isTeacher={isTeacher} canJoin={canJoin} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  ) : (
    <EmptyState title="Aún no hay equipo">
      Creá uno si la modalidad y el plazo del TP lo permiten, o esperá la asignación docente.
    </EmptyState>
  );
}
function TeamRow({ team, isTeacher, canJoin }) {
  const [confirmation, setConfirmation] = useState(false);
  const confirm = useConfirmTeam(() => setConfirmation(false));
  const provision = useProvisionRepository();
  const join = useJoinTeam();
  return (
    <TableRow>
      <TableCell>
        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 600 }}>{team.teamName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {team.memberUserIds.length} integrantes
          </Typography>
          {!canJoin && (
            <Button
              component={Link}
              to={`/equipos/${team.teamId}`}
              sx={{ alignSelf: 'flex-start' }}
            >
              Ver equipo e integrantes
            </Button>
          )}
          {team.deliveryId && (
            <Button
              component={Link}
              to={`/entregas/${team.deliveryId}`}
              sx={{ alignSelf: 'flex-start' }}
            >
              Ver entrega
            </Button>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={1}>
          <StatusBadge value={team.teamStatus} />
          {team.deliveryId && <StatusBadge value={team.deliveryStatus} />}
        </Stack>
      </TableCell>
      <TableCell>
        <RepositoryStatus team={team} />
      </TableCell>
      <TableCell>
        <Stack spacing={1}>
          {isTeacher && team.teamStatus === 'FORMING' && (
            <Button
              onClick={() => setConfirmation(true)}
              disabled={confirm.isPending || confirm.isUncertain}
            >
              Confirmar equipo
            </Button>
          )}
          {isTeacher &&
            team.teamStatus === 'CONFIRMED' &&
            team.repoProvisioningStatus !== 'COMPLETO' && (
              <Button
                disabled={provision.isPending || provision.isUncertain}
                onClick={() => provision.mutate(team.teamId)}
              >
                {provision.isPending
                  ? 'Procesando repositorio…'
                  : team.repoProvisioningStatus
                    ? 'Reintentar repositorio'
                    : 'Crear repositorio'}
              </Button>
            )}
          {canJoin && team.teamStatus === 'FORMING' && (
            <Button
              disabled={join.isPending || join.isUncertain}
              onClick={() => join.mutate(team.teamId)}
            >
              {join.isPending ? 'Uniendo…' : 'Unirme'}
            </Button>
          )}
          <MutationError mutation={provision} />
          <MutationError mutation={join} />
        </Stack>
        <ConfirmDialog
          open={confirmation}
          title="¿Confirmar este equipo?"
          onCancel={() => setConfirmation(false)}
          onConfirm={() => confirm.mutate(team.teamId)}
          busy={confirm.isPending}
          error={<MutationError mutation={confirm} />}
        >
          Se creará la entrega y se intentará generar el repositorio desde el template configurado.
        </ConfirmDialog>
      </TableCell>
    </TableRow>
  );
}
