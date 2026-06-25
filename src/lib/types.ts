export type PayMode = 'annual' | 'monthly' | 'hourly';

export interface Settings {
  /** 입력 방식 */
  mode: PayMode;
  /** 모드에 따른 원 금액 (연봉 / 월급 / 시급) */
  amount: number;
  /** 출근 시각 "HH:MM" */
  startTime: string;
  /** 퇴근 시각 "HH:MM" */
  endTime: string;
  /** 점심시간 제외 여부 */
  excludeLunch: boolean;
  /** 점심 시작 "HH:MM" */
  lunchStart: string;
  /** 점심 종료 "HH:MM" */
  lunchEnd: string;
  /** 주 근무일 (1~7) */
  workDaysPerWeek: number;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'annual',
  amount: 36000000,
  startTime: '09:00',
  endTime: '18:00',
  excludeLunch: true,
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workDaysPerWeek: 5,
};
