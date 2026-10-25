import { useEffect, useRef, useState } from "react";

/** Eases from the value last shown to `value` whenever it changes (from 0 on first mount). */
export function useTween(value: number, ms = 700) {
  const [shown, setShown] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      last.current = value;
      setShown(value);
      return;
    }
    const from = last.current, t0 = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const k = Math.min(1, (t - t0) / ms);
      last.current = k < 1 ? from + (value - from) * (1 - (1 - k) ** 3) : value;
      setShown(last.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return shown;
}
