import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { useBlocker, useBeforeUnload } from 'react-router-dom';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { useAuth } from '../../features/auth/AuthProvider';
const DirtyContext = createContext({
  register: () => {},
  clear: () => {},
  beforeAction: (action) => action(),
});
export function useUnsavedChanges(dirty) {
  const { register } = useContext(DirtyContext);
  const id = useId();
  useEffect(() => {
    register(id, dirty);
    return () => register(id, false);
  }, [dirty, id, register]);
  return useCallback(() => register(id, false), [id, register]);
}
export const useMarkChangesSaved = () => useContext(DirtyContext).clear;
export const useDiscardBeforeAction = () => useContext(DirtyContext).beforeAction;
export function UnsavedChangesProvider({ children }) {
  const entries = useRef(new Set());
  const [pendingAction, setPendingAction] = useState(null);
  const auth = useAuth();
  const register = useCallback((id, dirty) => {
    if (dirty) entries.current.add(id);
    else entries.current.delete(id);
  }, []);
  const beforeAction = useCallback((action) => {
    if (entries.current.size) setPendingAction(() => action);
    else action();
  }, []);
  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }) =>
      Boolean(auth?.user) &&
      auth?.status !== 'closing' &&
      entries.current.size > 0 &&
      `${currentLocation.pathname}${currentLocation.search}` !==
        `${nextLocation.pathname}${nextLocation.search}`,
    [auth?.status, auth?.user],
  );
  const blocker = useBlocker(shouldBlock);
  useBeforeUnload(
    useCallback((event) => {
      if (entries.current.size) {
        event.preventDefault();
        event.returnValue = '';
      }
    }, []),
  );
  function cancel() {
    if (pendingAction) setPendingAction(null);
    else blocker.reset?.();
  }
  function proceed() {
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    } else {
      entries.current.clear();
      blocker.proceed?.();
    }
  }
  return (
    <DirtyContext.Provider value={{ register, beforeAction, clear: () => entries.current.clear() }}>
      {children}
      <ConfirmDialog
        open={blocker.state === 'blocked' || Boolean(pendingAction)}
        title="Tenés cambios sin guardar"
        confirmLabel="Descartar y continuar"
        onCancel={cancel}
        onConfirm={proceed}
      >
        Si continuás se perderán los cambios de este formulario.
      </ConfirmDialog>
    </DirtyContext.Provider>
  );
}
