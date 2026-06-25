import { forwardRef } from 'react';
import type { LiveStats } from '../lib/salary';
import { formatWon, funConversions } from '../lib/format';

interface Props {
  stats: LiveStats;
}

/**
 * 캡처/공유용 카드. 화면 밖에 렌더해두고 html-to-image로 PNG 캡처한다.
 * 1080x1080 인스타 정사각 비율.
 */
const ShareCard = forwardRef<HTMLDivElement, Props>(({ stats }, ref) => {
  const fun = funConversions(stats.earnedToday).slice(0, 2);
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1080,
        background: 'radial-gradient(circle at 30% 20%, #1a1206 0%, #07080d 60%)',
        fontFamily: "'Pretendard', system-ui, sans-serif",
        padding: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg,#fde68a,#f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 900,
            color: '#07080d',
          }}
        >
          ₩
        </div>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#fafafa' }}>페이틱</div>
          <div style={{ fontSize: 22, color: '#a1a1aa' }}>{dateStr} · 실시간 월급 카운터</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 30, color: '#a1a1aa', fontWeight: 600 }}>
          오늘 지금까지 번 돈
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <span
            style={{
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              background: 'linear-gradient(90deg,#fbbf24,#fde68a,#34d399)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {formatWon(stats.earnedToday, 0)}
          </span>
          <span style={{ fontSize: 56, fontWeight: 800, color: '#fcd34d', marginLeft: 12 }}>
            원
          </span>
        </div>
        <div style={{ fontSize: 26, color: '#71717a', marginTop: 8 }}>
          시간당 {formatWon(stats.perHour)}원
          {stats.overtimeEarn > 0
            ? ` · 일급 초과 +${formatWon(stats.overtimeEarn)}원 🔥`
            : ` · 일급 진행률 ${Math.round(stats.progress * 100)}%`}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.18)',
          borderRadius: 28,
          padding: '34px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fcd34d' }}>🛒 이 돈이면…</div>
        {fun.map((f, i) => (
          <div key={i} style={{ fontSize: 34, color: '#e4e4e7', fontWeight: 600 }}>
            {f.emoji} {f.text}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', fontSize: 24, color: '#52525b', fontWeight: 600 }}>
        pay-tick · 나도 지금 얼마 버는지 확인하기
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
