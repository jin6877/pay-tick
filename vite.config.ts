import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Tauri dev 서버가 기대하는 고정 포트 (웹/Vercel 빌드에는 영향 없음)
  server: {
    port: 5173,
    strictPort: true,
  },
  // 상대 경로로 빌드해 Tauri의 로컬 file 로딩에서도 안전 (Vercel 루트 배포에도 호환)
  base: './',
})
