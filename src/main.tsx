import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Widget from './components/Widget.tsx'
import { isWidgetMode } from './lib/tauri.ts'

const widget = isWidgetMode()

// 브라우저에서 풀화면 <-> 위젯 해시 전환 시 한 번 새로고침해 올바른 루트를 렌더
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    if (isWidgetMode() !== widget) window.location.reload()
  })
}

// 위젯 모드에서는 창 배경을 투명하게 (프레임리스 글래스)
if (widget) {
  document.documentElement.classList.add('widget-mode')
  document.body.classList.add('widget-mode')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{widget ? <Widget /> : <App />}</StrictMode>,
)
