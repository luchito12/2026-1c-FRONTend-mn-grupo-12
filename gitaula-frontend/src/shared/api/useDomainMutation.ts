import { useRef, useState } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { sessionGeneration, isClosingSession } from './sessionBoundary';
import { useFeedback } from '../ui/FeedbackProvider';

export function useDomainMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  invalidate: readonly QueryKey[],
  message: string,
  onSuccess?: (data: T, variables: V) => void,
) {
  const client = useQueryClient();
  const notify = useFeedback();
  const locked = useRef(false);
  const [isUncertain, setUncertain] = useState(false);
  const [isReconciling, setReconciling] = useState(false);
  async function reconcile() {
    const generation = sessionGeneration();
    setReconciling(true);
    try {
      await Promise.all(
        invalidate.map((queryKey) =>
          client.invalidateQueries({ queryKey }, { throwOnError: true }),
        ),
      );
      if (generation === sessionGeneration()) setUncertain(false);
    } catch {
      /* Keep mutations blocked until server state can be read. */
    } finally {
      setReconciling(false);
    }
  }
  const mutation = useMutation<T, Error, V, { generation: number }>({
    retry: false,
    onSettled: () => {
      locked.current = false;
    },
    onMutate: () => ({ generation: sessionGeneration() }),
    mutationFn: async (variables) => {
      if (isClosingSession()) throw new Error('Se está cerrando la sesión.');
      if (isUncertain)
        throw new Error('Comprobá el estado del servidor antes de repetir esta acción.');
      const generation = sessionGeneration();
      const result = await mutationFn(variables);
      if (generation !== sessionGeneration())
        throw new DOMException('La sesión cambió.', 'AbortError');
      return result;
    },
    onSuccess: async (data, variables, context) => {
      if (context?.generation !== sessionGeneration()) return;
      await Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey })));
      if (context?.generation !== sessionGeneration()) return;
      notify(message);
      onSuccess?.(data, variables);
    },
    onError: async (error, _variables, context) => {
      if (error.name === 'AbortError' || context?.generation !== sessionGeneration()) return;
      // A disconnected request may already have changed server state. Reconcile before retrying.
      if ('status' in error && [0, 502, 504].includes(Number(error.status))) {
        setUncertain(true);
        await reconcile();
      }
    },
  });
  const mutate: typeof mutation.mutate = (...args) => {
    if (locked.current) return;
    locked.current = true;
    mutation.mutate(...args);
  };
  const mutateAsync: typeof mutation.mutateAsync = (...args) => {
    if (locked.current) return Promise.reject(new Error('Esta acción ya se está procesando.'));
    locked.current = true;
    return mutation.mutateAsync(...args);
  };
  return { ...mutation, mutate, mutateAsync, isUncertain, isReconciling, reconcile };
}
