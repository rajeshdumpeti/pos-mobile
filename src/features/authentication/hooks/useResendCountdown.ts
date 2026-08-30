import { useCallback, useEffect, useState } from 'react';

const countdownSeconds = 30;

export function useResendCountdown() {
  const [availableAt, setAvailableAt] = useState(() => Date.now() + countdownSeconds * 1000);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingSeconds = Math.max(0, Math.ceil((availableAt - now) / 1000));
  const restart = useCallback(() => {
    const nextAvailableAt = Date.now() + countdownSeconds * 1000;
    setAvailableAt(nextAvailableAt);
    setNow(Date.now());
  }, []);

  return { remainingSeconds, canResend: remainingSeconds === 0, restart };
}
