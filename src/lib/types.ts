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
  /** 근무시간 외(정규 퇴근 이후)에는 카운터를 멈춘다 */
  stopOutsideWork: boolean;
  /** 초과근무 시 페이가 발생하는지 여부 */
  overtimeEnabled: boolean;
  /** 초과근무 시급(원). 시급과 다른 경우가 많아 별도로 입력 */
  overtimeHourly: number;
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
  stopOutsideWork: false,
  overtimeEnabled: false,
  overtimeHourly: 0,
};
