import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { authApi } from './api.js';
import { useAuth } from './AuthProvider';
import { internalPath } from '../../shared/lib/domain';
import { saveReturnPath } from './oauth';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
export function LoginPage() {
  const { user, status, error, refresh, reason } = useAuth();
  const location = useLocation();
  const from = internalPath(location.state?.from);
  if (status === 'checking') return <LoadingState fullPage label="Comprobando sesión…" />;
  if (user && status !== 'connection_error') return <Navigate to={from} replace />;
  return (
    <Box component="main" sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Typography variant="overline" color="primary">
            GitAula
          </Typography>
          <Typography variant="h1">Tu cursada, conectada a GitHub.</Typography>
          <Typography color="text.secondary">
            Accedé a tus comisiones, equipos y entregas con tu cuenta de GitHub.
          </Typography>
          {(location.state?.reason ?? reason) === 'expired' && (
            <Alert severity="info">
              Iniciá sesión para continuar en la página que solicitaste.
            </Alert>
          )}
          {(location.state?.reason ?? reason) === 'signed_out' && (
            <Alert severity="success">La sesión se cerró correctamente.</Alert>
          )}
          {status === 'connection_error' && (
            <Alert severity="error" action={<Button onClick={refresh}>Reintentar</Button>}>
              {error?.message || 'No pudimos comprobar la sesión.'}
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={<GitHubIcon />}
            onClick={() => {
              saveReturnPath(from);
              window.location.assign(authApi.loginUrl());
            }}
          >
            Ingresar con GitHub
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
