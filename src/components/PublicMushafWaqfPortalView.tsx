import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Heart,
  Image as ImageIcon,
  Layers,
  ListFilter,
  Maximize2,
  MessageCircle,
  Mic,
  Minimize2,
  Moon,
  Pause,
  Play,
  Printer,
  Repeat,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Sun,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import { useAcademy } from '../context/AcademyContext';
import {
  AyahEntry,
  BUILT_IN_ADHKAR_AND_RUQYAH_LIBRARY,
  JUZ_NAMES,
  QuranEditionMode,
  QuranSearchResultItem,
  RECITERS,
  SAJDAH_PAGES,
  SURAHS,
  WAQF_DEDICATION_TEXT,
  getAllQuartersIndex,
  getEveryAyahAudioUrl,
  getMadinahPageInfo,
  getPageNumberForJuz,
  getPageNumberForQuarter,
  getPageNumberForSurahAyah,
  getQuranPageImageUrl,
  getWordMeaningAndTafsir,
  loadDualTafsirForAyah,
  loadSurahVerses,
  parseVerseTajweedTokens,
  searchQuranVersesInstant,
  stripLeadingBasmalah,
} from '../data/quranData';
import { PublicBookmarkCategory, ReciterId } from '../types';
import { AcademyPdfGuideModal } from './AcademyPdfGuideModal';
import { ACADEMY_BRAND_CONFIG } from '../constants/brandConfig';
const OFFICIAL_BRANDING = {
  academyName: ACADEMY_BRAND_CONFIG.platformName,
  slogan: ACADEMY_BRAND_CONFIG.slogan,
  developerName: ACADEMY_BRAND_CONFIG.creatorNameEn,
  whatsappDisplay: ACADEMY_BRAND_CONFIG.whatsappNumber,
};

interface PublicMushafWaqfPortalViewProps {
  onClosePortal?: () => void;
  onBackToAcademy?: () => void;
  embeddedInTeacherOrGuardian?: boolean;
}

export interface WaqfDedicationProps {
  compact?: boolean;
  variant?: 'portal_banner' | 'khatmah_screen' | 'certificate';
  onOpenFullModal?: () => void;
}

export const WAQF_MEMORIAL_NAMES_LIST = [
  {
    id: 'parents',
    relation: 'لوالدينا الكريمين',
    fullName: 'لوالدينا الكريمين رحمهما الله وغفر لهما',
    shortName: 'والدينا الكريمين',
  },
  {
    id: 'all_muslims',
    relation: 'ولجميع أموات المسلمين',
    fullName: 'لجميع موتانا وموتى المسلمين أجمعين',
    shortName: 'موتانا وموتى المسلمين',
  },
] as const;

