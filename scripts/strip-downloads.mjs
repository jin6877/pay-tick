// Tauri 빌드 전용: dist/downloads (설치파일 자체 호스팅용 폴더)를 번들에서 제외한다.
// 이걸 안 하면 Tauri가 dist를 통째로 앱에 넣으면서, 새 버전이 이전 설치파일을
// 자기 안에 품어 앱 크기가 매 릴리스마다 눈덩이처럼 커진다.
import { rmSync } from 'node:fs';

rmSync(new URL('../dist/downloads', import.meta.url), { recursive: true, force: true });
console.log('[build:app] dist/downloads 제거 완료 (Tauri 번들 비대화 방지)');
