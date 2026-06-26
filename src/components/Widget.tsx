import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../lib/types';
import { useLocalStorage } from '../lib/useLocalStorage';
import { useNow } from '../lib/useNow';
import { computeStats } from '../lib/salary';
import { formatWon } from '../lib/format';
import { centerWidget, closeWidget, hideWidget, setWidgetSize } from '../lib/tauri';
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

// 컴팩트 위젯 / 설정 펼침 시 창 크기 (몰래 쓰기 좋게 컴팩트는 작게)
const COMPACT = { w: 176, h: 72 };
const PANEL = { w: 320, h: 580 };

export default function Widget() {
  // 위젯/풀화면이 동일한 localStorage 키를 공유 -> 설정값 자동 동기화
  const [settings, setSettings] = useLocalStorage<Settings>('paytick.settings', DEFAULT_SETTINGS);
  // 최초 실행(아직 설정 안 함)이면 설정부터 보여준다
  const [hasVisited, setHasVisited] = useLocalStorage<{ done: boolean }>('paytick.visited', {
    done: false,
  });
  const [editing, setEditing] = useState(!hasVisited.done);

  const now = useNow(true);
  const stats = useMemo(() => computeStats(settings, now), [settings, now]);

  // 설정은 별도 창을 띄우지 않고 위젯 안에서 인라인으로 펼친다 (윈도우 멀티윈도우 버그 회피).
  // 펼침/접힘에 맞춰 Tauri 창 크기를 조절하고, 설정을 펼칠 땐 화면 중앙으로 옮겨
  // 완료 버튼이 화면 밖으로 나가 갇히는 상황을 막는다.
  useEffect(() => {
    void (async () => {
      if (editing) {
        await setWidgetSize(PANEL.w, PANEL.h);
        await centerWidget();
      } else {
        await setWidgetSize(COMPACT.w, COMPACT.h);
      }
    })();
  }, [editing]);

  // 금액 글자 크기를 자릿수에 맞춰 반응형으로 (작은 위젯 폭을 넘지 않게 자동 축소)
  const amountStr = formatWon(stats.earnedToday, 2);
  const amountFontPx = useMemo(() => {
    const avail = COMPACT.w - 30; // 좌우 패딩 + "원" 공간 제외한 가용 폭
    const px = avail / (amountStr.length * 0.56);
    return Math.max(13, Math.min(27, px));
  }, [amountStr.length]);

  const closeSettings = () => {
    setEditing(false);
    setHasVisited({ done: true });
  };

  // ── 설정 화면 (인라인) ──
  if (editing) {
    return (
      <div className="flex h-svh w-svw flex-col rounded-[14px] border border-white/10 bg-[#0b0d14] text-zinc-100 shadow-2xl shadow-black/60">
        {/* 드래그 핸들: 설정 중에도 이 막대를 잡고 위젯 이동 (완료 버튼 갇힘 방지) */}
        <div
          data-tauri-drag-region
          title="여기를 잡고 위젯을 옮길 수 있어요"
          className="flex shrink-0 cursor-grab items-center justify-center gap-1.5 border-b border-white/5 py-2 select-none active:cursor-grabbing"
        >
          <span data-tauri-drag-region className="h-1 w-10 rounded-full bg-white/25" />
          <span data-tauri-drag-region className="text-[10px] font-medium text-zinc-500">
            여기를 잡고 이동
          </span>
        </div>
        <div className="flex-1 overflow-auto px-3.5 pb-3.5">
          <SettingsPanel settings={settings} onChange={setSettings} onClose={closeSettings} />
        </div>
      </div>
    );
  }

  // ── 컴팩트 위젯 화면 ──
  return (
    <div className="flex h-svh w-svw flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#0b0d14]/80 text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur-xl">
      {/* 드래그 가능한 상단 바 */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-1.5 pt-1 pb-0.5 select-none"
      >
        <div data-tauri-drag-region className="flex items-center gap-1">
          <span className={`h-1 w-1 rounded-full ${PHASE_DOT[stats.phase]}`} />
          <span data-tauri-drag-region className="text-[8px] font-semibold text-zinc-500">
            {PHASE_LABEL[stats.phase]}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setEditing(true)}
            aria-label="연봉·근무시간 설정"
            title="연봉·근무시간 설정"
            className="rounded border border-amber-400/40 bg-amber-400/10 px-1 py-px text-[8px] font-semibold text-amber-300 transition hover:bg-amber-400/20 active:scale-90"
          >
            ⚙
          </button>
          <button
            onClick={() => void hideWidget()}
            aria-label="숨기기"
            title="트레이로 숨기기"
            className="rounded px-0.5 text-[10px] leading-none text-zinc-500 transition hover:text-amber-300 active:scale-90"
          >
            –
          </button>
          <button
            onClick={() => void closeWidget()}
            aria-label="닫기"
            title="종료"
            className="rounded px-0.5 text-[10px] leading-none text-zinc-500 transition hover:text-rose-400 active:scale-90"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 메인 카운터 */}
      <div
        data-tauri-drag-region
        className="flex flex-1 flex-col items-center justify-center px-1.5 pb-1.5"
      >
        <div data-tauri-drag-region className="flex max-w-full items-baseline justify-center">
          <span
            data-tauri-drag-region
            style={{ fontSize: `${amountFontPx}px` }}
            className="tnum money-gradient font-black leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]"
          >
            {amountStr}
          </span>
          <span className="ml-0.5 text-[10px] font-extrabold text-amber-300/80">원</span>
        </div>
        <div data-tauri-drag-region className="mt-0.5 text-[8px] font-medium text-zinc-500">
          초당 <span className="tnum text-emerald-300">+{formatWon(stats.perSec, 2)}</span>
          <span className="mx-0.5 text-zinc-700">·</span>
          시간 <span className="tnum text-zinc-300">{formatWon(stats.perHour)}</span>
        </div>
      </div>
    </div>
  );
}
