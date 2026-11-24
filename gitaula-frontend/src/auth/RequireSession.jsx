import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
export function RequireSession({ children }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <LoadingState label="Restaurando tu sesión…" fullPage />;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
