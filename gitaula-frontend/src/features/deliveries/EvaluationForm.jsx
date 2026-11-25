import { useRef, useState } from 'react';
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { MutationError } from '../../shared/ui/MutationError.jsx';
import { useUnsavedChanges } from '../../shared/ui/UnsavedChanges.jsx';
const signature = (rubric, value) => JSON.stringify({ rubric, value });
export function EvaluationForm({ rubric, value, mutation }) {
  const [draftRubric, setDraftRubric] = useState(rubric);
  const [snapshot, setSnapshot] = useState(() => signature(rubric, value));
  const latest = useRef({ rubric, value });
  latest.current = { rubric, value };
  const [feedback, setFeedback] = useState(value?.feedback ?? '');
  const [scores, setScores] = useState(() =>
    Object.fromEntries(value?.scores?.map((s) => [s.criterion, s.score]) ?? []),
  );
  const [dirty, setDirty] = useState(false);
  const [validation, setValidation] = useState('');
  const remoteChanged = snapshot !== signature(rubric, value);
  useUnsavedChanges(dirty);
  function loadRemote() {
    setDraftRubric(rubric);
    setFeedback(value?.feedback ?? '');
    setScores(Object.fromEntries(value?.scores?.map((s) => [s.criterion, s.score]) ?? []));
    setSnapshot(signature(rubric, value));
    setDirty(false);
    setValidation('');
  }
  async function submit(event) {
    event.preventDefault();
    if (mutation.isPending || remoteChanged) return;
    if (
      !feedback.trim() ||
      draftRubric.criteria.some(
        (c) =>
          scores[c.name] === undefined ||
          String(scores[c.name]).trim() === '' ||
          !Number.isFinite(Number(scores[c.name])) ||
          Number(scores[c.name]) < 0 ||
          Number(scores[c.name]) > c.maxScore,
      )
    ) {
      setValidation(
        'Completá la devolución y todos los puntajes entre cero y el máximo de cada criterio.',
      );
      return;
    }
    try {
      await mutation.mutateAsync({
        feedback: feedback.trim(),
        scores: draftRubric.criteria.map((c) => ({
          criterion: c.name,
          score: Number(scores[c.name]),
        })),
      });
      setDirty(false);
      setSnapshot(signature(latest.current.rubric, latest.current.value));
    } catch {
      /* The mutation displays its error; preserve the draft. */
    }
  }
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack component="form" spacing={3} onSubmit={submit} onChange={() => setDirty(true)}>
        <Typography variant="h3">
          {value ? 'Actualizar evaluación' : 'Cargar evaluación'}
        </Typography>
        {remoteChanged && (
          <Alert
            severity="warning"
            action={<Button onClick={loadRemote}>Cargar versión actual</Button>}
          >
            La evaluación o la rúbrica cambiaron en el servidor. Tu borrador se conservó. Revisá la
            versión actual antes de guardar.
          </Alert>
        )}
        {draftRubric.criteria.map((criterion) => (
          <TextField
            key={criterion.name}
            label={`${criterion.name} (máximo ${criterion.maxScore})`}
            type="number"
            required
            slotProps={{ htmlInput: { min: 0, max: criterion.maxScore, step: 0.01 } }}
            value={scores[criterion.name] ?? ''}
            onChange={(event) => setScores({ ...scores, [criterion.name]: event.target.value })}
          />
        ))}
        <TextField
          label="Devolución general"
          multiline
          minRows={4}
          required
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
        {validation && <Alert severity="error">{validation}</Alert>}
        <MutationError mutation={mutation} />
        <Button
          type="submit"
          variant="contained"
          disabled={mutation.isPending || mutation.isUncertain || remoteChanged}
        >
          {mutation.isPending ? 'Guardando…' : 'Guardar evaluación'}
        </Button>
      </Stack>
    </Paper>
  );
}
