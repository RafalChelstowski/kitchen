import { UseMutateAsyncFunction, useMutation } from 'react-query';

export interface SetMutationParams<T> {
  path: string;
  payload: T;
}

export type MutationFn<T> = UseMutateAsyncFunction<
  T,
  unknown,
  SetMutationParams<T>,
  unknown
>;

export interface SetMutationResults<T> {
  set: MutationFn<T>;
  reset: () => void;
}

export function useSet<T>(): SetMutationResults<T> {
  const { mutateAsync, reset } = useMutation(
    async (params: SetMutationParams<T>) => {
      return params.payload;
    }
  );

  const set = async (variables: SetMutationParams<T>) => {
    const result = await mutateAsync(variables);

    return result;
  };

  return { set, reset };
}

export interface UpdateMutationResults<T> {
  update: MutationFn<T>;
  reset: () => void;
}

export function useUpdate<T>(): UpdateMutationResults<T> {
  const { mutateAsync, reset } = useMutation(
    async (params: SetMutationParams<T>) => {
      return params.payload;
    }
  );

  const update = async (variables: SetMutationParams<T>) => {
    const result = await mutateAsync(variables);

    return result;
  };

  return { update, reset };
}
