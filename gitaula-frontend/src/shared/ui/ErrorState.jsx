import { Alert, AlertTitle, Button } from '@mui/material';
import { Link } from 'react-router-dom';
export function ErrorState({ error, title = 'No pudimos cargar esta información', retry }) {
  return (
    <Alert
      severity={error?.status === 403 ? 'warning' : 'error'}
      action={
        retry && (
          <Button color="inherit" onClick={() => retry()}>
            Reintentar
          </Button>
        )
      }
    >
      <AlertTitle>{error?.status === 403 ? 'Acceso denegado' : title}</AlertTitle>
      {error?.message || 'Ocurrió un error inesperado.'}
      {error?.status === 403 && (
        <Button component={Link} to="/comisiones" color="inherit">
          Ver mis comisiones
        </Button>
      )}
    </Alert>
  );
}
