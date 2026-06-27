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
  after: { text: '초과근무 · 계속 쌓이는 중', cls: 'bg-fuchsia-400/15 text-fuchsia-300' },
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
  // 퇴근 후 카운터가 멈춘 경우엔 배지 문구를 바꾼다
  const badge =
    stats.phase === 'after' && !stats.earning
      ? { text: '퇴근 완료 · 카운터 정지', cls: 'bg-zinc-400/15 text-zinc-300' }
      : PHASE_BADGE[stats.phase];
  const fun = funConversions(stats.earnedToday);
  const progressPct = Math.round(stats.progress * 100);

  // 실제로 돈이 쌓이는 중일 때만 동전 애니메이션
  const earning = stats.earning;

  return (
    <div className="relative flex flex-col items-center gap-5 py-2">
      <FloatingMoney active={earning} />

      <span
        className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold ${badge.cls}`}
      >
        {badge.text}
      </span>

      {/* 메인 카운터 (HERO) — 누적 총액 */}
      <div className="relative z-10 flex flex-col items-center py-1">
        <span className="mb-2 text-[13px] font-semibold tracking-wide text-zinc-400">
          오늘 지금까지 번 돈
        </span>
        <div className="flex items-end justify-center">
          <span className="tnum money-gradient text-[clamp(2.9rem,13vw,4.6rem)] font-black leading-[0.95] drop-shadow-[0_0_30px_rgba(251,191,36,0.25)]">
            {formatWon(stats.earnedToday, 2)}
          </span>
          <span className="mb-1.5 ml-1.5 text-2xl font-extrabold text-amber-300/80">원</span>
        </div>
        {stats.overtimeEarn > 0 && (
          <span className="mt-2 rounded-full bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
            초과근무 +{formatWon(stats.overtimeEarn)}원 🔥
          </span>
        )}
      </div>

      {/* 진행률 */}
      <div className="relative z-10 w-full">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>오늘 일급 {formatWon(stats.dailyTarget)}원</span>
          <span className="font-semibold text-amber-300">
            {progressPct}%{stats.overtimeEarn > 0 ? '+' : ''}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-[width] duration-300"
            style={{ width: `${Math.max(1.5, progressPct)}%` }}
          />
        </div>
      </div>

      {/* per second/minute/hour — 보조 지표 (작게) */}
      <div className="relative z-10 flex w-full items-center justify-center gap-1.5 text-xs text-zinc-500">
        {[
          { label: '초당', value: stats.perSec, dec: 2 },
          { label: '분당', value: stats.perMin, dec: 0 },
          { label: '시간당', value: stats.perHour, dec: 0 },
        ].map((it, i) => (
          <span key={it.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-zinc-700">·</span>}
            <span>{it.label}</span>
            <span className="tnum font-semibold text-zinc-300">{formatWon(it.value, it.dec)}원</span>
          </span>
        ))}
      </div>

      {/* 안내 문구 */}
      {stats.phase === 'working' ? (
        <p className="relative z-10 text-center text-sm leading-relaxed text-zinc-400">
          퇴근까지 <span className="font-semibold text-zinc-200">{formatDuration(stats.remainingMinutes)}</span>{' '}
          남았어요.
          <br />앞으로 <span className="font-bold text-emerald-300">{formatWon(stats.remainingEarn)}원</span> 더 법니다.
        </p>
      ) : stats.phase === 'lunch' ? (
        <p className="relative z-10 text-center text-sm text-zinc-400">
          점심시간이라 카운터는 잠시 멈췄어요. 식사 후 다시 쌓여요 🍽️
        </p>
      ) : stats.phase === 'before' ? (
        <p className="relative z-10 text-center text-sm text-zinc-400">
          출근하면 카운터가 시작돼요. 오늘 목표는{' '}
          <span className="font-bold text-amber-300">{formatWon(stats.dailyTarget)}원</span> 💪
        </p>
      ) : stats.earning ? (
        <p className="relative z-10 text-center text-sm leading-relaxed text-zinc-400">
          정규 근무는 끝났어요. 지금부터는{' '}
          <span className="font-bold text-fuchsia-300">초과근무 페이</span>로{' '}
          <span className="tnum font-semibold text-fuchsia-300">시간당 {formatWon(stats.overtimePerSec * 3600)}원</span>씩 쌓여요 🔥
        </p>
      ) : (
        <p className="relative z-10 text-center text-sm leading-relaxed text-zinc-400">
          정규 근무가 끝나 카운터를 멈췄어요.
          <br />오늘도 고생했어요 👏
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
