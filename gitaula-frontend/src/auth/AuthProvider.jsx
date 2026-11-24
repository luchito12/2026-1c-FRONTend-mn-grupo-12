import { createContext, useCallback, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.js';
import { queryClient } from '../app/queryClient.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const session = useQuery({
    queryKey: ['session'],
    queryFn: authApi.me,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { queryClient.clear(); queryClient.setQueryData(['session'], null); }
  }, []);
  const value = { user: session.data || null, loading: session.isLoading, error: session.error, refresh: session.refetch, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
