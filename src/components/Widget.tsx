import { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../lib/types';
import { useLocalStorage } from '../lib/useLocalStorage';
import { useNow } from '../lib/useNow';
import { computeStats } from '../lib/salary';
import { formatWon } from '../lib/format';
import { isTauri, openSettings, closeWidget, hideWidget } from '../lib/tauri';
import SettingsPanel from './SettingsPanel';

const PHASE_DOT: Record<ReturnType<typeof computeStats>['phase'], string> = {
  before: 'bg-sky-400',
  working: 'bg-emerald-400',
  lunch: 'bg-orange-400',
  after: 'bg-fuchsia-400',
};

const PHASE_LABEL: Record<ReturnType<typeof computeStats>['phase'], string> = {
  before: '출근 전',
  working: '근무 중',
  lunch: '점심',
  after: '초과근무',
};

export default function Widget() {
  // 위젯/풀화면이 동일한 localStorage 키를 공유 -> 설정값 자동 동기화
  const [settings, setSettings] = useLocalStorage<Settings>('paytick.settings', DEFAULT_SETTINGS);
  const [editing, setEditing] = useState(false);

  const now = useNow(true);
  const stats = useMemo(() => computeStats(settings, now), [settings, now]);

  // 설정 버튼: Tauri면 메인 창을 열어 편집, 브라우저면 인라인 펼침
  const handleGear = () => {
    if (isTauri()) {
      void openSettings();
    } else {
      setEditing((v) => !v);
    }
  };

  if (editing && !isTauri()) {
    return (
      <div className="h-svh w-svw overflow-auto bg-zinc-950/95 p-3 text-zinc-100">
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-svh w-svw flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#0b0d14]/80 text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur-xl">
      {/* 드래그 가능한 상단 바 */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-2.5 pt-2 pb-1 select-none"
      >
        <div data-tauri-drag-region className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${PHASE_DOT[stats.phase]}`} />
          <span data-tauri-drag-region className="text-[10px] font-semibold text-zinc-400">
            {PHASE_LABEL[stats.phase]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleGear}
            aria-label="연봉·근무시간 설정"
            title="연봉·근무시간 설정"
            className="rounded-md border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 transition hover:bg-amber-400/20 active:scale-90"
          >
            ⚙ 설정
          </button>
          <button
            onClick={isTauri() ? hideWidget : undefined}
            aria-label="숨기기"
            title="트레이로 숨기기"
            className="rounded-md px-1 text-xs text-zinc-500 transition hover:text-amber-300 active:scale-90"
          >
            –
          </button>
          <button
            onClick={isTauri() ? closeWidget : undefined}
            aria-label="닫기"
            title="종료"
            className="rounded-md px-1 text-xs text-zinc-500 transition hover:text-rose-400 active:scale-90"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 메인 카운터 */}
      <div
        data-tauri-drag-region
        className="flex flex-1 flex-col items-center justify-center px-2 pb-2"
      >
        <div data-tauri-drag-region className="flex items-baseline">
          <span className="tnum money-gradient text-[clamp(1.6rem,8.5vw,2.4rem)] font-black leading-none drop-shadow-[0_0_14px_rgba(251,191,36,0.25)]">
            {formatWon(stats.earnedToday, 2)}
          </span>
          <span className="ml-1 text-sm font-extrabold text-amber-300/80">원</span>
        </div>
        <div data-tauri-drag-region className="mt-1.5 text-[10px] font-medium text-zinc-500">
          초당 <span className="tnum text-emerald-300">+{formatWon(stats.perSec, 2)}원</span>
          <span className="mx-1 text-zinc-700">·</span>
          시간당 <span className="tnum text-zinc-300">{formatWon(stats.perHour)}원</span>
        </div>
      </div>
    </div>
  );
}
