import { createContext } from 'react';
import type { SessionUser } from '../../shared/api/contracts';
export type SessionStatus =
  'checking' | 'authenticated' | 'anonymous' | 'connection_error' | 'closing';
export interface AuthState {
  user: SessionUser | null;
  status: SessionStatus;
  loading: boolean;
  error: Error | null;
  logoutError: Error | null;
  reason: string | null;
  refresh: () => Promise<unknown>;
  logout: () => Promise<boolean>;
  establish: (user: SessionUser) => Promise<void>;
}
export const AuthContext = createContext<AuthState | null>(null);
