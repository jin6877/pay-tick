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
  /** 오늘 출근 후 지금까지 번 돈(원) */
  earnedToday: number;
  /** 오늘 일급(목표) */
  dailyTarget: number;
  /** 진행률 0~1 */
  progress: number;
  /** 초당 */
  perSec: number;
  /** 분당 */
  perMin: number;
  /** 시간당 */
  perHour: number;
  /** 근무 시작 전 / 근무 중 / 근무 종료 */
  phase: 'before' | 'working' | 'after' | 'lunch';
  /** 퇴근까지 남은 분 (근무 중일 때) */
  remainingMinutes: number;
  /** 퇴근까지 더 벌 금액 */
  remainingEarn: number;
}

/**
 * now(ms) 기준으로 오늘 번 돈 계산.
 * 점심시간엔 카운터 정지.
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

  // 출근 전
  if (nowMin < start) {
    return {
      earnedToday: 0,
      dailyTarget,
      progress: 0,
      perSec,
      perMin: perSec * 60,
      perHour: perSec * 3600,
      phase: 'before',
      remainingMinutes: workMin,
      remainingEarn: dailyTarget,
    };
  }

  // 퇴근 후
  if (nowMin >= end) {
    return {
      earnedToday: dailyTarget,
      dailyTarget,
      progress: 1,
      perSec,
      perMin: perSec * 60,
      perHour: perSec * 3600,
      phase: 'after',
      remainingMinutes: 0,
      remainingEarn: 0,
    };
  }

  // 근무 시간 내: 시작부터 지금까지의 "유효 근무 분" 계산 (점심 제외)
  let elapsedWorkMin = nowMin - start;
  let isLunch = false;
  if (s.excludeLunch && le > ls) {
    if (nowMin >= le) {
      // 점심 끝난 뒤 -> 점심 통째로 제외
      elapsedWorkMin -= le - ls;
    } else if (nowMin >= ls) {
      // 점심 중 -> 점심 시작 직전까지만
      elapsedWorkMin = ls - start;
      isLunch = true;
    }
  }
  elapsedWorkMin = Math.max(0, elapsedWorkMin);

  const earnedToday = perSec * elapsedWorkMin * 60;
  const remainingMinutes = Math.max(0, workMin - elapsedWorkMin);

  return {
    earnedToday,
    dailyTarget,
    progress: dailyTarget > 0 ? Math.min(1, earnedToday / dailyTarget) : 0,
    perSec,
    perMin: perSec * 60,
    perHour: perSec * 3600,
    phase: isLunch ? 'lunch' : 'working',
    remainingMinutes,
    remainingEarn: Math.max(0, dailyTarget - earnedToday),
  };
}
