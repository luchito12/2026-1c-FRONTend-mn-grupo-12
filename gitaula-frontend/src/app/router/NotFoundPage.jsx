import { Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../shared/ui/EmptyState.jsx';
export function NotFoundPage() {
  return (
    <Container sx={{ py: 8 }}>
      <EmptyState
        title="No encontramos esta página"
        action={
          <Button component={Link} to="/" variant="contained">
            Ir a Inicio
          </Button>
        }
      >
        Revisá la dirección o volvé a tus comisiones.
      </EmptyState>
    </Container>
  );
}
