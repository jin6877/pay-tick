import { useEffect, useRef, useState } from 'react';

/**
 * requestAnimationFrame 기반으로 매 프레임 현재 시각(Date)을 갱신하는 훅.
 * 카운터가 부드럽게 올라가도록 ~60fps로 리렌더한다.
 */
export function useNow(active = true): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setNow(new Date());
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [active]);

  return now;
}
