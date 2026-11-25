import { useState } from 'react';
import { Alert, Autocomplete, Button, Stack, TextField } from '@mui/material';
import { useParticipants } from '../commissions/hooks.js';
import { useCreateTeam } from './hooks.js';
import { label } from '../../shared/lib/domain';
import { useCurrentUser } from '../auth/useCurrentUser.js';
import { FormDialog } from '../../shared/ui/FormDialog.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
export function CreateTeamDialog({ project, open, onClose }) {
  const isTeacher = project.currentRole === 'TEACHER';
  const user = useCurrentUser();
  const participants = useParticipants(project.commissionId, open && isTeacher);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([]);
  const [validation, setValidation] = useState('');
  const create = useCreateTeam(project.projectId, () => {
    setTeamName('');
    setMembers([]);
    onClose();
  });
  const dirty = Boolean(teamName || members.length);
  useUnsavedChanges(open && dirty);
  const assigned = new Set(project.teams.flatMap((team) => team.memberUserIds));
  const options =
    participants.data?.filter((p) => p.status === 'ACTIVE' && !assigned.has(p.userId)) ?? [];
  const individual = project.type === 'INDIVIDUAL';
  function submit(event) {
    event.preventDefault();
    if (create.isPending) return;
    if (!teamName.trim()) {
      setValidation('Ingresá el nombre del equipo.');
      return;
    }
    if (isTeacher && (!members.length || (individual && members.length !== 1))) {
      setValidation(
        individual ? 'Elegí exactamente un integrante.' : 'Elegí al menos un integrante.',
      );
      return;
    }
    create.mutate({
      teamName: teamName.trim(),
      memberUserIds: isTeacher ? members.map((member) => member.userId) : [user.userId],
    });
  }
  return (
    <FormDialog
      open={open}
      title={isTeacher ? 'Crear equipo' : 'Crear mi equipo'}
      dirty={dirty}
      busy={create.isPending}
      onClose={onClose}
    >
      <Stack component="form" spacing={3} onSubmit={submit} sx={{ pt: 1 }}>
        <TextField
          label="Nombre del equipo"
          required
          autoFocus
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
        />
        {isTeacher &&
          (participants.isPending ? (
            <LoadingState />
          ) : participants.isError ? (
            <ErrorState error={participants.error} retry={participants.refetch} />
          ) : (
            <Autocomplete
              multiple
              options={options}
              value={members}
              onChange={(_, value) => setMembers(value)}
              getOptionLabel={(p) =>
                `${p.name ?? p.githubLogin} (@${p.githubLogin}) · ${label(p.role)}`
              }
              isOptionEqualToValue={(a, b) => a.userId === b.userId}
              getOptionDisabled={(p) =>
                individual && members.length === 1 && members[0].userId !== p.userId
              }
              noOptionsText="No hay participantes activos disponibles"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Integrantes"
                  helperText={
                    individual
                      ? 'Este TP admite un integrante por equipo.'
                      : 'Participantes activos de esta comisión sin equipo en el TP.'
                  }
                />
              )}
            />
          ))}
        {project.teamFormationMode === 'MANUAL_TEACHER' && (
          <Alert severity="info">
            Crear el equipo también lo confirmará, creará su entrega e intentará generar el
            repositorio desde el template configurado.
          </Alert>
        )}
        {validation && <Alert severity="error">{validation}</Alert>}
        <MutationError mutation={create} />
        {create.isPending && (
          <Alert severity="info">
            Creando el equipo y procesando su configuración. Puede demorar; no cierres esta ventana.
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={
            create.isPending || create.isUncertain || (isTeacher && !participants.isSuccess)
          }
        >
          {create.isPending ? 'Creando…' : 'Crear equipo'}
        </Button>
      </Stack>
    </FormDialog>
  );
}
