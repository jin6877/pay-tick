import { useCallback, useEffect, useRef, useState } from 'react';

function read<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw != null) {
      const parsed = JSON.parse(raw);
      // 플랫 객체는 기본값과 병합해 신규 필드 누락을 방지
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        initial &&
        typeof initial === 'object' &&
        !Array.isArray(initial)
      ) {
        return { ...(initial as object), ...(parsed as object) } as T;
      }
      return parsed as T;
    }
  } catch {
    /* 손상된 값은 무시하고 기본값 사용 */
  }
  return initial;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));
  const keyRef = useRef(key);
  keyRef.current = key;

  // value가 어떤 경로로 바뀌든 항상 localStorage에 기록 (저장 누락 방지)
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  // 다른 탭에서의 변경을 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyRef.current && e.newValue != null) {
        try {
          setValue(JSON.parse(e.newValue) as T);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(keyRef.current, JSON.stringify(resolved));
      } catch {
        /* ignore */
      }
      return resolved;
    });
  }, []);

  return [value, set] as const;
}
