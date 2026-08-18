import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { resolveInitialTheme } from './state/use-theme';
import './index.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('未找到 #root 容器，index.html 可能被修改过。');
}

// 首帧之前定好主题，避免深色用户先看到一闪的浅色底
document.documentElement.dataset.theme = resolveInitialTheme();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
