import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        ![401, 403, 404].includes(error?.status) && error?.name !== 'AbortError' && count < 1,
      staleTime: 30_000,
    },
    mutations: { retry: false },
  },
});
