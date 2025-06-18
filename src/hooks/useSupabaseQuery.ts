import { useQuery } from '@tanstack/react-query';
import { logDebug } from '@/utils/debug';

/**
 * Custom hook to fetch data from Supabase with React Query caching
 * @param key The query key for React Query caching
 * @param queryFn The function to execute for fetching data
 * @param options Additional options for React Query
 * @returns The query result
 */
export function useSupabaseQuery<T>(
  key: string | string[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: any = {},
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const start = performance.now();
      try {
        const { data, error } = await queryFn();

        if (error) {
          logDebug(
            `Error in useSupabaseQuery (${Array.isArray(key) ? key.join('.') : key})`,
            error,
            'error',
          );
          throw error;
        }

        const duration = Math.round(performance.now() - start);
        logDebug(
          `Supabase query (${Array.isArray(key) ? key.join('.') : key}) completed in ${duration}ms`,
          null,
          'info',
        );

        return data as T;
      } catch (error) {
        logDebug(
          `Exception in useSupabaseQuery (${Array.isArray(key) ? key.join('.') : key})`,
          error,
          'error',
        );
        throw error;
      }
    },
    ...options,
  });
}

/**
 * Hook for fetching data that depends on association ID with proper caching
 */
export function useAssociationData<T>(
  queryName: string,
  associationId: string | undefined | null,
  fetchFn: (id: string) => Promise<{ data: T | null; error: any }>,
  options: any = {},
) {
  return useSupabaseQuery<T>(
    [queryName, associationId || 'none'],
    async () => {
      if (!associationId) {
        return { data: null as unknown as T, error: null };
      }
      return fetchFn(associationId);
    },
    {
      enabled: !!associationId,
      ...options,
    },
  );
}

export default useSupabaseQuery;
