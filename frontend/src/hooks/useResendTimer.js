import { useCallback, useEffect, useState } from "react";

export function useResendTimer(initialSeconds = 30) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return { seconds, canResend: seconds === 0, start };
}
