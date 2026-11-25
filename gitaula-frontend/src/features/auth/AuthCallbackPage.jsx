import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import { useAuth } from './AuthProvider';
import { completeOAuth, takeReturnPath } from './oauth';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
export function AuthCallbackPage() {
  const [code] = useState(() => new URLSearchParams(window.location.search).get('loginCode'));
  const [error, setError] = useState(null);
  const request = useRef(null);
  const navigate = useNavigate();
  const { establish } = useAuth();
  useEffect(() => {
    // Remove the one-time secret without causing a router remount.
    window.history.replaceState(window.history.state, '', '/auth/callback');
    if (!code) return;
    request.current ??= completeOAuth(code);
    let active = true;
    request.current
      .then(async (user) => {
        if (!active) return;
        await establish(user);
        if (active) navigate(takeReturnPath(), { replace: true });
      })
      .catch((error) => {
        if (active) setError(error);
      });
    return () => {
      active = false;
    };
  }, [code, establish, navigate]);
  if (!code || error)
    return (
      <Stack sx={{ maxWidth: 600, mx: 'auto', p: 3, mt: 8 }} spacing={2}>
        <ErrorState
          title="No se pudo completar el inicio de sesión"
          error={error ?? new Error('Falta el código de acceso. Volvé a iniciar sesión.')}
        />
        <Button component={Link} to="/login" variant="contained">
          Reiniciar inicio de sesión
        </Button>
      </Stack>
    );
  return <LoadingState fullPage label="Comprobando el acceso a tu cuenta…" />;
}
