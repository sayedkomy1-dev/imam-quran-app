import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Share2, WifiOff, X } from 'lucide-react';
import { PortalRoute } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PortalManifestConfig {
  route: PortalRoute;
  canonicalPath: string;
  name: string;
  shortName: string;
  portalLabel: string;
  description: string;
  themeColor: string;
  publicUrl: string;
}

export const PORTAL_PWA_CONFIGS: Record<PortalRoute, PortalManifestConfig> = {
  student: {
    route: 'student',
    canonicalPath: '/student',
    name: 'أكاديمية الإمام - بوابة الطالب',
    shortName: 'طالب الإمام',
    portalLabel: 'الطالب',
    description: 'الورد اليومي، المصحف التفاعلي، الحصون الخمسة، وتسجيل التسميع الصوتي في أكاديمية الإمام لتحفيظ القرآن الكريم.',
    themeColor: '#064e3b',
    publicUrl: 'https://welivequranacademy.online/student',
  },
  guardian: {
    route: 'guardian',
    canonicalPath: '/Guardian',
    name: 'أكاديمية الإمام - بوابة ولي الأمر',
    shortName: 'ولي أمر الإمام',
    portalLabel: 'ولي الأمر',
    description: 'متابعة الحفظ الجديد، المراجعات، الحضور، والتقارير الصوتية للأبناء في أكاديمية الإمام لتحفيظ القرآن الكريم.',
    themeColor: '#064e3b',
    publicUrl: 'https://welivequranacademy.online/Guardian',
  },
  owner: {
    route: 'owner',
    canonicalPath: '/owner',
    name: 'أكاديمية الإمام - لوحة المالك والإدارة العليا',
    shortName: 'إدارة الإمام',
    portalLabel: 'المالك والإدارة العليا',
    description: 'لوحة التحكم العليا للمالك، إدارة صلاحيات المشرفين والمحفظين، والنسخ الاحتياطي السحابي.',
    themeColor: '#042f2e',
    publicUrl: 'https://welivequranacademy.online/owner',
  },
  general: {
    route: 'general',
    canonicalPath: '/General',
    name: 'أكاديمية الإمام - بوابة المعلمين والإشراف',
    shortName: 'معلمو الإمام',
    portalLabel: 'المعلمين والإشراف',
    description: 'إدارة الحلقات القرآنية، محرك التسميع الخماسي، السبورة الذكية، والاختبارات والإجازات.',
    themeColor: '#145a3a',
    publicUrl: 'https://welivequranacademy.online/General',
  },
  almushaf: {
    route: 'almushaf',
    canonicalPath: '/almushaf',
    name: 'مصحف الإمام الشامل - بالقرآن نحيا',
    shortName: 'مصحف الإمام',
    portalLabel: 'المصحف الشريف الشامل',
    description: 'مصحف المدينة المنورة التفاعلي مع التلاوات الصوتية، التفسير الميسر، والورد اليومي.',
    themeColor: '#065f46',
    publicUrl: 'https://welivequranacademy.online/almushaf',
  },
  sadaqa: {
    route: 'sadaqa',
    canonicalPath: '/sadaqa',
    name: 'الصدقة الجارية والوقف القرآني - بالقرآن نحيا',
    shortName: 'الصدقة الجارية',
    portalLabel: 'الوقف والصدقة الجارية',
    description: 'بوابة الوقف القرآني والصدقة الجارية وتوليد بطاقات الدعاء والختمات في أكاديمية الإمام.',
    themeColor: '#064e3b',
    publicUrl: 'https://welivequranacademy.online/sadaqa',
  },
};

let currentManifestBlobUrl: string | null = null;

/**
 * Case-insensitive URL Pathname & Query detector for the 6 independent portals
 */
