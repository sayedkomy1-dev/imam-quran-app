import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Image as ImageIcon,
  Layers,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sun,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  AyahEntry,
  JUZ_NAMES,
  RECITERS,
  SAJDAH_PAGES,
  SURAHS,
  getEveryAyahAudioUrl,
  getMadinahPageInfo,
  getPageNumberForJuz,
  getPageNumberForSurahAyah,
  getQuranPageImageUrl,
  getLocalKfgqpcPageUrl,
  getWordMeaningAndTafsir,
  loadDualTafsirForAyah,
  loadSurahVerses,
  parseVerseTajweedTokens,
  stripLeadingBasmalah,
} from '../data/quranData';
import { ErrorHotspotStageKey, RecitationError } from '../types';

export interface MushafEngineProps {
  initialPage?: number;
  initialSurahId?: number;
  initialJuz?: number;
  fromAyah?: number;
  toAyah?: number;
  defaultNightMode?: boolean;
  defaultDisplayMode?: 'digital_uthmani' | 'scanned_page';
  enableErrorMarking?: boolean;
  recordedErrors?: RecitationError[];
  historicalHotspots?: RecitationError[];
  onRecordError?: (error: Omit<RecitationError, 'id'>) => void;
  onPageChange?: (pageNumber: number) => void;
  compactHeader?: boolean;
}

