import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as Record<string, boolean>).__AL_IMAM_APP_MOUNTED__ = true;

const INLINE_SVG_FALLBACK_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#145a3a"/><rect x="10" y="10" width="172" height="172" rx="34" fill="none" stroke="#c59b27" stroke-width="4"/><text x="96" y="106" text-anchor="middle" fill="#f6d878" font-family="Cairo,sans-serif" font-size="24" font-weight="800">أكاديمية الإمام</text><text x="96" y="138" text-anchor="middle" fill="#ffffff" font-family="Cairo,sans-serif" font-size="16" font-weight="700">بالقرآن نحيا</text></svg>`
  );

// Ensure image assets work seamlessly and never show broken icons
window.addEventListener(
  'error',
  (event) => {
    const target = event.target as HTMLImageElement | null;
    if (target && target.tagName === 'IMG' && !target.dataset.fallbackTried) {
      target.dataset.fallbackTried = 'true';
      target.src = '/icon.svg';
      target.onerror = () => {
        target.src = INLINE_SVG_FALLBACK_DATA_URL;
      };
    }
  },
  true
);

interface GlobalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  GlobalErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: unknown): GlobalErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'خطأ غير متوقع');
    return {
      hasError: true,
      errorMessage: msg,
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('[Al-Imam GlobalErrorBoundary]', error, errorInfo);
  }

  handleSafeResetAndReload = () => {
    try {
      // Clear transient/corrupted session & firebase keys while preserving backup snapshots if possible
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('firebase:') ||
            k.includes('session_restore') ||
            k === 'imam_academy_pwa_store_v13_sanitized')
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  handleSoftReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-[#0d3b26] to-slate-950 text-white p-4 font-sans"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-md border-2 border-[#c59b27]/60 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#c59b27]/20 border-2 border-[#c59b27] flex items-center justify-center mx-auto text-3xl shadow-lg">
              🕌
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-amber-300">
                أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                حدث تعارض مؤقت أثناء قراءة الذاكرة المحلية للمتصفح. يمكنك إعادة ضبط وتحديث الصفحة فوراً بضغطة واحدة ليعمل التطبيق بكامل كفاءته.
              </p>
            </div>

            {this.state.errorMessage && (
              <div
                dir="ltr"
                className="p-3 rounded-xl bg-black/30 border border-white/15 text-[11px] font-mono text-amber-200/90 text-left overflow-x-auto max-h-24"
              >
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleSafeResetAndReload}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-l from-[#c59b27] to-amber-400 text-[#14281d] font-black text-xs sm:text-sm shadow-lg hover:opacity-95 transition cursor-pointer"
              >
                🔄 إعادة ضبط وتحديث الصفحة فوراً
              </button>
              <button
                type="button"
                onClick={this.handleSoftReload}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                إعادة المحاولة بدون مسح الذاكرة
              </button>
            </div>

            <div className="pt-3 border-t border-white/15 text-[11px] text-emerald-200/80">
              تصميم وتطوير: Sayed Mohamed Elkomy | واتساب الدعم الفني:{' '}
              <a
                href="https://wa.me/201068631966"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 font-bold underline"
                dir="ltr"
              >
                +201068631966
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);
