import { Alert, Button } from '@mui/material';
export function MutationError({ mutation }) {
  if (!mutation.isError || mutation.error.name === 'AbortError') return null;
  const uncertainResponse = [0, 502, 504].includes(mutation.error.status);
  return (
    <Alert
      severity="error"
      action={
        mutation.isUncertain && (
          <Button disabled={mutation.isReconciling} onClick={mutation.reconcile}>
            {mutation.isReconciling ? 'Comprobando…' : 'Comprobar estado'}
          </Button>
        )
      }
    >
      {mutation.error.message}
      {uncertainResponse &&
        (mutation.isUncertain
          ? ' La operación podría haberse procesado. Comprobá el estado antes de repetirla.'
          : ' El estado se volvió a consultar. Revisalo antes de repetir la operación.')}
    </Alert>
  );
}
