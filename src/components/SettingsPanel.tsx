import type { PayMode, Settings } from '../lib/types';

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
}

const MODE_LABEL: Record<PayMode, string> = {
  annual: '연봉',
  monthly: '월급',
  hourly: '시급',
};

const PRESET: Record<PayMode, number[]> = {
  annual: [30000000, 40000000, 50000000, 70000000],
  monthly: [2500000, 3000000, 4000000, 5000000],
  hourly: [10030, 12000, 15000, 20000],
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-400/60 focus:bg-white/10';

export default function SettingsPanel({ settings, onChange, onClose }: Props) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">근무 설정</h2>
        <button
          onClick={onClose}
          className="rounded-lg bg-amber-400 px-4 py-1.5 text-sm font-bold text-zinc-950 transition active:scale-95"
        >
          완료
        </button>
      </div>

      {/* 모드 선택 */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-1">
        {(Object.keys(MODE_LABEL) as PayMode[]).map((m) => (
          <button
            key={m}
            onClick={() => update({ mode: m })}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              settings.mode === m
                ? 'bg-amber-400 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <Field label={`${MODE_LABEL[settings.mode]} (원)`}>
        <input
          type="number"
          inputMode="numeric"
          value={settings.amount || ''}
          onChange={(e) => update({ amount: Number(e.target.value) || 0 })}
          className={`${inputCls} tnum text-base`}
          placeholder="금액 입력"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
          {PRESET[settings.mode].map((p) => (
            <button
              key={p}
              onClick={() => update({ amount: p })}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 transition hover:border-amber-400/40 hover:text-amber-300"
            >
              {p.toLocaleString('ko-KR')}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="출근 시각">
          <input
            type="time"
            value={settings.startTime}
            onChange={(e) => update({ startTime: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="퇴근 시각">
          <input
            type="time"
            value={settings.endTime}
            onChange={(e) => update({ endTime: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-medium text-zinc-200">점심시간 제외</span>
          <input
            type="checkbox"
            checked={settings.excludeLunch}
            onChange={(e) => update({ excludeLunch: e.target.checked })}
            className="h-5 w-5 accent-amber-400"
          />
        </label>
        {settings.excludeLunch && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="점심 시작">
              <input
                type="time"
                value={settings.lunchStart}
                onChange={(e) => update({ lunchStart: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="점심 종료">
              <input
                type="time"
                value={settings.lunchEnd}
                onChange={(e) => update({ lunchEnd: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>

      {/* 근무시간 외 정지 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
        <label className="flex cursor-pointer items-start justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-zinc-200">근무시간 외엔 멈추기</span>
            <span className="text-[11px] leading-snug text-zinc-500">
              정규 퇴근 시각이 지나면 카운터를 멈춰요.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.stopOutsideWork}
            onChange={(e) => update({ stopOutsideWork: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
          />
        </label>
      </div>

      {/* 초과근무 페이 */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
        <label className="flex cursor-pointer items-start justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-zinc-200">초과근무 페이 발생</span>
            <span className="text-[11px] leading-snug text-zinc-500">
              정규 퇴근 이후엔 초과근무 시급으로 따로 쌓여요.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.overtimeEnabled}
            onChange={(e) => update({ overtimeEnabled: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
          />
        </label>
        {settings.overtimeEnabled && (
          <div className="mt-3">
            <Field label="초과근무 시급 (원)">
              <input
                type="number"
                inputMode="numeric"
                value={settings.overtimeHourly || ''}
                onChange={(e) => update({ overtimeHourly: Number(e.target.value) || 0 })}
                className={`${inputCls} tnum text-base`}
                placeholder="예: 시급의 1.5배"
              />
            </Field>
          </div>
        )}
      </div>

      <Field label="주 근무일">
        <div className="grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              onClick={() => update({ workDaysPerWeek: d })}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                settings.workDaysPerWeek === d
                  ? 'bg-amber-400 text-zinc-950'
                  : 'border border-white/10 bg-white/5 text-zinc-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Field>

      <p className="pt-1 text-center text-[11px] text-zinc-600">
        페이틱 v{__APP_VERSION__}
      </p>
    </div>
  );
}
