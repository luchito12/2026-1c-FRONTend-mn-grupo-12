import { QueryWarning } from '../../shared/ui/QueryWarning.jsx';
import { useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useRubric, useSaveRubric } from './hooks.js';
import { FormDialog } from '../../shared/ui/FormDialog.jsx';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
export function RubricPanel({ projectId, isTeacher }) {
  const rubric = useRubric(projectId);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const save = useSaveRubric(projectId, () => {
    setDirty(false);
    setEditing(false);
  });
  return (
    <Stack spacing={2}>
      <QueryWarning query={rubric} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h2">Rúbrica de evaluación</Typography>
        {isTeacher && (
          <Button
            onClick={() => {
              save.reset();
              setDirty(false);
              setEditing(true);
            }}
          >
            Configurar rúbrica
          </Button>
        )}
      </Stack>
      {rubric.isPending ? (
        <LoadingState />
      ) : rubric.isError && rubric.data === undefined ? (
        <ErrorState error={rubric.error} retry={rubric.refetch} />
      ) : rubric.data ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h3">{rubric.data.name}</Typography>
          {rubric.data.criteria.map((criterion) => (
            <Typography key={criterion.name} sx={{ mt: 1 }}>
              {criterion.name} · Máximo: {criterion.maxScore}
            </Typography>
          ))}
        </Paper>
      ) : (
        <Typography color="text.secondary">El docente todavía no configuró criterios.</Typography>
      )}
      <FormDialog
        open={editing && isTeacher}
        title="Configurar rúbrica"
        onClose={() => setEditing(false)}
        dirty={dirty}
        busy={save.isPending}
      >
        {editing && rubric.data !== undefined && (
          <RubricForm value={rubric.data} save={save} onDirty={() => setDirty(true)} />
        )}
      </FormDialog>
    </Stack>
  );
}
function RubricForm({ value, save, onDirty }) {
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(value));
  const [name, setName] = useState(value?.name ?? '');
  const [criteria, setCriteria] = useState(value?.criteria ?? [{ name: '', maxScore: '' }]);
  const [validation, setValidation] = useState('');
  const [dirty, setDirty] = useState(false);
  const remoteChanged = snapshot !== JSON.stringify(value);
  useUnsavedChanges(dirty && !save.isSuccess);
  function change(index, field, value) {
    setCriteria((current) => current.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }
  function submit(event) {
    event.preventDefault();
    const names = criteria.map((c) => c.name.trim());
    if (
      !name.trim() ||
      names.some((n) => !n) ||
      new Set(names).size !== names.length ||
      criteria.some(
        (c) =>
          String(c.maxScore).trim() === '' ||
          !Number.isFinite(Number(c.maxScore)) ||
          Number(c.maxScore) <= 0,
      )
    ) {
      setValidation('Usá nombres únicos y puntajes máximos mayores que cero.');
      return;
    }
    if (!save.isPending && !remoteChanged)
      save.mutate({
        name: name.trim(),
        criteria: criteria.map((c) => ({ name: c.name.trim(), maxScore: Number(c.maxScore) })),
      });
  }
  return (
    <Stack
      component="form"
      spacing={3}
      onSubmit={submit}
      onChange={() => {
        setDirty(true);
        onDirty();
      }}
      sx={{ pt: 1 }}
    >
      {remoteChanged && (
        <Alert
          severity="warning"
          action={
            <Button
              onClick={() => {
                setName(value?.name ?? '');
                setCriteria(value?.criteria ?? [{ name: '', maxScore: '' }]);
                setSnapshot(JSON.stringify(value));
              }}
            >
              Cargar versión actual
            </Button>
          }
        >
          La rúbrica cambió en el servidor. Tu edición se conservó. Revisá los cambios antes de
          guardar.
        </Alert>
      )}
      <TextField
        label="Nombre de la rúbrica"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {criteria.map((criterion, index) => (
        <Stack spacing={2} key={index}>
          <TextField
            label={`Criterio ${index + 1}`}
            required
            value={criterion.name}
            onChange={(e) => change(index, 'name', e.target.value)}
          />
          <TextField
            label={`Puntaje máximo ${index + 1}`}
            type="number"
            required
            slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
            value={criterion.maxScore}
            onChange={(e) => change(index, 'maxScore', e.target.value)}
          />
          {criteria.length > 1 && (
            <Button
              onClick={() => {
                setDirty(true);
                onDirty();
                setCriteria(criteria.filter((_, i) => i !== index));
              }}
            >
              Quitar criterio {index + 1}
            </Button>
          )}
        </Stack>
      ))}
      <Button
        onClick={() => {
          setDirty(true);
          onDirty();
          setCriteria([...criteria, { name: '', maxScore: '' }]);
        }}
      >
        Agregar criterio
      </Button>
      <Typography variant="body2" color="text.secondary">
        Las evaluaciones guardadas conservan los criterios usados al calificarlas.
      </Typography>
      {validation && <Alert severity="error">{validation}</Alert>}
      <MutationError mutation={save} />
      <Button
        type="submit"
        variant="contained"
        disabled={save.isPending || save.isUncertain || remoteChanged}
      >
        {save.isPending ? 'Guardando…' : 'Guardar rúbrica'}
      </Button>
    </Stack>
  );
}
