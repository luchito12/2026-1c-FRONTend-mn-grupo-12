import { useLocation } from 'react-router-dom';
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AuthState } from './AuthContext';
import type { SessionUser } from '../../shared/api/contracts';
import { authApi } from './api.js';
import {
  advanceSession,
  setClosingSession,
  sessionGeneration,
} from '../../shared/api/sessionBoundary';
import { keys } from '../../shared/api/queryKeys';

const privateQuery = (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== 'session';
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const location = useLocation();
  const [closing, setClosing] = useState(false);
  const [logoutError, setLogoutError] = useState<Error | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const identity = useRef<number | null>(null);
  const closingRef = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const expire = useCallback(
    (cause: string) => {
      advanceSession();
      void client.cancelQueries();
      client.setQueryData(keys.session, null);
      client.removeQueries({ predicate: privateQuery });
      client.getMutationCache().clear();
      identity.current = null;
      closingRef.current = false;
      setClosing(false);
      setReason(cause);
    },
    [client],
  );
  useEffect(() => {
    const unauthorized = () => expire('expired');
    window.addEventListener('gitaula:unauthorized', unauthorized);
    if (typeof BroadcastChannel !== 'undefined') {
      const connection = new BroadcastChannel('gitaula-session');
      channel.current = connection;
      connection.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === 'logout') expire('signed_out');
      };
    }
    return () => {
      window.removeEventListener('gitaula:unauthorized', unauthorized);
      channel.current?.close();
      channel.current = null;
    };
  }, [expire]);
  const session = useQuery<SessionUser | null, Error>({
    queryKey: keys.session,
    queryFn: async ({ signal }) => {
      const generation = sessionGeneration();
      try {
        const user = await authApi.me({ signal });
        if (signal.aborted || generation !== sessionGeneration())
          throw new DOMException('Solicitud cancelada.', 'AbortError');
        if (identity.current !== null && identity.current !== user.userId) {
          advanceSession();
          await client.cancelQueries({ predicate: privateQuery });
          client.removeQueries({ predicate: privateQuery });
          client.getMutationCache().clear();
        }
        identity.current = user.userId;
        return user;
      } catch (error) {
        if (signal.aborted || generation !== sessionGeneration())
          throw new DOMException('Solicitud cancelada.', 'AbortError');
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          // This observer must settle normally; never remove the active /me query.
          advanceSession();
          await client.cancelQueries({ predicate: privateQuery });
          client.removeQueries({ predicate: privateQuery });
          client.getMutationCache().clear();
          identity.current = null;
          setReason('expired');
          return null;
        }
        throw error;
      }
    },
    // The callback owns /me after the exchange; a concurrent old-cookie 401 must not abort it.
    enabled: !closing && location.pathname !== '/auth/callback',
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const establish = useCallback(
    async (user: SessionUser) => {
      advanceSession();
      await client.cancelQueries();
      client.removeQueries({ predicate: privateQuery });
      client.getMutationCache().clear();
      identity.current = user.userId;
      setReason(null);
      client.setQueryData(keys.session, user);
    },
    [client],
  );
  const logout = useCallback(async () => {
    if (closingRef.current) return false;
    closingRef.current = true;
    setClosing(true);
    setLogoutError(null);
    // Fence operations already running even if the logout request later fails.
    advanceSession();
    setClosingSession(true);
    await client.cancelQueries();
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error && typeof error === 'object' && 'status' in error && error.status === 401)) {
        setLogoutError(new Error('No pudimos cerrar la sesión. Reintentar'));
        closingRef.current = false;
        setClosingSession(false);
        setClosing(false);
        return false;
      }
    }
    channel.current?.postMessage('logout');
    expire('signed_out');
    return true;
  }, [client, expire]);
  const user = session.data ?? null;
  const status = closing
    ? 'closing'
    : session.isPending
      ? 'checking'
      : session.isError
        ? 'connection_error'
        : user
          ? 'authenticated'
          : 'anonymous';
  const value: AuthState = {
    user,
    status,
    loading: status === 'checking',
    error: session.error,
    logoutError,
    reason,
    refresh: session.refetch,
    logout,
    establish,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
