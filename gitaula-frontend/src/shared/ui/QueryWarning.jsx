import { Alert, Button } from '@mui/material';
export function QueryWarning({ query }) {
  if (!query.isError || query.data === undefined) return null;
  return (
    <Alert severity="warning" action={<Button onClick={() => query.refetch()}>Actualizar</Button>}>
      No pudimos actualizar los datos. Se conserva la última información y tus cambios en edición.{' '}
      {query.error?.message}
    </Alert>
  );
}