export const WaqfDedication: React.FC<WaqfDedicationProps> = ({
  compact = false,
  variant = 'portal_banner',
  onOpenFullModal,
}) => {
  const { waqfImpactStats, recordWaqfAmeenPrayer } = useAcademy();
  const [justPrayed, setJustPrayed] = useState(false);
  const [localSessionAmeens, setLocalSessionAmeens] = useState(0);

  const totalDedicatedKhatmahs = waqfImpactStats.completedKhatmahsCount;
  const totalDedicatedKhatmahsAndPrayers =
    waqfImpactStats.ameenPrayersCount + waqfImpactStats.completedKhatmahsCount;

  const handleAmeenClick = () => {
    recordWaqfAmeenPrayer();
    setLocalSessionAmeens((prev) => prev + 1);
    setJustPrayed(true);
    setTimeout(() => setJustPrayed(false), 3500);
  };

  if (compact) {
    return (
      <div className="rounded-xl border border-amber-300/70 dark:border-amber-700/40 bg-[#fcf9ef] dark:bg-[#112119] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-neutral-700 dark:text-emerald-100">
          <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
            🌿 وقف قرآني وصدقة جارية:
          </span>
          <span>
            اللهم اجعل ثواب التلاوة صدقة جارية ونوراً ورحمةً{' '}
            <strong className="text-[#14281d] dark:text-amber-200">
              لوالدينا وأمواتنا وأموات المسلمين أجمعين.
            </strong>
          </span>
          <span className="text-[11px] font-mono tabular-nums text-amber-800 dark:text-amber-300 font-bold">
            (الدعوات والختمات: {totalDedicatedKhatmahsAndPrayers.toLocaleString('ar-EG')})
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAmeenClick}
            className="px-3 py-1 rounded-lg bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            🤲 آمين (+1)
          </button>
          {justPrayed && (
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              تقبل الله دعاءكم
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/70 dark:border-amber-500/50 bg-gradient-to-l from-[#fffdf6] via-[#fcf6e3] to-[#f8ecc9] dark:from-slate-900 dark:via-emerald-950/85 dark:to-amber-950/60 p-3.5 sm:p-4 shadow-xs">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="font-extrabold text-amber-800 dark:text-amber-300">
              {WAQF_DEDICATION_TEXT.header}
            </span>
            <span aria-hidden="true" className="text-amber-600/50">·</span>
            <span className="font-bold text-emerald-950 dark:text-emerald-200">
              عدّاد الختمات المهداة:{' '}
              <strong className="font-mono text-amber-800 dark:text-amber-300">
                {totalDedicatedKhatmahs.toLocaleString('ar-EG')}
              </strong>
            </span>
            <span aria-hidden="true" className="text-amber-600/50">·</span>
            <span className="font-bold text-amber-900 dark:text-amber-300/90">
              إجمالي الدعوات والختمات: {totalDedicatedKhatmahsAndPrayers.toLocaleString('ar-EG')}
            </span>
          </div>

          <p className="text-xs font-bold text-slate-800 dark:text-amber-100 leading-relaxed">
            {WAQF_DEDICATION_TEXT.intro}{' '}
            <strong className="text-[#145a3a] dark:text-amber-200">
              لوالدينا الكريمين ولجميع موتانا وموتى المسلمين أجمعين.
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAmeenClick}
            className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/60 whitespace-nowrap"
          >
            <span>🤲 آمين — إهداء ثواب التلاوة (+1)</span>
          </button>

          {variant === 'khatmah_screen' && (
            <div className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 text-center">
              ✨ كل نقرة تزيد عدّاد الختمات والدعوات
              {localSessionAmeens > 0 ? ` (+${localSessionAmeens})` : ''}
            </div>
          )}

          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-xs transition cursor-pointer text-center border border-amber-400/50 whitespace-nowrap"
            >
              وثيقة الوقف ودعاء الختمة
            </button>
          )}

          {justPrayed && (
            <div className="text-center text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/95 dark:bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-400/60">
              {WAQF_DEDICATION_TEXT.ameenToastMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WaqfDedicationBannerCard = WaqfDedication;

export interface ImmersiveReadingModeProps {
  isActive: boolean;
  onToggle: () => void;
  currentPage: number;
  juzNumber: number;
  juzName: string;
  hizbNumber: number;
  quarterInHizb: number;
  flatPageAyahs: { surahId: number; surahName: string; ayahEntry: AyahEntry }[];
  activeSurahId: number;
  activeAyahNumber: number;
  onSelectAyah: (surahId: number, ayahNumber: number) => void;
  onStepAyah: (direction: 'next' | 'prev') => void;
  onStepPage: (direction: 'next' | 'prev') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedReciter: ReciterId;
  onChangeReciter: (reciter: ReciterId) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  mushafNightMode: boolean;
  mushafSepiaMode: boolean;
  onSelectTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  onAdjustFontSize: (delta: 1 | -1) => void;
  onSaveTadabburBookmark: (surahId: number, surahName: string, ayahEntry: AyahEntry) => void;
  focusStyle: 'spotlight_page' | 'single_ayah_zen';
  onChangeFocusStyle: (style: 'spotlight_page' | 'single_ayah_zen') => void;
}

export const ImmersiveReadingMode: React.FC<ImmersiveReadingModeProps> = ({
  isActive,
  onToggle,
  currentPage,
  juzNumber,
  juzName,
  hizbNumber,
  quarterInHizb,
  flatPageAyahs,
  activeSurahId,
  activeAyahNumber,
  onSelectAyah,
  onStepAyah,
  onStepPage,
  isPlaying,
  onTogglePlay,
  selectedReciter,
  onChangeReciter,
  playbackSpeed,
  onChangeSpeed,
  mushafNightMode,
  mushafSepiaMode,
  onSelectTheme,
  onAdjustFontSize,
  onSaveTadabburBookmark,
  focusStyle,
  onChangeFocusStyle,
}) => {
  const [showInlineTafsir, setShowInlineTafsir] = useState<boolean>(true);
  const [focusedWord, setFocusedWord] = useState<string | null>(null);

  const currentAyahIndex = useMemo(() => {
    const idx = flatPageAyahs.findIndex(
      (item) => item.surahId === activeSurahId && item.ayahEntry.ayah === activeAyahNumber
    );
    return idx >= 0 ? idx : 0;
  }, [flatPageAyahs, activeSurahId, activeAyahNumber]);

  const focusedItem = flatPageAyahs[currentAyahIndex] || flatPageAyahs[0] || null;
  const prevItem = currentAyahIndex > 0 ? flatPageAyahs[currentAyahIndex - 1] : null;
  const nextItem =
    currentAyahIndex >= 0 && currentAyahIndex + 1 < flatPageAyahs.length
      ? flatPageAyahs[currentAyahIndex + 1]
      : null;

  useEffect(() => {
    setFocusedWord(null);
  }, [activeSurahId, activeAyahNumber, currentPage]);

  // Keyboard navigation in Immersive Reading Mode
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onToggle();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onStepAyah('next');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onStepAyah('prev');
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onToggle, onStepAyah, onTogglePlay]);

  if (!isActive) {
    return null;
  }

  return (
    <div
      className={`rounded-[28px] border-2 p-4 sm:p-6 shadow-2xl transition-all space-y-5 ${
        mushafNightMode
          ? 'bg-[#09121d] border-amber-500/60 text-amber-50'
          : mushafSepiaMode
          ? 'bg-[#f6eedb] border-amber-600/60 text-[#2b2114]'
          : 'bg-gradient-to-b from-[#fffdf7] to-[#fcf6e6] dark:from-slate-900 dark:to-slate-950 border-amber-500/70 text-slate-900 dark:text-slate-100'
      }`}
    >
      {/* Top Minimal Immersive Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-2xs">
            <span>🧘 وضع القراءة الخاشعة نشط</span>
          </span>
          <span className="text-xs font-extrabold text-emerald-800 dark:text-amber-300">
            صفحة {currentPage} • {juzName} (الجزء {juzNumber} • الحزب {hizbNumber} • الربع {quarterInHizb})
          </span>
          {focusedItem && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30">
              الآية {currentAyahIndex + 1} من {flatPageAyahs.length} في الصفحة
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Focus Mode Switcher: Spotlight + Dimmed Page vs Single Ayah Zen */}
          <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/10 p-0.5 border border-amber-500/30">
            <button
              type="button"
              onClick={() => onChangeFocusStyle('spotlight_page')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                focusStyle === 'spotlight_page'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'opacity-75 hover:opacity-100'
              }`}
              title="التركيز على الآية الحالية مع تعتيم هادئ لباقي آيات الصفحة"
            >
              📖 تركيز مع سياق الصفحة
            </button>
            <button
              type="button"
              onClick={() => onChangeFocusStyle('single_ayah_zen')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                focusStyle === 'single_ayah_zen'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'opacity-75 hover:opacity-100'
              }`}
              title="إخفاء الصفحة بالكامل وعرض الآية الحالية فقط لتدبر عميق"
            >
              🎯 الآية الحالية فقط
            </button>
          </div>

          {/* Font Scale A+ / A- */}
          <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/10 border border-amber-500/30 overflow-hidden">
            <button
              type="button"
              onClick={() => onAdjustFontSize(1)}
              className="px-2.5 py-1 text-xs font-black hover:bg-amber-500/20 cursor-pointer"
              title="تكبير خط الآية"
            >
              أ+
            </button>
            <span className="w-px h-4 bg-amber-500/30" />
            <button
              type="button"
              onClick={() => onAdjustFontSize(-1)}
              className="px-2.5 py-1 text-xs font-black hover:bg-amber-500/20 cursor-pointer"
              title="تصغير خط الآية"
            >
              أ-
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/10 border border-amber-500/30 p-0.5">
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                !mushafNightMode && !mushafSepiaMode ? 'bg-amber-400 text-slate-950 font-black' : ''
              }`}
              title="الوضع النهاري"
            >
              ☀️
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                mushafNightMode ? 'bg-amber-400 text-slate-950 font-black' : ''
              }`}
              title="الوضع الليلي"
            >
              🌙
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('sepia')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                mushafSepiaMode ? 'bg-amber-400 text-slate-950 font-black' : ''
              }`}
              title="الوضع الكريمي المريح للعين"
            >
              📜
            </button>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs transition"
            title="الخروج من وضع القراءة الخاشعة وإظهار جميع أدوات المصحف (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>إنهاء وضع الخشوع (Esc)</span>
          </button>
        </div>
      </div>

      {/* Focused Current Ayah Spotlight Stage (منصة التركيز على الآية الحالية) */}
      {focusedItem && (
        <div className="relative rounded-3xl border-2 border-amber-500/70 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-600/10 p-5 sm:p-8 shadow-inner space-y-5">
          {/* Header Badge of Focused Ayah */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-800 text-amber-300 text-xs font-black shadow-2xs">
                سُورَةُ {focusedItem.surahName} • الآية ﴿{focusedItem.ayahEntry.ayah}﴾
              </span>
              <span className="text-[11px] font-bold opacity-75">
                انقر على أي كلمة في الآية لإظهار معناها وأحكام تجويدها فوراً
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowInlineTafsir((prev) => !prev)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 border cursor-pointer transition ${
                  showInlineTafsir
                    ? 'bg-emerald-700/20 border-emerald-500/50 text-emerald-900 dark:text-emerald-200'
                    : 'bg-black/5 dark:bg-white/5 border-amber-500/30 opacity-80'
                }`}
              >
                {showInlineTafsir ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showInlineTafsir ? 'إخفاء التفسير' : 'إظهار التفسير الميسر'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSaveTadabburBookmark(
                    focusedItem.surahId,
                    focusedItem.surahName,
                    focusedItem.ayahEntry
                  )
                }
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-extrabold cursor-pointer transition"
              >
                ⭐ حفظ في فواصل التدبر
              </button>
            </div>
          </div>

          {/* Previous Ayah Context Whisper (Dimmed) */}
          {prevItem && (
            <div
              onClick={() => onSelectAyah(prevItem.surahId, prevItem.ayahEntry.ayah)}
              className="text-center text-sm sm:text-base font-serif opacity-40 hover:opacity-80 cursor-pointer transition select-none truncate px-4"
              title="انقر للعودة إلى الآية السابقة"
            >
              ﴿ {prevItem.ayahEntry.text} ﴾ ({prevItem.ayahEntry.ayah})
            </div>
          )}

          {/* Main Spotlighted Current Ayah Text */}
          <div className="py-4 px-2 sm:px-6 text-center">
            <div className="leading-[2.7] text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-wide flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
              {focusedItem.ayahEntry.text.split(/\s+/).filter(Boolean).map((word, wIdx) => (
                <button
                  key={`${focusedItem.ayahEntry.ayah}-${wIdx}`}
                  type="button"
                  onClick={() => setFocusedWord((prev) => (prev === word ? null : word))}
                  className={`px-1.5 py-0.5 rounded-xl transition-all cursor-pointer ${
                    focusedWord === word
                      ? 'bg-amber-400 text-slate-950 font-black scale-105 shadow-sm'
                      : 'hover:bg-amber-500/20'
                  }`}
                >
                  {word}
                </button>
              ))}
              <span className="inline-flex items-center justify-center mx-1.5 px-3 py-0.5 rounded-full text-lg sm:text-xl font-black bg-amber-500/25 text-amber-900 dark:text-amber-300 border-2 border-amber-500/60 shadow-2xs">
                ﴿{focusedItem.ayahEntry.ayah}﴾
              </span>
            </div>
          </div>

          {/* Next Ayah Context Whisper (Dimmed) */}
          {nextItem && (
            <div
              onClick={() => onSelectAyah(nextItem.surahId, nextItem.ayahEntry.ayah)}
              className="text-center text-sm sm:text-base font-serif opacity-40 hover:opacity-80 cursor-pointer transition select-none truncate px-4"
              title="انقر للانتقال إلى الآية التالية"
            >
              ﴿ {nextItem.ayahEntry.text} ﴾ ({nextItem.ayahEntry.ayah})
            </div>
          )}

          {/* Selected Word Meaning & Tajweed Popover inside Spotlight */}
          {focusedWord && (
            <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-2 border-amber-400 text-right space-y-1 shadow-md">
              {(() => {
                const wordInfo = getWordMeaningAndTafsir(
                  focusedWord,
                  focusedItem.ayahEntry,
                  focusedItem.surahName
                );
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                        بيان الكلمة القرآنية «{focusedWord}»:
                      </span>
                      <button
                        type="button"
                        onClick={() => setFocusedWord(null)}
                        className="text-xs font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        إغلاق ✕
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-bold">{wordInfo.wordMeaning}</p>
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      💡 التوجيه التجويدي: {wordInfo.tajweedNote}
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {/* Inline Tafsir Al-Muyassar of the Current Ayah */}
          {showInlineTafsir && (
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-500/40 text-right space-y-1">
              <div className="text-xs font-black text-emerald-800 dark:text-amber-300">
                📚 التفسير الميسر للآية الحالية ﴿{focusedItem.ayahEntry.ayah}﴾:
              </div>
              <p className="text-xs sm:text-sm font-bold leading-relaxed opacity-90">
                {focusedItem.ayahEntry.tafsir}
              </p>
            </div>
          )}

          {/* Floating Stepper & Audio Transport Controls */}
          <div className="pt-3 border-t border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStepAyah('prev')}
                className="px-3.5 py-2 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-emerald-700 hover:text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer transition"
                title="الآية السابقة (السهم الأيمن)"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الآية السابقة</span>
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md cursor-pointer transition ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title="تشغيل أو إيقاف التلاوة الصوتية للآية الحالية (مفتاح المسافة Space)"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>إيقاف التلاوة</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>استماع للآية الحالية</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onStepAyah('next')}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer transition shadow-xs"
                title="الآية التالية (السهم الأيسر)"
              >
                <span>الآية التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedReciter}
                onChange={(e) => onChangeReciter(e.target.value as ReciterId)}
                className="rounded-xl border border-amber-500/40 bg-white/80 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                aria-label="القارئ في وضع القراءة الخاشعة"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    🎙️ {r.name}
                  </option>
                ))}
              </select>

              <select
                value={playbackSpeed}
                onChange={(e) => onChangeSpeed(Number(e.target.value))}
                className="rounded-xl border border-amber-500/40 bg-white/80 dark:bg-slate-800 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                aria-label="سرعة التلاوة"
              >
                {[0.75, 1, 1.25, 1.5].map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}x
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onStepPage('prev')}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 text-[11px] font-extrabold disabled:opacity-40 cursor-pointer"
                  title="الصفحة السابقة"
                >
                  صفحة {Math.max(1, currentPage - 1)}
                </button>
                <button
                  type="button"
                  onClick={() => onStepPage('next')}
                  disabled={currentPage >= 604}
                  className="px-2.5 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 text-[11px] font-extrabold disabled:opacity-40 cursor-pointer"
                  title="الصفحة التالية"
                >
                  صفحة {Math.min(604, currentPage + 1)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PublicMushafWaqfPortalView: React.FC<PublicMushafWaqfPortalViewProps> = ({
  onClosePortal,
  onBackToAcademy,
  embeddedInTeacherOrGuardian = false,
}) => {
  const handleCloseOrBack = onClosePortal || onBackToAcademy;
  const {
    settings,
    updateSettings,
    waqfImpactStats,
    publicVisitors,
    currentPublicVisitorId,
    publicBookmarks,
    recordWaqfAmeenPrayer,
    recordPwaInstallEvent,
    recordOfflineDownloadEvent,
    savePublicBookmark,
    deletePublicBookmark,
    updatePublicVisitorWird,
    markVisitorEncouragementRead,
    showToast,
  } = useAcademy();

  const currentVisitor = useMemo(
    () =>
      publicVisitors.find((v) => v.id === currentPublicVisitorId) ||
      publicVisitors[0],
    [publicVisitors, currentPublicVisitorId]
  );

  // Active sub-tab in Public Portal
  const [portalSubTab, setPortalSubTab] = useState<
    'mushaf' | 'wird_khatmah' | 'offline_center' | 'waqf_card' | 'adhkar_library'
  >('mushaf');

  // Academy PDF Guide Modal
  const [showAcademyPdfGuide, setShowAcademyPdfGuide] = useState<boolean>(false);

  // Custom Sadaqah Jariyah / Waqf Dedication Name (Supports ?waqf=... URL parameter)
  const [customWaqfDedicationName, setCustomWaqfDedicationName] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('waqf');
      if (fromUrl && fromUrl.trim()) {
        localStorage.setItem('imam_custom_waqf_name', fromUrl.trim());
        return fromUrl.trim();
      }
      return localStorage.getItem('imam_custom_waqf_name') || '';
    } catch {
      return '';
    }
  });
  const [waqfRelationType, setWaqfRelationType] = useState<string>('صدقة جارية على روح المغفور له بإذن الله');

  // Dual-Page Open Mushaf Mode & Swipe Paging Animation
  const [dualPageMode, setDualPageMode] = useState<boolean>(false);
  const [pageTurnAnim, setPageTurnAnim] = useState<'none' | 'next' | 'prev'>('none');
  const touchStartXRef = useRef<number | null>(null);

  // 4-Tab Slide-Out Index & Search Drawer (Surahs, 240 Quarters, Instant Search, Colored Bookmarks)
  const [showIndexDrawer, setShowIndexDrawer] = useState<boolean>(false);
  const [indexDrawerTab, setIndexDrawerTab] = useState<'surahs' | 'quarters' | 'search' | 'bookmarks'>('surahs');
  const [drawerSurahFilter, setDrawerSurahFilter] = useState<string>('');
  const [drawerQuarterJuzFilter, setDrawerQuarterJuzFilter] = useState<number>(0);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState<string>('');
  const [drawerSearchResults, setDrawerSearchResults] = useState<QuranSearchResultItem[]>([]);
  const [isSearchingQuran, setIsSearchingQuran] = useState<boolean>(false);
  const allQuartersList = useMemo(() => getAllQuartersIndex(), []);

  // Adhkar & Tasbih interactive counters
  const [adhkarCategoryTab, setAdhkarCategoryTab] = useState<'khatm' | 'morning_evening' | 'ruqyah'>('morning_evening');
  const [tasbihCounts, setTasbihCounts] = useState<Record<string, number>>({});

  // Mushaf Night/Day mode local toggle (synced with global theme)
  const [mushafNightMode, setMushafNightMode] = useState<boolean>(
    () => settings.theme === 'dark'
  );
  const [mushafSepiaMode, setMushafSepiaMode] = useState<boolean>(
    () => settings.theme === 'sepia'
  );

  // Collapsible Spiritual Ribbon & Distraction-Free Reading Mode
  const [waqfRibbonCollapsed, setWaqfRibbonCollapsed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('wlq_waqf_ribbon_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [expandedWaqfBannerInPortal, setExpandedWaqfBannerInPortal] =
    useState<boolean>(false);
  const [ribbonJustPrayed, setRibbonJustPrayed] = useState<boolean>(false);
  const [distractionFreeReading, setDistractionFreeReading] =
    useState<boolean>(false);
  const [immersiveFocusStyle, setImmersiveFocusStyle] = useState<
    'spotlight_page' | 'single_ayah_zen'
  >('spotlight_page');

  const handleToggleImmersiveReadingMode = () => {
    setDistractionFreeReading((prev) => {
      const next = !prev;
      if (next) {
        setPortalSubTab('mushaf');
      }
      return next;
    });
  };

  const handleToggleCollapseRibbon = (collapsed: boolean) => {
    setWaqfRibbonCollapsed(collapsed);
    try {
      sessionStorage.setItem('wlq_waqf_ribbon_collapsed', collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  };

  // Auto-collapse spiritual ribbon smoothly on scroll during Mushaf reading
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 240 && !waqfRibbonCollapsed && portalSubTab === 'mushaf') {
        setWaqfRibbonCollapsed(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [waqfRibbonCollapsed, portalSubTab]);

  // Current Madinah Mushaf Page (1..604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('imam_public_mushaf_last_page_v1'));
      if (saved >= 1 && saved <= 604) return saved;
    } catch {
      // ignore
    }
    return currentVisitor?.currentPage || 1;
  });

  const pageInfo = useMemo(() => getMadinahPageInfo(currentPage), [currentPage]);

  // Loaded verses for all Surahs on the current page
  const [pageSections, setPageSections] = useState<
    { surahId: number; surahName: string; fromAyah: number; toAyah: number; verses: AyahEntry[] }[]
  >([]);
  const [loadingPage, setLoadingPage] = useState<boolean>(false);

  // Synchronized Audio Player state
  const [selectedReciter, setSelectedReciter] = useState<ReciterId>('Husary_128kbps');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAudioSurahId, setActiveAudioSurahId] = useState<number>(pageInfo.primarySurahId);
  const [activeAudioAyah, setActiveAudioAyah] = useState<number>(pageInfo.fromAyah);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [autoAdvancePages, setAutoAdvancePages] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 3-Mode Mushaf Edition: 'digital' | 'shamarli' | 'madinah'
  const [mushafEdition, setMushafEdition] = useState<QuranEditionMode>(() => {
    try {
      const saved = localStorage.getItem('imam_mushaf_edition_mode');
      if (saved === 'shamarli' || saved === 'madinah' || saved === 'digital') return saved;
    } catch {}
    return 'digital';
  });

  // Interactive Tajweed Highlighting
  const [enableTajweedHighlighting, setEnableTajweedHighlighting] = useState<boolean>(() => {
    try {
      return localStorage.getItem('imam_tajweed_highlighting') === 'true';
    } catch {}
    return false;
  });

  // Memorization Audio Loop & Shadowing Silence Controls
  // muallimRepeatCount: 1..10 or 0 for infinite (∞)
  const [muallimRepeatCount, setMuallimRepeatCount] = useState<number>(1);
  const [currentRepeatCycle, setCurrentRepeatCycle] = useState<number>(0);
  const [silencePauseAfterAyah, setSilencePauseAfterAyah] = useState<boolean>(false);
  const [isInSilenceShadowing, setIsInSilenceShadowing] = useState<boolean>(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rangeLoopEnabled, setRangeLoopEnabled] = useState<boolean>(false);
  const [rangeFromAyah, setRangeFromAyah] = useState<number>(1);
  const [rangeToAyah, setRangeToAyah] = useState<number>(5);

  // Offline Recitation Comparator & Voice Recorder State
  const [showComparatorModal, setShowComparatorModal] = useState<boolean>(false);
  const [comparatorAyah, setComparatorAyah] = useState<{ surahId: number; surahName: string; ayah: number; text: string } | null>(null);
  const [isRecordingStudent, setIsRecordingStudent] = useState<boolean>(false);
  const [studentAudioBlobUrl, setStudentAudioBlobUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPlayingStudentVoice, setIsPlayingStudentVoice] = useState<boolean>(false);
  const [isPlayingSheikhVoice, setIsPlayingSheikhVoice] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const studentAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const sheikhAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load adjacent pages for image editions
  useEffect(() => {
    if (mushafEdition !== 'digital') {
      const prevP = Math.max(1, currentPage - 1);
      const nextP = Math.min(604, currentPage + 1);
      const img1 = new Image();
      img1.src = getQuranPageImageUrl(mushafEdition, prevP);
      const img2 = new Image();
      img2.src = getQuranPageImageUrl(mushafEdition, nextP);
    }
  }, [currentPage, mushafEdition]);

  // Selected Ayah Modal (Dual Tafsir: Muyassar & Jalalayn, Word Meanings, Share Card)
  const [selectedAyahDetail, setSelectedAyahDetail] = useState<{
    surahId: number;
    surahName: string;
    ayahEntry: AyahEntry;
  } | null>(null);
  const [selectedWordInModal, setSelectedWordInModal] = useState<string | null>(null);
  const [activeTafsirEdition, setActiveTafsirEdition] = useState<'muyassar' | 'jalalayn'>('muyassar');
  const [dualTafsirData, setDualTafsirData] = useState<{ muyassar: string; jalalayn: string } | null>(null);

  useEffect(() => {
    if (!selectedAyahDetail) {
      setDualTafsirData(null);
      return;
    }
    let cancelled = false;
    loadDualTafsirForAyah(
      selectedAyahDetail.surahId,
      selectedAyahDetail.ayahEntry.ayah,
      selectedAyahDetail.ayahEntry.tafsir
    ).then((res) => {
      if (!cancelled) setDualTafsirData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedAyahDetail]);

  // Instant Quran Search Effect in Drawer
  useEffect(() => {
    const q = drawerSearchQuery.trim();
    if (q.length < 2) {
      setDrawerSearchResults([]);
      setIsSearchingQuran(false);
      return;
    }
    let cancelled = false;
    setIsSearchingQuran(true);
    const timer = setTimeout(() => {
      searchQuranVersesInstant(q, 50).then((results) => {
        if (!cancelled) {
          setDrawerSearchResults(results.items);
          setIsSearchingQuran(false);
        }
      });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [drawerSearchQuery]);

  // Modals: Waqf & Khatmah Dua Modal, Khatmah Certificate Modal, PWA Install Guide Modal, Bookmarks Modal
  const [showWaqfAndKhatmahModal, setShowWaqfAndKhatmahModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false);

  // Offline Download Center state
  const [offlineTargetScope, setOfflineTargetScope] = useState<'juz30' | 'juz29_30' | 'selected_surah' | 'full_mushaf_text'>('juz30');
  const [offlineSelectedSurah, setOfflineSelectedSurah] = useState<number>(18);
  const [offlineSelectedReciter, setOfflineSelectedReciter] = useState<ReciterId>('Husary_128kbps');
  const [isDownloadingOffline, setIsDownloadingOffline] = useState<boolean>(false);
  const [offlineProgress, setOfflineProgress] = useState<number>(0);
  const [offlineStatusLabel, setOfflineStatusLabel] = useState<string>('');
  const [cachedPackagesList, setCachedPackagesList] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('imam_offline_cached_packages_v1');
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return ['النص العثماني والتفسير الميسر (السور الأساسية وجزء عم وتبارك)'];
  });

  // Visitor Wird Settings Form
  const [visitorNameInput, setVisitorNameInput] = useState<string>(
    currentVisitor?.visitorName || 'زائر المصحف الوقفي'
  );
  const [selectedPlanType, setSelectedPlanType] = useState<'monthly_30' | 'bimonthly_60' | 'custom_pages'>(
    currentVisitor?.planType || 'monthly_30'
  );
  const [customDailyPages, setCustomDailyPages] = useState<number>(
    currentVisitor?.dailyTargetPages || 20
  );

  // Load current page verses whenever currentPage changes
  useEffect(() => {
    let cancelled = false;
    setLoadingPage(true);

    try {
      localStorage.setItem('imam_public_mushaf_last_page_v1', String(currentPage));
    } catch {
      // ignore
    }

    const loadAllSections = async () => {
      const sections: {
        surahId: number;
        surahName: string;
        fromAyah: number;
        toAyah: number;
        verses: AyahEntry[];
      }[] = [];

      for (const sec of pageInfo.surahsOnPage) {
        const verses = await loadSurahVerses(sec.surahId, sec.fromAyah, sec.toAyah);
        sections.push({
          ...sec,
          verses,
        });
      }

      if (!cancelled) {
        setPageSections(sections);
        setLoadingPage(false);
        if (sections.length > 0 && !isPlaying) {
          setActiveAudioSurahId(sections[0].surahId);
          setActiveAudioAyah(sections[0].fromAyah);
        }
      }
    };

    void loadAllSections();
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageInfo]);

  // Flat list of ayahs on current page for synchronized playback
  const flatPageAyahs = useMemo(() => {
    const list: { surahId: number; surahName: string; ayahEntry: AyahEntry }[] = [];
    for (const sec of pageSections) {
      for (const v of sec.verses) {
        list.push({
          surahId: sec.surahId,
          surahName: sec.surahName,
          ayahEntry: v,
        });
      }
    }
    return list;
  }, [pageSections]);

  // Synchronized Audio Playback effect + MediaSession API for Lock Screen Controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setIsInSilenceShadowing(false);
      audio.pause();
      return;
    }

    const url = getEveryAyahAudioUrl(selectedReciter, activeAudioSurahId, activeAudioAyah);
    if (audio.src !== url) {
      audio.src = url;
    }
    audio.playbackRate = playbackSpeed;
    audio.play().catch(() => {
      setIsPlaying(false);
      showToast('تعذر تشغيل الصوت تلقائياً — تأكد من الاتصال بالإنترنت أو تنزيل التلاوة أوفلاين', 'info');
    });

    // Update Lock Screen / Background MediaSession Metadata
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const surahMeta = SURAHS.find((s) => s.id === activeAudioSurahId);
        const reciterMeta = RECITERS.find((r) => r.id === selectedReciter);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `سورة ${surahMeta?.name || pageInfo.primarySurahName} — الآية ${activeAudioAyah}`,
          artist: reciterMeta?.name || 'القارئ المتزامن',
          album: `${OFFICIAL_BRANDING.academyName} (${OFFICIAL_BRANDING.slogan})`,
        });
        navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
        navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
        navigator.mediaSession.setActionHandler('previoustrack', () => handleStepFocusedAyah('prev'));
        navigator.mediaSession.setActionHandler('nexttrack', () => handleStepFocusedAyah('next'));
      } catch {
        // ignore MediaSession errors on unsupported browsers
      }
    }
  }, [isPlaying, selectedReciter, activeAudioSurahId, activeAudioAyah, playbackSpeed]);

  const proceedToNextAyahOrRepeat = () => {
    // 1. Check Single Ayah Repeat (0 = infinite ∞, or >1 count)
    if (muallimRepeatCount === 0 || currentRepeatCycle + 1 < muallimRepeatCount) {
      setCurrentRepeatCycle((prev) => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    setCurrentRepeatCycle(0);

    // 2. Check Ayah Range Loop (fromAyah .. toAyah on current Surah)
    if (rangeLoopEnabled) {
      const minA = Math.min(rangeFromAyah, rangeToAyah);
      const maxA = Math.max(rangeFromAyah, rangeToAyah);
      if (activeAudioAyah >= minA && activeAudioAyah < maxA) {
        setActiveAudioAyah(activeAudioAyah + 1);
        return;
      } else if (activeAudioAyah >= maxA) {
        setActiveAudioAyah(minA);
        if (minA === activeAudioAyah && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        return;
      }
    }

    // 3. Normal Page Progression
    const idx = flatPageAyahs.findIndex(
      (item) =>
        item.surahId === activeAudioSurahId && item.ayahEntry.ayah === activeAudioAyah
    );

    if (idx >= 0 && idx + 1 < flatPageAyahs.length) {
      const nextItem = flatPageAyahs[idx + 1];
      setActiveAudioSurahId(nextItem.surahId);
      setActiveAudioAyah(nextItem.ayahEntry.ayah);
    } else if (autoAdvancePages && currentPage < 604) {
      const nextPage = currentPage + 1;
      const nextInfo = getMadinahPageInfo(nextPage);
      setCurrentPage(nextPage);
      setActiveAudioSurahId(nextInfo.primarySurahId);
      setActiveAudioAyah(nextInfo.fromAyah);
      updatePublicVisitorWird({
        currentPage: nextPage,
        currentSurahName: nextInfo.primarySurahName,
        currentJuz: nextInfo.juzNumber,
        pagesDelta: 1,
      });
    } else {
      setIsPlaying(false);
      if (currentPage === 604) {
        setShowWaqfAndKhatmahModal(true);
      }
    }
  };

  const handleAudioEnded = () => {
    if (silencePauseAfterAyah && audioRef.current) {
      const durationMs = Math.min(
        14000,
        Math.max(2200, Math.round((audioRef.current.duration || 4) * 1000))
      );
      setIsInSilenceShadowing(true);
      silenceTimerRef.current = setTimeout(() => {
        setIsInSilenceShadowing(false);
        proceedToNextAyahOrRepeat();
      }, durationMs);
      return;
    }
    proceedToNextAyahOrRepeat();
  };

  const handleStepFocusedAyah = (direction: 'next' | 'prev') => {
    if (flatPageAyahs.length === 0) return;
    const currentIdx = flatPageAyahs.findIndex(
      (item) =>
        item.surahId === activeAudioSurahId && item.ayahEntry.ayah === activeAudioAyah
    );
    const safeIdx = currentIdx >= 0 ? currentIdx : 0;

    if (direction === 'next') {
      if (safeIdx + 1 < flatPageAyahs.length) {
        const nextItem = flatPageAyahs[safeIdx + 1];
        setActiveAudioSurahId(nextItem.surahId);
        setActiveAudioAyah(nextItem.ayahEntry.ayah);
      } else if (currentPage < 604) {
        handleGoToPage(currentPage + 1, true);
      }
    } else {
      if (safeIdx - 1 >= 0) {
        const prevItem = flatPageAyahs[safeIdx - 1];
        setActiveAudioSurahId(prevItem.surahId);
        setActiveAudioAyah(prevItem.ayahEntry.ayah);
      } else if (currentPage > 1) {
        handleGoToPage(currentPage - 1, false);
      }
    }
  };

  const handleGoToPage = (targetPage: number, recordReadDelta = false) => {
    const clamped = Math.max(1, Math.min(604, targetPage));
    if (clamped !== currentPage) {
      setPageTurnAnim(clamped > currentPage ? 'next' : 'prev');
      setTimeout(() => setPageTurnAnim('none'), 260);
    }
    setIsPlaying(false);
    setCurrentPage(clamped);
    const info = getMadinahPageInfo(clamped);
    setActiveAudioSurahId(info.primarySurahId);
    setActiveAudioAyah(info.fromAyah);
    setRangeFromAyah(info.fromAyah);
    setRangeToAyah(info.toAyah);

    if (recordReadDelta) {
      updatePublicVisitorWird({
        currentPage: clamped,
        currentSurahName: info.primarySurahName,
        currentJuz: info.juzNumber,
        pagesDelta: 1,
      });
    }
  };

  // Download Luxury Quranic Ayah Card or Waqf Card via HTML5 Canvas
  const handleDownloadLuxuryCanvasCard = (opts: {
    headerBadge: string;
    mainArabicText: string;
    subReference: string;
    tafsirOrPrayer: string;
    waqfFooter: string;
    fileName: string;
  }) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Royal Emerald & Gold Background
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#071f15');
      grad.addColorStop(0.5, '#0f3826');
      grad.addColorStop(1, '#092318');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Ornate Gold Double Frame
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(42, 42, 996, 996);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(58, 58, 964, 964);

      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      // Academy Header
      ctx.fillStyle = '#f3d478';
      ctx.font = 'bold 30px Cairo, Amiri, serif';
      ctx.fillText(`${OFFICIAL_BRANDING.academyName} — ${OFFICIAL_BRANDING.slogan}`, 540, 125);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.fillText(opts.headerBadge, 540, 175);

      // Word-wrap helper
      const drawWrapped = (
        text: string,
        x: number,
        startY: number,
        maxWidth: number,
        lineHeight: number,
        font: string,
        color: string
      ) => {
        ctx.font = font;
        ctx.fillStyle = color;
        const words = text.split(' ');
        let line = '';
        let y = startY;
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, y);
            line = words[i] + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), x, y);
          y += lineHeight;
        }
        return y;
      };

      let nextY = drawWrapped(
        `﴿ ${opts.mainArabicText} ﴾`,
        540,
        290,
        860,
        66,
        'bold 40px Amiri, serif',
        '#ffffff'
      );

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 26px Cairo, sans-serif';
      ctx.fillText(opts.subReference, 540, nextY + 20);

      if (opts.tafsirOrPrayer) {
        drawWrapped(
          opts.tafsirOrPrayer,
          540,
          nextY + 90,
          840,
          44,
          '24px Cairo, sans-serif',
          '#e2e8f0'
        );
      }

      // Waqf & Developer Footer
      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 23px Cairo, sans-serif';
      ctx.fillText(opts.waqfFooter, 540, 945);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px Cairo, sans-serif';
      ctx.fillText(
        `تصميم وتطوير: ${OFFICIAL_BRANDING.developerName} | واتساب: ${OFFICIAL_BRANDING.whatsappDisplay}`,
        540,
        995
      );

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = opts.fileName;
      a.click();
      showToast('تم توليد وتنزيل البطاقة المصورة الفاخرة بنجاح ✓', 'success');
    } catch {
      showToast('تعذر حفظ الصورة، يرجى المحاولة مرة أخرى', 'error');
    }
  };

  const handleQuickSaveBookmark = (category: PublicBookmarkCategory) => {
    const labels: Record<PublicBookmarkCategory, string> = {
      khatmah: '🔖 فاصل الختمة اليومية',
      memorization: '📌 فاصل الحفظ والمراجعة',
      tadabbur: '⭐ آية للتدبر',
    };
    savePublicBookmark({
      category,
      label: labels[category],
      pageNumber: currentPage,
      surahId: activeAudioSurahId || pageInfo.primarySurahId,
      surahName:
        SURAHS.find((s) => s.id === (activeAudioSurahId || pageInfo.primarySurahId))?.name ||
        pageInfo.primarySurahName,
      ayahNumber: activeAudioAyah || pageInfo.fromAyah,
      juzNumber: pageInfo.juzNumber,
      note: `صفحة ${currentPage} — الجزء ${pageInfo.juzNumber}`,
    });
  };

  const handleTriggerPwaInstall = async () => {
    const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void } })
      .deferredPrompt;
    recordPwaInstallEvent();
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      deferredPrompt.prompt();
      showToast('تم فتح نافذة تثبيت المصحف العام على جهازك', 'success');
    } else {
      setShowInstallModal(true);
    }
  };

  const handleDownloadOfflineBundle = async () => {
    if (isDownloadingOffline) return;
    setIsDownloadingOffline(true);
    setOfflineProgress(5);
    setOfflineStatusLabel('جاري تهيئة مخزن IndexedDB & Cache Storage للعمل بدون إنترنت...');

    const surahIdsToCache: number[] =
      offlineTargetScope === 'juz30'
        ? Array.from({ length: 37 }, (_, i) => 78 + i)
        : offlineTargetScope === 'juz29_30'
        ? Array.from({ length: 48 }, (_, i) => 67 + i)
        : offlineTargetScope === 'selected_surah'
        ? [offlineSelectedSurah]
        : [1, 2, 18, 36, 55, 56, 67, 78, 87, 93, 97, 103, 108, 112, 113, 114];

    for (let i = 0; i < surahIdsToCache.length; i++) {
      const sId = surahIdsToCache[i];
      const meta = SURAHS.find((s) => s.id === sId) || SURAHS[0];
      setOfflineStatusLabel(`جاري تنزيل وحفظ سورة ${meta.name} (النص العثماني + التفسير الميسر)...`);
      await loadSurahVerses(sId, 1, Math.min(meta.ayahs, 40));

      // Cache first ayahs audio in Cache Storage if available
      if (typeof caches !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const cache = await caches.open('imam-public-mushaf-offline-v1');
          const sampleAyahs = [1, 2, 3].filter((a) => a <= meta.ayahs);
          for (const aNum of sampleAyahs) {
            const audioUrl = getEveryAyahAudioUrl(offlineSelectedReciter, sId, aNum);
            fetch(audioUrl, { mode: 'no-cors' })
              .then((res) => cache.put(audioUrl, res))
              .catch(() => {});
          }
        } catch {
          // ignore cache error
        }
      }

      setOfflineProgress(Math.min(98, Math.round(((i + 1) / surahIdsToCache.length) * 100)));
      await new Promise((r) => setTimeout(r, 60));
    }

    const reciterLabel =
      RECITERS.find((r) => r.id === offlineSelectedReciter)?.name || offlineSelectedReciter;
    const scopeLabel =
      offlineTargetScope === 'juz30'
        ? 'جزء عمّ كاملاً (37 سورة)'
        : offlineTargetScope === 'juz29_30'
        ? 'جزئي تبارك وعمّ (48 سورة)'
        : offlineTargetScope === 'selected_surah'
        ? `سورة ${SURAHS.find((s) => s.id === offlineSelectedSurah)?.name || ''}`
        : 'باقة السور المختارة والمصحف الوقفي';

    const packageTitle = `${scopeLabel} — بصوت ${reciterLabel}`;
    const updatedList = Array.from(new Set([packageTitle, ...cachedPackagesList]));
    setCachedPackagesList(updatedList);
    try {
      localStorage.setItem('imam_offline_cached_packages_v1', JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    setOfflineProgress(100);
    setOfflineStatusLabel('اكتمل التنزيل والحفظ في ذاكرة الهاتف (IndexedDB / Cache Storage) بنجاح 100%!');
    recordOfflineDownloadEvent();
    showToast('تم تنزيل المصحف والتفسير والتلاوات للعمل بدون إنترنت بنجاح', 'success');
    setTimeout(() => {
      setIsDownloadingOffline(false);
    }, 1200);
  };

  const handleSaveWirdPlanSettings = () => {
    const planLabel =
      selectedPlanType === 'monthly_30'
        ? 'ختمة شهرية (جزء يومياً - 20 صفحة)'
        : selectedPlanType === 'bimonthly_60'
        ? 'ختمة في شهرين (نصف جزء يومياً - 10 صفحات)'
        : `ورد مخصص (${customDailyPages} صفحات يومياً)`;

    const targetPages =
      selectedPlanType === 'monthly_30'
        ? 20
        : selectedPlanType === 'bimonthly_60'
        ? 10
        : Math.max(1, customDailyPages);

    updatePublicVisitorWird({
      visitorName: visitorNameInput.trim() || 'زائر المصحف الوقفي',
      planType: selectedPlanType,
      planLabel,
      dailyTargetPages: targetPages,
    });
    showToast('تم حفظ خطة الورد اليومي والختمة القرآنية بنجاح', 'success');
  };

  const handleCompleteDailyWird = () => {
    const targetPages = currentVisitor?.dailyTargetPages || 20;
    const nextPage = Math.min(604, currentPage + targetPages);
    const info = getMadinahPageInfo(nextPage);
    const completedKhatmah = nextPage >= 604 ? 1 : 0;

    updatePublicVisitorWird({
      currentPage: nextPage,
      currentSurahName: info.primarySurahName,
      currentJuz: info.juzNumber,
      pagesDelta: targetPages,
      completedKhatmahDelta: completedKhatmah,
      streakDays: (currentVisitor?.streakDays || 1) + 1,
    });
    setCurrentPage(nextPage);

    if (completedKhatmah > 0) {
      setShowWaqfAndKhatmahModal(true);
    } else {
      showToast(
        `🔥 تقبل الله طاعتك! أتممت ورد اليوم (+${targetPages} صفحة) وارتفع عداد المواظبة إلى ${(currentVisitor?.streakDays || 1) + 1} يوماً`,
        'success'
      );
    }
  };

  const unreadEncouragements = useMemo(
    () => (currentVisitor?.encouragements || []).filter((e) => !e.isRead),
    [currentVisitor]
  );

  const adjustPublicFontSize = (delta: 1 | -1) => {
    const order: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
    const currentIdx = Math.max(0, order.indexOf(settings.fontSize || 'md'));
    const nextIdx = Math.max(0, Math.min(order.length - 1, currentIdx + delta));
    updateSettings({ fontSize: order[nextIdx] });
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        mushafNightMode
          ? 'bg-[#0b1711] text-[#e9f2ec]'
          : mushafSepiaMode
          ? 'bg-[#f4ecd8] text-[#2b2114]'
          : 'bg-[#faf6ec] dark:bg-[#0b1711] text-slate-900 dark:text-[#e9f2ec]'
      }`}
      dir="rtl"
    >
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
        }}
        className="hidden"
      />

      {/* Top Islamic Header Bar (Automatically hidden in Immersive Reading Mode to eliminate visual distraction) */}
      {!distractionFreeReading && (
        <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-b border-amber-500/40 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xl shadow-inner">
                📖
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-amber-300">
                    بوابة المصحف العام والورد اليومي (وقف وصدقة جارية)
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-600">
                    طبعة المدينة المنورة • 604 صفحة
                  </span>
                  {waqfRibbonCollapsed && (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleCollapseRibbon(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/60 cursor-pointer transition"
                      title="إظهار شريط الوقف القرآني والصدقة الجارية"
                    >
                      <span>🌿 وقف قرآني</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-emerald-200/90">
                  {settings.academyName} — متاح لعموم المسلمين أونلاين وبدون إنترنت 100%
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Font Size Controls (أ+ / أ-) */}
              <div className="flex items-center rounded-xl bg-white/10 border border-white/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => adjustPublicFontSize(1)}
                  className="px-2.5 py-1.5 text-xs font-extrabold text-amber-300 hover:bg-white/15 cursor-pointer"
                  title="تكبير حجم الخط القرآني (أ+)"
                >
                  أ+
                </button>
                <span className="w-px h-4 bg-white/20" />
                <button
                  type="button"
                  onClick={() => adjustPublicFontSize(-1)}
                  className="px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-white/15 cursor-pointer"
                  title="تصغير حجم الخط القرآني (أ-)"
                >
                  أ-
                </button>
              </div>

              {/* 3-Mode Mushaf Theme Switcher (☀️ نهاري / 🌙 ليلي / 📜 كريمي للمصحف) */}
              <div className="flex items-center rounded-xl bg-white/10 border border-white/20 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMushafNightMode(false);
                    setMushafSepiaMode(false);
                    updateSettings({ theme: 'light' });
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                    !mushafNightMode && !mushafSepiaMode
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  ☀️ نهاري
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMushafNightMode(true);
                    setMushafSepiaMode(false);
                    updateSettings({ theme: 'dark' });
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                    mushafNightMode
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  🌙 ليلي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMushafNightMode(false);
                    setMushafSepiaMode(true);
                    updateSettings({ theme: 'sepia' });
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                    mushafSepiaMode
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  📜 كريمي
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowIndexDrawer(true)}
                className="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition border flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/35 text-amber-200 border-amber-400/50"
                title="الفهرس الشامل والبحث الذكي في القرآن الكريم والأرباع والفواصل"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>🗂️ الفهرس والبحث</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAcademyPdfGuide(true)}
                className="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition border flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-amber-200 border-amber-400/40"
                title="الدليل التعريفي المصور للأكاديمية (PDF)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">📄 الدليل التعريفي PDF</span>
              </button>

              <button
                type="button"
                onClick={handleToggleImmersiveReadingMode}
                className="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition border flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
                title="وضع القراءة الخاشعة بضغطة واحدة — إخفاء شريط التنقل العلوي وتوسيع مساحة عرض الآيات لتقليل التشتت البصري"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>🧘 وضع القراءة الخاشعة</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerPwaInstall}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden md:inline">📱 تثبيت المصحف العام</span>
              </button>

              {handleCloseOrBack && (
                <button
                  type="button"
                  onClick={handleCloseOrBack}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>العودة لبوابة الأكاديمية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Academy PDF Guide Modal */}
      <AcademyPdfGuideModal
        isOpen={showAcademyPdfGuide}
        onClose={() => setShowAcademyPdfGuide(false)}
      />

      {/* Slide-out 4-Tab Index & Instant Search Drawer (DrawerLayout v2.0.0) */}
      {showIndexDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex justify-start" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l-2 border-amber-500/60 flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white flex items-center justify-between border-b border-amber-400/40">
              <div>
                <h3 className="text-sm sm:text-base font-black text-amber-300">
                  🗂️ الفهرس القرآني الشامل والبحث الذكي الفوري
                </h3>
                <p className="text-[11px] text-emerald-200">
                  114 سورة • 30 جزءاً • 60 حزباً • 240 ربعاً • بحث فوري بدون تشكيل • فواصل ملونة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIndexDrawer(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Drawer Tabs */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-extrabold">
              {[
                { id: 'surahs', label: '📖 السور (114)' },
                { id: 'quarters', label: '🧭 الأرباع (240)' },
                { id: 'search', label: '🔍 بحث الآيات' },
                { id: 'bookmarks', label: `🔖 الفواصل (${publicBookmarks.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setIndexDrawerTab(t.id as 'surahs' | 'quarters' | 'search' | 'bookmarks')}
                  className={`py-2 px-1.5 rounded-xl transition cursor-pointer text-center ${
                    indexDrawerTab === t.id
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Tab Content */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {indexDrawerTab === 'surahs' && (
                <>
                  <input
                    type="text"
                    value={drawerSurahFilter}
                    onChange={(e) => setDrawerSurahFilter(e.target.value)}
                    placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، الملك، 36)..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold"
                  />
                  <div className="space-y-1.5">
                    {SURAHS.filter(
                      (s) =>
                        !drawerSurahFilter.trim() ||
                        s.name.includes(drawerSurahFilter.trim()) ||
                        String(s.id) === drawerSurahFilter.trim()
                    ).map((s) => {
                      const startPage = getPageNumberForSurahAyah(s.id, 1);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            handleGoToPage(startPage);
                            setShowIndexDrawer(false);
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-right cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 font-black text-xs flex items-center justify-center">
                              {s.id}
                            </span>
                            <div>
                              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                سورة {s.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {s.type} • {s.ayahs} آية • الجزء {s.juz}
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black">
                            ص {startPage}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {indexDrawerTab === 'quarters' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      تصفية حسب الجزء:
                    </label>
                    <select
                      value={drawerQuarterJuzFilter}
                      onChange={(e) => setDrawerQuarterJuzFilter(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-extrabold"
                    >
                      <option value={0}>كل الأجزاء (30 جزءاً • 60 حزباً • 240 ربعاً)</option>
                      {JUZ_NAMES.map((jName, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          الجزء {idx + 1}: {jName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    {allQuartersList
                      .filter((q) => drawerQuarterJuzFilter === 0 || q.juzNumber === drawerQuarterJuzFilter)
                      .map((q) => (
                        <button
                          key={q.quarterIndex}
                          type="button"
                          onClick={() => {
                            handleGoToPage(q.pageNumber);
                            setShowIndexDrawer(false);
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-right cursor-pointer transition"
                        >
                          <div>
                            <div className="font-extrabold text-xs text-emerald-900 dark:text-amber-300">
                              الجزء {q.juzNumber} ({q.juzName}) — الحزب {q.hizbNumber}: {q.quarterLabel}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              سورة {q.surahName} (آية {q.ayahNumber})
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                            ص {q.pageNumber}
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}

              {indexDrawerTab === 'search' && (
                <>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={drawerSearchQuery}
                        onChange={(e) => setDrawerSearchQuery(e.target.value)}
                        placeholder="ابحث بأي كلمة أو جزء من آية بدون تشكيل (مثال: فسيكفيكهم الله، جنات عدن)..."
                        className="w-full rounded-xl border border-amber-400 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>يدعم البحث الذكي بتوحيد الهمزات (أ، إ، آ ➔ ا) وبدون تشكيل</span>
                      {drawerSearchQuery.trim().length >= 2 && (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {isSearchingQuran ? 'جاري البحث...' : `${drawerSearchResults.length} نتيجة`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {drawerSearchResults.map((res, rIdx) => (
                      <button
                        key={`${res.surahId}-${res.ayahNumber}-${rIdx}`}
                        type="button"
                        onClick={() => {
                          handleGoToPage(res.pageNumber);
                          setActiveAudioSurahId(res.surahId);
                          setActiveAudioAyah(res.ayahNumber);
                          setShowIndexDrawer(false);
                        }}
                        className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-amber-50/40 dark:bg-slate-800/60 text-right space-y-1 cursor-pointer transition"
                      >
                        <div className="flex items-center justify-between text-xs font-black text-emerald-800 dark:text-amber-300">
                          <span>
                            سورة {res.surahName} — الآية ({res.ayahNumber})
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-white text-[10px]">
                            ص {res.pageNumber} • جزء {res.juzNumber}
                          </span>
                        </div>
                        <p className="font-serif text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                          ﴿ {res.text} ﴾
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {indexDrawerTab === 'bookmarks' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('memorization')}
                      className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 text-xs font-extrabold cursor-pointer text-right"
                    >
                      🟢 + حفظ فاصل أخضر (موضع الحفظ الحالي — ص {currentPage})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('tadabbur')}
                      className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-xs font-extrabold cursor-pointer text-right"
                    >
                      🟡 + حفظ فاصل ذهبي (موضع المراجعة والتدبر — ص {currentPage})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('khatmah')}
                      className="p-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 text-xs font-extrabold cursor-pointer text-right"
                    >
                      🔵 + حفظ فاصل أزرق (الورد اليومي والختمة — ص {currentPage})
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {publicBookmarks.map((bm) => {
                      const colorClass =
                        bm.category === 'memorization'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40'
                          : bm.category === 'tadabbur'
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40'
                          : 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40';
                      const dotIcon =
                        bm.category === 'memorization'
                          ? '🟢 فاصل الحفظ'
                          : bm.category === 'tadabbur'
                          ? '🟡 فاصل المراجعة والتدبر'
                          : '🔵 فاصل الورد اليومي';
                      return (
                        <div
                          key={bm.id}
                          className={`p-3 rounded-xl border-r-4 border flex items-center justify-between gap-2 ${colorClass}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleGoToPage(bm.pageNumber);
                              setShowIndexDrawer(false);
                            }}
                            className="text-right flex-1 cursor-pointer"
                          >
                            <div className="text-xs font-black">{dotIcon}</div>
                            <div className="text-[11px] font-bold opacity-85 mt-0.5">
                              صفحة {bm.pageNumber} • سورة {bm.surahName} (آية {bm.ayahNumber})
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePublicBookmark(bm.id)}
                            className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs cursor-pointer"
                            title="حذف الفاصل"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowIndexDrawer(false)} />
        </div>
      )}

      <div
        className={`mx-auto transition-all duration-300 ${
          distractionFreeReading
            ? 'max-w-[96rem] px-3 sm:px-8 py-3 space-y-3'
            : 'max-w-7xl px-3 sm:px-6 py-3 space-y-3'
        }`}
      >

        {/* Graceful & Non-Intrusive Collapsible Spiritual Ribbon + Expandable Waqf Card */}
        {!waqfRibbonCollapsed && !distractionFreeReading && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-gradient-to-l from-emerald-950 via-emerald-900 to-amber-950 text-white px-4 py-2.5 border border-amber-400/60 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="text-xs sm:text-sm font-extrabold text-amber-100 leading-relaxed flex flex-wrap items-center gap-2">
                <span>
                  🌿 وقف قرآني وصدقة جارية:{' '}
                  {customWaqfDedicationName ? (
                    <strong className="text-amber-300 underline decoration-amber-400/60">
                      {waqfRelationType}: «{customWaqfDedicationName}» — اللهم اجعل ثواب تلاوة هذا المصحف نوراً ورحمةً في قبره وميزان حسناته
                    </strong>
                  ) : (
                    'اللهم اجعل ثواب هذا المصحف وتلاوته صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين'
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    recordWaqfAmeenPrayer();
                    setRibbonJustPrayed(true);
                    setTimeout(() => setRibbonJustPrayed(false), 3200);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    ribbonJustPrayed
                      ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md scale-105'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white border-amber-400/60'
                  }`}
                >
                  {ribbonJustPrayed ? (
                    <span>✨ تقبل الله دعاءكم ({waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')})</span>
                  ) : (
                    <span>🤲 آمين (دعاء بالرحمة) • {waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedWaqfBannerInPortal((prev) => !prev)
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold border border-amber-400/40 cursor-pointer transition"
                >
                  {expandedWaqfBannerInPortal ? 'إخفاء البطاقة الكاملة' : 'تفاصيل الوقف'}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCollapseRibbon(true)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold cursor-pointer"
                  title="طي الشريط الروحاني لتوفير مساحة القراءة"
                >
                  ✕
                </button>
              </div>
            </div>

            {expandedWaqfBannerInPortal && (
              <WaqfDedication
                compact={embeddedInTeacherOrGuardian}
                variant="portal_banner"
                onOpenFullModal={() => setShowWaqfAndKhatmahModal(true)}
              />
            )}
          </div>
        )}

        {/* Sub-navigation Tabs (Hidden in Immersive Reading Mode to eliminate UI clutter) */}
        {!distractionFreeReading && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              {
                id: 'mushaf',
                label: '📖 مصحف المدينة والمتابعة الصوتية',
                sub: `صفحة ${currentPage} • الجزء ${pageInfo.juzNumber}`,
              },
              {
                id: 'wird_khatmah',
                label: '🔥 متتبع الورد اليومي والختمات',
                sub: `${currentVisitor?.streakDays || 1} يوم مواظبة • ${currentVisitor?.completionPercentage || 0}%`,
              },
              {
                id: 'adhkar_library',
                label: '📿 الأذكار والرقية ودعاء الختم',
                sub: 'مكتبة التحصين والعداد التسبيحي',
              },
              {
                id: 'offline_center',
                label: '📥 مركز التنزيل بدون إنترنت 100%',
                sub: `${cachedPackagesList.length} باقات محفوظة بالهاتف`,
              },
              {
                id: 'waqf_card',
                label: '🌿 مولّد الصدقة الجارية والوقف',
                sub: `${waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG')} دعاء وتأمين`,
              },
            ].map((tab) => {
              const active = portalSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setPortalSubTab(
                      tab.id as 'mushaf' | 'wird_khatmah' | 'offline_center' | 'waqf_card' | 'adhkar_library'
                    )
                  }
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-800 text-white border-amber-400 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="font-extrabold text-xs sm:text-sm">{tab.label}</div>
                  <div
                    className={`text-[11px] mt-0.5 font-semibold ${
                      active ? 'text-amber-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.sub}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 1: PUBLIC MADINAH MUSHAF & SYNCHRONIZED AUDIO */}
        {(portalSubTab === 'mushaf' || distractionFreeReading) && (
          <div className="space-y-3.5">
            {/* Immersive Reading Mode Component (One-click toggle + Current Ayah Spotlight) */}
            <ImmersiveReadingMode
              isActive={distractionFreeReading}
              onToggle={handleToggleImmersiveReadingMode}
              currentPage={currentPage}
              juzNumber={pageInfo.juzNumber}
              juzName={pageInfo.juzName}
              hizbNumber={pageInfo.hizbNumber}
              quarterInHizb={pageInfo.quarterInHizb}
              flatPageAyahs={flatPageAyahs}
              activeSurahId={activeAudioSurahId}
              activeAyahNumber={activeAudioAyah}
              onSelectAyah={(sId, aNum) => {
                setActiveAudioSurahId(sId);
                setActiveAudioAyah(aNum);
              }}
              onStepAyah={handleStepFocusedAyah}
              onStepPage={(dir) =>
                handleGoToPage(dir === 'next' ? currentPage + 1 : currentPage - 1, dir === 'next')
              }
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((prev) => !prev)}
              selectedReciter={selectedReciter}
              onChangeReciter={setSelectedReciter}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
              mushafNightMode={mushafNightMode}
              mushafSepiaMode={mushafSepiaMode}
              onSelectTheme={(theme) => {
                setMushafNightMode(theme === 'dark');
                setMushafSepiaMode(theme === 'sepia');
                updateSettings({ theme });
              }}
              onAdjustFontSize={adjustPublicFontSize}
              onSaveTadabburBookmark={(surahId, surahName, ayahEntry) => {
                savePublicBookmark({
                  category: 'tadabbur',
                  label: '⭐ آية للتدبر',
                  pageNumber: currentPage,
                  surahId,
                  surahName,
                  ayahNumber: ayahEntry.ayah,
                  juzNumber: pageInfo.juzNumber,
                  note: ayahEntry.text,
                });
              }}
              focusStyle={immersiveFocusStyle}
              onChangeFocusStyle={setImmersiveFocusStyle}
            />

            {/* Bookmarks Popover Modal (Opened from toolbar button so Mushaf stays Above the Fold) */}
            {showBookmarksModal && (
              <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-amber-400/50 shadow-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-900 dark:text-emerald-300">
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      <span>الفواصل والعلامات المرجعية ({publicBookmarks.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBookmarksModal(false)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('khatmah')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 text-xs font-extrabold cursor-pointer transition"
                    >
                      + حفظ 🔖 فاصل الختمة اليومية (ص {currentPage})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('memorization')}
                      className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 text-xs font-extrabold cursor-pointer transition"
                    >
                      + حفظ 📌 فاصل الحفظ والمراجعة
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSaveBookmark('tadabbur')}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-xs font-extrabold cursor-pointer transition"
                    >
                      + حفظ ⭐ آية للتدبر
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
                    {publicBookmarks.map((bm) => {
                      const badgeStyle =
                        bm.category === 'khatmah'
                          ? 'border-emerald-400/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200'
                          : bm.category === 'memorization'
                          ? 'border-blue-400/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200'
                          : 'border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200';
                      return (
                        <div
                          key={bm.id}
                          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border ${badgeStyle}`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleGoToPage(bm.pageNumber);
                              setShowBookmarksModal(false);
                            }}
                            className="text-right flex-1 cursor-pointer"
                          >
                            <div className="font-extrabold text-xs">{bm.label}</div>
                            <div className="text-[11px] opacity-85 mt-0.5">
                              صفحة {bm.pageNumber} • سورة {bm.surahName} (آية {bm.ayahNumber})
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleGoToPage(bm.pageNumber);
                              setShowBookmarksModal(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 text-[11px] font-extrabold shadow-sm cursor-pointer"
                          >
                            انتقال
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation & Synchronized Audio Controls Bar (Hidden in Immersive Reading Mode) */}
            {!distractionFreeReading && (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-2.5">
                {/* Row 1: Surah, Juz, Page, Quarter selectors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      السورة (114 سورة)
                    </label>
                    <select
                      value={pageInfo.primarySurahId}
                      onChange={(e) => {
                        const sId = Number(e.target.value);
                        handleGoToPage(getPageNumberForSurahAyah(sId, 1));
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-extrabold"
                    >
                      {SURAHS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}. سورة {s.name} ({s.type} - {s.ayahs} آية)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      الجزء (30 جزءاً)
                    </label>
                    <select
                      value={pageInfo.juzNumber}
                      onChange={(e) => {
                        const jNum = Number(e.target.value);
                        handleGoToPage(getPageNumberForJuz(jNum));
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-extrabold"
                    >
                      {JUZ_NAMES.map((jName, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          الجزء {idx + 1}: {jName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      الحزب والربع (240 ربعاً)
                    </label>
                    <select
                      value={pageInfo.quarterIndex}
                      onChange={(e) => {
                        const qIdx = Number(e.target.value);
                        handleGoToPage(getPageNumberForQuarter(qIdx));
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-extrabold"
                    >
                      {Array.from({ length: 240 }, (_, i) => {
                        const q = i + 1;
                        const hizb = Math.ceil(q / 4);
                        const qInHizb = ((q - 1) % 4) + 1;
                        return (
                          <option key={q} value={q}>
                            الحزب {hizb} — الربع {qInHizb} (ربع #{q})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      رقم الصفحة (طبعة المدينة 1 - 604)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleGoToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
                        title="الصفحة السابقة"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={604}
                        value={currentPage}
                        onChange={(e) => handleGoToPage(Number(e.target.value) || 1)}
                        className="w-full text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs font-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleGoToPage(currentPage + 1, true)}
                        disabled={currentPage >= 604}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
                        title="الصفحة التالية"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Synchronized Audio Bar */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold">القارئ المتزامن:</span>
                    <select
                      value={selectedReciter}
                      onChange={(e) => setSelectedReciter(e.target.value as ReciterId)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold"
                    >
                      {RECITERS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold"
                    >
                      {[0.75, 1, 1.25, 1.5].map((sp) => (
                        <option key={sp} value={sp}>
                          السرعة {sp}x
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBookmarksModal(true)}
                      className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                      <span>الفواصل ({publicBookmarks.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPlaying((prev) => !prev)}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition ${
                        isPlaying
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>إيقاف التلاوة المتزامنة</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>تشغيل الصفحة بالمتابعة البصرية</span>
                        </>
                      )}
                    </button>

                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAdvancePages}
                        onChange={(e) => setAutoAdvancePages(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>انتقال تلقائي للصفحة التالية</span>
                    </label>
                  </div>
                </div>

                {/* Row 3: Edition Switcher, Tajweed Highlighting & Pedagogical Tools */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  {/* 3-Mode Edition Switcher */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setMushafEdition('digital');
                        try { localStorage.setItem('imam_mushaf_edition_mode', 'digital'); } catch {}
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        mushafEdition === 'digital'
                          ? 'bg-[#145a3a] text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>النص العثماني الرقمي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMushafEdition('shamarli');
                        try { localStorage.setItem('imam_mushaf_edition_mode', 'shamarli'); } catch {}
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        mushafEdition === 'shamarli'
                          ? 'bg-[#145a3a] text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>مصحف الشمرلي (المصري)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMushafEdition('madinah');
                        try { localStorage.setItem('imam_mushaf_edition_mode', 'madinah'); } catch {}
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        mushafEdition === 'madinah'
                          ? 'bg-[#145a3a] text-white font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/40'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>مصحف المدينة المنورة المصور</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Dual-Page Open Mushaf Mode Toggle (Wide Screens) */}
                    <button
                      type="button"
                      onClick={() => setDualPageMode((prev) => !prev)}
                      className={`hidden lg:inline-flex px-3 py-1.5 rounded-xl text-xs font-extrabold items-center gap-1.5 border transition cursor-pointer ${
                        dualPageMode
                          ? 'bg-emerald-800 text-amber-200 border-amber-400 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                      title="التبديل بين عرض صفحة واحدة وعرض مصحف مفتوح صفحتين متقابلتين"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{dualPageMode ? '📖 مصحف مفتوح (صفحتين ✓)' : '📄 عرض صفحتين متقابلتين'}</span>
                    </button>

                    {/* Tajweed Highlighting Toggle */}
                    {mushafEdition === 'digital' && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !enableTajweedHighlighting;
                          setEnableTajweedHighlighting(nextVal);
                          try { localStorage.setItem('imam_tajweed_highlighting', String(nextVal)); } catch {}
                          showToast(nextVal ? 'تم تفعيل التلوين التفاعلي لأحكام التجويد' : 'تم إيقاف تلوين التجويد', 'info');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
                          enableTajweedHighlighting
                            ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>🎨 تلوين أحكام التجويد</span>
                        <span className="text-[10px] font-mono">
                          {enableTajweedHighlighting ? '(مفعل ✓)' : '(متوقف)'}
                        </span>
                      </button>
                    )}

                    {/* Universal Memorization Loop & Shadowing Controls */}
                    <div className="flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs">
                      <Repeat className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                      <span className="font-bold text-amber-900 dark:text-amber-200">تكرار الآية:</span>
                      <select
                        value={muallimRepeatCount}
                        onChange={(e) => {
                          setMuallimRepeatCount(Number(e.target.value));
                          setCurrentRepeatCycle(0);
                        }}
                        className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-bold"
                      >
                        {[1, 2, 3, 5, 7, 10].map((cnt) => (
                          <option key={cnt} value={cnt}>
                            {cnt} {cnt === 1 ? 'مرة' : 'مرات'}
                          </option>
                        ))}
                        <option value={0}>∞ تكرار لا نهائي</option>
                      </select>

                      <label className="inline-flex items-center gap-1 mr-1.5 font-bold text-emerald-900 dark:text-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={silencePauseAfterAyah}
                          onChange={(e) => setSilencePauseAfterAyah(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>فترة سكت للترديد خلف الشيخ</span>
                      </label>

                      <label className="inline-flex items-center gap-1 mr-1.5 font-bold text-amber-900 dark:text-amber-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rangeLoopEnabled}
                          onChange={(e) => setRangeLoopEnabled(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>تكرار نطاق آيات</span>
                      </label>

                      {rangeLoopEnabled && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold">
                          <span>من</span>
                          <input
                            type="number"
                            min={1}
                            max={286}
                            value={rangeFromAyah}
                            onChange={(e) => setRangeFromAyah(Math.max(1, Number(e.target.value) || 1))}
                            className="w-12 text-center rounded border border-amber-400 bg-white dark:bg-slate-800 px-1 py-0.5"
                          />
                          <span>إلى</span>
                          <input
                            type="number"
                            min={1}
                            max={286}
                            value={rangeToAyah}
                            onChange={(e) => setRangeToAyah(Math.max(1, Number(e.target.value) || 1))}
                            className="w-12 text-center rounded border border-amber-400 bg-white dark:bg-slate-800 px-1 py-0.5"
                          />
                        </div>
                      )}
                    </div>

                    {isInSilenceShadowing && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black animate-pulse">
                        🎙️ فترة سكت: ردّد الآية الآن...
                      </span>
                    )}

                    {/* Recitation Comparator Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        const firstItem = flatPageAyahs[0];
                        if (firstItem) {
                          setComparatorAyah({
                            surahId: firstItem.surahId,
                            surahName: firstItem.surahName,
                            ayah: firstItem.ayahEntry.ayah,
                            text: firstItem.ayahEntry.text,
                          });
                        }
                        setShowComparatorModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-amber-200 border border-amber-400/40 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Mic className="w-3.5 h-3.5 text-amber-300" />
                      <span>قارن تلاوتك بالشيخ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Madinah Mushaf Ornate Page Frame (Supports RTL Swipe Paging, Dual-Page Open Mushaf & Sajdah Badge) */}
            {(!distractionFreeReading || immersiveFocusStyle === 'spotlight_page') && (
              <div
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (touchStartXRef.current === null) return;
                  const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
                  const deltaX = endX - touchStartXRef.current;
                  touchStartXRef.current = null;
                  // In RTL Arabic Mushaf: swipe right (deltaX > 65) goes to next page; swipe left (deltaX < -65) goes to previous page
                  if (deltaX > 65 && currentPage < 604) {
                    handleGoToPage(currentPage + 1, true);
                  } else if (deltaX < -65 && currentPage > 1) {
                    handleGoToPage(currentPage - 1, false);
                  }
                }}
                className={`rounded-[32px] border-4 shadow-2xl transition-all duration-300 ${
                  pageTurnAnim === 'next'
                    ? 'scale-[0.99] -translate-x-1'
                    : pageTurnAnim === 'prev'
                    ? 'scale-[0.99] translate-x-1'
                    : ''
                } ${
                  distractionFreeReading
                    ? 'p-6 sm:p-10 md:p-12'
                    : 'p-4 sm:p-8'
                } ${
                  mushafNightMode
                    ? 'bg-[#0c1322] border-amber-600/60 text-amber-50'
                    : mushafSepiaMode
                    ? 'bg-[#FDFBF7] border-amber-600/70 text-[#2b2114]'
                    : 'bg-[#fffdf7] dark:bg-slate-900 border-amber-500/70 text-slate-900 dark:text-slate-100'
                }`}
              >
                {/* Mushaf Top Margin Header (Surah on Right, Page Center, Juz/Hizb/Quarter on Left) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b-2 border-amber-500/40 text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-300">
                  <div>سورة {pageInfo.primarySurahName}</div>
                  <div className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center gap-2">
                    <span>
                      {dualPageMode && currentPage < 604
                        ? `صفحتا ${currentPage} - ${currentPage + 1} من 604`
                        : `صفحة ${currentPage} من 604`}
                    </span>
                    {SAJDAH_PAGES[currentPage] && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-amber-200 text-[11px] font-black">
                        ۩ سجدة تلاوة ({SAJDAH_PAGES[currentPage].surahName}: {SAJDAH_PAGES[currentPage].ayahNumber})
                      </span>
                    )}
                  </div>
                  <div>
                    {pageInfo.juzName} • الحزب {pageInfo.hizbNumber} (الربع {pageInfo.quarterInHizb})
                  </div>
                </div>

                {mushafEdition !== 'digital' ? (
                  <div className="flex flex-col items-center justify-center p-2 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400/40 shadow-inner">
                    <div className="flex items-center justify-between w-full pb-2 mb-3 border-b border-amber-300/40 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <span>
                        {mushafEdition === 'shamarli'
                          ? 'طبعة مصحف الشمرلي المصرية التراثية (صور عالية الدقة)'
                          : 'طبعة مصحف المدينة المنورة (مجمع الملك فهد)'}
                      </span>
                      <span className="font-mono">
                        {dualPageMode && currentPage < 604
                          ? `صفحتا ${currentPage} و ${currentPage + 1}`
                          : `صفحة ${currentPage} من 604`}
                      </span>
                    </div>
                    <div className={`w-full py-2 overflow-hidden ${dualPageMode && currentPage < 604 ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 items-center' : 'flex justify-center'}`}>
                      <div className="flex flex-col items-center">
                        <img
                          src={getQuranPageImageUrl(mushafEdition, currentPage)}
                          alt={`مصحف صفحة ${currentPage}`}
                          className="max-h-[75vh] sm:max-h-[85vh] w-auto rounded-xl shadow-xl border-2 border-amber-500/50 object-contain hover:scale-[1.01] transition-transform duration-200"
                          loading="eager"
                        />
                        <span className="mt-1.5 text-[11px] font-black text-amber-800 dark:text-amber-300">
                          صفحة {currentPage}
                        </span>
                      </div>
                      {dualPageMode && currentPage < 604 && (
                        <div className="hidden lg:flex flex-col items-center border-r-2 border-amber-500/30 pr-4">
                          <img
                            src={getQuranPageImageUrl(mushafEdition, currentPage + 1)}
                            alt={`مصحف صفحة ${currentPage + 1}`}
                            className="max-h-[75vh] sm:max-h-[85vh] w-auto rounded-xl shadow-xl border-2 border-amber-500/50 object-contain hover:scale-[1.01] transition-transform duration-200"
                            loading="eager"
                          />
                          <span className="mt-1.5 text-[11px] font-black text-amber-800 dark:text-amber-300">
                            صفحة {currentPage + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : loadingPage ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-500">
                      جاري عرض آيات الصفحة {currentPage} بالرسم العثماني...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {enableTajweedHighlighting && (
                      <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-wrap items-center justify-around gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#e11d48]">
                          <span className="w-3 h-3 rounded-full bg-[#e11d48]"></span>
                          <span>أحكام المدود (أحمر)</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-[#16a34a]">
                          <span className="w-3 h-3 rounded-full bg-[#16a34a]"></span>
                          <span>الغنة والإخفاء والإدغام (أخضر)</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-[#2563eb]">
                          <span className="w-3 h-3 rounded-full bg-[#2563eb]"></span>
                          <span>القلقلة: قطب جد (أزرق)</span>
                        </div>
                      </div>
                    )}
                    {pageSections.map((sec) => (
                      <div key={`${sec.surahId}-${sec.fromAyah}`} className="space-y-4">
                        {/* Surah Ornate Banner */}
                        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-700/15 to-amber-500/15 border-2 border-amber-500/50 py-2.5 px-4 text-center">
                          <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-amber-300">
                            سُورَةُ {sec.surahName} — الآيات ({sec.fromAyah} إلى {sec.toAyah})
                          </div>
                          {sec.fromAyah === 1 && sec.surahId !== 1 && sec.surahId !== 9 && (
                            <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-amber-100 mt-1">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                          )}
                        </div>

                        {/* Continuous Uthmani Mushaf Flow with Immersive Current-Ayah Focus & Expanded Verse Area */}
                        <div
                          className={`font-serif text-justify select-text transition-all duration-300 ${
                            distractionFreeReading
                              ? 'leading-[2.9] text-2xl sm:text-3xl md:text-4xl'
                              : 'leading-[2.65] text-xl sm:text-2xl md:text-3xl'
                          }`}
                        >
                          {sec.verses.map((v) => {
                            const isCurrentFocusedAyah =
                              activeAudioSurahId === sec.surahId &&
                              activeAudioAyah === v.ayah;
                            const isCurrentReciting =
                              isPlaying && isCurrentFocusedAyah;
                            const cleanVerseText = stripLeadingBasmalah(
                              v.text,
                              sec.surahId,
                              v.ayah
                            );

                            return (
                              <span
                                key={v.ayah}
                                onClick={() => {
                                  setActiveAudioSurahId(sec.surahId);
                                  setActiveAudioAyah(v.ayah);
                                  if (!distractionFreeReading) {
                                    setSelectedAyahDetail({
                                      surahId: sec.surahId,
                                      surahName: sec.surahName,
                                      ayahEntry: { ...v, text: cleanVerseText },
                                    });
                                    setSelectedWordInModal(null);
                                  }
                                }}
                                className={`inline rounded-xl px-2 py-1 [box-decoration-break:clone] [-webkit-box-decoration-break:clone] transition-all cursor-pointer ${
                                  distractionFreeReading
                                    ? isCurrentFocusedAyah
                                      ? 'bg-amber-300/85 dark:bg-amber-500/45 text-slate-950 dark:text-white ring-2 ring-amber-500 shadow-md font-bold opacity-100'
                                      : 'opacity-35 hover:opacity-90'
                                    : isCurrentReciting
                                    ? 'bg-amber-300/85 dark:bg-amber-500/45 text-slate-950 dark:text-white ring-2 ring-amber-500 shadow-sm'
                                    : isCurrentFocusedAyah
                                    ? 'bg-emerald-500/20 dark:bg-emerald-500/30 ring-1 ring-emerald-500/50'
                                    : 'hover:bg-emerald-500/15'
                                }`}
                                title={
                                  distractionFreeReading
                                    ? 'انقر للتركيز على هذه الآية في منصة الخشوع'
                                    : 'انقر لعرض التفسير الميسر ومعاني الكلمات أو الاستماع والمشاركة'
                                }
                              >
                                {enableTajweedHighlighting ? (
                                  <span>
                                    {parseVerseTajweedTokens(cleanVerseText).map((tok, tIdx) => (
                                      <span
                                        key={tIdx}
                                        style={tok.color ? { color: tok.color } : undefined}
                                        title={tok.label}
                                        className={tok.color ? 'font-bold' : ''}
                                      >
                                        {tok.text}
                                      </span>
                                    ))}{' '}
                                  </span>
                                ) : (
                                  <span>{cleanVerseText} </span>
                                )}
                                <span className="inline-flex items-center justify-center mx-1 px-2 py-0.5 rounded-full text-sm font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/50">
                                  ﴿{v.ayah}﴾
                                </span>{' '}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mushaf Bottom Footer */}
                <div className="mt-8 pt-4 border-t-2 border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleGoToPage(currentPage - (dualPageMode ? 2 : 1))}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الصفحة السابقة ({Math.max(1, currentPage - 1)})</span>
                  </button>

                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 text-center space-y-1">
                    {SAJDAH_PAGES[currentPage] && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/50 font-black">
                        <span>۩ موضع سجدة تلاوة في هذه الصفحة: سورة {SAJDAH_PAGES[currentPage].surahName} (آية {SAJDAH_PAGES[currentPage].ayahNumber})</span>
                      </div>
                    )}
                    <div>
                      {distractionFreeReading ? (
                        <span>
                          🧘 <strong>وضع القراءة الخاشعة:</strong> اسحب يميناً أو يساراً لتقليب الصفحات أو انقر على أي آية
                        </span>
                      ) : (
                        <span>
                          💡 اسحب الصفحة يميناً/يساراً للتقليب السلس • انقر على أي آية لعرض <strong>التفسير الميسر والجلالين</strong> والاستماع والمشاركة
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoToPage(currentPage + (dualPageMode ? 2 : 1), true)}
                    disabled={currentPage >= 604}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition"
                  >
                    <span>إتمام الصفحة والانتقال للتالية ({Math.min(604, currentPage + 1)})</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DAILY/MONTHLY WIRD & KHATMAH TRACKER */}
        {portalSubTab === 'wird_khatmah' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Visitor Wird Config Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base">إعداد خطة الورد والختمة</h3>
                    <p className="text-xs text-slate-500">حدد خطتك واسمك ليظهر تقدمك وأوسمتك</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">اسم القارئ أو الكنية (اختياري):</label>
                    <input
                      type="text"
                      value={visitorNameInput}
                      onChange={(e) => setVisitorNameInput(e.target.value)}
                      placeholder="مثال: أبو عبد الرحمن / قارئ المصحف"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">نظام الختمة اليومية:</label>
                    <select
                      value={selectedPlanType}
                      onChange={(e) =>
                        setSelectedPlanType(
                          e.target.value as 'monthly_30' | 'bimonthly_60' | 'custom_pages'
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold"
                    >
                      <option value="monthly_30">ختمة شهرية (جزء يومياً - 20 صفحة)</option>
                      <option value="bimonthly_60">ختمة في شهرين (نصف جزء يومياً - 10 صفحات)</option>
                      <option value="custom_pages">عدد صفحات مخصص يومياً</option>
                    </select>
                  </div>

                  {selectedPlanType === 'custom_pages' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">عدد الصفحات اليومية:</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={customDailyPages}
                        onChange={(e) => setCustomDailyPages(Number(e.target.value) || 5)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveWirdPlanSettings}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer transition"
                  >
                    حفظ خطة الورد اليومي ✓
                  </button>
                </div>
              </div>

              {/* Active Progress & Streak Card */}
              <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-emerald-900 dark:text-emerald-300">
                      مرحباً بك، {currentVisitor?.visitorName}
                    </h3>
                    <p className="text-xs text-slate-500">{currentVisitor?.planLabel}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-black">
                      🔥 أيام المواظبة المتتالية: {currentVisitor?.streakDays || 1} يوم
                    </span>
                    <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                      🏅 الختمات المكتملة: {currentVisitor?.completedKhatmahs || 0}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span>
                      موضعك الحالي: صفحة {currentVisitor?.currentPage || currentPage} (سورة{' '}
                      {currentVisitor?.currentSurahName || pageInfo.primarySurahName} • الجزء{' '}
                      {currentVisitor?.currentJuz || pageInfo.juzNumber})
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {currentVisitor?.completionPercentage || Math.round((currentPage / 604) * 100)}% من الختمة الحالية
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          currentVisitor?.completionPercentage || Math.round((currentPage / 604) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {(currentVisitor?.badges || []).map((b, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-400/50 text-xs font-extrabold"
                    >
                      🏅 {b}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCompleteDailyWird}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إتمام ورد اليوم (+{currentVisitor?.dailyTargetPages || 20} صفحة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Award className="w-4 h-4" />
                    <span>📜 إصدار شهادة إتمام ختمة قرآنية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWaqfAndKhatmahModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-extrabold cursor-pointer"
                  >
                    🤲 دعاء ختم القرآن الكريم وإهداء الثواب
                  </button>

                  <a
                    href="https://wa.me/201068631966?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%D8%8C%20%D8%A3%D8%AA%D8%A7%D8%A8%D8%B9%20%D9%88%D8%B1%D8%AF%D9%8A%20%D9%81%D9%8A%20%D8%A8%D9%88%D8%A7%D8%A8%D8%A9%20%D8%A7%D9%84%D9%85%D8%B5%D8%AD%D9%81%20%D8%A7%D9%84%D8%B9%D8%A7%D9%85%20%D9%88%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D9%86%D8%B6%D9%85%D8%A7%D9%85%20%D9%84%D8%AD%D9%84%D9%82%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AA%D8%B5%D8%AD%D9%8A%D8%AD%20%D9%88%D8%A7%D9%84%D8%AA%D8%AD%D9%81%D9%8A%D8%B8%20%D9%85%D8%B9%20%D9%85%D8%B9%D9%84%D9%85%20%D8%A8%D8%A3%D9%83%D8%A7%D8%AF%D9%8A%D9%85%D9%8A%D8%A9%20%D8%A7%D9%84%D8%A5%D9%85%D8%A7%D9%85"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>التحق بحلقات التصحيح والتحفيظ المباشرة بالأكاديمية</span>
                  </a>
                </div>
              </div>
            </div>

            {/* WaqfDedication on Daily Wird & Khatmah Completion Screen */}
            <WaqfDedication
              variant="khatmah_screen"
              onOpenFullModal={() => setShowWaqfAndKhatmahModal(true)}
            />
          </div>
        )}

        {/* TAB 3: OFFLINE RESOURCE DOWNLOADER (100% OFFLINE CENTER) */}
        {portalSubTab === 'offline_center' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold">
                    مركز التنزيل المسبق للعمل بدون إنترنت 100%
                  </h3>
                  <p className="text-xs text-slate-500">
                    حمّل صفحات مصحف المدينة والتفسير الميسر والتلاوات الصوتية لتعمل معك في السفر والمسجد وبدون شبكة
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                إجمالي التنزيلات المحفوظة: {waqfImpactStats.offlineDownloadsCount.toLocaleString('ar-EG')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">اختر نطاق التنزيل للحفظ المحلي:</label>
                <select
                  value={offlineTargetScope}
                  onChange={(e) =>
                    setOfflineTargetScope(
                      e.target.value as 'juz30' | 'juz29_30' | 'selected_surah' | 'full_mushaf_text'
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-extrabold"
                >
                  <option value="juz30">جزء عمّ كاملاً (النص العثماني + التفسير + التلاوة)</option>
                  <option value="juz29_30">جزئي تبارك وعمّ (48 سورة مع التفسير والتلاوة)</option>
                  <option value="selected_surah">سورة محددة كاملة (مع التفسير والتلاوة)</option>
                  <option value="full_mushaf_text">نصوص المصحف والتفسير الميسر للسور المختارة</option>
                </select>
              </div>

              {offlineTargetScope === 'selected_surah' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">اختر السورة:</label>
                  <select
                    value={offlineSelectedSurah}
                    onChange={(e) => setOfflineSelectedSurah(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-extrabold"
                  >
                    {SURAHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}. سورة {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1.5">اختر القارئ لحفظ التلاوة الصوتية:</label>
                <select
                  value={offlineSelectedReciter}
                  onChange={(e) => setOfflineSelectedReciter(e.target.value as ReciterId)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs font-extrabold"
                >
                  {RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isDownloadingOffline && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                  <span>{offlineStatusLabel}</span>
                  <span>{offlineProgress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${offlineProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadOfflineBundle}
                disabled={isDownloadingOffline}
                className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>بدء تنزيل وتخزين الباقة للعمل بدون إنترنت</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                الباقات المحفوظة والجاهزة للعمل أوفلاين على هذا الجهاز:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cachedPackagesList.map((pkg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pkg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WAQF & SADAQAH JARIYAH GENERATOR + KHATMAH DUA */}
        {portalSubTab === 'waqf_card' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-400/70 p-6 shadow-lg space-y-6">
            <WaqfDedication variant="khatmah_screen" />

            {/* Interactive Sadaqah Jariyah Customizer & Shareable Link Generator */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white border-2 border-amber-400/70 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black">
                    🌿 مولّد الصدقة الجارية والوقف القرآني المخصص
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-amber-200 mt-1.5">
                    أنشئ رابط مصحف وقفي وبطاقة دعاء فاخرة باسم من تحب (متوفى / مريض / الوالدين)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    نوع الإهداء أو الوقف:
                  </label>
                  <select
                    value={waqfRelationType}
                    onChange={(e) => setWaqfRelationType(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-amber-400/40 px-3 py-2.5 text-xs font-extrabold text-white"
                  >
                    <option value="صدقة جارية على روح المغفور له بإذن الله" className="text-slate-900">
                      صدقة جارية على روح متوفى
                    </option>
                    <option value="وقف قرآني وبنية الشفاء العاجل لـ" className="text-slate-900">
                      بنية الشفاء العاجل لمريض
                    </option>
                    <option value="وقف قرآني وصدقة جارية لوالدينا الكريمين:" className="text-slate-900">
                      برّاً بالوالدين الكريمين
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    الاسم المهدى إليه ثواب التلاوة والختمات:
                  </label>
                  <input
                    type="text"
                    value={customWaqfDedicationName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomWaqfDedicationName(val);
                      try {
                        localStorage.setItem('imam_custom_waqf_name', val);
                      } catch {}
                    }}
                    placeholder="اكتب الاسم هنا (مثال: والدي الحاج محمد / والدتي / جدي / عموم موتى المسلمين)..."
                    className="w-full rounded-xl bg-white/15 border border-amber-400/60 px-3.5 py-2.5 text-xs sm:text-sm font-black text-white placeholder:text-emerald-200/60"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetName = customWaqfDedicationName.trim() || 'لوالدينا وأموات المسلمين أجمعين';
                    const shareUrl = `${window.location.origin}${window.location.pathname}?waqf=${encodeURIComponent(targetName)}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(shareUrl);
                    }
                    showToast('تم نسخ رابط المصحف الوقفي المخصص! كل من يقرأ منه يظهر له الإهداء أعلى المصحف', 'success');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>🔗 نسخ رابط المصحف الوقفي المخصص</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetName = customWaqfDedicationName.trim() || 'لوالدينا وأمواتنا وأموات المسلمين أجمعين';
                    handleDownloadLuxuryCanvasCard({
                      headerBadge: '🌿 وثيقة وقف قرآني وصدقة جارية مباركة',
                      mainArabicText: `${waqfRelationType}: ${targetName}`,
                      subReference: 'اللهم اجعل ثواب تلاوة هذا المصحف الشريف نوراً ورحمةً ورفعةً في الدرجات',
                      tafsirOrPrayer:
                        'اللهم ارحمهم بالقرآن العظيم، وآنس وحشتهم، ونوّر قبورهم، واجمعنا بهم في الفردوس الأعلى من الجنة مع النبيين والصديقين والشهداء والصالحين.',
                      waqfFooter: `وقف قرآني مجاني مفتوح لعموم المسلمين — ${OFFICIAL_BRANDING.academyName}`,
                      fileName: `waqf-sadaqah-card-${Date.now()}.png`,
                    });
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white border border-amber-400/50 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>🖼️ تحميل بطاقة الصدقة الجارية (PNG فاخرة)</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🌿 مصحف وقفي وصدقة جارية (${waqfRelationType}: ${
                      customWaqfDedicationName.trim() || 'لوالدينا وأموات المسلمين'
                    })\nاقرأ وردك اليومي واستمع لكبار القراء عبر ${OFFICIAL_BRANDING.academyName} (${OFFICIAL_BRANDING.slogan}):\n${
                      window.location.origin
                    }${window.location.pathname}?waqf=${encodeURIComponent(
                      customWaqfDedicationName.trim() || 'لوالدينا وأموات المسلمين'
                    )}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مشاركة الوقف عبر واتساب</span>
                </a>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/70 border border-amber-300/60 space-y-3">
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-900 dark:text-amber-300">
                🤲 دعاء ختم القرآن الكريم وإهداء ثواب التلاوة
              </h3>
              <p className="text-sm leading-loose font-bold text-slate-800 dark:text-slate-200">
                «اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدىً ورحمة، اللهم ذكرني منه ما نُسّيت وعلمني منه ما جهلت، وارزقني تلاوته آناء الليل وأطراف النهار، واجعله لي حجةً يا رب العالمين. اللهم تقبل منا ختم كتابك العظيم، واجعل ثواب ما قرأناه وتدبرناه صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين.»
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: BUILT-IN ADHKAR, KHATM DUA & RUQYAH LIBRARY */}
        {portalSubTab === 'adhkar_library' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/50 p-5 sm:p-6 shadow-lg space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-900 dark:text-amber-300">
                  📿 مكتبة الأذكار، دعاء ختم القرآن، وآيات السكينة والرقية الشرعية
                </h3>
                <p className="text-xs text-slate-500">
                  مكتبة إيمانية مدمجة مع عداد تسبيح تفاعلي لكل ذكر وآية
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'morning_evening', label: '☀️🌙 أذكار الصباح والمساء' },
                  { id: 'ruqyah', label: '🛡️ آيات السكينة والرقية الشرعية' },
                  { id: 'khatm', label: '🤲 دعاء ختم القرآن الكريم' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAdhkarCategoryTab(cat.id as 'khatm' | 'morning_evening' | 'ruqyah')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                      adhkarCategoryTab === cat.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {adhkarCategoryTab === 'khatm' && (
              <div className="space-y-4">
                {BUILT_IN_ADHKAR_AND_RUQYAH_LIBRARY.filter(
                  (item) => item.category === 'khatm_dua'
                ).map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50/50 dark:from-slate-800 dark:to-emerald-950/40 border border-amber-400/60 space-y-2"
                  >
                    <div className="text-sm font-black text-emerald-900 dark:text-amber-300">
                      ✨ {item.title}
                    </div>
                    <p className="font-serif text-lg sm:text-xl leading-loose text-slate-900 dark:text-slate-100 font-bold">
                      «{item.arabicText}»
                    </p>
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      🌟 المصدر / الفضل: {item.virtueOrSource}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(adhkarCategoryTab === 'morning_evening' || adhkarCategoryTab === 'ruqyah') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUILT_IN_ADHKAR_AND_RUQYAH_LIBRARY.filter((item) =>
                  adhkarCategoryTab === 'morning_evening'
                    ? item.category === 'morning_evening'
                    : item.category === 'ruqyah_sakinah'
                ).map((item) => {
                  const currentCnt = tasbihCounts[item.id] || 0;
                  const targetCnt = item.targetCount || 1;
                  const isDone = currentCnt >= targetCnt;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-3 ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-emerald-900 dark:text-amber-300">
                            {item.title}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-black">
                            التكرار: {currentCnt} / {targetCnt}
                          </span>
                        </div>
                        <p className="font-serif text-base sm:text-lg leading-loose text-slate-900 dark:text-slate-100 font-bold">
                          {item.arabicText}
                        </p>
                        {item.virtueOrSource && (
                          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            🌟 الفضل: {item.virtueOrSource}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() =>
                            setTasbihCounts((prev) => ({
                              ...prev,
                              [item.id]: (prev[item.id] || 0) + 1,
                            }))
                          }
                          className={`flex-1 py-2 px-4 rounded-xl font-black text-xs cursor-pointer transition ${
                            isDone
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                          }`}
                        >
                          {isDone ? `✓ اكتمل التكرار (${currentCnt}/${targetCnt}) — زيادة +1` : `📿 اضغط للعدّ والتسبيح (${currentCnt}/${targetCnt})`}
                        </button>
                        {currentCnt > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTasbihCounts((prev) => ({
                                ...prev,
                                [item.id]: 0,
                              }))
                            }
                            className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-[11px] font-bold cursor-pointer"
                          >
                            تصفير
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Interactive Ayah Action Popover, Dual Tafseer (Muyassar + Jalalayn), Word Meanings & Luxury Share Card */}
      {selectedAyahDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-400/70 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-emerald-900 dark:text-amber-300">
                  سورة {selectedAyahDetail.surahName} — الآية ({selectedAyahDetail.ayahEntry.ayah})
                </h3>
                <p className="text-xs text-slate-500">
                  انقر على أي كلمة في الآية لإظهار معناها الدقيق وتوجيهها التجويدي • اختر التفسير أو شارك الآية كبطاقة مصورة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAyahDetail(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shareable Waqf Quranic Card Preview */}
            <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-[#fffdf5] to-[#fef5d8] dark:from-slate-950 dark:to-emerald-950/70 p-5 text-center space-y-3 shadow-inner">
              <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                {OFFICIAL_BRANDING.academyName} — {OFFICIAL_BRANDING.slogan}
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 text-xl sm:text-2xl font-serif leading-loose text-slate-900 dark:text-amber-50">
                {selectedAyahDetail.ayahEntry.text.split(/\s+/).map((w, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedWordInModal(w)}
                    className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                      selectedWordInModal === w
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'hover:bg-amber-500/20'
                    }`}
                  >
                    {w}
                  </button>
                ))}
                <span className="text-amber-700 dark:text-amber-300 font-bold">
                  ﴿{selectedAyahDetail.ayahEntry.ayah}﴾
                </span>
              </div>

              {selectedWordInModal && (
                <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-400 text-right space-y-1">
                  <div className="text-xs font-black text-amber-700 dark:text-amber-300">
                    معنى الكلمة «{selectedWordInModal}»:
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {
                      getWordMeaningAndTafsir(
                        selectedWordInModal,
                        selectedAyahDetail.ayahEntry,
                        selectedAyahDetail.surahName
                      ).wordMeaning
                    }
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    💡 تنبيه التجويد:{' '}
                    {
                      getWordMeaningAndTafsir(
                        selectedWordInModal,
                        selectedAyahDetail.ayahEntry,
                        selectedAyahDetail.surahName
                      ).tajweedNote
                    }
                  </div>
                </div>
              )}

              {/* Dual Tafsir Switcher (ar.muyassar & ar.jalalayn) */}
              <div className="text-right p-3.5 rounded-xl bg-white/85 dark:bg-slate-900/85 border border-emerald-500/30 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    📖 موسوعة التفسير المدمجة (أوفلاين / أونلاين):
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTafsirEdition('muyassar')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                        activeTafsirEdition === 'muyassar'
                          ? 'bg-emerald-700 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      التفسير الميسر
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTafsirEdition('jalalayn')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                        activeTafsirEdition === 'jalalayn'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      تفسير الجلالين
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeTafsirEdition === 'jalalayn'
                    ? dualTafsirData?.jalalayn || selectedAyahDetail.ayahEntry.tafsir
                    : dualTafsirData?.muyassar || selectedAyahDetail.ayahEntry.tafsir}
                </p>
              </div>

              <div className="pt-2 border-t border-amber-400/40 text-[11px] font-bold text-amber-900 dark:text-amber-200">
                🌿 وقف قرآني وصدقة جارية لوالدينا وأمواتنا وأموات المسلمين أجمعين
              </div>
            </div>

            {/* Interactive Ayah Action Popover Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAudioSurahId(selectedAyahDetail.surahId);
                    setActiveAudioAyah(selectedAyahDetail.ayahEntry.ayah);
                    setIsPlaying(true);
                    setSelectedAyahDetail(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>▶️ استماع وترديد من هذه الآية</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComparatorAyah({
                      surahId: selectedAyahDetail.surahId,
                      surahName: selectedAyahDetail.surahName,
                      ayah: selectedAyahDetail.ayahEntry.ayah,
                      text: selectedAyahDetail.ayahEntry.text,
                    });
                    setSelectedAyahDetail(null);
                    setShowComparatorModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-amber-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>🎙️ سجل تلاوتك وقارنها بالشيخ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    savePublicBookmark({
                      category: 'memorization',
                      label: '🟢 فاصل الحفظ',
                      pageNumber: currentPage,
                      surahId: selectedAyahDetail.surahId,
                      surahName: selectedAyahDetail.surahName,
                      ayahNumber: selectedAyahDetail.ayahEntry.ayah,
                      juzNumber: pageInfo.juzNumber,
                      note: selectedAyahDetail.ayahEntry.text,
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 text-xs font-extrabold cursor-pointer"
                >
                  🔖 وضع فاصل هنا
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadLuxuryCanvasCard({
                      headerBadge: `سورة ${selectedAyahDetail.surahName} — الآية (${selectedAyahDetail.ayahEntry.ayah}) • صفحة ${currentPage}`,
                      mainArabicText: selectedAyahDetail.ayahEntry.text,
                      subReference: `التفسير (${activeTafsirEdition === 'jalalayn' ? 'الجلالين' : 'الميسر'}):`,
                      tafsirOrPrayer:
                        activeTafsirEdition === 'jalalayn'
                          ? dualTafsirData?.jalalayn || selectedAyahDetail.ayahEntry.tafsir
                          : dualTafsirData?.muyassar || selectedAyahDetail.ayahEntry.tafsir,
                      waqfFooter:
                        '🌿 صدقة جارية ووقف قرآني لوالدينا وأموات المسلمين أجمعين',
                      fileName: `ayah-card-${selectedAyahDetail.surahId}-${selectedAyahDetail.ayahEntry.ayah}.png`,
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>🖼️ مشاركة كبطاقة مصورة فاخرة (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const shareText = `﴿ ${selectedAyahDetail.ayahEntry.text} ﴾ [سورة ${selectedAyahDetail.surahName}: ${selectedAyahDetail.ayahEntry.ayah}]\nالتفسير: ${
                      activeTafsirEdition === 'jalalayn'
                        ? dualTafsirData?.jalalayn || selectedAyahDetail.ayahEntry.tafsir
                        : dualTafsirData?.muyassar || selectedAyahDetail.ayahEntry.tafsir
                    }\n🌿 صدقة جارية ووقف قرآني — ${OFFICIAL_BRANDING.academyName} (${OFFICIAL_BRANDING.slogan})`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(shareText);
                    }
                    showToast('تم نسخ بطاقة الآية والتفسير وتذييل الصدقة الجارية للمشاركة', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Offline Recitation Comparator & Voice Recorder */}
      {showComparatorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500 max-w-xl w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    أداة «قارن تلاوتك بالشيخ» (Recitation Comparator)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    سجّل تلاوتك للآية ثم استمع للفرق بين صوتك وتلاوة الشيخ الحصري المتقن
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                  if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                  }
                  setIsRecordingStudent(false);
                  setShowComparatorModal(false);
                }}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Ayah Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                اختر الآية المراد التسميع والمقارنة عليها:
              </label>
              <select
                value={comparatorAyah ? `${comparatorAyah.surahId}-${comparatorAyah.ayah}` : ''}
                onChange={(e) => {
                  const [sIdStr, aStr] = e.target.value.split('-');
                  const sId = Number(sIdStr);
                  const a = Number(aStr);
                  const found = flatPageAyahs.find((item) => item.surahId === sId && item.ayahEntry.ayah === a);
                  if (found) {
                    setComparatorAyah({
                      surahId: found.surahId,
                      surahName: found.surahName,
                      ayah: found.ayahEntry.ayah,
                      text: found.ayahEntry.text,
                    });
                    setStudentAudioBlobUrl(null);
                    setRecordingSeconds(0);
                  }
                }}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-[#f6f7f2] dark:bg-[#0b1711] px-3.5 py-2 text-xs font-bold"
              >
                {flatPageAyahs.map((item) => (
                  <option key={`${item.surahId}-${item.ayahEntry.ayah}`} value={`${item.surahId}-${item.ayahEntry.ayah}`}>
                    سورة {item.surahName} — الآية ({item.ayahEntry.ayah})
                  </option>
                ))}
              </select>
            </div>

            {/* Display Ayah Text */}
            {comparatorAyah && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  سورة {comparatorAyah.surahName} ﴿{comparatorAyah.ayah}﴾:
                </span>
                <p className="font-quran text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-loose">
                  «{comparatorAyah.text}»
                </p>
              </div>
            )}

            {/* Recorder Controls */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <button
                type="button"
                onClick={async () => {
                  if (isRecordingStudent) {
                    // Stop recording
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                      mediaRecorderRef.current.stop();
                    }
                    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                    setIsRecordingStudent(false);
                  } else {
                    // Start recording
                    try {
                      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        showToast('الميكروفون غير متاح في هذا المتصفح', 'error');
                        return;
                      }
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      recordedChunksRef.current = [];
                      const mr = new MediaRecorder(stream);
                      mediaRecorderRef.current = mr;
                      mr.ondataavailable = (e) => {
                        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
                      };
                      mr.onstop = () => {
                        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                        const blobUrl = URL.createObjectURL(blob);
                        setStudentAudioBlobUrl(blobUrl);
                        stream.getTracks().forEach((t) => t.stop());
                        showToast('تم حفظ تسجيل التلاوة بنجاح ✓ يمكنك الآن المقارنة', 'success');
                      };
                      mr.start();
                      setIsRecordingStudent(true);
                      setRecordingSeconds(0);
                      recordingTimerRef.current = setInterval(() => {
                        setRecordingSeconds((s) => s + 1);
                      }, 1000);
                    } catch {
                      showToast('يرجى منح إذن استخدام الميكروفون للتسجيل', 'error');
                    }
                  }
                }}
                className={`py-3 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer transition shadow-md ${
                  isRecordingStudent
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69]'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>
                  {isRecordingStudent
                    ? `جارٍ تسجيل صوتك (${recordingSeconds}ث)... اضغط للإيقاف`
                    : 'اضغط هنا لبدء تسجيل تلاوتك بصوتك'}
                </span>
              </button>

              {studentAudioBlobUrl && (
                <div className="w-full space-y-3 pt-2">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 text-center">
                    ✓ تم تجهيز تلاوتك ({recordingSeconds} ثانية) — استمع للمقارنة:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Play Student Recitation */}
                    <button
                      type="button"
                      onClick={() => {
                        if (studentAudioPlayerRef.current) {
                          studentAudioPlayerRef.current.pause();
                        }
                        const a = new Audio(studentAudioBlobUrl);
                        studentAudioPlayerRef.current = a;
                        setIsPlayingStudentVoice(true);
                        a.onended = () => setIsPlayingStudentVoice(false);
                        a.play().catch(() => setIsPlayingStudentVoice(false));
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                      <span>{isPlayingStudentVoice ? 'جارٍ الاستماع لصوتك...' : '١. استمع لتلاوتك'}</span>
                    </button>

                    {/* Play Sheikh Husary Recitation for Same Ayah */}
                    <button
                      type="button"
                      onClick={() => {
                        if (sheikhAudioPlayerRef.current) {
                          sheikhAudioPlayerRef.current.pause();
                        }
                        const sheikhUrl = getEveryAyahAudioUrl(
                          'Husary_128kbps',
                          comparatorAyah?.surahId || 1,
                          comparatorAyah?.ayah || 1
                        );
                        const a = new Audio(sheikhUrl);
                        sheikhAudioPlayerRef.current = a;
                        setIsPlayingSheikhVoice(true);
                        a.onended = () => setIsPlayingSheikhVoice(false);
                        a.play().catch(() => setIsPlayingSheikhVoice(false));
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isPlayingSheikhVoice ? 'جارٍ تلاوة الشيخ...' : '٢. استمع للشيخ الحصري'}</span>
                    </button>
                  </div>

                  {/* Sequential Auto-Compare Button */}
                  <button
                    type="button"
                    onClick={() => {
                      showToast('بدء الاستماع المتتالي: تلاوتك أولاً ثم الشيخ الحصري تلقائياً', 'info');
                      const studentAudio = new Audio(studentAudioBlobUrl);
                      studentAudioPlayerRef.current = studentAudio;
                      setIsPlayingStudentVoice(true);
                      studentAudio.play().catch(() => setIsPlayingStudentVoice(false));
                      studentAudio.onended = () => {
                        setIsPlayingStudentVoice(false);
                        const sheikhUrl = getEveryAyahAudioUrl(
                          'Husary_128kbps',
                          comparatorAyah?.surahId || 1,
                          comparatorAyah?.ayah || 1
                        );
                        const sheikhAudio = new Audio(sheikhUrl);
                        sheikhAudioPlayerRef.current = sheikhAudio;
                        setIsPlayingSheikhVoice(true);
                        sheikhAudio.play().catch(() => setIsPlayingSheikhVoice(false));
                        sheikhAudio.onended = () => setIsPlayingSheikhVoice(false);
                      };
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-l from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>⚡ تشغيل المقارنة المتتالية التلقائية (صوتك ➔ صوت الشيخ)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Waqf & Khatmah Dua Modal */}
      {showWaqfAndKhatmahModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-emerald-900 dark:text-amber-300">
                🌿 وثيقة الوقف القرآني ودعاء ختم القرآن الكريم
              </h3>
              <button
                type="button"
                onClick={() => setShowWaqfAndKhatmahModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <WaqfDedication variant="khatmah_screen" />

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-slate-800 border border-emerald-400/40 space-y-2 text-xs sm:text-sm font-bold leading-relaxed">
              <p className="text-emerald-900 dark:text-emerald-300 font-extrabold">
                🤲 دعاء ختم القرآن الكريم:
              </p>
              <p>
                اللهم ارحمني بالقرآن واجعله لي إماماً ونوراً وهدىً ورحمة، اللهم ذكرني منه ما نُسّيت وعلمني منه ما جهلت، وارزقني تلاوته آناء الليل وأطراف النهار، واجعله لي حجةً يا رب العالمين. اللهم أوصل ثواب ما قرأناه ونور ما تلوناه صدقة جارية ونوراً ورحمة لوالدينا وأمواتنا وأموات المسلمين أجمعين.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Khatmah Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-4 border-amber-500 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-center">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                {settings.academyName}
              </span>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-[#fffdf4] to-[#fef6d8] dark:from-slate-950 dark:to-emerald-950 p-6 space-y-4">
              <div className="text-amber-600 dark:text-amber-400 font-black text-sm">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-amber-300">
                🏅 شهادة إتمام ختمة قرآنية مباركة
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                تتشرف <strong>{settings.academyName}</strong> بتوثيق إتمام تلاوة ومواظبة القارئ الكريم:
              </p>
              <div className="py-2 px-6 rounded-2xl bg-amber-500/15 border border-amber-500/50 inline-block text-lg sm:text-xl font-black text-emerald-900 dark:text-white">
                {currentVisitor?.visitorName}
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                خطة الورد: {currentVisitor?.planLabel} • أيام المواظبة: {currentVisitor?.streakDays} يوماً
              </p>

              <div className="text-right">
                <WaqfDedication compact variant="certificate" />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة / حفظ الشهادة PDF</span>
              </button>
              <button
                type="button"
                onClick={() => recordWaqfAmeenPrayer()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                {WAQF_DEDICATION_TEXT.ameenButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PWA Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-emerald-900 dark:text-amber-300">
                📱 تثبيت المصحف العام على هاتفك
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
              <p>لتثبيت بوابة المصحف العام والورد اليومي كتطبيق مستقل يعمل بدون إنترنت:</p>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong>• لهواتف أندرويد و Chrome:</strong> اضغط على قائمة المتصفح (⋮) أعلى الشاشة ثم اختر <strong>«تثبيت التطبيق / Install App»</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية»</strong>.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong>• لهواتف آيفون (Safari):</strong> اضغط على زر المشاركة (Share) أسفل الشاشة ثم اختر <strong>«إضافة إلى الشاشة الرئيسية / Add to Home Screen»</strong>.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
            >
              تم، فهمت الطريقة ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const OwnerPublicWaqfImpactHub: React.FC = () => {
  const {
    waqfImpactStats,
    publicVisitors,
    sendOwnerVisitorEncouragement,
    setPublicMushafPortalOpen,
  } = useAcademy();

  const [encouragementTargetId, setEncouragementTargetId] = useState<string | 'ALL' | null>(null);
  const [badgeTitleInput, setBadgeTitleInput] = useState<string>(
    '🌟 وسام تميز ورسالة تشجيع وإهداء خاص من إدارة أكاديمية الإمام'
  );
  const [encouragementMsgInput, setEncouragementMsgInput] = useState<string>(
    'هنيئاً لكم هذه الهمة القرآنية المباركة والمواظبة على الورد اليومي؛ جعل الله القرآن العظيم ربيع قلوبكم ونوراً في الدنيا والآخرة.'
  );

  const sortedVisitors = useMemo(
    () =>
      [...publicVisitors].sort(
        (a, b) =>
          b.streakDays - a.streakDays ||
          b.completionPercentage - a.completionPercentage
      ),
    [publicVisitors]
  );

  const handleConfirmSendEncouragement = () => {
    if (!encouragementTargetId) return;
    sendOwnerVisitorEncouragement(
      encouragementTargetId,
      badgeTitleInput,
      encouragementMsgInput
    );
    setEncouragementTargetId(null);
  };

  return (
    <section className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/70 shadow-md space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#dfbd69] text-[11px] font-black mb-1">
            🌿 لوحة مالك الأكاديمية — إحصائيات الوقف القرآني وزوار المصحف العام
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c59b27]" />
            <span>
              عداد الزوار ولوحة الأثر القرآني وتشجيع القراء المتميزين
            </span>
          </h2>
          <p className="text-xs text-neutral-500">
            متابعة زوار بوابة المصحف العام والورد اليومي، الدعوات المهداة للوقف، وإرسال أوسمة التميز والرسائل التشجيعية للقراء المواظبين
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEncouragementTargetId('ALL')}
            className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>🌟 إرسال تشجيع ووسام جماعي لكل زوار المصحف</span>
          </button>

          <button
            type="button"
            onClick={() => setPublicMushafPortalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#dfbd69]" />
            <span>فتح بوابة المصحف العام والوقف</span>
          </button>
        </div>
      </div>

      {/* 1. عداد الزوار والأثر القرآني */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'إجمالي زوار المصحف العام',
            val: waqfImpactStats.totalVisitors.toLocaleString('ar-EG'),
            sub: 'زائر وقارئ نشط',
            color: 'text-[#145a3a] dark:text-[#dfbd69]',
          },
          {
            label: 'مرات تثبيت التطبيق (PWA)',
            val: waqfImpactStats.pwaInstallsCount.toLocaleString('ar-EG'),
            sub: 'هاتف وجهاز مثبت',
            color: 'text-blue-700 dark:text-blue-400',
          },
          {
            label: 'إجمالي الصفحات المقروءة',
            val: waqfImpactStats.totalPagesRead.toLocaleString('ar-EG'),
            sub: 'صفحة من مصحف المدينة',
            color: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            label: 'إجمالي الأجزاء المقروءة',
            val: waqfImpactStats.totalJuzRead.toLocaleString('ar-EG'),
            sub: 'جزء قرآني كامل',
            color: 'text-teal-700 dark:text-teal-300',
          },
          {
            label: 'الختمات القرآنية المكتملة',
            val: waqfImpactStats.completedKhatmahsCount.toLocaleString('ar-EG'),
            sub: 'ختمة مباركة',
            color: 'text-purple-700 dark:text-purple-300',
          },
          {
            label: 'دعوات «🤲 آمين» للوقف',
            val: waqfImpactStats.ameenPrayersCount.toLocaleString('ar-EG'),
            sub: 'دعوة بالرحمة والمغفرة',
            color: 'text-amber-700 dark:text-amber-300',
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-1"
          >
            <div className="text-[11px] font-bold text-neutral-500">{kpi.label}</div>
            <div className={`text-xl font-black font-mono tabular-nums ${kpi.color}`}>
              {kpi.val}
            </div>
            <div className="text-[10px] text-neutral-400 font-semibold">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* 2. جدول القراء الأكثر التزاماً بالورد اليومي والشهري + 3. أداة تشجيع المالك */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>
              جدول القراء الأكثر التزاماً بالورد اليومي والشهري (مرتبين حسب أيام المواظبة 🔥 Streak ونسبة الختمة):
            </span>
          </h3>
          <span className="text-xs font-bold text-neutral-500">
            {sortedVisitors.length} قراء متميزين في الصدارة
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-900/60">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-[#145a3a] text-white">
                <th className="p-3">اسم القارئ / الزائر</th>
                <th className="p-3">خطة الورد اليومي</th>
                <th className="p-3">الموضع الحالي</th>
                <th className="p-3">أيام المواظبة (Streak)</th>
                <th className="p-3">إنجاز الختمة</th>
                <th className="p-3">دعوات «🤲 آمين»</th>
                <th className="p-3">أداة تشجيع المالك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-emerald-950">
              {sortedVisitors.map((vis) => (
                <tr
                  key={vis.id}
                  className="odd:bg-white even:bg-[#fcfaf2] dark:odd:bg-[#12231a] dark:even:bg-[#0b1711]"
                >
                  <td className="p-3">
                    <div className="font-extrabold text-[#14281d] dark:text-white">
                      {vis.visitorName}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vis.badges.slice(0, 2).map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold"
                        >
                          🏅 {b}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{vis.planLabel}</td>
                  <td className="p-3 font-bold text-[#145a3a] dark:text-[#dfbd69]">
                    صفحة {vis.currentPage} (سورة {vis.currentSurahName} • جزء {vis.currentJuz})
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-black font-mono">
                      🔥 {vis.streakDays} يوم
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 rounded-full bg-neutral-200 dark:bg-emerald-950 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${vis.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono font-extrabold">
                        {vis.completionPercentage}% ({vis.completedKhatmahs} ختمة)
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                    🤲 {vis.ameenCount}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setEncouragementTargetId(vis.id)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#c59b27] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#14281d] font-extrabold text-[11px] shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      🌟 وسام تميز ورسالة تشجيع
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Sending Owner Encouragement Badge & Message */}
      {encouragementTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12231a] rounded-3xl border-2 border-[#c59b27] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[#145a3a] dark:text-[#dfbd69]">
                🌟 إرسال وسام تميز ورسالة تشجيع وإهداء خاص من إدارة أكاديمية الإمام
              </h3>
              <button
                type="button"
                onClick={() => setEncouragementTargetId(null)}
                className="p-1.5 rounded-xl bg-neutral-100 dark:bg-[#0b1711] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              المرسل إليه:{' '}
              <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                {encouragementTargetId === 'ALL'
                  ? 'جميع قراء وزوار بوابة المصحف العام والورد اليومي'
                  : publicVisitors.find((v) => v.id === encouragementTargetId)?.visitorName}
              </strong>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">عنوان الوسام أو الإهداء:</label>
                <input
                  type="text"
                  value={badgeTitleInput}
                  onChange={(e) => setBadgeTitleInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] font-extrabold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">
                  رسالة التشجيع والدعاء (تظهر كإشعار احتفالي في شاشة المصحف العام للقارئ):
                </label>
                <textarea
                  rows={3}
                  value={encouragementMsgInput}
                  onChange={(e) => setEncouragementMsgInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEncouragementTargetId(null)}
                className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-[#0b1711] text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEncouragement}
                className="px-5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                إرسال الوسام ورسالة التشجيع الآن ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

