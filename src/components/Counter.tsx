import { useEffect, useRef, useState } from 'react';
import type { LiveStats } from '../lib/salary';
import { formatWon, formatDuration, funConversions } from '../lib/format';

interface Props {
  stats: LiveStats;
}

const PHASE_BADGE: Record<LiveStats['phase'], { text: string; cls: string }> = {
  before: { text: '아직 출근 전', cls: 'bg-sky-400/15 text-sky-300' },
  working: { text: '근무 중 · 돈 버는 중', cls: 'bg-emerald-400/15 text-emerald-300' },
  lunch: { text: '점심시간 · 카운터 정지', cls: 'bg-orange-400/15 text-orange-300' },
  after: { text: '오늘 근무 끝! 수고했어요', cls: 'bg-amber-400/15 text-amber-300' },
};

function FloatingMoney({ active }: { active: boolean }) {
  const [bits, setBits] = useState<{ id: number; left: number; delay: number; emoji: string }[]>(
    [],
  );
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const emojis = ['💸', '💵', '🪙', '💰'];
    const t = setInterval(() => {
      const id = idRef.current++;
      setBits((prev) => [
        ...prev.slice(-8),
        {
          id,
          left: 10 + Math.random() * 80,
          delay: 0,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        },
      ]);
      setTimeout(() => setBits((prev) => prev.filter((b) => b.id !== id)), 2600);
    }, 900);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-6 text-2xl"
          style={{ left: `${b.left}%`, animation: 'float-up 2.6s ease-out forwards' }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}

export default function Counter({ stats }: Props) {
  const badge = PHASE_BADGE[stats.phase];
  const fun = funConversions(stats.earnedToday);
  const progressPct = Math.round(stats.progress * 100);

  return (
    <div className="relative flex flex-col items-center gap-6 py-2">
      <FloatingMoney active={stats.phase === 'working'} />

      <span
        className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold ${badge.cls}`}
      >
        {badge.text}
      </span>

      {/* 메인 카운터 */}
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-1 text-xs font-medium tracking-wide text-zinc-500">
          오늘 지금까지 번 돈
        </span>
        <div className="flex items-end justify-center">
          <span className="tnum money-gradient text-[clamp(2.2rem,9.5vw,3.5rem)] font-black leading-none">
            {formatWon(stats.earnedToday, 2)}
          </span>
          <span className="mb-1 ml-1 text-xl font-bold text-amber-300/80">원</span>
        </div>
      </div>

      {/* 진행률 */}
      <div className="relative z-10 w-full">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>오늘 일급 {formatWon(stats.dailyTarget)}원</span>
          <span className="font-semibold text-amber-300">{progressPct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-[width] duration-300"
            style={{ width: `${Math.max(1.5, progressPct)}%` }}
          />
        </div>
      </div>

      {/* per second/minute/hour */}
      <div className="relative z-10 grid w-full grid-cols-3 gap-2.5">
        {[
          { label: '초당', value: stats.perSec, dec: 2 },
          { label: '분당', value: stats.perMin, dec: 0 },
          { label: '시간당', value: stats.perHour, dec: 0 },
        ].map((it) => (
          <div
            key={it.label}
            className="rounded-2xl border border-white/5 bg-white/[0.03] px-2 py-3 text-center"
          >
            <div className="text-[11px] font-medium text-zinc-500">{it.label}</div>
            <div className="tnum mt-0.5 text-base font-bold text-zinc-100">
              {formatWon(it.value, it.dec)}
            </div>
            <div className="text-[10px] text-zinc-600">원</div>
          </div>
        ))}
      </div>

      {/* 안내 문구 */}
      {stats.phase === 'working' || stats.phase === 'lunch' ? (
        <p className="relative z-10 text-center text-sm leading-relaxed text-zinc-400">
          퇴근까지 <span className="font-semibold text-zinc-200">{formatDuration(stats.remainingMinutes)}</span>{' '}
          남았어요.
          <br />앞으로 <span className="font-bold text-emerald-300">{formatWon(stats.remainingEarn)}원</span> 더 법니다.
        </p>
      ) : stats.phase === 'before' ? (
        <p className="relative z-10 text-center text-sm text-zinc-400">
          출근하면 카운터가 시작돼요. 오늘 목표는{' '}
          <span className="font-bold text-amber-300">{formatWon(stats.dailyTarget)}원</span> 💪
        </p>
      ) : (
        <p className="relative z-10 text-center text-sm text-zinc-400">
          오늘 일당 <span className="font-bold text-amber-300">{formatWon(stats.dailyTarget)}원</span> 완납! 내일 또 만나요 🎉
        </p>
      )}

      {/* 재미 환산 */}
      <div className="relative z-10 w-full rounded-2xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
        <div className="mb-2.5 text-xs font-semibold text-amber-300/90">
          🛒 지금까지 번 돈이면…
        </div>
        <div className="flex flex-col gap-2">
          {fun.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-200">
              <span className="text-xl">{f.emoji}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
