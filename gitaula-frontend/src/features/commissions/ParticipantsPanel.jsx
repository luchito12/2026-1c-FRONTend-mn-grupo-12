import { useState } from 'react';
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useParticipants, useEnrollParticipant, useUpdateParticipant } from './hooks.js';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.jsx';
import { FormDialog } from '../../shared/ui/FormDialog.jsx';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { StatusBadge } from '../../shared/ui/StatusBadge.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
export function ParticipantsPanel({ commissionId, isTeacher }) {
  const participants = useParticipants(commissionId);
  const [open, setOpen] = useState(false);
  const [githubLogin, setGithubLogin] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [pending, setPending] = useState(null);
  const enroll = useEnrollParticipant(commissionId, () => {
    setOpen(false);
    setGithubLogin('');
  });
  const update = useUpdateParticipant(commissionId, () => setPending(null));
  useUnsavedChanges(open && Boolean(githubLogin));
  if (participants.isPending) return <LoadingState />;
  if (participants.isError)
    return <ErrorState error={participants.error} retry={participants.refetch} />;
  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h2">Participantes</Typography>
        {isTeacher && (
          <Button
            onClick={() => {
              enroll.reset();
              setOpen(true);
            }}
            variant="contained"
          >
            Agregar participante
          </Button>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: { sm: 'none' } }}>
        Deslizá la tabla para ver estado y acciones.
      </Typography>
      {participants.data.length ? (
        <TableContainer
          role="region"
          aria-label="Tabla de participantes desplazable"
          tabIndex={0}
          component={Paper}
          variant="outlined"
        >
          <Table sx={{ minWidth: 720 }} aria-label="Participantes">
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                {isTeacher && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.data.map((participant) => (
                <TableRow key={participant.userId}>
                  <TableCell>
                    <Typography>@{participant.githubLogin}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {participant.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={participant.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={participant.status} />
                  </TableCell>
                  {isTeacher && (
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Button
                          disabled={
                            update.isPending ||
                            (update.isUncertain && update.variables?.userId === participant.userId)
                          }
                          onClick={() => {
                            update.reset();
                            setPending({
                              participant,
                              body: {
                                role: participant.role === 'TEACHER' ? 'STUDENT' : 'TEACHER',
                                status: participant.status,
                              },
                            });
                          }}
                        >
                          Cambiar a {participant.role === 'TEACHER' ? 'alumno' : 'docente'}
                        </Button>
                        <Button
                          onClick={() => {
                            update.reset();
                            setPending({
                              participant,
                              body: {
                                role: participant.role,
                                status: participant.status === 'ACTIVE' ? 'WITHDRAWN' : 'ACTIVE',
                              },
                            });
                          }}
                        >
                          {participant.status === 'ACTIVE' ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState title="Sin participantes">
          Los participantes de la comisión aparecerán acá.
        </EmptyState>
      )}
      <FormDialog
        open={open && isTeacher}
        title="Agregar participante"
        onClose={() => setOpen(false)}
        dirty={Boolean(githubLogin)}
        busy={enroll.isPending}
      >
        <Stack
          component="form"
          spacing={3}
          onSubmit={(event) => {
            event.preventDefault();
            if (!enroll.isPending) enroll.mutate({ githubLogin: githubLogin.trim(), role });
          }}
          sx={{ pt: 1 }}
        >
          <Alert severity="info">
            El usuario debe haber iniciado sesión en GitAula al menos una vez.
          </Alert>
          <TextField
            label="Usuario de GitHub"
            autoFocus
            required
            value={githubLogin}
            onChange={(event) => setGithubLogin(event.target.value)}
            slotProps={{ htmlInput: { pattern: '[a-zA-Z0-9\\-]+', maxLength: 39 } }}
          />
          <TextField
            select
            label="Rol"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <MenuItem value="STUDENT">Alumno</MenuItem>
            <MenuItem value="TEACHER">Docente</MenuItem>
          </TextField>
          <MutationError mutation={enroll} />
          <Button
            type="submit"
            variant="contained"
            disabled={enroll.isPending || enroll.isUncertain || !githubLogin.trim()}
          >
            {enroll.isPending ? 'Agregando…' : 'Agregar participante'}
          </Button>
        </Stack>
      </FormDialog>
      <ConfirmDialog
        open={Boolean(pending) && isTeacher}
        title={`¿Actualizar a @${pending?.participant.githubLogin}?`}
        busy={update.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => update.mutate({ userId: pending.participant.userId, body: pending.body })}
        error={<MutationError mutation={update} />}
      >
        {pending?.body.status === 'WITHDRAWN'
          ? 'Perderá el acceso a esta comisión. Podés reactivar su inscripción después.'
          : pending?.body.role !== pending?.participant.role
            ? 'El nuevo rol cambiará los permisos en esta comisión.'
            : 'Recuperará el acceso con su rol actual.'}{' '}
        No se puede retirar ni cambiar el rol del último docente activo.
      </ConfirmDialog>
    </Stack>
  );
}
