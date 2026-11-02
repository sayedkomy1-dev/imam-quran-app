import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ——— 1. Signal React is mounted (used by splash screen rescue button logic) ———
(window as unknown as Record<string, boolean>).__AL_IMAM_APP_MOUNTED__ = true;

// ——— 2. Fallback SVG for broken images ———
const INLINE_SVG_FALLBACK_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#145a3a"/><rect x="10" y="10" width="172" height="172" rx="34" fill="none" stroke="#c59b27" stroke-width="4"/><text x="96" y="100" text-anchor="middle" fill="#f6d878" font-family="Cairo,sans-serif" font-size="22" font-weight="800">أكاديمية الإمام</text><text x="96" y="132" text-anchor="middle" fill="#ffffff" font-family="Cairo,sans-serif" font-size="14" font-weight="700">بالقرآن نحيا</text></svg>`
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
        target.onerror = null; // prevent infinite loop
      };
    }
  },
  true
);

// ——— 3. Global audio / media cleanup on page hide (Cleanup on Unmount) ———
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause all playing audio/video when the tab is hidden to prevent ghost audio
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((media) => {
      if (!media.paused) {
        media.pause();
      }
    });
  }
});

// ——— 4. Global ErrorBoundary ———
interface GlobalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
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
      errorStack: '',
    };
  }

  static getDerivedStateFromError(error: unknown): GlobalErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'خطأ غير متوقع');
    const stack = error instanceof Error ? (error.stack || '') : '';
    return {
      hasError: true,
      errorMessage: msg,
      errorStack: stack,
    };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('[Al-Imam GlobalErrorBoundary] Caught error:', error);
    console.error('[Al-Imam GlobalErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleSafeResetAndReload = () => {
    try {
      // Clear transient/corrupted session & firebase keys while preserving backup snapshots
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
      // ignore storage errors in restricted environments
    }
    window.location.reload();
  };

  handleSoftReload = () => {
    this.setState({ hasError: false, errorMessage: '', errorStack: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-[#0d3b26] to-slate-950 text-white p-4 font-sans"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white/10 backdrop-blur-md border-2 border-[#c59b27]/60 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#c59b27]/20 border-2 border-[#c59b27] flex items-center justify-center mx-auto text-3xl shadow-lg">
              🕌
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-amber-300">
                أكاديمية الإمام لتحفيظ القرآن الكريم
              </h1>
              <p className="text-sm font-bold text-amber-200/80">بالقرآن نحيا</p>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed mt-2">
                حدث تعارض مؤقت أثناء قراءة الذاكرة المحلية. يمكنك إعادة ضبط وتحديث التطبيق
                فوراً بضغطة واحدة ليعمل بكامل كفاءته.
              </p>
            </div>

            {/* Error details (collapsible) */}
            {this.state.errorMessage && (
              <details className="text-right">
                <summary className="text-xs text-amber-200/70 cursor-pointer hover:text-amber-200 transition">
                  عرض تفاصيل الخطأ (للمطور)
                </summary>
                <div
                  dir="ltr"
                  className="mt-2 p-3 rounded-xl bg-black/30 border border-white/15 text-[11px] font-mono text-amber-200/90 text-left overflow-x-auto max-h-32"
                >
                  <strong>{this.state.errorMessage}</strong>
                  {this.state.errorStack && (
                    <pre className="mt-1 text-[10px] text-white/50 whitespace-pre-wrap">
                      {this.state.errorStack.slice(0, 600)}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleSafeResetAndReload}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-l from-[#c59b27] to-amber-400 text-[#14281d] font-black text-sm shadow-lg hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                🔄 إعادة ضبط وتحديث فوري
              </button>
              <button
                type="button"
                onClick={this.handleSoftReload}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition cursor-pointer"
              >
                ↩ إعادة المحاولة
              </button>
            </div>

            {/* WhatsApp Support */}
            <div className="pt-3 border-t border-white/15 text-[11px] text-emerald-200/80 space-y-1">
              <p>
                تصميم وتطوير: <strong className="text-amber-300">Sayed Mohamed Elkomy</strong>
              </p>
              <p>
                <span>واتساب الدعم الفني: </span>
                <a
                  href="https://wa.me/201068631966"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 font-bold underline"
                  dir="ltr"
                >
                  +201068631966
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ——— 5. Mount React App ———
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
} else {
  // Fallback: create root element if not found (safety net)
  const fallbackRoot = document.createElement('div');
  fallbackRoot.id = 'root';
  document.body.appendChild(fallbackRoot);
  createRoot(fallbackRoot).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  );
}
