import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-[#c59b27] px-3 py-1.5 text-xs font-bold text-[#14281d] hover:bg-[#b58c1e] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        تثبيت التطبيق
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#c59b27]/40 bg-[#c59b27]/15 px-3 py-1.5 text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] hover:bg-[#c59b27]/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          تثبيت على آيفون
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#12231a] p-6 shadow-xl border border-neutral-200 dark:border-emerald-900/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#145a3a] dark:text-[#dfbd69]">
                  تثبيت أكاديمية الإمام على جهازك
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري السفلي.
                <br />
                2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> ليعمل التطبيق بدون إنترنت.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#145a3a] py-2.5 text-sm font-bold text-white hover:bg-[#0f452c]"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineToast, setOfflineToast] = useState<{ show: boolean; msg: string; type: 'offline' | 'online' }>({
    show: false,
    msg: '',
    type: 'offline',
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineToast({
        show: true,
        msg: 'تمت استعادة الاتصال بالإنترنت بنجاح — جارٍ مزامنة بياناتك سحابياً ✓',
        type: 'online',
      });
      setTimeout(() => setOfflineToast((p) => ({ ...p, show: false })), 4500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineToast({
        show: true,
        msg: 'انقطع الاتصال بالإنترنت — التطبيق يعمل بالكامل دون اتصال وسيتم مزامنة البيانات تلقائياً فور عودة الاتصال ☁️',
        type: 'offline',
      });
      setTimeout(() => setOfflineToast((p) => ({ ...p, show: false })), 5500);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {offlineToast.show && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-2.5 transition-all duration-300 animate-in slide-in-from-top-4 ${
            offlineToast.type === 'offline'
              ? 'bg-amber-600 text-white border-amber-300 ring-2 ring-amber-400/40'
              : 'bg-emerald-700 text-white border-emerald-300 ring-2 ring-emerald-400/40'
          }`}
        >
          {offlineToast.type === 'offline' ? (
            <WifiOff className="w-5 h-5 shrink-0 animate-pulse text-amber-200" />
          ) : (
            <span className="text-emerald-200 text-base">✓</span>
          )}
          <span>{offlineToast.msg}</span>
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg border border-amber-400/50">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>وضع دون اتصال — الحفظ محلي وتلقائي وسيتم المزامنة لاحقاً</span>
        </div>
      )}
    </>
  );
};
