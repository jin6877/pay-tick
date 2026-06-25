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

  // 방문자 OS 감지 -> 맞는 다운로드 버튼 강조
  const os = useMemo<'mac' | 'windows' | 'other'>(() => {
    if (typeof navigator === 'undefined') return 'other';
    const ua = `${navigator.userAgent} ${navigator.platform}`.toLowerCase();
    if (/mac|iphone|ipad|ipod/.test(ua)) return 'mac';
    if (/win/.test(ua)) return 'windows';
    return 'other';
  }, []);

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

      {/* 데스크톱 위젯 다운로드 */}
      <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
        <div className="text-sm font-bold text-emerald-300">🖥️ 데스크톱 위젯으로 받기</div>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
          화면 맨 위에 항상 떠서, 켜두면 번 돈이 실시간으로 차오르는 미니 위젯이에요.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href="/downloads/PayTick-mac.dmg"
            download
            className={`flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] ${
              os === 'mac'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950'
                : 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            🍎 Mac{os === 'mac' && ' · 추천'}
          </a>
          <a
            href="/downloads/PayTick-windows-setup.exe"
            download
            className={`flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold transition active:scale-[0.98] ${
              os === 'windows'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-zinc-950'
                : 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            🪟 Windows{os === 'windows' && ' · 추천'}
          </a>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-600">
          ⚠️ 별도 서명이 없는 앱이라, 처음 실행 시 보안 경고가 떠요. <b className="text-zinc-500">맥</b>은
          앱을 우클릭→"열기", <b className="text-zinc-500">윈도우</b>는 "추가 정보→실행"을 눌러주세요.
        </p>
      </section>

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
