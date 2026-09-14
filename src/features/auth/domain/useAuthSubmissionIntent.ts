import { useCallback, useRef } from 'react';

export type AuthSubmissionHandler<TValues> = (
  values: TValues,
) => void | boolean | Promise<void | boolean>;

export function useAuthSubmissionIntent<TValues>(handler?: AuthSubmissionHandler<TValues>) {
  const active = useRef(false);

  return useCallback(
    async (values: TValues) => {
      if (!handler || active.current) return undefined;
      active.current = true;
      try {
        return await handler(values);
      } finally {
        active.current = false;
      }
    },
    [handler],
  );
}
