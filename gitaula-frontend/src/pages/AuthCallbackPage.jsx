import { useEffect } from 'react'; import { useNavigate, useSearchParams } from 'react-router-dom'; import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.js'; import { queryClient } from '../app/queryClient.js'; import { ErrorState } from '../components/ErrorState.jsx'; import { LoadingState } from '../components/LoadingState.jsx';
export function AuthCallbackPage() { const [params] = useSearchParams(); const navigate = useNavigate(); const loginCode = params.get('loginCode');
  const exchange = useMutation({ mutationFn: authApi.exchange, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['session'] }); navigate('/', { replace: true }); } });
  useEffect(() => { if (loginCode && !exchange.isPending && !exchange.isSuccess && !exchange.isError) exchange.mutate(loginCode); }, [loginCode, exchange.isError, exchange.isPending, exchange.isSuccess, exchange.mutate]);
  if (!loginCode) return <ErrorState title="Falta el código de inicio de sesión" error={{ message: 'Volvé a iniciar sesión desde GitAula.' }} />;
  if (exchange.isError) return <main className="auth-page"><ErrorState title="No se pudo iniciar sesión" error={exchange.error} retry={() => exchange.mutate(loginCode)} /></main>;
  return <LoadingState fullPage label="Iniciando sesión de forma segura…" />;
}