export const MushafEngine: React.FC<MushafEngineProps> = ({
  initialPage,
  initialSurahId = 1,
  initialJuz,
  fromAyah,
  toAyah,
  defaultNightMode = false,
  defaultDisplayMode = 'digital_uthmani',
  enableErrorMarking = false,
  recordedErrors = [],
  historicalHotspots = [],
  onRecordError,
  onPageChange,
  compactHeader = false,
}) => {
  const computedStartPage = useMemo(() => {
    if (initialPage && initialPage >= 1 && initialPage <= 604) return initialPage;
    if (initialJuz && initialJuz >= 1 && initialJuz <= 30) return getPageNumberForJuz(initialJuz);
    return getPageNumberForSurahAyah(initialSurahId, fromAyah || 1);
  }, [initialPage, initialSurahId, initialJuz, fromAyah]);

  const [currentPage, setCurrentPage] = useState<number>(computedStartPage);
  const [displayMode, setDisplayMode] = useState<'digital_uthmani' | 'scanned_page'>(defaultDisplayMode);
  const [isNightMode, setIsNightMode] = useState<boolean>(defaultNightMode);
  const [nightFilterPreset, setNightFilterPreset] = useState<'royal_navy' | 'golden_amber' | 'high_contrast'>('royal_navy');
  const [tajweedColorsEnabled, setTajweedColorsEnabled] = useState<boolean>(true);
  const [fontScale, setFontScale] = useState<number>(1.85);
  const [selectedReciter, setSelectedReciter] = useState<string>(RECITERS[0].id);
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Verses state for current page's surahs
  const [pageSurahVerses, setPageSurahVerses] = useState<
    Array<{
      surahId: number;
      surahName: string;
      surahType: 'مكية' | 'مدنية';
      surahAyahsCount: number;
      surahJuz: number;
      fromAyah: number;
      toAyah: number;
      verses: AyahEntry[];
    }>
  >([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false);

  // Selected word popover for Tafsir & 3-Stage/4-Category Error Marking
  const [selectedWordState, setSelectedWordState] = useState<{
    word: string;
    surahId: number;
    surahName: string;
    ayahEntry: AyahEntry;
  } | null>(null);
  const [dualTafsir, setDualTafsir] = useState<{ muyassar: string; jalalayn: string } | null>(null);

  useEffect(() => {
    setCurrentPage(computedStartPage);
  }, [computedStartPage]);

  const pageInfo = useMemo(() => getMadinahPageInfo(currentPage), [currentPage]);
  const sajdahInfo = SAJDAH_PAGES[currentPage];

  // Dynamic CSS filter string for Night Mode on scanned Mushaf pages & ornaments
  const scannedNightCssFilter = useMemo(() => {
    if (!isNightMode) return 'none';
    if (nightFilterPreset === 'golden_amber') {
      return 'invert(0.93) hue-rotate(172deg) sepia(0.38) contrast(1.12) brightness(0.95)';
    }
    if (nightFilterPreset === 'high_contrast') {
      return 'invert(0.96) hue-rotate(185deg) contrast(1.22) brightness(0.98)';
    }
    // Default royal_navy: deep navy background with crisp warm-white/gold Uthmanic script
    return 'invert(0.92) hue-rotate(188deg) sepia(0.24) contrast(1.08) brightness(0.96)';
  }, [isNightMode, nightFilterPreset]);

  // Load verses for all surahs on the active page
  useEffect(() => {
    let isMounted = true;
    setIsLoadingVerses(true);

    const loadAllSegments = async () => {
      try {
        const segments = await Promise.all(
          pageInfo.surahsOnPage.map(async (seg) => {
            const meta = SURAHS.find((s) => s.id === seg.surahId) || SURAHS[0];
            const effectiveFrom = fromAyah && seg.surahId === initialSurahId ? Math.max(seg.fromAyah, fromAyah) : seg.fromAyah;
            const effectiveTo = toAyah && seg.surahId === initialSurahId ? Math.min(seg.toAyah, toAyah) : seg.toAyah;
            const verses = await loadSurahVerses(seg.surahId, effectiveFrom, effectiveTo);
            return {
              surahId: seg.surahId,
              surahName: meta.name,
              surahType: meta.type,
              surahAyahsCount: meta.ayahs,
              surahJuz: meta.juz,
              fromAyah: effectiveFrom,
              toAyah: effectiveTo,
              verses,
            };
          })
        );
        if (isMounted) {
          setPageSurahVerses(segments);
        }
      } finally {
        if (isMounted) {
          setIsLoadingVerses(false);
        }
      }
    };

    void loadAllSegments();
    return () => {
      isMounted = false;
    };
  }, [pageInfo, fromAyah, toAyah, initialSurahId]);

  // Load dual tafsir when a word is clicked
  useEffect(() => {
    if (!selectedWordState) {
      setDualTafsir(null);
      return;
    }
    let active = true;
    loadDualTafsirForAyah(
      selectedWordState.surahId,
      selectedWordState.ayahEntry.ayah,
      selectedWordState.ayahEntry.tafsir
    ).then((res) => {
      if (active) setDualTafsir(res);
    });
    return () => {
      active = false;
    };
  }, [selectedWordState]);

  const navigateToPage = (targetPage: number) => {
    const clamped = Math.max(1, Math.min(604, targetPage));
    setCurrentPage(clamped);
    setSelectedWordState(null);
    onPageChange?.(clamped);
  };

  const togglePlayAyahAudio = (surahId: number, ayahNumber: number) => {
    const key = `${surahId}:${ayahNumber}`;
    if (playingAyahKey === key && audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahKey(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const url = getEveryAyahAudioUrl(selectedReciter, surahId, ayahNumber);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAyahKey(key);
    audio.onended = () => setPlayingAyahKey(null);
    audio.onerror = () => setPlayingAyahKey(null);
    void audio.play();
  };

  // Hotspot lookup map
  const hotspotMap = useMemo(() => {
    const map = new Map<string, RecitationError>();
    historicalHotspots.forEach((err) => {
      const w = (err.word || '').trim();
      const aNum = err.ayahNumber ?? err.ayah ?? 1;
      if (w) map.set(`${err.surahId}:${aNum}:${w}`, err);
    });
    return map;
  }, [historicalHotspots]);

  const currentErrorMap = useMemo(() => {
    const map = new Map<string, RecitationError>();
    recordedErrors.forEach((err) => {
      const w = (err.word || '').trim();
      const aNum = err.ayahNumber ?? err.ayah ?? 1;
      if (w) map.set(`${err.surahId}:${aNum}:${w}`, err);
    });
    return map;
  }, [recordedErrors]);

  const handleMarkWordError = (
    stageKey: ErrorHotspotStageKey,
    errorType: RecitationError['errorType'],
    deductionPoints: number,
    stageNote: string
  ) => {
    if (!selectedWordState || !onRecordError) return;
    const mappedType: RecitationError['type'] =
      stageKey === 'memorization_1'
        ? 'حفظ'
        : stageKey === 'tashkeel_05'
        ? 'تشكيل'
        : stageKey === 'tajweed_05'
        ? 'تجويد'
        : 'تردد';
    onRecordError({
      type: mappedType,
      context: 'التسميع',
      word: selectedWordState.word,
      surahId: selectedWordState.surahId,
      surah: selectedWordState.surahName,
      surahName: selectedWordState.surahName,
      ayah: selectedWordState.ayahEntry.ayah,
      ayahNumber: selectedWordState.ayahEntry.ayah,
      errorType,
      deductionPoints,
      hotspotStageKey: stageKey,
      note: stageNote,
      timestamp: new Date().toISOString(),
    });
    setSelectedWordState(null);
  };

  return (
    <div
      className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden shadow-xl ${
        isNightMode
          ? 'bg-[#07111e] border-[#c59b27]/60 text-[#f5ecd5]'
          : 'bg-[#fcf9f2] border-[#c59b27]/50 text-[#1c160d]'
      }`}
    >
      {/* Top KFGQPC Mushaf Engine Control Bar */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          isNightMode
            ? 'bg-gradient-to-l from-[#0b192c] via-[#102542] to-[#0b192c] border-[#c59b27]/30'
            : 'bg-gradient-to-l from-[#145a3a] via-[#196b46] to-[#0f452c] border-[#c59b27]/40 text-white'
        }`}
      >
        {/* Right: Surah & Juz Selectors with Ornate Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#c59b27]/20 border border-[#c59b27]/60 text-[#dfbd69] text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>محرك المصحف العثماني KFGQPC</span>
          </span>

          {/* Surah Selector */}
          <select
            value={pageInfo.primarySurahId}
            onChange={(e) => {
              const sId = Number(e.target.value);
              navigateToPage(getPageNumberForSurahAyah(sId, 1));
            }}
            aria-label="اختيار السورة"
            className="py-1.5 px-2.5 rounded-xl bg-black/25 border border-[#c59b27]/50 text-white text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            {SURAHS.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0d261a] text-white">
                {s.id}. سورة {s.name} ({s.type} • {s.ayahs} آية)
              </option>
            ))}
          </select>

          {/* 30 Juz Selector */}
          <select
            value={pageInfo.juzNumber}
            onChange={(e) => {
              const jNum = Number(e.target.value);
              navigateToPage(getPageNumberForJuz(jNum));
            }}
            aria-label="اختيار الجزء"
            className="py-1.5 px-2.5 rounded-xl bg-black/25 border border-[#c59b27]/50 text-[#dfbd69] text-xs font-extrabold focus:outline-none cursor-pointer"
          >
            {JUZ_NAMES.map((jName, idx) => (
              <option key={idx + 1} value={idx + 1} className="bg-[#0d261a] text-white">
                الجزء {idx + 1}: {jName}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Page Stepper (1..604) */}
        <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-xl border border-[#c59b27]/40">
          <button
            type="button"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 text-white cursor-pointer"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 text-xs font-mono font-black text-[#dfbd69]">
            <span>ص</span>
            <input
              type="number"
              min={1}
              max={604}
              value={currentPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= 604) navigateToPage(val);
              }}
              className="w-12 text-center bg-transparent border-b border-[#c59b27]/60 text-white font-bold focus:outline-none"
            />
            <span className="text-[10px] text-white/75">/ 604</span>
          </div>
          <button
            type="button"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={currentPage >= 604}
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 text-white cursor-pointer"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Left: Mode Switcher, Night Mode CSS Filter Toggle, Tajweed & Font Zoom */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() =>
              setDisplayMode((prev) =>
                prev === 'digital_uthmani' ? 'scanned_page' : 'digital_uthmani'
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-extrabold border border-white/20 cursor-pointer transition"
          >
            {displayMode === 'digital_uthmani' ? (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>المصحف المصور</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>الخط العثماني التفاعلي</span>
              </>
            )}
          </button>

          {/* True Night Mode Toggle (invert / hue-rotate / contrast) */}
          <button
            type="button"
            onClick={() => setIsNightMode((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer transition ${
              isNightMode
                ? 'bg-[#c59b27] text-[#091526] border-[#dfbd69] shadow-sm'
                : 'bg-black/25 text-[#dfbd69] border-[#c59b27]/50 hover:bg-black/40'
            }`}
            title="تفعيل الوضع الليلي المريح للعين عبر فلاتر CSS الذكية (invert / hue-rotate / contrast)"
          >
            {isNightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isNightMode ? 'وضع النهار' : 'الوضع الليلي الذكي'}</span>
          </button>

          {isNightMode && (
            <select
              value={nightFilterPreset}
              onChange={(e) =>
                setNightFilterPreset(
                  e.target.value as 'royal_navy' | 'golden_amber' | 'high_contrast'
                )
              }
              aria-label="نمط فلتر الوضع الليلي"
              className="py-1 px-2 rounded-xl bg-[#0b192c] border border-[#c59b27]/60 text-[#dfbd69] text-[10px] font-bold cursor-pointer"
            >
              <option value="royal_navy">فلتر كحلي ملكي (Invert + Hue 188°)</option>
              <option value="golden_amber">فلتر ذهبي دافئ (Sepia + Hue 172°)</option>
              <option value="high_contrast">فلتر تباين عالٍ (Contrast 122%)</option>
            </select>
          )}

          {displayMode === 'digital_uthmani' && (
            <>
              <button
                type="button"
                onClick={() => setTajweedColorsEnabled((p) => !p)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border cursor-pointer transition ${
                  tajweedColorsEnabled
                    ? 'bg-emerald-500/25 border-emerald-300/60 text-white'
                    : 'bg-black/20 border-white/15 text-white/70'
                }`}
              >
                🎨 ألوان التجويد
              </button>
              <button
                type="button"
                onClick={() => setFontScale((s) => Math.min(2.6, Number((s + 0.15).toFixed(2))))}
                className="p-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white border border-white/15 cursor-pointer"
                title="تكبير الخط العثماني"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFontScale((s) => Math.max(1.3, Number((s - 0.15).toFixed(2))))}
                className="p-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-white border border-white/15 cursor-pointer"
                title="تصغير الخط العثماني"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ornate 30-Juz & Hizb Header Ribbon with SVG Medallions */}
      {!compactHeader && (
        <div
          className={`px-5 py-2.5 border-b flex items-center justify-between gap-3 flex-wrap text-xs ${
            isNightMode
              ? 'bg-[#0a1829] border-[#c59b27]/25 text-[#dfbd69]'
              : 'bg-[#f4ede0] border-[#c59b27]/35 text-[#145a3a]'
          }`}
        >
          {/* Right Badge: Juz & Name with SVG Star Medallion */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-[#c59b27]/25 to-emerald-700/15 border border-[#c59b27]/60 font-black">
              <svg className="w-4 h-4 text-[#c59b27] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L14.8 6.2L20.5 5.5L17.8 10.5L22 14.5L16.5 16.2L16.2 22L12 18.8L7.8 22L7.5 16.2L2 14.5L6.2 10.5L3.5 5.5L9.2 6.2L12 1Z" />
              </svg>
              <span>
                الجزء {pageInfo.juzNumber}: {pageInfo.juzName}
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27]/15 border border-[#c59b27]/40 text-[11px] font-extrabold">
              الحزب {pageInfo.hizbNumber} • الربع {pageInfo.quarterInHizb}
            </span>
          </div>

          {/* Center: Sajdah Indicator or Hotspot Counter */}
          <div className="flex items-center gap-2">
            {sajdahInfo && (
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                ۩ موضع سجدة تلاوة: سورة {sajdahInfo.surahName} (آية {sajdahInfo.ayahNumber})
              </span>
            )}
            {historicalHotspots.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-[11px] font-black">
                <Flame className="w-3.5 h-3.5" />
                <span>نقاط ساخنة للمراجعة: {historicalHotspots.length}</span>
              </span>
            )}
          </div>

          {/* Left Badge: Surah Name & Page Number */}
          <div className="flex items-center gap-2 font-black">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#c59b27]/25 to-emerald-700/15 border border-[#c59b27]/60">
              سُورَةُ {pageInfo.primarySurahName} • ص {currentPage}
            </span>
          </div>
        </div>
      )}

      {/* Main Mushaf Frame with 4 Ornate SVG Corners (/mushaf-corner.svg) */}
      <div className="relative p-4 sm:p-7 md:p-9 min-h-[540px] flex flex-col justify-between">
        {/* 4 Ornate Islamic SVG Corner Frames */}
        <img
          src="/mushaf-corner.svg"
          alt=""
          aria-hidden="true"
          style={isNightMode ? { filter: 'brightness(1.25) saturate(1.15)' } : undefined}
          className="w-12 h-12 sm:w-16 sm:h-16 absolute top-2 right-2 pointer-events-none select-none opacity-85"
        />
        <img
          src="/mushaf-corner.svg"
          alt=""
          aria-hidden="true"
          style={
            isNightMode
              ? { transform: 'scaleX(-1)', filter: 'brightness(1.25) saturate(1.15)' }
              : { transform: 'scaleX(-1)' }
          }
          className="w-12 h-12 sm:w-16 sm:h-16 absolute top-2 left-2 pointer-events-none select-none opacity-85"
        />
        <img
          src="/mushaf-corner.svg"
          alt=""
          aria-hidden="true"
          style={
            isNightMode
              ? { transform: 'scaleY(-1)', filter: 'brightness(1.25) saturate(1.15)' }
              : { transform: 'scaleY(-1)' }
          }
          className="w-12 h-12 sm:w-16 sm:h-16 absolute bottom-2 right-2 pointer-events-none select-none opacity-85"
        />
        <img
          src="/mushaf-corner.svg"
          alt=""
          aria-hidden="true"
          style={
            isNightMode
              ? { transform: 'scale(-1, -1)', filter: 'brightness(1.25) saturate(1.15)' }
              : { transform: 'scale(-1, -1)' }
          }
          className="w-12 h-12 sm:w-16 sm:h-16 absolute bottom-2 left-2 pointer-events-none select-none opacity-85"
        />

        {/* Inner Double Golden Frame */}
        <div
          className={`relative z-10 rounded-2xl border-2 p-4 sm:p-6 md:p-8 shadow-inner transition-colors ${
            isNightMode
              ? 'bg-[#091526]/95 border-[#c59b27]/55'
              : 'bg-[#fffdf7] border-[#c59b27]/60'
          }`}
        >
          {displayMode === 'scanned_page' ? (
            /* Scanned Madinah Mushaf Page with CSS Night Filter (invert / hue-rotate / contrast) */
            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`relative w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden border-2 border-[#c59b27]/60 shadow-lg ${
                  isNightMode ? 'bg-[#07111e]' : 'bg-[#fffdf7]'
                }`}
              >
                <img
                  src={getLocalKfgqpcPageUrl(currentPage)}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback1) {
                      target.dataset.fallback1 = '1';
                      target.src = getQuranPageImageUrl('madinah', currentPage);
                    } else if (!target.dataset.fallback2) {
                      target.dataset.fallback2 = '1';
                      target.src = getQuranPageImageUrl('shamarli', currentPage);
                    }
                  }}
                  alt={`صفحة المصحف الشريف رقم ${currentPage}`}
                  style={{ filter: scannedNightCssFilter }}
                  className="w-full h-auto object-contain mx-auto transition-all duration-300 select-none"
                />
              </div>
              <div className="text-[11px] font-bold text-center opacity-80">
                {isNightMode
                  ? `🌙 الوضع الليلي للمصحف المصور مفعّل عبر فلاتر CSS (${scannedNightCssFilter})`
                  : '📖 طبعة مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة'}
              </div>
            </div>
          ) : isLoadingVerses ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#c59b27] border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-[#c59b27]">
                جاري تحميل الرسم العثماني القياسي (KFGQPC Uthmanic Script)...
              </p>
            </div>
          ) : (
            /* Digital Uthmani Script Engine (uthmanic_hafs) + Ornate SVG Surah Banners */
            <div className="space-y-8">
              {pageSurahVerses.map((segment) => (
                <div key={`${segment.surahId}-${segment.fromAyah}`} className="space-y-5">
                  {/* Ornate SVG Surah Header Cartouche (/mushaf-title-ornament.svg) */}
                  <div className="relative w-full max-w-2xl mx-auto my-2">
                    <div className="relative h-16 sm:h-20 flex items-center justify-center overflow-hidden rounded-2xl border border-[#c59b27]/60 shadow-sm">
                      <img
                        src="/mushaf-title-ornament.svg"
                        alt=""
                        aria-hidden="true"
                        style={
                          isNightMode
                            ? { filter: 'brightness(0.92) contrast(1.12)' }
                            : undefined
                        }
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      />
                      <div className="relative z-10 flex items-center justify-between w-full px-6 sm:px-12 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-black/35 border border-[#dfbd69]/50 text-[#dfbd69] text-[10px] sm:text-xs font-extrabold">
                          الجزء {segment.surahJuz}
                        </span>
                        <div className="flex flex-col items-center">
                          <h3 className="font-uthmanic-hafs text-lg sm:text-2xl font-black text-[#fff8e7] drop-shadow">
                            سُورَةُ {segment.surahName}
                          </h3>
                          <span className="text-[10px] text-[#dfbd69] font-bold">
                            آياتها ({segment.surahAyahsCount}) • {segment.surahType}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-black/35 border border-[#dfbd69]/50 text-[#dfbd69] text-[10px] sm:text-xs font-extrabold">
                          ترتيبها {segment.surahId}
                        </span>
                      </div>
                    </div>

                    {/* Basmalah for every Surah start except At-Tawbah (9) and Al-Fatihah (1) */}
                    {segment.fromAyah === 1 && segment.surahId !== 1 && segment.surahId !== 9 && (
                      <div
                        className={`text-center pt-4 pb-1 font-uthmanic-hafs text-2xl sm:text-3xl font-bold ${
                          isNightMode ? 'text-[#dfbd69]' : 'text-[#145a3a]'
                        }`}
                      >
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </div>
                    )}
                  </div>

                  {/* Continuous Uthmanic Ayahs Block */}
                  <div
                    dir="rtl"
                    style={{
                      fontSize: `${fontScale}rem`,
                      lineHeight: 2.25,
                    }}
                    className="font-uthmanic-hafs text-justify leading-relaxed select-text px-1 sm:px-3"
                  >
                    {segment.verses.map((ayahObj) => {
                      const cleanText = stripLeadingBasmalah(
                        ayahObj.text,
                        segment.surahId,
                        ayahObj.ayah
                      );
                      const tokens = parseVerseTajweedTokens(cleanText);
                      const isPlayingThisAyah =
                        playingAyahKey === `${segment.surahId}:${ayahObj.ayah}`;

                      return (
                        <React.Fragment key={ayahObj.ayah}>
                          <span
                            className={`inline rounded-xl transition-colors ${
                              isPlayingThisAyah
                                ? isNightMode
                                  ? 'bg-[#c59b27]/25 ring-1 ring-[#dfbd69]'
                                  : 'bg-emerald-500/15 ring-1 ring-[#145a3a]'
                                : ''
                            }`}
                          >
                            {tokens.map((tok, tokIdx) => {
                              if (/^\s+$/.test(tok.text)) {
                                return <span key={tokIdx}>{tok.text}</span>;
                              }
                              const trimmedWord = tok.text.trim();
                              const errKey = `${segment.surahId}:${ayahObj.ayah}:${trimmedWord}`;
                              const recordedErr = currentErrorMap.get(errKey);
                              const hotspotErr = hotspotMap.get(errKey);

                              let wordBadgeClass = '';
                              if (recordedErr) {
                                if (recordedErr.hotspotStageKey === 'memorization_1') {
                                  wordBadgeClass =
                                    'bg-red-600/25 text-red-600 dark:text-red-300 ring-2 ring-red-500 rounded-lg px-1';
                                } else if (recordedErr.hotspotStageKey === 'tashkeel_05') {
                                  wordBadgeClass =
                                    'bg-orange-500/25 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500 rounded-lg px-1';
                                } else if (recordedErr.hotspotStageKey === 'tajweed_05') {
                                  wordBadgeClass =
                                    'bg-purple-600/25 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500 rounded-lg px-1';
                                } else {
                                  wordBadgeClass =
                                    'bg-amber-500/25 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500 rounded-lg px-1';
                                }
                              } else if (hotspotErr) {
                                wordBadgeClass =
                                  'hotspot-word-pulse bg-amber-500/20 border-b-2 border-rose-500 rounded-md px-1';
                              }

                              const tokenColor =
                                tajweedColorsEnabled && tok.color && !recordedErr
                                  ? tok.color
                                  : undefined;

                              return (
                                <span
                                  key={tokIdx}
                                  onClick={() =>
                                    setSelectedWordState({
                                      word: trimmedWord,
                                      surahId: segment.surahId,
                                      surahName: segment.surahName,
                                      ayahEntry: ayahObj,
                                    })
                                  }
                                  style={tokenColor ? { color: tokenColor } : undefined}
                                  title={
                                    hotspotErr
                                      ? `🔥 نقطة ساخنة سابقة (${hotspotErr.note || hotspotErr.errorType}) — انقر للتدبر أو رصد الإتقان`
                                      : 'انقر لعرض معنى الكلمة والتفسير أو وسم ملاحظة التسميع'
                                  }
                                  className={`cursor-pointer hover:bg-[#c59b27]/20 rounded-md px-0.5 transition ${wordBadgeClass}`}
                                >
                                  {tok.text}
                                </span>
                              );
                            })}
                          </span>

                          {/* Ornate SVG Ayah End Medallion + Audio Play Trigger */}
                          <button
                            type="button"
                            onClick={() =>
                              togglePlayAyahAudio(segment.surahId, ayahObj.ayah)
                            }
                            title={`استماع للآية ${ayahObj.ayah} بصوت القارئ المختار`}
                            className={`inline-flex items-center justify-center mx-1.5 px-2 py-0.5 rounded-full border text-sm font-mono font-black align-middle cursor-pointer transition ${
                              isPlayingThisAyah
                                ? 'bg-[#c59b27] text-[#091526] border-[#dfbd69] scale-110'
                                : isNightMode
                                ? 'bg-[#102542] text-[#dfbd69] border-[#c59b27]/60 hover:bg-[#c59b27]/30'
                                : 'bg-[#f4ede0] text-[#145a3a] border-[#c59b27]/60 hover:bg-[#c59b27]/25'
                            }`}
                          >
                            <span>﴿{ayahObj.ayah}﴾</span>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Word Popover: Word Meaning + Dual Tafsir + 4-Category Weighted Error Marking */}
        {selectedWordState && (
          <div
            className={`mt-4 p-4 rounded-2xl border-2 shadow-xl transition-all ${
              isNightMode
                ? 'bg-[#0d1f38] border-[#c59b27]/70 text-[#f5ecd5]'
                : 'bg-white border-[#145a3a]/40 text-[#14281d]'
            }`}
          >
            {(() => {
              const info = getWordMeaningAndTafsir(
                selectedWordState.word,
                selectedWordState.ayahEntry,
                selectedWordState.surahName
              );
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#c59b27]/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-[#c59b27]/20 border border-[#c59b27]/50 font-uthmanic-hafs text-xl font-black text-[#c59b27]">
                        ﴿ {selectedWordState.word} ﴾
                      </span>
                      <span className="text-xs font-extrabold opacity-80">
                        سورة {selectedWordState.surahName} • الآية ({selectedWordState.ayahEntry.ayah})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          togglePlayAyahAudio(
                            selectedWordState.surahId,
                            selectedWordState.ayahEntry.ayah
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                      >
                        {playingAyahKey ===
                        `${selectedWordState.surahId}:${selectedWordState.ayahEntry.ayah}` ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>سماع الآية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWordState(null)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-xs font-bold cursor-pointer"
                      >
                        إغلاق ✕
                      </button>
                    </div>
                  </div>

                  {/* 4-Category Weighted Error Marking Buttons (when enableErrorMarking is active) */}
                  {enableErrorMarking && onRecordError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                      <div className="text-xs font-black text-rose-600 dark:text-rose-300">
                        🎯 تصنيف الخطأ الفوري وحفظه في سجل النقاط الساخنة (Error Hotspots):
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkWordError(
                              'memorization_1',
                              'نسيان',
                              1.0,
                              '🔴 خطأ حفظ / نسيان (-1.0 نقطة)'
                            )
                          }
                          className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black cursor-pointer shadow-xs"
                        >
                          🔴 خطأ حفظ / نسيان (-1)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkWordError(
                              'tashkeel_05',
                              'تشكيل',
                              0.5,
                              '🟠 خطأ تشكيل / إعراب (-0.5 نقطة)'
                            )
                          }
                          className="py-2 px-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black cursor-pointer shadow-xs"
                        >
                          🟠 خطأ تشكيل / إعراب (-0.5)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkWordError(
                              'tajweed_05',
                              'تجويد',
                              0.5,
                              '🟣 خطأ حكم تجويدي (-0.5 نقطة)'
                            )
                          }
                          className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black cursor-pointer shadow-xs"
                        >
                          🟣 خطأ حكم تجويدي (-0.5)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkWordError(
                              'hesitation_025',
                              'تردد',
                              0.25,
                              '🟡 تردد / تنبيه فتح (-0.25 نقطة)'
                            )
                          }
                          className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#14281d] text-xs font-black cursor-pointer shadow-xs"
                        >
                          🟡 تردد / تنبيه فتح (-0.25)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Word Meaning & Tajweed Note */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#c59b27]/10 border border-[#c59b27]/30">
                      <span className="font-black text-[#c59b27] block mb-0.5">
                        📖 بيان الكلمة والتدبر:
                      </span>
                      <p className="leading-relaxed font-semibold">{info.wordMeaning}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="font-black text-emerald-600 dark:text-emerald-300 block mb-0.5">
                        🎙️ الملاحظة التجويدية والأدائية:
                      </span>
                      <p className="leading-relaxed font-semibold">{info.tajweedNote}</p>
                    </div>
                  </div>

                  {dualTafsir && (
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#c59b27]/25 text-xs space-y-1">
                      <div className="font-black text-[#c59b27]">
                        📚 التفسير الميسر للآية الكريمة:
                      </div>
                      <p className="leading-relaxed">{dualTafsir.muyassar}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Bottom Mushaf Page Footer */}
        <div className="mt-4 pt-2 border-t border-[#c59b27]/30 flex items-center justify-between text-[11px] font-bold opacity-85">
          <span>الجزء {pageInfo.juzNumber} ({pageInfo.juzName})</span>
          <span className="font-mono font-black text-xs px-3 py-0.5 rounded-full bg-[#c59b27]/20 border border-[#c59b27]/50">
            صفحة {currentPage}
          </span>
          <span>سورة {pageInfo.primarySurahName}</span>
        </div>
      </div>
    </div>
  );
};
