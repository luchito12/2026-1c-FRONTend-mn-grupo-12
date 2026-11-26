import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../auth/useCurrentUser';
import { commissionsApi } from '../commissions/api';
import type { Role } from '../../shared/api/contracts';
import { keys } from '../../shared/api/queryKeys';
import { LoadingState } from '../../shared/ui/LoadingState';
import { ErrorState } from '../../shared/ui/ErrorState';
interface WorkView {
  role: Role;
  availableRoles: Role[];
  setRole: (role: Role) => void;
}
const WorkViewContext = createContext<WorkView | null>(null);
export const useWorkView = () => useContext(WorkViewContext);
const summaryFilters = { page: 0, size: 1, q: '' };
export function WorkViewProvider({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const summary = useQuery({
    queryKey: keys.commissions(user?.userId, summaryFilters),
    queryFn: ({ signal }) => commissionsApi.list(user?.userId, summaryFilters, { signal }),
    enabled: Boolean(user?.userId),
  });
  if (summary.isPending) return <LoadingState label="Preparando tus vistas…" />;
  if (!summary.data) return <ErrorState error={summary.error} retry={summary.refetch} />;
  return (
    <WorkViewState key={user?.userId} availableRoles={summary.data.availableRoles}>
      {children}
    </WorkViewState>
  );
}
function WorkViewState({
  children,
  availableRoles,
}: {
  children: ReactNode;
  availableRoles: Role[];
}) {
  // One choice per authenticated identity. No credentials or role history are persisted.
  const [role, setRole] = useState<Role>(() =>
    availableRoles.includes('TEACHER') ? 'TEACHER' : 'STUDENT',
  );
  return (
    <WorkViewContext.Provider value={{ role, setRole, availableRoles }}>
      {children}
    </WorkViewContext.Provider>
  );
}
