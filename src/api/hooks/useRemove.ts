import { UseMutateAsyncFunction, useMutation } from 'react-query';

export type RemoveFn = UseMutateAsyncFunction<
  unknown,
  unknown,
  string,
  unknown
>;

interface MutationResults {
  remove: RemoveFn;
}

export function useRemove(): MutationResults {
  const { mutateAsync } = useMutation(async (path: string) => {
    return path;
  });

  return { remove: mutateAsync };
}
