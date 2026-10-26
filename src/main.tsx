import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 首屏渲染前确定深浅主题：优先用户选择，其次跟随系统
const THEME_KEY = 'app-theme';
try {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', theme === 'dark');
} catch {
  // 本地存储不可用时保持浅色
}

createRoot(document.getElementById('root')!).render(<App />);
