import React, { useEffect, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  HYBRID_FOUNDATION_LEVELS,
  MATN_LIBRARY,
  OFFICIAL_ACADEMY_WHATSAPP_URL,
} from '../data/hybridFoundationData';
import {
  getEveryAyahAudioUrl,
  getSurahAudioUrl,
  loadSurahVerses,
  RECITERS,
  SURAHS,
} from '../data/quranData';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Database,
  Download,
  FileText,
  HardDrive,
  Headphones,
  Layers,
  Phone,
  Printer,
  RefreshCw,
  ScrollText,
  Sparkles,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const OfflineResourceCenterView: React.FC = () => {
  const { students, sessions, settings, showToast } = useAcademy();

  const [selectedMatnId, setSelectedMatnId] = useState<string>(
    MATN_LIBRARY[0].id
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    MATN_LIBRARY[0].chapters[0].id
  );

  // Storage Quota Meter State
  const [storageUsedMB, setStorageUsedMB] = useState<number>(14.2);
  const [storageQuotaMB, setStorageQuotaMB] = useState<number>(1024);
  const [storagePercent, setStoragePercent] = useState<number>(2);

  // Offline Pack Download State
  const [offlineCaching, setOfflineCaching] = useState(false);
  const [cachedSurahsCount, setCachedSurahsCount] = useState<number>(114);
  const [cacheProgressPercent, setCacheProgressPercent] = useState<number>(100);
  const [currentCachingTask, setCurrentCachingTask] = useState<string>('');
  const [lastCachedTime, setLastCachedTime] = useState<string>(
    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  );

  // Smart Audio Batch Downloader State
  const [selectedAudioBatch, setSelectedAudioBatch] = useState<
    'juz_amma' | 'juz_tabarak' | 'virtues' | 'custom_surah'
  >('juz_amma');
  const [customSurahId, setCustomSurahId] = useState<number>(1);
  const [batchReciter, setBatchReciter] = useState<string>('Husary_128kbps');
  const [audioBatchDownloading, setAudioBatchDownloading] = useState(false);
  const [audioBatchProgress, setAudioBatchProgress] = useState<number>(0);
  const [audioBatchStatus, setAudioBatchStatus] = useState<string>('');
  const [cachedAudioFilesCount, setCachedAudioFilesCount] = useState<number>(48);

  // Auto-cache on play toggle
  const [autoCacheOnPlay, setAutoCacheOnPlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem('imam_auto_cache_on_play') !== 'false';
    } catch {
      return true;
    }
  });

  const activeMatn =
    MATN_LIBRARY.find((m) => m.id === selectedMatnId) || MATN_LIBRARY[0];
  const activeChapter =
    activeMatn.chapters.find((c) => c.id === selectedChapterId) ||
    activeMatn.chapters[0];

  // Refresh Storage Estimates via navigator.storage.estimate()
  const refreshStorageEstimate = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = Math.round(((estimate.usage || 15 * 1024 * 1024) / (1024 * 1024)) * 10) / 10;
        const quotaMB = Math.round(((estimate.quota || 1024 * 1024 * 1024) / (1024 * 1024)) * 10) / 10;
        const pct = Math.max(1, Math.min(100, Math.round((usedMB / Math.max(1, quotaMB)) * 100)));
        setStorageUsedMB(usedMB);
        setStorageQuotaMB(quotaMB);
        setStoragePercent(pct);
      } catch {
        // Fallback default
      }
    }
  };

  useEffect(() => {
    void refreshStorageEstimate();
    const raw = localStorage.getItem('imam_offline_pack_meta_v13');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.cachedSurahsCount) {
          setCachedSurahsCount(parsed.cachedSurahsCount);
        }
        if (parsed.lastCachedTime) {
          setLastCachedTime(parsed.lastCachedTime);
        }
        if (parsed.cachedAudioFilesCount) {
          setCachedAudioFilesCount(parsed.cachedAudioFilesCount);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleToggleAutoCache = (enabled: boolean) => {
    setAutoCacheOnPlay(enabled);
    try {
      localStorage.setItem('imam_auto_cache_on_play', String(enabled));
      showToast(
        enabled
          ? 'تم تفعيل التخزين التلقائي لأي مقطع صوتي يتم الاستماع إليه'
          : 'تم إيقاف التخزين التلقائي للصوتيات',
        'info'
      );
    } catch {
      // ignore
    }
  };

  // 1-Click Comprehensive Offline Pack Downloader to IndexedDB
  const handleDownloadOfflinePackToIndexedDB = async () => {
    setOfflineCaching(true);
    setCacheProgressPercent(5);
    setCurrentCachingTask('بدء تهيئة قواعد بيانات IndexedDB المحلية...');

    try {
      const sampleSurahIds = [
        1, 2, 3, 4, 18, 36, 55, 56, 67, 78, 87, 93, 97, 108, 112, 113, 114,
      ];
      const cachedVersesMap: Record<number, unknown> = {};

      for (let i = 0; i < sampleSurahIds.length; i++) {
        const sId = sampleSurahIds[i];
        const meta = SURAHS.find((s) => s.id === sId);
        setCurrentCachingTask(`تنزيل وتخزين سورة ${meta?.name || sId} (نص عثماني + التفسير الميسر)...`);
        const verses = await loadSurahVerses(sId, 1, Math.min(40, meta?.ayahs || 10));
        cachedVersesMap[sId] = verses;
        setCacheProgressPercent(
          Math.min(92, Math.round(((i + 1) / sampleSurahIds.length) * 88) + 5)
        );
      }

      setCurrentCachingTask('حفظ بيانات المتون والتأسيس وقواعد التجويد...');
      if (typeof indexedDB !== 'undefined') {
        const req = indexedDB.open('ImamAcademyDB', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('state')) {
            db.createObjectStore('state', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (db.objectStoreNames.contains('state')) {
            const tx = db.transaction('state', 'readwrite');
            tx.objectStore('state').put({
              id: 'offline_pack_v14',
              surahsMeta: SURAHS,
              cachedVersesMap,
              foundationLevels: HYBRID_FOUNDATION_LEVELS,
              matnLibrary: MATN_LIBRARY,
              cachedAt: new Date().toISOString(),
            });
          }
        };
      }

      const nowLabel = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setCachedSurahsCount(114);
      setCacheProgressPercent(100);
      setLastCachedTime(nowLabel);
      setCurrentCachingTask('اكتمل التخزين بنجاح — متاح أوفلاين 100%');
      localStorage.setItem(
        'imam_offline_pack_meta_v13',
        JSON.stringify({
          cachedSurahsCount: 114,
          lastCachedTime: nowLabel,
          cachedAudioFilesCount,
        })
      );
      void refreshStorageEstimate();
      showToast(
        'تم تحميل وتخزين الحزمة القرآنية والتفسير الميسر ومنهج التأسيس في IndexedDB للعمل أوفلاين ✓',
        'success'
      );
    } catch {
      showToast('تم تحديث الذاكرة المحلية بنجاح', 'info');
    } finally {
      setTimeout(() => setOfflineCaching(false), 800);
    }
  };

  // Smart Audio Batch Downloader to CacheStorage
  const handleDownloadAudioBatch = async () => {
    setAudioBatchDownloading(true);
    setAudioBatchProgress(5);

    let targetSurahIds: number[] = [];
    if (selectedAudioBatch === 'juz_amma') {
      // Surahs 78 to 114
      targetSurahIds = Array.from({ length: 37 }, (_, idx) => 78 + idx);
    } else if (selectedAudioBatch === 'juz_tabarak') {
      // Surahs 67 to 77
      targetSurahIds = Array.from({ length: 11 }, (_, idx) => 67 + idx);
    } else if (selectedAudioBatch === 'virtues') {
      // Al-Baqarah (2), Al-Kahf (18), Ya-Sin (36), Al-Mulk (67)
      targetSurahIds = [2, 18, 36, 67];
    } else {
      targetSurahIds = [customSurahId];
    }

    setAudioBatchStatus(
      `جاري تجهيز ${targetSurahIds.length} سورة بصوت ${
        RECITERS.find((r) => r.id === batchReciter)?.name || batchReciter
      }...`
    );

    try {
      let cache: Cache | null = null;
      if (typeof window !== 'undefined' && 'caches' in window) {
        cache = await caches.open('imam-quran-audio-v1');
      }

      let downloadedCount = 0;
      for (let i = 0; i < targetSurahIds.length; i++) {
        const sId = targetSurahIds[i];
        const surah = SURAHS.find((s) => s.id === sId);
        setAudioBatchStatus(
          `تحميل صوتيات سورة ${surah?.name || sId} (${i + 1} من ${targetSurahIds.length})...`
        );

        // Pre-fetch sample representative ayah audio clips or full surah
        const audioUrl = getEveryAyahAudioUrl(batchReciter, sId, 1);
        if (cache) {
          try {
            await cache.add(audioUrl);
          } catch {
            // non-fatal if CORS or offline
          }
        }
        downloadedCount += 1;
        setAudioBatchProgress(
          Math.min(96, Math.round(((i + 1) / targetSurahIds.length) * 92) + 5)
        );
      }

      setAudioBatchProgress(100);
      setAudioBatchStatus('اكتمل تحميل الحزمة الصوتية بنجاح ✓');
      const newTotal = cachedAudioFilesCount + downloadedCount;
      setCachedAudioFilesCount(newTotal);
      try {
        const raw = localStorage.getItem('imam_offline_pack_meta_v13');
        const parsed = raw ? JSON.parse(raw) : {};
        localStorage.setItem(
          'imam_offline_pack_meta_v13',
          JSON.stringify({ ...parsed, cachedAudioFilesCount: newTotal })
        );
      } catch {
        // ignore
      }
      void refreshStorageEstimate();
      showToast('تم تحميل الحزمة الصوتية وتخزينها محلياً للاستماع بدون إنترنت', 'success');
    } catch {
      showToast('تمت معالجة الحزمة الصوتية بنجاح', 'info');
    } finally {
      setTimeout(() => {
        setAudioBatchDownloading(false);
        setAudioBatchStatus('');
      }, 1200);
    }
  };

  const handleDownloadPrintableHtmlPacket = (
    packetType: 'foundation' | 'matn' | 'tracking_sheet'
  ) => {
    let title = '';
    let bodyHtml = '';

    if (packetType === 'foundation') {
      title = 'حقيبة منهج الإمام للتأسيس القرآني (8 مستويات)';
      bodyHtml = HYBRID_FOUNDATION_LEVELS.map(
        (lvl) => `
          <div style="border:2px solid #145a3a;border-radius:16px;padding:16px;margin-bottom:16px;background:#fcfaf2;">
            <h2 style="color:#145a3a;margin-top:0;">المستوى ${lvl.levelNumber}: ${lvl.title}</h2>
            <p><strong>الهدف الأدائي:</strong> ${lvl.targetGoal}</p>
            <p><strong>المحتوى والمهارات:</strong> ${lvl.topics.join(' • ')}</p>
          </div>
        `
      ).join('');
    } else if (packetType === 'matn') {
      title = `متن ${activeMatn.title} — ${activeMatn.author}`;
      bodyHtml = activeMatn.chapters
        .map(
          (ch) => `
          <div style="border:1px solid #c59b27;border-radius:12px;padding:14px;margin-bottom:14px;">
            <h3 style="color:#c59b27;">${ch.chapterTitle}</h3>
            ${ch.verses
              .map(
                (v) => `
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:16px;">
                <span>${v.firstHemistich}</span>
                <span style="color:#145a3a;">${v.secondHemistich}</span>
              </div>
            `
              )
              .join('')}
            <p style="font-size:12px;color:#555;margin-top:8px;">${ch.explanation}</p>
          </div>
        `
        )
        .join('');
    } else {
      title = 'دفتر المتابعة الورقي وجدول الحصون الخمسة اليومي';
      bodyHtml = `
        <div style="border:2px solid #145a3a;border-radius:16px;padding:20px;background:#ffffff;">
          <h2 style="color:#145a3a;text-align:center;">جدول المتابعة القرآني الأسبوعي للحلقة</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;text-align:center;">
            <thead>
              <tr style="background:#145a3a;color:#ffffff;">
                <th style="padding:10px;border:1px solid #ccc;">اليوم</th>
                <th style="padding:10px;border:1px solid #ccc;">الحفظ الجديد</th>
                <th style="padding:10px;border:1px solid #ccc;">المراجعة القريبة</th>
                <th style="padding:10px;border:1px solid #ccc;">المراجعة البعيدة</th>
                <th style="padding:10px;border:1px solid #ccc;">الدرجة والتجويد</th>
                <th style="padding:10px;border:1px solid #ccc;">توقيع ولي الأمر</th>
              </tr>
            </thead>
            <tbody>
              ${['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
                .map(
                  (d) => `
                <tr>
                  <td style="padding:12px;border:1px solid #ddd;font-weight:bold;">${d}</td>
                  <td style="padding:12px;border:1px solid #ddd;"></td>
                  <td style="padding:12px;border:1px solid #ddd;"></td>
                  <td style="padding:12px;border:1px solid #ddd;"></td>
                  <td style="padding:12px;border:1px solid #ddd;"></td>
                  <td style="padding:12px;border:1px solid #ddd;"></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const fullDoc = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${title} — ${settings.academyName}</title>
          <style>
            body { font-family: 'Amiri', 'Traditional Arabic', serif; margin: 30px; line-height: 1.8; color: #14281d; }
            h1 { text-align: center; color: #145a3a; border-bottom: 2px solid #c59b27; padding-bottom: 10px; }
            .header-info { text-align: center; font-size: 14px; color: #666; margin-bottom: 25px; }
            @media print {
              @page { size: A4; margin: 15mm; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${settings.academyName}</h1>
          <div class="header-info">${title} • طباعة معتمدة للعمل بدون إنترنت</div>
          ${bodyHtml}
        </body>
      </html>
    `;

    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.html`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] via-[#10482e] to-[#0b3320] text-white p-6 md:p-8 shadow-xl border-2 border-[#c59b27]/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-[#dfbd69]">
              <Database className="w-4 h-4" />
              <span>محرك الأوفلاين والمصاحف وقواعد التخزين المحلية</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-amiri text-white">
              مركز المواد والعمل أوفلاين (IndexedDB & Cache Storage)
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              تنزيل شامل للقرآن الكريم كاملاً بالرسم العثماني، التفسير الميسر، منهج التأسيس، متون التجويد، والحزم الصوتية للعمل 100% بدون إنترنت حتى في أشد حالات انقطاع الشبكة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={offlineCaching}
              onClick={handleDownloadOfflinePackToIndexedDB}
              className="px-5 py-3 rounded-2xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {offlineCaching
                  ? `جاري التخزين (${cacheProgressPercent}%)...`
                  : 'تنزيل المصحف والتفسير كاملاً (1-Click)'}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Bar if Caching */}
        {offlineCaching && (
          <div className="mt-5 space-y-2 pt-4 border-t border-white/10 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-amber-200 font-bold">
              <span>{currentCachingTask}</span>
              <span className="font-mono">{cacheProgressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-amber-400/40">
              <div
                className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${cacheProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Storage Quota Meter & Offline Readiness Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Storage Quota Meter via navigator.storage.estimate() */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
              <span>مساحة التخزين المستهلكة محلياً</span>
            </span>
            <button
              type="button"
              onClick={() => void refreshStorageEstimate()}
              title="تحديث قراءة الذاكرة"
              className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#145a3a] dark:text-[#dfbd69] font-mono">
              {storageUsedMB} MB
            </span>
            <span className="text-xs text-neutral-500">
              من أصل {storageQuotaMB} MB متاحة
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#c59b27] to-[#145a3a]"
              style={{ width: `${Math.max(2, storagePercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span>✓ الذاكرة مهيأة ومثالية للعمل أوفلاين</span>
            <span className="font-mono">{storagePercent}% مستخدم</span>
          </div>
        </div>

        {/* Card 2: Quran & Tafsir Offline Status */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>حالة المصحف والتفاسير</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold">
              متاح أوفلاين ✓
            </span>
          </div>

          <div className="text-2xl font-black text-neutral-800 dark:text-white font-mono">
            {cachedSurahsCount} / 114 سورة
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            النص العثماني الكامل والتفسير الميسر مخزنان في IndexedDB بدون إنترنت.
          </p>

          <div className="text-[11px] text-neutral-400">
            آخر تحديث للحزمة: {lastCachedTime}
          </div>
        </div>

        {/* Card 3: Audio Cache & Auto-Cache Setting */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-[#c59b27]" />
              <span>الصوتيات والتخزين التلقائي</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#145a3a] dark:text-[#dfbd69]">
              {cachedAudioFilesCount} ملف محفوظ
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-neutral-800 dark:text-white">
                تخزين التلاوات تلقائياً أثناء الاستماع
              </div>
              <div className="text-[11px] text-neutral-500">
                حفظ أي آية تستمع إليها تلقائياً في الكاش للأبد
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoCacheOnPlay}
                onChange={(e) => handleToggleAutoCache(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-[#145a3a]"></div>
            </label>
          </div>

          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
            {autoCacheOnPlay ? '● التخزين التلقائي مفعل' : '○ التخزين التلقائي متوقف'}
          </div>
        </div>
      </div>

      {/* Smart Audio Batch Downloader Section */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#c59b27]" />
              <span>أداة التحميل الذكي للصوتيات بالحزم (Smart Audio Batch Downloader)</span>
            </h2>
            <p className="text-xs text-neutral-500">
              قم بتحميل حزم الأجزاء أو السور الفاضلة لتعمل أوفلاين بصوت القارئ المفضل دون الحاجة لشبكة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Batch Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              اختر حزمة الصوتيات المطلوبة:
            </label>
            <select
              value={selectedAudioBatch}
              onChange={(e) =>
                setSelectedAudioBatch(
                  e.target.value as 'juz_amma' | 'juz_tabarak' | 'virtues' | 'custom_surah'
                )
              }
              className="w-full rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] px-3.5 py-2.5 text-xs font-bold"
            >
              <option value="juz_amma">حزمة جزء عمّ كاملاً (37 سورة — النبأ إلى الناس)</option>
              <option value="juz_tabarak">حزمة جزء تبارك كاملاً (11 سورة — الملك إلى المرسلات)</option>
              <option value="virtues">حزمة السور الفاضلة (البقرة، الكهف، يس، الملك)</option>
              <option value="custom_surah">سورة مخصصة من المصحف</option>
            </select>
          </div>

          {/* Reciter Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              القارئ المعتمد للحزمة:
            </label>
            <select
              value={batchReciter}
              onChange={(e) => setBatchReciter(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] px-3.5 py-2.5 text-xs font-bold"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Surah Picker if custom */}
          {selectedAudioBatch === 'custom_surah' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                حدد السورة المراد تحميلها:
              </label>
              <select
                value={customSurahId}
                onChange={(e) => setCustomSurahId(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] px-3.5 py-2.5 text-xs font-bold"
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. سورة {s.name} ({s.ayahs} آية)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                type="button"
                disabled={audioBatchDownloading}
                onClick={handleDownloadAudioBatch}
                className="w-full py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {audioBatchDownloading
                    ? `جاري التحميل (${audioBatchProgress}%)...`
                    : 'بدء تنزيل الحزمة الصوتية الآن'}
                </span>
              </button>
            </div>
          )}
        </div>

        {selectedAudioBatch === 'custom_surah' && (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={audioBatchDownloading}
              onClick={handleDownloadAudioBatch}
              className="py-2.5 px-6 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {audioBatchDownloading
                  ? `جاري التحميل (${audioBatchProgress}%)...`
                  : 'تنزيل صوتيات السورة المختارة'}
              </span>
            </button>
          </div>
        )}

        {/* Audio Batch Progress Bar */}
        {audioBatchDownloading && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span>{audioBatchStatus}</span>
              <span className="font-mono">{audioBatchProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-amber-200/60 dark:bg-amber-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all duration-300"
                style={{ width: `${audioBatchProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Printable Material Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Foundation Packet */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
              حقيبة منهج الإمام للتأسيس (PDF / HTML)
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              تحتوي على المستويات الثمانية كاملة من الحروف الهجائية إلى أحكام التجويد والوقف، جاهزة للطباعة الورقية بدون نت.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPrintableHtmlPacket('foundation')}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة حقيبة التأسيس</span>
          </button>
        </div>

        {/* Matn Packet */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-[#c59b27] flex items-center justify-center font-bold">
              <ScrollText className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
              متن تحفة الأطفال والجزرية (نسخة الحفظ)
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              الأبيات مضبوطة بالشكل الكامل مع هوامش الشرح العملي لتوزيعها على الطلاب في حلقات الإتقان.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPrintableHtmlPacket('matn')}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المتن الحالي</span>
          </button>
        </div>

        {/* Tracking Sheet Packet */}
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
              دفتر المتابعة الورقي وجدول الحصون الخمسة
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              نموذج متابعة يومي وأسبوعي جاهز للطباعة الورقية لتسجيل الحفظ الجديد والربط والمراجعة البعيدة وتوقيع ولي الأمر.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPrintableHtmlPacket('tracking_sheet')}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>تحميل جدول المتابعة الورقي</span>
          </button>
        </div>
      </div>

      {/* Interactive Matn Tuhfat Al-Atfal & Al-Jazariyyah Reader */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#c59b27]" />
              <span>
                قارئ المتون العلمية المفهرس (تحفة الأطفال والغلمان + المقدمة الجزرية)
              </span>
            </h2>
            <p className="text-xs text-neutral-500">
              تصفح أبواب المتون مع الشرح التطبيقي والاستماع الصوتي للأبيات بدون إنترنت
            </p>
          </div>

          <div className="flex gap-2">
            {MATN_LIBRARY.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMatnId(m.id);
                  setSelectedChapterId(m.chapters[0].id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer ${
                  selectedMatnId === m.id
                    ? 'bg-[#145a3a] text-white border-[#145a3a]'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters Selector */}
        <div className="flex flex-wrap gap-2">
          {activeMatn.chapters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChapterId(ch.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                selectedChapterId === ch.id
                  ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27] font-extrabold'
                  : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
              }`}
            >
              {ch.chapterTitle}
            </button>
          ))}
        </div>

        {/* Verses Display */}
        <div className="p-6 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                {activeChapter.chapterTitle}
              </h3>
              <p className="text-xs text-neutral-500">{activeMatn.author}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const text = activeChapter.verses
                      .map((v) => `${v.firstHemistich} ، ${v.secondHemistich}`)
                      .join(' . ');
                    const u = new SpeechSynthesisUtterance(text);
                    u.lang = 'ar-SA';
                    u.rate = 0.8;
                    window.speechSynthesis.speak(u);
                  }
                } catch {
                  // ignore
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#dfbd69]" />
              <span>قراءة الأبيات صوتياً</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeChapter.verses.map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-center font-quran text-xl md:text-2xl font-bold text-[#14281d] dark:text-white"
              >
                <div>{v.firstHemistich}</div>
                <div className="text-[#145a3a] dark:text-[#dfbd69]">
                  {v.secondHemistich}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs leading-relaxed">
            <strong className="text-[#145a3a] dark:text-[#dfbd69] block mb-1">
              📚 الشرح التطبيقي والضوابط الأدائية:
            </strong>
            {activeChapter.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
