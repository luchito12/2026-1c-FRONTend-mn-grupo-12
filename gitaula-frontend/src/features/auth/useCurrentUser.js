import { useAuth } from './AuthProvider';
export const useCurrentUser = () => useAuth()?.user ?? null;
