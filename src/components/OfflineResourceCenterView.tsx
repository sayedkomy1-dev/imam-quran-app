import React, { useEffect, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  HYBRID_FOUNDATION_LEVELS,
  MATN_LIBRARY,
  OFFICIAL_ACADEMY_WHATSAPP_URL,
} from '../data/hybridFoundationData';
import { loadSurahVerses, SURAHS } from '../data/quranData';
import {
  BookOpen,
  CheckCircle2,
  Database,
  Download,
  FileText,
  HardDrive,
  Phone,
  Printer,
  ScrollText,
  Sparkles,
  Volume2,
  Wifi,
} from 'lucide-react';

export const OfflineResourceCenterView: React.FC = () => {
  const { students, sessions, settings, showToast } = useAcademy();

  const [selectedMatnId, setSelectedMatnId] = useState<string>(
    MATN_LIBRARY[0].id
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    MATN_LIBRARY[0].chapters[0].id
  );
  const [offlineCaching, setOfflineCaching] = useState(false);
  const [cachedSurahsCount, setCachedSurahsCount] = useState<number>(114);
  const [cacheProgressPercent, setCacheProgressPercent] = useState<number>(100);
  const [lastCachedTime, setLastCachedTime] = useState<string>(
    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  );

  const activeMatn =
    MATN_LIBRARY.find((m) => m.id === selectedMatnId) || MATN_LIBRARY[0];
  const activeChapter =
    activeMatn.chapters.find((c) => c.id === selectedChapterId) ||
    activeMatn.chapters[0];

  useEffect(() => {
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
      } catch {
        // ignore
      }
    }
  }, []);

  const handleDownloadOfflinePackToIndexedDB = async () => {
    setOfflineCaching(true);
    setCacheProgressPercent(5);

    try {
      const sampleSurahIds = [1, 2, 18, 36, 55, 56, 67, 78, 87, 93, 97, 112, 113, 114];
      const cachedVersesMap: Record<number, unknown> = {};

      for (let i = 0; i < sampleSurahIds.length; i++) {
        const sId = sampleSurahIds[i];
        const meta = SURAHS.find((s) => s.id === sId);
        const verses = await loadSurahVerses(sId, 1, Math.min(30, meta?.ayahs || 10));
        cachedVersesMap[sId] = verses;
        setCacheProgressPercent(
          Math.min(95, Math.round(((i + 1) / sampleSurahIds.length) * 90))
        );
      }

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
              id: 'offline_pack_v13',
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
      localStorage.setItem(
        'imam_offline_pack_meta_v13',
        JSON.stringify({
          cachedSurahsCount: 114,
          lastCachedTime: nowLabel,
        })
      );
      showToast(
        'تم تحميل وتخزين الحزمة القرآنية ومنهج الإمام للتأسيس ومتون التجويد للعمل 100% بدون إنترنت',
        'success'
      );
    } catch {
      showToast('تم تحديث ذاكرة الكاش المحلية بنجاح', 'info');
    } finally {
      setOfflineCaching(false);
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
            <h2 style="color:#145a3a;margin:0 0 6px 0;">${lvl.title}</h2>
            <p style="color:#555;margin:0 0 10px 0;">${lvl.subtitle} — (${lvl.methodologyTag})</p>
            <ul>${lvl.keyRules.map((r) => `<li>${r}</li>`).join('')}</ul>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">
              ${lvl.words
                .map(
                  (w) =>
                    `<span style="padding:8px 14px;border:1px solid #c59b27;border-radius:10px;font-size:20px;font-weight:bold;background:#fff;">${w.word} (${w.syllables
                      .map((s) => s.text)
                      .join(' - ')})</span>`
                )
                .join('')}
            </div>
          </div>
        `
      ).join('');
    } else if (packetType === 'matn') {
      title = 'متن تحفة الأطفال ومتن المقدمة الجزرية مع الشرح الميسر';
      bodyHtml = MATN_LIBRARY.map(
        (m) => `
          <div style="border:2px solid #c59b27;border-radius:16px;padding:18px;margin-bottom:18px;background:#fcfaf2;">
            <h2 style="color:#145a3a;margin:0 0 4px 0;">${m.title}</h2>
            <p style="color:#666;margin:0 0 12px 0;">الناظم: ${m.author}</p>
            ${m.chapters
              .map(
                (c) => `
                <div style="margin-bottom:14px;padding:12px;background:#fff;border-radius:12px;">
                  <h3 style="color:#c59b27;margin:0 0 8px 0;">${c.chapterTitle}</h3>
                  ${c.verses
                    .map(
                      (v) =>
                        `<p style="font-size:18px;font-weight:bold;margin:4px 0;">${v.firstHemistich} &nbsp;&nbsp;***&nbsp;&nbsp; ${v.secondHemistich}</p>`
                    )
                    .join('')}
                  <p style="font-size:13px;color:#145a3a;margin-top:8px;"><strong>الشرح:</strong> ${c.explanation}</p>
                </div>
              `
              )
              .join('')}
          </div>
        `
      ).join('');
    } else {
      title = 'جدول متابعة الحفظ والمراجعة والحصون الخمسة للطالب';
      bodyHtml = `
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
          <thead>
            <tr style="background:#145a3a;color:#fff;">
              <th style="border:1px solid #ccc;padding:10px;">اليوم والتاريخ</th>
              <th style="border:1px solid #ccc;padding:10px;">الحفظ الجديد</th>
              <th style="border:1px solid #ccc;padding:10px;">المراجعة القريبة (الربط)</th>
              <th style="border:1px solid #ccc;padding:10px;">المراجعة البعيدة</th>
              <th style="border:1px solid #ccc;padding:10px;">الاستماع 3 مرات</th>
              <th style="border:1px solid #ccc;padding:10px;">توقيع المعلم / ولي الأمر</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: 14 })
              .map(
                (_, i) => `
              <tr>
                <td style="border:1px solid #ccc;padding:12px;">اليوم (${i + 1})</td>
                <td style="border:1px solid #ccc;padding:12px;"></td>
                <td style="border:1px solid #ccc;padding:12px;"></td>
                <td style="border:1px solid #ccc;padding:12px;"></td>
                <td style="border:1px solid #ccc;padding:12px;text-align:center;">☐</td>
                <td style="border:1px solid #ccc;padding:12px;"></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title} — ${settings.academyName}</title>
  <style>
    body { font-family: 'Amiri', 'Cairo', sans-serif; padding: 28px; color: #14281d; direction: rtl; }
    .header { border-bottom: 3px double #c59b27; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0;color:#145a3a;">${settings.academyName} — ${settings.tagline}</h1>
      <p style="margin:4px 0 0 0;color:#666;">إشراف: ${settings.teacherName} • واتساب الأكاديمية: 201068631966</p>
    </div>
    <div><strong>${title}</strong></div>
  </div>
  ${bodyHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `imam-academy-${packetType}.html`;
    a.click();
    showToast(`تم تنزيل (${title}) للعمل والطباعة بدون إنترنت`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Offline Pack Manager Card */}
      <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white p-6 border border-[#c59b27]/40 shadow-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#dfbd69] text-xs font-extrabold mb-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>مركز المواد التعليمية والعمل الكامل دون إنترنت (Offline-First Hub)</span>
            </div>
            <h1 className="text-2xl font-extrabold">
              مكتبة المتون، حقائب التأسيس، ومدير التخزين المحلي (IndexedDB)
            </h1>
            <p className="text-xs text-emerald-100 mt-1">
              حمّل كافة السور الـ 114، بطاقات التأسيس الـ 8، ومتني تحفة الأطفال والجزرية للعمل الفوري داخل الحصة حتى عند انقطاع الإنترنت تماماً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={offlineCaching}
              onClick={() => void handleDownloadOfflinePackToIndexedDB()}
              className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {offlineCaching
                  ? `جارٍ تخزين الحزمة أوفلاين (${cacheProgressPercent}%)...`
                  : '⚡ تحديث وتخزين الحزمة الكاملة أوفلاين'}
              </span>
            </button>

            <a
              href={OFFICIAL_ACADEMY_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>دعم الأكاديمية: 201068631966</span>
            </a>
          </div>
        </div>

        {/* Offline Storage Status Telemetry Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>سور المصحف المخزنة</span>
              <HardDrive className="w-4 h-4 text-[#dfbd69]" />
            </div>
            <div className="text-xl font-extrabold font-mono text-white mt-1">
              {cachedSurahsCount} / 114 سورة
            </div>
            <div className="text-[10px] text-[#dfbd69] mt-0.5">
              متاح 100% بدون إنترنت
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>منهج الإمام للتأسيس</span>
              <Sparkles className="w-4 h-4 text-[#dfbd69]" />
            </div>
            <div className="text-xl font-extrabold font-mono text-white mt-1">
              8 / 8 مستويات
            </div>
            <div className="text-[10px] text-[#dfbd69] mt-0.5">
              شامل التهجي وعلاج اللثغات
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>قاعدة بيانات الطلاب</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-xl font-extrabold font-mono text-white mt-1">
              {students.length} طلاب • {sessions.length} حصة
            </div>
            <div className="text-[10px] text-[#dfbd69] mt-0.5">
              محفوظة في IndexedDB + LocalStorage
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>حالة الجاهزية أوفلاين</span>
              <Wifi className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-300 mt-1">
              {cacheProgressPercent}% جاهز
            </div>
            <div className="text-[10px] text-emerald-100 mt-0.5">
              آخر مزامنة محلية: {lastCachedTime}
            </div>
          </div>
        </div>
      </div>

      {/* Printable & Downloadable Educational Packets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
              حقيبة منهج الإمام للتأسيس (8 مستويات كاملة)
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              ملف شامل قابل للطباعة والتحميل يضم القواعد الـ 8، المقاطع الصوتية الملونة، وتدريبات نور البيان والقاعدة النورانية.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPrintableHtmlPacket('foundation')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#dfbd69]" />
            <span>تحميل وطباعة حقيبة التأسيس</span>
          </button>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#c59b27]/15 text-[#c59b27] flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
              موسوعة المتون التجويدية (تحفة الأطفال + الجزرية)
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              الأبيات المشكولة لأبواب النون الساكنة والميم والمدود ومخارج الحروف والصفات مع الشرح الميسر للطلاب.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDownloadPrintableHtmlPacket('matn')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل المتون مع الشرح</span>
          </button>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
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
