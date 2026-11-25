import { Component } from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>No pudimos mostrar esta pantalla</AlertTitle>Recargá para volver a
            intentarlo. Si persiste, contactá al equipo.
            <Button onClick={() => window.location.reload()}>Recargar GitAula</Button>
          </Alert>
        </Box>
      );
    return this.props.children;
  }
}
