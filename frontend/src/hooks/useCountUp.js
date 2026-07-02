import { useEffect, useMemo, useRef, useState } from "react";

export default function useCountUp(targetValue, durationMs = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const lastTargetRef = useRef(targetValue);

  const targetNumber = useMemo(() => {
    if (typeof targetValue === "number") return targetValue;
    const n = Number(targetValue);
    return Number.isFinite(n) ? n : 0;
  }, [targetValue]);

  useEffect(() => {
    if (lastTargetRef.current === targetValue) return;
    lastTargetRef.current = targetValue;

    const start = performance.now();
    const from = 0;
    const to = targetNumber;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, targetNumber, targetValue]);

  return value;
}
