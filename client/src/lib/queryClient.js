import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client with sensible defaults for a realtime app:
 * data is considered fresh briefly, retries are limited, and refetching on
 * window focus is disabled (Socket.IO keeps data live instead).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
