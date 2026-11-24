import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: (count, error) => error?.status !== 401 && count < 1, staleTime: 30_000 }, mutations: { retry: false } } });
