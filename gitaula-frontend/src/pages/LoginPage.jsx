import { Navigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth.js'; import { useAuth } from '../auth/AuthProvider.jsx'; import { LoadingState } from '../components/LoadingState.jsx';
export function LoginPage() { const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <LoadingState fullPage label="Comprobando sesión…" />;
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">GITAULA</p><h1>Tu aula, conectada a GitHub.</h1><p>Ingresá con tu cuenta de GitHub para acceder a las comisiones en las que participás.</p><button className="primary auth-button" onClick={() => window.location.assign(authApi.loginUrl())}>Ingresar con GitHub</button><small>La sesión se guarda en una cookie segura; GitAula no almacena tu token en el navegador.</small></section></main>;
}
