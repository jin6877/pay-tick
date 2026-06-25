import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { DEFAULT_SETTINGS, type Settings } from './lib/types';
import { useLocalStorage } from './lib/useLocalStorage';
import { useNow } from './lib/useNow';
import { computeStats } from './lib/salary';
import Counter from './components/Counter';
import SettingsPanel from './components/SettingsPanel';
import ShareCard from './components/ShareCard';

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>('paytick.settings', DEFAULT_SETTINGS);
  const [hasVisited, setHasVisited] = useLocalStorage<{ done: boolean }>('paytick.visited', {
    done: false,
  });
  const [showSettings, setShowSettings] = useState(!hasVisited.done);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const now = useNow(true);
  const stats = useMemo(() => computeStats(settings, now), [settings, now]);
  const shareRef = useRef<HTMLDivElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(shareRef.current, {
        pixelRatio: 1,
        cacheBust: true,
        width: 1080,
        height: 1080,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'paytick.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '페이틱 · 오늘 번 돈',
        });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'paytick.png';
        a.click();
        flash('이미지를 저장했어요 📸');
      }
    } catch {
      flash('공유가 취소됐어요');
    } finally {
      setSharing(false);
    }
  };

  const closeSettings = () => {
    setShowSettings(false);
    setHasVisited({ done: true });
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-5 pb-10 pt-6 text-zinc-100">
      {/* 헤더 */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-amber-500 text-lg font-black text-zinc-950">
            ₩
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight">페이틱</div>
            <div className="text-[11px] text-zinc-500">실시간 월급 카운터</div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings((v) => !v)}
          aria-label="설정"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-300 transition active:scale-95"
        >
          ⚙️ 설정
        </button>
      </header>

      <main className="flex-1">
        {showSettings ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <SettingsPanel settings={settings} onChange={setSettings} onClose={closeSettings} />
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-5 shadow-2xl shadow-black/40">
              <Counter stats={stats} />
            </div>

            <button
              onClick={handleShare}
              disabled={sharing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 py-3.5 text-base font-bold text-zinc-950 transition active:scale-[0.98] disabled:opacity-60"
            >
              {sharing ? '카드 만드는 중…' : '📸 결과 카드 공유하기'}
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-600">
              인스타 스토리·카톡에 자랑하기 좋은 정사각 카드로 저장돼요
            </p>
          </>
        )}
      </main>

      <footer className="mt-6 text-center text-[11px] text-zinc-600">
        모든 계산은 브라우저에서만 이뤄지고 어디에도 전송되지 않아요.
        <br />
        <a
          href="#/widget"
          className="mt-1 inline-block text-zinc-500 underline-offset-2 transition hover:text-amber-300 hover:underline"
        >
          🪟 데스크톱 위젯 모드 미리보기
        </a>
      </footer>

      {/* 화면 밖 캡처용 카드 */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <ShareCard ref={shareRef} stats={stats} />
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-100 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
