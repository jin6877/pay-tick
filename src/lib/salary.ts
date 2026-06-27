import type { Settings } from './types';

const WEEKS_PER_YEAR = 52;

/** "HH:MM" -> 자정 기준 분 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 점심을 뺀 하루 순수 근무 시간(분). 음수 방지. */
export function workMinutesPerDay(s: Settings): number {
  const start = toMinutes(s.startTime);
  const end = toMinutes(s.endTime);
  let total = end - start;
  if (total <= 0) total = 0;

  if (s.excludeLunch) {
    const ls = Math.max(toMinutes(s.lunchStart), start);
    const le = Math.min(toMinutes(s.lunchEnd), end);
    const lunch = Math.max(0, le - ls);
    total -= lunch;
  }
  return Math.max(0, total);
}

/**
 * 초당 버는 금액(원). 입력 모드에 따라 환산.
 * - annual: 연봉 / (주근무일 * 52) = 일급, 그걸 하루 근무시간으로 나눔
 * - monthly: 월급 * 12 로 연봉화 후 동일
 * - hourly: 시급 그대로
 */
export function perSecond(s: Settings): number {
  const workMin = workMinutesPerDay(s);
  if (workMin <= 0) return 0;

  let hourly: number;
  if (s.mode === 'hourly') {
    hourly = s.amount;
  } else {
    const annual = s.mode === 'monthly' ? s.amount * 12 : s.amount;
    const workDaysPerYear = s.workDaysPerWeek * WEEKS_PER_YEAR;
    if (workDaysPerYear <= 0) return 0;
    const daily = annual / workDaysPerYear;
    hourly = daily / (workMin / 60);
  }
  return hourly / 3600;
}

export interface LiveStats {
  /** 오늘 출근 후 지금까지 번 돈(원) — 누적, 절대 줄어들거나 멈추지 않음 */
  earnedToday: number;
  /** 오늘 일급(정규 근무 기준 목표) */
  dailyTarget: number;
  /** 진행률 0~1 (정규 일급 대비) */
  progress: number;
  /** 정규 일급을 넘어 추가로 번 금액 (초과근무) */
  overtimeEarn: number;
  /** 초당 */
  perSec: number;
  /** 분당 */
  perMin: number;
  /** 시간당 */
  perHour: number;
  /** 근무 시작 전 / 근무 중 / 점심 / 초과근무(정규 종료 이후 계속 켜둠) */
  phase: 'before' | 'working' | 'after' | 'lunch';
  /** 퇴근까지 남은 분 (근무 중일 때) */
  remainingMinutes: number;
  /** 퇴근까지 더 벌 금액 */
  remainingEarn: number;
  /** 지금 이 순간 돈이 실제로 쌓이고 있는지 (애니메이션·문구 분기용) */
  earning: boolean;
  /** 초과근무 시급 적용 중 초당 금액 (초과근무 단계일 때) */
  overtimePerSec: number;
}

/**
 * 정규 퇴근(end) 이후 초과근무 구간의 초당 금액.
 * - overtimeEnabled: 별도 초과근무 시급으로 계산 (시급과 다른 경우가 많음)
 * - stopOutsideWork: 근무시간 외엔 멈춤 → 0
 * - 둘 다 아니면: 기존 동작(정규 초당 비율로 계속 누적)
 */
function overtimePerSecond(s: Settings, regularPerSec: number): number {
  if (s.overtimeEnabled) return Math.max(0, s.overtimeHourly) / 3600;
  if (s.stopOutsideWork) return 0;
  return regularPerSec;
}

/**
 * now(ms) 기준으로 오늘 번 돈 계산.
 * - 점심시간엔 카운터 정지.
 * - 정규 퇴근 시각 이후에도 페이지를 켜두면 같은 초당 비율로 "초과근무"로 계속 누적.
 *   누적 금액은 절대 0으로 리셋되거나 일급에서 멈추지 않는다.
 */
export function computeStats(s: Settings, now: Date): LiveStats {
  const perSec = perSecond(s);
  const workMin = workMinutesPerDay(s);
  const dailyTarget = perSec * workMin * 60;

  const nowMin =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;

  const start = toMinutes(s.startTime);
  const end = toMinutes(s.endTime);
  const ls = s.excludeLunch ? toMinutes(s.lunchStart) : -1;
  const le = s.excludeLunch ? toMinutes(s.lunchEnd) : -1;

  const otPerSec = overtimePerSecond(s, perSec);
  const base = {
    perSec,
    perMin: perSec * 60,
    perHour: perSec * 3600,
    overtimePerSec: otPerSec,
  };

  // 출근 전
  if (nowMin < start) {
    return {
      ...base,
      earnedToday: 0,
      dailyTarget,
      progress: 0,
      overtimeEarn: 0,
      phase: 'before',
      remainingMinutes: workMin,
      remainingEarn: dailyTarget,
      earning: false,
    };
  }

  const isAfterEnd = nowMin >= end;

  // ── 정규 근무 구간(start ~ min(now, end)) 유효 분 (점심 제외) ──
  const regNow = Math.min(nowMin, end);
  let regularMin = regNow - start;
  if (s.excludeLunch && le > ls) {
    if (regNow >= le) {
      regularMin -= le - ls; // 점심 통째로 제외
    } else if (regNow >= ls) {
      regularMin = ls - start; // 점심 직전까지만
    }
  }
  regularMin = Math.max(0, regularMin);
  const regularEarn = perSec * regularMin * 60;

  // 점심 중인지(정규 종료 전, 점심 시간대)
  const isLunch = !isAfterEnd && s.excludeLunch && le > ls && nowMin >= ls && nowMin < le;

  // ── 초과근무 구간(end 이후) ──
  const overtimeMin = isAfterEnd ? nowMin - end : 0;
  const overtimeEarn = otPerSec * overtimeMin * 60;

  const earnedToday = regularEarn + overtimeEarn;
  const remainingMinutes = isAfterEnd ? 0 : Math.max(0, workMin - regularMin);

  // 실제로 돈이 쌓이는 중인가
  const earning = isAfterEnd ? otPerSec > 0 : !isLunch;

  return {
    ...base,
    earnedToday,
    dailyTarget,
    progress: dailyTarget > 0 ? Math.min(1, earnedToday / dailyTarget) : 0,
    overtimeEarn,
    phase: isLunch ? 'lunch' : isAfterEnd ? 'after' : 'working',
    remainingMinutes,
    remainingEarn: Math.max(0, dailyTarget - regularEarn),
    earning,
  };
}
