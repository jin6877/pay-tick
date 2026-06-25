# 페이틱 (pay-tick) 💸

> 출근한 순간부터 "내가 지금까지 얼마나 벌었는지" 누적 총액이 초마다 끝없이 차오르는 실시간 월급 카운터

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)

🔗 **라이브 데모: https://pay-tick.vercel.app**

![앱 스크린샷](docs/screenshot.png)

## 소개

연봉·월급·시급과 근무 시간만 입력하면, 출근한 시점부터 지금까지 번 **누적 총액**이
소수점까지 실시간으로 끝없이 올라갑니다. 켜둘수록 큰 숫자가 계속 차올라
"내가 이만큼 벌었다"는 누적 쾌감을 줍니다. 점심시간엔 카운터도 같이 쉬어요.
캡처해서 SNS에 자랑하기 좋은 정사각 결과 카드도 만들어 줍니다.

## ✨ 주요 기능

- 💰 **누적 총액이 주인공** — 출근 시점부터 지금까지 번 돈이 대형 카운터로 초마다 부드럽게 상승
- ♾️ **멈추지 않는 카운터** — 정규 퇴근 시각이 지나도 "초과근무"로 계속 쌓이고, 일급에서 cap 되거나 0으로 리셋되지 않음
- ⏱️ **실시간 카운트업** — `requestAnimationFrame` 기반 ~60fps로 소수점 둘째 자리까지 부드럽게 증가
- 💵 **유연한 입력** — 연봉 / 월급 / 시급 중 선택, 프리셋 버튼 제공
- 🕘 **근무 형태 설정** — 출근·퇴근 시각, 점심시간 제외, 주 근무일(1~7일)
- 📊 **보조 지표** — 초당·분당·시간당 수입, 오늘 일급 대비 진행률 바(초과 시 +로 표시)
- 🛒 **재미 환산** — 지금까지 번 돈으로 살 수 있는 삼각김밥·아메리카노·치킨 개수
- 📸 **결과 카드 공유** — 인스타·카톡용 1080×1080 정사각 카드 PNG로 저장/공유
- 💾 **자동 저장** — 연봉·근무 설정 등 모든 입력값이 localStorage에 저장되어 새로고침·재방문 시 그대로 유지
- 🔒 **완전 클라이언트** — 모든 계산은 브라우저에서만, 서버 전송 없음
- 🪟 **데스크톱 위젯 (신규)** — 화면 위에 항상 떠 있는 작은 글래스 위젯으로 누적 금액이 실시간으로 차오름 (macOS · Windows)

## 🪟 데스크톱 위젯

웹 버전과 동일한 코드를 **Tauri v2**로 감싼 데스크톱 앱입니다. 화면 위에 항상 떠 있는
작은 반투명 글래스 창에 누적 금액이 큼직하게 실시간으로 올라갑니다. 설정값(연봉·근무시간)은
웹과 동일한 localStorage를 공유합니다.

### 사용법

- **창**: ~240×112 의 프레임리스·반투명·항상 맨 위(always-on-top) 창. 모든 작업공간(스페이스)에 표시됩니다.
- **이동**: 위젯 상단 영역을 드래그하면 원하는 위치로 옮길 수 있습니다.
- **⚙ 설정**: 위젯의 톱니 버튼을 누르면 풀화면 설정 창이 열려 연봉·근무시간을 편집합니다. 저장 즉시 위젯에 반영됩니다.
- **숨기기/종료**: 위젯의 `–` 버튼으로 트레이로 숨기고, `✕` 또는 메뉴바 트레이 아이콘의 **종료**로 끕니다. 트레이 메뉴에서 위젯 다시 보이기/설정 열기도 가능합니다.
- 브라우저에서 위젯 모드를 미리 보려면 주소 뒤에 `#/widget` (또는 `?widget=1`)을 붙이세요. 풀화면 하단의 "데스크톱 위젯 모드 미리보기" 링크로도 열립니다.

### 다운로드 (릴리스)

`v*` 태그를 push하거나 GitHub Actions에서 **Release (Tauri desktop)** 워크플로를 수동 실행하면
macOS(`.dmg`, universal)와 Windows(`.msi`/`.exe`)가 빌드되어 [GitHub Releases](https://github.com/jin6877/pay-tick/releases)에 올라갑니다.

```bash
# 예: 릴리스 태그 푸시
git tag v0.1.0 && git push origin v0.1.0
```

### 로컬에서 데스크톱 앱 실행/빌드

> Rust 툴체인 필요. macOS는 Xcode, Windows는 MSVC 빌드 도구가 있어야 합니다.

```bash
npm run tauri:dev     # 개발 모드(핫리로드)
npm run tauri:build   # 설치 패키지 빌드 (.dmg / .msi)
```

빌드 산출물(맥):

- `src-tauri/target/release/bundle/dmg/페이틱_<버전>_aarch64.dmg`
- `src-tauri/target/release/bundle/macos/페이틱.app`

## 🛠 기술 스택

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- html-to-image (결과 카드 캡처)
- Pretendard 폰트
- Tauri v2 (데스크톱 위젯 · macOS/Windows)

## 🚀 로컬 실행

```bash
npm install && npm run dev
```

빌드:

```bash
npm run build && npm run preview
```

## 📁 계산 로직

- `src/lib/salary.ts` — 연봉/월급/시급을 초당 수입으로 환산하고, 점심시간을 제외한
  유효 근무 시간 기준으로 "오늘 지금까지 번 돈(누적)"을 계산합니다. 정규 퇴근 이후엔
  같은 비율로 초과근무 누적이 이어져 카운터가 멈추지 않습니다.
- `src/lib/useNow.ts` — rAF 기반 시계 훅으로 매 프레임 리렌더하여 카운터가 부드럽게 올라갑니다.

---

made with ☕ and 💸
