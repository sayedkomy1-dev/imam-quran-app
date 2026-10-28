import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as Record<string, boolean>).__AL_IMAM_APP_MOUNTED__ = true;

// Ensure image assets work seamlessly whether served from compiled dist/ root or unbuilt GitHub repo root
window.addEventListener(
  'error',
  (event) => {
    const target = event.target as HTMLImageElement | null;
    if (
      target &&
      target.tagName === 'IMG' &&
      target.src &&
      target.src.includes('/assets/aistudio/') &&
      !target.dataset.fallbackTried
    ) {
      target.dataset.fallbackTried = 'true';
      const idx = target.src.indexOf('/assets/aistudio/');
      target.src = './public' + target.src.slice(idx);
    }
  },
  true
);

createRoot(document.getElementById('root')!).render(<App />);
