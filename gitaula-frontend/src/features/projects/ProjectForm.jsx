import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { projectFormSchema } from './projectFormSchema';
import { fieldProps } from '../../shared/lib/form.js';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
const valuesOf = (value) => ({
  projectName: value?.projectName ?? '',
  description: value?.description ?? '',
  templateOwner: value?.templateOwner ?? '',
  templateRepo: value?.templateRepo ?? '',
  targetOrg: value?.targetOrg ?? '',
  teamFormationMode: value?.teamFormationMode ?? 'MANUAL_TEACHER',
  teamFormationDeadline: value?.teamFormationDeadline ?? '',
  dueDate: value?.dueDate ?? '',
  type: value?.type ?? 'GROUP',
  allowLate: value?.allowLate ?? false,
});
export function ProjectForm({ value, mutation, onDirtyChange }) {
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: valuesOf(value),
  });
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(valuesOf(value)));
  const remoteChanged = Boolean(value) && snapshot !== JSON.stringify(valuesOf(value));
  const clearDirty = useUnsavedChanges(form.formState.isDirty && !mutation.isSuccess);
  const dirty = form.formState.isDirty;
  // The containing dialog reads dirtiness from a native event callback, without resetting form data on refetch.
  function submit(values) {
    if (mutation.isPending) return;
    if (remoteChanged) return;
    if (value?.teamFormationDeadline && !values.teamFormationDeadline) {
      form.setError('teamFormationDeadline', {
        message: 'No se puede quitar una fecha ya guardada. Elegí otra fecha.',
      });
      return;
    }
    if (
      values.type === 'INDIVIDUAL' &&
      value?.teams.some((team) => team.memberUserIds.length > 1)
    ) {
      form.setError('type', {
        message: 'Reasigná los equipos con varios integrantes antes de cambiar a individual.',
      });
      return;
    }
    const { projectName, ...editable } = values;
    mutation.mutate(
      {
        ...(value ? editable : { ...editable, projectName }),
        teamFormationDeadline: values.teamFormationDeadline || null,
      },
      { onSuccess: clearDirty },
    );
  }
  return (
    <Stack
      component="form"
      spacing={3}
      noValidate
      onSubmit={form.handleSubmit(submit)}
      onChange={() => onDirtyChange?.(true)}
    >
      {remoteChanged && (
        <Alert
          severity="warning"
          action={
            <Button
              onClick={() => {
                form.reset(valuesOf(value));
                setSnapshot(JSON.stringify(valuesOf(value)));
                onDirtyChange?.(false);
              }}
            >
              Cargar versión actual
            </Button>
          }
        >
          El TP cambió en el servidor. Conservamos tus datos. Revisá la versión actual antes de
          guardar.
        </Alert>
      )}
      <Typography variant="h2">Información</Typography>
      <TextField
        label="Título"
        {...fieldProps(form, 'projectName')}
        slotProps={{ input: { readOnly: Boolean(value) } }}
        helperText={
          value
            ? 'El título se conserva. Podés editar la descripción y la configuración.'
            : form.formState.errors.projectName?.message
        }
      />
      <TextField label="Descripción" multiline minRows={3} {...fieldProps(form, 'description')} />
      <Typography variant="h2">Fechas y equipos</Typography>
      <Alert severity="info">
        Las fechas límite incluyen todo el día en UTC. La actividad se muestra en horario de
        Argentina.
      </Alert>
      <TextField
        label="Fecha de entrega (UTC)"
        type="date"
        {...fieldProps(form, 'dueDate')}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Controller
        name="type"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            label="Tipo de TP"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
          >
            <MenuItem value="GROUP">Grupal</MenuItem>
            <MenuItem value="INDIVIDUAL">Individual (un integrante por equipo)</MenuItem>
          </TextField>
        )}
      />
      <Controller
        name="allowLate"
        control={form.control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                slotProps={{ input: { ref: field.ref } }}
              />
            }
            label="Permitir entregas después del vencimiento"
          />
        )}
      />
      <Controller
        name="teamFormationMode"
        control={form.control}
        render={({ field }) => (
          <TextField {...field} select label="Formación de equipos">
            <MenuItem value="MANUAL_TEACHER">Asignación docente</MenuItem>
            <MenuItem value="SELF_ORGANIZED_STUDENTS">Autoorganización de alumnos</MenuItem>
          </TextField>
        )}
      />
      <TextField
        label="Fecha límite de equipos (UTC)"
        type="date"
        {...fieldProps(form, 'teamFormationDeadline')}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Typography variant="h2">GitHub</Typography>
      <TextField label="Owner del template" {...fieldProps(form, 'templateOwner')} />
      <TextField label="Repositorio template" {...fieldProps(form, 'templateRepo')} />
      <TextField label="Organización destino" {...fieldProps(form, 'targetOrg')} />
      <MutationError mutation={mutation} />
      <Button
        type="submit"
        variant="contained"
        disabled={
          mutation.isPending || mutation.isUncertain || remoteChanged || (Boolean(value) && !dirty)
        }
      >
        {mutation.isPending ? 'Guardando…' : 'Guardar TP'}
      </Button>
    </Stack>
  );
}