export function detectPortalRouteFromLocation(
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/',
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): PortalRoute | null {
  const cleanPath = (pathname || '/').trim().toLowerCase().replace(/\/+$/, '');
  const params = new URLSearchParams(search || '');
  const portalParam = (params.get('portal') || '').trim().toLowerCase();

  if (cleanPath.endsWith('/student') || portalParam === 'student') {
    return 'student';
  }
  if (cleanPath.endsWith('/guardian') || portalParam === 'guardian') {
    return 'guardian';
  }
  if (cleanPath.endsWith('/owner') || portalParam === 'owner') {
    return 'owner';
  }
  if (cleanPath.endsWith('/general') || portalParam === 'general') {
    return 'general';
  }
  if (cleanPath.endsWith('/almushaf') || portalParam === 'almushaf') {
    return 'almushaf';
  }
  if (
    cleanPath.endsWith('/sadaqa') ||
    cleanPath.endsWith('/sadaqah') ||
    portalParam === 'sadaqa' ||
    params.has('waqf')
  ) {
    return 'sadaqa';
  }
  return null;
}

/**
 * Dynamically generates a Blob URL manifest for the active portal so each portal can be installed
 * as a standalone PWA with its own start_url, scope, name, and short_name.
 */
export function updatePortalManifest(portal: PortalRoute): PortalManifestConfig {
  const cfg = PORTAL_PWA_CONFIGS[portal] || PORTAL_PWA_CONFIGS.general;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return cfg;
  }

  try {
    const origin = window.location.origin;
    const dynamicManifest = {
      name: cfg.name,
      short_name: cfg.shortName,
      description: cfg.description,
      start_url: `${origin}${cfg.canonicalPath}`,
      scope: `${origin}/`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#062c1e',
      theme_color: cfg.themeColor,
      dir: 'rtl',
      lang: 'ar',
      icons: [
        {
          src: `${origin}/icon.svg`,
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
        {
          src: `${origin}/assets/aistudio/icon-192_29a1c2ce.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${origin}/assets/aistudio/icon-512_0f792e6f.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    const blob = new Blob([JSON.stringify(dynamicManifest)], {
      type: 'application/manifest+json',
    });
    const nextBlobUrl = URL.createObjectURL(blob);

    let linkEl = document.querySelector<HTMLLinkElement>(
      'link#dynamic-pwa-manifest, link[rel="manifest"]'
    );
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = 'dynamic-pwa-manifest';
      linkEl.rel = 'manifest';
      document.head.appendChild(linkEl);
    }
    linkEl.href = nextBlobUrl;

    if (currentManifestBlobUrl) {
      URL.revokeObjectURL(currentManifestBlobUrl);
    }
    currentManifestBlobUrl = nextBlobUrl;

    const appleTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    if (appleTitleMeta) {
      appleTitleMeta.content = cfg.shortName;
    }
    document.title = `${cfg.name} | بالقرآن نحيا`;
  } catch {
    // ignore manifest blob errors in restricted environments
  }

  return cfg;
}

// Keep a module-level reference to beforeinstallprompt so any component mounted later still has it
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall(portalRoute: PortalRoute = 'general') {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    updatePortalManifest(portalRoute);
  }, [portalRoute]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = evt;
      setDeferredPrompt(evt);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
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
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (!promptToUse) return false;
    await promptToUse.prompt();
    const { outcome } = await promptToUse.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    install,
    portalConfig: PORTAL_PWA_CONFIGS[portalRoute] || PORTAL_PWA_CONFIGS.general,
  };
}

export const PWAInstallButton: React.FC<{
  portalRoute?: PortalRoute;
  route?: PortalRoute;
  compact?: boolean;
}> = ({ portalRoute, route, compact = false }) => {
  const effectiveRoute: PortalRoute = portalRoute || route || 'general';
  const { isInstallable, isInstalled, isIOS, install, portalConfig } =
    usePWAInstall(effectiveRoute);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPortalLink = async () => {
    const shareUrl = portalConfig.publicUrl;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleTriggerInstall = async () => {
    updatePortalManifest(effectiveRoute);
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuideModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        {!isInstalled && (
          <button
            type="button"
            onClick={() => void handleTriggerInstall()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-amber-400 px-3 py-1.5 text-xs font-black text-[#14281d] hover:opacity-95 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            title={`تثبيت بوابة ${portalConfig.portalLabel} كبرنامج مستقل على الهاتف أو الحاسوب`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>
              {compact
                ? `📲 تثبيت بوابة ${portalConfig.portalLabel}`
                : `📲 تثبيت بوابة ${portalConfig.portalLabel} كبرنامج على الهاتف`}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleCopyPortalLink()}
          className="flex items-center gap-1.5 rounded-xl border border-[#c59b27]/50 bg-[#c59b27]/15 px-2.5 py-1.5 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] hover:bg-[#c59b27]/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title={`نسخ رابط بوابة ${portalConfig.portalLabel}: ${portalConfig.publicUrl}`}
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>تم نسخ الرابط ✓</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">
                🔗 نسخ ومشاركة رابط هذه البوابة
              </span>
              <span className="md:hidden">🔗 رابط البوابة</span>
            </>
          )}
        </button>
      </div>

      {showInstallGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={() => setShowInstallGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] p-6 shadow-2xl border-2 border-[#c59b27]/60 space-y-4 text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-emerald-900 pb-3">
              <div>
                <span className="text-[11px] font-black text-[#c59b27] block">
                  📲 تثبيت التطبيق المستقل ({portalConfig.shortName})
                </span>
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  تثبيت بوابة {portalConfig.portalLabel} على شاشة هاتفك
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-2 text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed">
              {isIOS ? (
                <>
                  <p className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    خطوات التثبيت على آيفون وآيباد (Safari):
                  </p>
                  <p>
                    1. اضغط على زر <strong>المشاركة (Share ⬆️)</strong> في شريط متصفح سفاري السفلي.
                  </p>
                  <p>
                    2. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> لتثبيت{' '}
                    <strong>"{portalConfig.shortName}"</strong> كتطبيق مستقل.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    خطوات التثبيت السريع على أندرويد أو الحاسوب (Chrome / Edge):
                  </p>
                  <p>
                    1. اضغط على قائمة المتصفح العلوية <strong>(⋮ ثلاث نقاط)</strong>.
                  </p>
                  <p>
                    2. اختر <strong>تثبيت التطبيق (Install App)</strong> أو{' '}
                    <strong>إضافة إلى الشاشة الرئيسية</strong> ليظهر باسم{' '}
                    <strong>"{portalConfig.shortName}"</strong>.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                🔗 الرابط المباشر لبوابة {portalConfig.portalLabel}:
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-emerald-950/60 border border-neutral-200 dark:border-emerald-800">
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={portalConfig.publicUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-left text-neutral-800 dark:text-emerald-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleCopyPortalLink()}
                  className="px-3 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'تم النسخ ✓' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `📲 رابط وتطبيق (${portalConfig.name}) في أكاديمية الإمام لتحفيظ القرآن الكريم (بالقرآن نحيا):\n${portalConfig.publicUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>مشاركة رابط البوابة عبر واتساب</span>
              </a>
              <button
                type="button"
                onClick={() => setShowInstallGuideModal(false)}
                className="py-2.5 px-4 rounded-xl bg-neutral-200 dark:bg-emerald-900 text-neutral-800 dark:text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const PortalInstallAndShareBar: React.FC<{
  portalRoute?: PortalRoute;
  route?: PortalRoute | string;
  onSelectPortalRoute?: (route: PortalRoute) => void;
}> = ({ portalRoute, route, onSelectPortalRoute }) => {
  const effectiveRoute: PortalRoute =
    portalRoute || ((route as PortalRoute) ?? 'general');
  const { isInstallable, isInstalled, install, portalConfig } =
    usePWAInstall(effectiveRoute);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  return (
    <div
      dir="rtl"
      className="p-4 rounded-2xl bg-gradient-to-l from-emerald-950 via-[#0d3b26] to-emerald-900 border border-[#c59b27]/50 text-white shadow-lg space-y-3 no-print"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27]/25 border border-[#c59b27] text-amber-300 text-[11px] font-black">
              📲 نظام البوابات المستقلة (Multi-PWA)
            </span>
            <h4 className="text-xs sm:text-sm font-extrabold text-white">
              {portalConfig.name} ({portalConfig.shortName})
            </h4>
          </div>
          <p className="text-[11px] text-emerald-200/90">
            يمكنك تثبيت هذه البوابة كتطبيق مستقل على هاتفك أو نسخ رابطها المباشر لمشاركته مع الطلاب وأولياء الأمور
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                updatePortalManifest(effectiveRoute);
                if (isInstallable) {
                  void install();
                } else {
                  void handleCopy(portalConfig.publicUrl);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#c59b27] to-amber-400 text-[#14281d] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📲 تثبيت بوابة {portalConfig.portalLabel} كبرنامج على الهاتف</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleCopy(portalConfig.publicUrl)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            {copiedUrl === portalConfig.publicUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>تم نسخ الرابط: {portalConfig.canonicalPath} ✓</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>🔗 نسخ ومشاركة رابط هذه البوابة</span>
              </>
            )}
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `🌿 بوابة (${portalConfig.name}) — أكاديمية الإمام لتحفيظ القرآن الكريم (بالقرآن نحيا):\n${portalConfig.publicUrl}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
          >
            <span>واتساب</span>
          </a>
        </div>
      </div>

      {/* Quick Direct Links to All 6 Portals */}
      <div className="pt-2 border-t border-emerald-800/70 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-amber-300 font-bold ml-1">روابط البوابات الست المباشرة:</span>
        {(Object.values(PORTAL_PWA_CONFIGS) as PortalManifestConfig[]).map((item) => {
          const isCurrent = item.route === effectiveRoute;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => {
                updatePortalManifest(item.route);
                try {
                  window.history.pushState(
                    { imamGuard: true, portal: item.route },
                    '',
                    item.canonicalPath
                  );
                } catch {
                  // ignore
                }
                if (onSelectPortalRoute) {
                  onSelectPortalRoute(item.route);
                } else {
                  void handleCopy(item.publicUrl);
                }
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                isCurrent
                  ? 'bg-[#c59b27] text-[#14281d] font-black shadow-2xs'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60'
              }`}
              title={`${item.name} — ${item.publicUrl}`}
            >
              <span>{item.portalLabel}</span>
              <span className="font-mono text-[10px] opacity-80" dir="ltr">
                {item.canonicalPath}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ExitConfirmationModal: React.FC<{
  isOpen: boolean;
  onStay?: () => void;
  onCancel?: () => void;
  onExit?: () => void;
  onConfirmExit?: () => void;
}> = ({ isOpen, onStay, onCancel, onExit, onConfirmExit }) => {
  if (!isOpen) return null;
  const handleStay = onStay || onCancel || (() => {});
  const handleExit = onExit || onConfirmExit || (() => {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir="rtl"
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleStay}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-6 shadow-2xl text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-[#c59b27] flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
            ⚠️ تنبيه: هل تريد بالفعل الخروج من تطبيق أكاديمية الإمام؟
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            كافة بيانات الحفظ والتسميع محفوظة تلقائياً. اضغط «البقاء في التطبيق» لمواصلة عملك أو «نعم، خروج» لإغلاق النافذة.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            autoFocus
            onClick={handleStay}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs sm:text-sm font-black cursor-pointer shadow-md"
          >
            البقاء في التطبيق (افتراضي)
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="py-2.5 px-4 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs sm:text-sm font-bold cursor-pointer"
          >
            نعم، خروج
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineToast, setOfflineToast] = useState<{
    show: boolean;
    msg: string;
    type: 'offline' | 'online';
  }>({
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
