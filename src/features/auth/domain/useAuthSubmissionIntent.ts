import { useCallback, useRef } from 'react';

export type AuthSubmissionHandler<TValues> = (values: TValues) => void | Promise<void>;

export function useAuthSubmissionIntent<TValues>(handler?: AuthSubmissionHandler<TValues>) {
  const active = useRef(false);

  return useCallback(
    async (values: TValues) => {
      if (!handler || active.current) return;
      active.current = true;
      try {
        await handler(values);
      } finally {
        active.current = false;
      }
    },
    [handler],
  );
}
