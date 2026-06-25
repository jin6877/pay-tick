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

  const base = {
    perSec,
    perMin: perSec * 60,
    perHour: perSec * 3600,
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
    };
  }

  // 시작부터 지금까지의 "유효 근무 분" 계산 (점심 제외). 정규 종료 이후엔 계속 누적(초과근무).
  let elapsedWorkMin = nowMin - start;
  let isLunch = false;
  if (s.excludeLunch && le > ls) {
    if (nowMin >= le) {
      // 점심 끝난 뒤 -> 점심 통째로 제외
      elapsedWorkMin -= le - ls;
    } else if (nowMin >= ls) {
      // 점심 중 -> 점심 시작 직전까지만, 카운터 정지
      elapsedWorkMin = ls - start;
      isLunch = true;
    }
  }
  elapsedWorkMin = Math.max(0, elapsedWorkMin);

  // 누적 금액: 정규 일급에서 cap 하지 않고 계속 상승
  const earnedToday = perSec * elapsedWorkMin * 60;

  // 정규 종료 이후면 초과근무 단계 (그래도 누적은 계속 올라감)
  const isAfterEnd = nowMin >= end;
  const overtimeEarn = Math.max(0, earnedToday - dailyTarget);
  const remainingMinutes = isAfterEnd ? 0 : Math.max(0, workMin - elapsedWorkMin);

  return {
    ...base,
    earnedToday,
    dailyTarget,
    progress: dailyTarget > 0 ? Math.min(1, earnedToday / dailyTarget) : 0,
    overtimeEarn,
    phase: isLunch ? 'lunch' : isAfterEnd ? 'after' : 'working',
    remainingMinutes,
    remainingEarn: Math.max(0, dailyTarget - earnedToday),
  };
}
