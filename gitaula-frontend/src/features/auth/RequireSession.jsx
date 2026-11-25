import { Fragment } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoadingState } from '../../shared/ui/LoadingState.jsx';
import { ErrorState } from '../../shared/ui/ErrorState.jsx';
export function RequireSession({ children }) {
  const { user, status, error, refresh, reason } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <LoadingState label="Restaurando tu sesión…" fullPage />;
  if (status === 'connection_error' && !user)
    return <ErrorState title="No pudimos comprobar tu sesión" error={error} retry={refresh} />;
  return user ? (
    <Fragment key={user.userId}>{children ?? <Outlet />}</Fragment>
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}`, reason }}
    />
  );
}
