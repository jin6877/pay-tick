// Tauri 환경 감지 + 안전한 래퍼.
// 브라우저(Vercel)에서는 모든 함수가 무해한 no-op으로 동작한다.

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** URL 해시/쿼리로 컴팩트 위젯 모드인지 판별 */
export function isWidgetMode(): boolean {
  if (typeof window === 'undefined') return false;
  const { hash, search } = window.location;
  if (/[#/]widget/.test(hash)) return true;
  const params = new URLSearchParams(search);
  return params.get('widget') === '1';
}

/** Tauri 명령 호출 (브라우저에선 무시) */
export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (!isTauri()) return undefined;
  try {
    const core = await import('@tauri-apps/api/core');
    return (await core.invoke(cmd, args)) as T;
  } catch {
    return undefined;
  }
}

/** 현재 창 닫기 (앱 종료 트리거) */
export async function closeWidget(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  } catch {
    /* ignore */
  }
}

/** 위젯을 트레이로 숨기기 */
export async function hideWidget(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().hide();
  } catch {
    /* ignore */
  }
}

/** 위젯 창 크기 조절 (설정 펼침/접힘 시). 브라우저에선 무시. */
export async function setWidgetSize(width: number, height: number): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const { LogicalSize } = await import('@tauri-apps/api/dpi');
    await getCurrentWindow().setSize(new LogicalSize(width, height));
  } catch {
    /* ignore */
  }
}
