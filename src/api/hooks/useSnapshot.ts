import { useQuery, UseQueryOptions, UseQueryResult } from 'react-query';

export function useSnapshot<T>(
  firebasePathKey: string,
  options: UseQueryOptions<T, unknown, T, string> = {}
): UseQueryResult<T, unknown> {
  return useQuery(firebasePathKey, () => Promise.resolve(undefined as T), {
    ...options,
    enabled: false,
  });
}
