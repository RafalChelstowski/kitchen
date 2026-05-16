import { useEffect } from 'react';
import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from 'react-query';

export function useRealtimeQuery<T>(
  path: string,
  options: UseQueryOptions<T, unknown, T, string> = {}
): UseQueryResult<T, unknown> {
  useEffect(() => {
    return undefined;
  }, []);

  return useQuery(path, () => Promise.resolve(undefined as T), {
    ...options,
    enabled: false,
  });
}
