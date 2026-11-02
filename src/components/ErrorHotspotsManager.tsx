import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Flame,
  Filter,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SURAHS } from '../data/quranData';
import {
  ErrorContext,
  ErrorFollowUpStatus,
  ErrorHotspotStageKey,
  ErrorType,
  RecitationError,
  Student,
} from '../types';

export interface ErrorHotspotsManagerProps {
  student: Student;
  historicalHotspots: RecitationError[];
  currentSessionErrors: RecitationError[];
  activeErrorContext?: ErrorContext;
  defaultSurahName?: string;
  defaultAyahNumber?: number;
  onUpdateFollowUpStatus: (
    studentId: string,
    errorKeyOrId: string,
    status: ErrorFollowUpStatus
  ) => void;
  onAddHotspotError: (newError: RecitationError) => void;
  onRemoveCurrentError?: (errorId: string) => void;
  onOpenInMushaf?: (surahName: string, ayahNumber: number) => void;
  onAssignToNearReview?: (surahId: number, surahName: string, fromAyah: number, toAyah: number) => void;
  onAppendToParentNotes?: (text: string) => void;
}

const HOTSPOT_STAGE_CONFIG: Record<
  ErrorHotspotStageKey,
  {
    label: string;
    shortBadge: string;
    deduction: number;
    errorType: ErrorType;
    bgClass: string;
    badgeClass: string;
    borderClass: string;
  }
> = {
  memorization_1: {
    label: '🔴 خطأ حفظ / نسيان',
    shortBadge: 'حفظ (-1.0)',
    deduction: 1.0,
    errorType: 'حفظ',
    bgClass: 'bg-rose-50/90 dark:bg-rose-950/35',
    badgeClass: 'bg-rose-600 text-white',
    borderClass: 'border-rose-400 dark:border-rose-700',
  },
  tashkeel_05: {
    label: '🟠 خطأ تشكيل / إعراب',
    shortBadge: 'تشكيل (-0.5)',
    deduction: 0.5,
    errorType: 'تشكيل',
    bgClass: 'bg-orange-50/90 dark:bg-orange-950/35',
    badgeClass: 'bg-orange-500 text-white',
    borderClass: 'border-orange-400 dark:border-orange-700',
  },
  tajweed_05: {
    label: '🟣 خطأ حكم تجويدي',
    shortBadge: 'تجويد (-0.5)',
    deduction: 0.5,
    errorType: 'تجويد',
    bgClass: 'bg-purple-50/90 dark:bg-purple-950/35',
    badgeClass: 'bg-purple-600 text-white',
    borderClass: 'border-purple-400 dark:border-purple-700',
  },
  hesitation_025: {
    label: '🟡 تردد / تنبيه فتح',
    shortBadge: 'تردد (-0.25)',
    deduction: 0.25,
    errorType: 'تردد',
    bgClass: 'bg-amber-50/90 dark:bg-amber-950/35',
    badgeClass: 'bg-amber-500 text-slate-950',
    borderClass: 'border-amber-400 dark:border-amber-600',
  },
};

export const ErrorHotspotsManager: React.FC<ErrorHotspotsManagerProps> = ({
  student,
  historicalHotspots,
  currentSessionErrors,
  activeErrorContext = 'التسميع',
  defaultSurahName,
  defaultAyahNumber = 1,
  onUpdateFollowUpStatus,
  onAddHotspotError,
  onRemoveCurrentError,
  onOpenInMushaf,
  onAssignToNearReview,
  onAppendToParentNotes,
}) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | ErrorHotspotStageKey>('ALL');
  const [pulseOnlyFilter, setPulseOnlyFilter] = useState<boolean>(false);
  const [showQuickAddForm, setShowQuickAddForm] = useState<boolean>(false);

  // Quick add hotspot word form state
  const [wordInput, setWordInput] = useState<string>('');
  const [surahNameInput, setSurahNameInput] = useState<string>(
    defaultSurahName || student.currentStop?.surahName || 'النبأ'
  );
  const [ayahInput, setAyahInput] = useState<number>(
    defaultAyahNumber || student.currentStop?.ayah || 1
  );
  const [selectedStage, setSelectedStage] =
    useState<ErrorHotspotStageKey>('memorization_1');
  const [customNoteInput, setCustomNoteInput] = useState<string>('');

  // Combine historical open hotspots + current session errors into unified list with deduplication
  const allHotspotItems = useMemo(() => {
    const combined: Array<{
      item: RecitationError;
      source: 'current_session' | 'previous_sessions';
      stageKey: ErrorHotspotStageKey;
    }> = [];

    const resolveStageKey = (err: RecitationError): ErrorHotspotStageKey => {
      if (err.hotspotStageKey) return err.hotspotStageKey;
      const t = String(err.type || err.errorType || '');
      if (t === 'حفظ' || t === 'نسيان' || t === 'نسيان آية') return 'memorization_1';
      if (t === 'تشكيل') return 'tashkeel_05';
      if (t === 'تجويد') return 'tajweed_05';
      return 'hesitation_025';
    };

    currentSessionErrors.forEach((err) => {
      combined.push({
        item: err,
        source: 'current_session',
        stageKey: resolveStageKey(err),
      });
    });

    historicalHotspots.forEach((err) => {
      const duplicateInCurrent = currentSessionErrors.some(
        (c) =>
          (c.compositeKey && c.compositeKey === err.compositeKey) ||
          (c.word &&
            err.word &&
            c.word === err.word &&
            (c.surah || c.surahName) === (err.surah || err.surahName) &&
            (c.ayah || c.ayahNumber) === (err.ayah || err.ayahNumber))
      );
      if (!duplicateInCurrent) {
        combined.push({
          item: err,
          source: 'previous_sessions',
          stageKey: resolveStageKey(err),
        });
      }
    });

    return combined;
  }, [historicalHotspots, currentSessionErrors]);

  const filteredHotspots = useMemo(() => {
    return allHotspotItems.filter(({ item, stageKey }) => {
      if (stageFilter !== 'ALL' && stageKey !== stageFilter) return false;
      if (pulseOnlyFilter && item.followUpStatus === 'mastered') return false;
      return true;
    });
  }, [allHotspotItems, stageFilter, pulseOnlyFilter]);

  const stats = useMemo(() => {
    let totalPointsDeducted = 0;
    const byStage: Record<ErrorHotspotStageKey, number> = {
      memorization_1: 0,
      tashkeel_05: 0,
      tajweed_05: 0,
      hesitation_025: 0,
    };

    allHotspotItems.forEach(({ item, stageKey }) => {
      byStage[stageKey] = (byStage[stageKey] || 0) + 1;
      if (item.followUpStatus !== 'mastered') {
        totalPointsDeducted +=
          typeof item.deductionPoints === 'number'
            ? item.deductionPoints
            : HOTSPOT_STAGE_CONFIG[stageKey].deduction;
      }
    });

    return {
      totalCount: allHotspotItems.length,
      pulsingCount: allHotspotItems.filter((x) => x.item.followUpStatus !== 'mastered')
        .length,
      repeatedCount: allHotspotItems.filter(
        (x) => (x.item.repeatCount || 1) > 1 || x.item.followUpStatus === 'repeated_error'
      ).length,
      totalPointsDeducted: Number(totalPointsDeducted.toFixed(2)),
      byStage,
    };
  }, [allHotspotItems]);

  const handleCreateHotspotWord = (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = HOTSPOT_STAGE_CONFIG[selectedStage];
    const surahMeta =
      SURAHS.find((s) => s.name === surahNameInput) || SURAHS[0];
    const cleanWord = wordInput.trim() || `موضع آية ${ayahInput}`;

    const newErr: RecitationError = {
      id: `hs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: cfg.errorType,
      errorType:
        cfg.errorType === 'حفظ'
          ? 'نسيان'
          : cfg.errorType === 'تشكيل'
          ? 'تشكيل'
          : cfg.errorType === 'تجويد'
          ? 'تجويد'
          : 'تردد',
      context: activeErrorContext,
      surahId: surahMeta.id,
      surah: surahMeta.name,
      surahName: surahMeta.name,
      ayah: ayahInput,
      ayahNumber: ayahInput,
      word: cleanWord,
      subType: customNoteInput.trim() || cfg.label,
      note: customNoteInput.trim() || cfg.label,
      deductionPoints: cfg.deduction,
      hotspotStageKey: selectedStage,
      followUpStatus: 'needs_review',
      repeatCount: 1,
      compositeKey: `${surahMeta.name}_${ayahInput}_${cleanWord}_${selectedStage}`,
      timestamp: new Date().toISOString().split('T')[0],
    };

    onAddHotspotError(newErr);
    setWordInput('');
    setCustomNoteInput('');
    setShowQuickAddForm(false);
  };

  const handleExportHotspotsToParentNote = () => {
    if (!onAppendToParentNotes || filteredHotspots.length === 0) return;
    const lines = filteredHotspots.slice(0, 6).map(({ item, stageKey }) => {
      const cfg = HOTSPOT_STAGE_CONFIG[stageKey];
      const sName = item.surah || item.surahName || student.currentStop.surahName;
      const aNum = item.ayah || item.ayahNumber || 1;
      const wText = item.word ? `﴿${item.word}﴾` : item.subType || item.type;
      return `• ${wText} — سورة ${sName} (آية ${aNum}): ${cfg.shortBadge}`;
    });
    const summaryText = `🔥 الكلمات القرآنية الموصى بتكرارها وتثبيتها في المنزل (النقاط الساخنة):\n${lines.join('\n')}`;
    onAppendToParentNotes(summaryText);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-rose-50/70 dark:from-[#12231a] dark:via-[#0d1a13] dark:to-rose-950/20 border-2 border-amber-400/80 dark:border-amber-500/50 p-4 sm:p-5 shadow-md space-y-4">
      {/* Header & Summary Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-amber-300/60 dark:border-emerald-900/60">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm relative">
            <Flame className="w-5 h-5" />
            {stats.pulsingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-[#14281d] dark:text-[#dfbd69]">
                🔥 مدير النقاط الساخنة القرآنية (ErrorHotspotsManager)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>{stats.pulsingCount} كلمة تومض للمراجعة (Pulse)</span>
              </span>
              {stats.repeatedCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                  🔁 {stats.repeatedCount} أخطاء متكررة
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-[#dfbd69] text-[10px] font-mono font-black">
                إجمالي الخصم الموزون: -{stats.totalPointsDeducted} نقطة
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 mt-1">
              سجل ذكي للكلمات القرآنية التي أخطأ فيها الطالب ({student.name}) مع وميض بصري (Pulse) لتنبيه المحفظ والطالب في الحصص القادمة حتى يتم إتقانها بالكامل.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowQuickAddForm((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showQuickAddForm ? 'إغلاق النموذج' : '+ إضافة كلمة ساخنة يدوياً'}</span>
          </button>

          {onAppendToParentNotes && filteredHotspots.length > 0 && (
            <button
              type="button"
              onClick={handleExportHotspotsToParentNote}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-900 dark:text-amber-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
              title="إدراج قائمة الكلمات الساخنة في تقرير واتساب ولي الأمر للتدريب المنزلي"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>إدراج في تقرير ولي الأمر</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Hotspot Word Form */}
      {showQuickAddForm && (
        <form
          onSubmit={handleCreateHotspotWord}
          className="p-4 rounded-2xl bg-white dark:bg-[#0b1711] border-2 border-[#c59b27]/60 space-y-3 animate-in fade-in"
        >
          <div className="text-xs font-black text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#c59b27]" />
            <span>إضافة كلمة قرآنية جديدة إلى سجل النقاط الساخنة (مع تفعيل الوميض Pulse):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold mb-1">الكلمة القرآنية</label>
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="مثال: سَيَعْلَمُونَ / مَعَاشًا"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#12231a] text-xs font-bold font-uthmanic-hafs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">السورة</label>
              <select
                value={surahNameInput}
                onChange={(e) => setSurahNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#12231a] text-xs font-bold"
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.id}. سورة {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">رقم الآية</label>
              <input
                type="number"
                min={1}
                max={286}
                value={ayahInput}
                onChange={(e) => setAyahInput(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#12231a] text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">تصنيف الخطأ (4 فئات)</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as ErrorHotspotStageKey)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#12231a] text-xs font-bold"
              >
                <option value="memorization_1">🔴 خطأ حفظ / نسيان (-1.0)</option>
                <option value="tashkeel_05">🟠 خطأ تشكيل / إعراب (-0.5)</option>
                <option value="tajweed_05">🟣 خطأ حكم تجويدي (-0.5)</option>
                <option value="hesitation_025">🟡 تردد / تنبيه فتح (-0.25)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                🔥 حفظ وتفعيل التنبيه البصري
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4-Category Filter Pills & Pulse Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
              stageFilter === 'ALL'
                ? 'bg-[#145a3a] text-[#dfbd69] shadow-xs'
                : 'bg-white dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-900'
            }`}
          >
            الكل ({stats.totalCount})
          </button>

          {(Object.keys(HOTSPOT_STAGE_CONFIG) as ErrorHotspotStageKey[]).map((key) => {
            const cfg = HOTSPOT_STAGE_CONFIG[key];
            const count = stats.byStage[key] || 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStageFilter(key)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition border ${
                  stageFilter === key
                    ? `${cfg.badgeClass} border-transparent shadow-xs`
                    : 'bg-white dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-emerald-900'
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-amber-300 cursor-pointer">
          <input
            type="checkbox"
            checked={pulseOnlyFilter}
            onChange={(e) => setPulseOnlyFilter(e.target.checked)}
            className="rounded accent-rose-600 cursor-pointer"
          />
          <span>عرض الكلمات النابضة (التي تحتاج مراجعة) فقط</span>
        </label>
      </div>

      {/* Hotspots Cards Grid with Visual Pulse */}
      {filteredHotspots.length === 0 ? (
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0b1711]/80 border border-emerald-400/50 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            لا توجد كلمات ساخنة تحتاج مراجعة ضمن هذا التصنيف — جميع الكلمات متقنة ولله الحمد!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          {filteredHotspots.map(({ item, source, stageKey }) => {
            const cfg = HOTSPOT_STAGE_CONFIG[stageKey];
            const sName = item.surah || item.surahName || student.currentStop.surahName;
            const aNum = item.ayah || item.ayahNumber || 1;
            const isPulsing = item.followUpStatus !== 'mastered';
            const repeatCount = item.repeatCount || 1;

            return (
              <div
                key={item.id}
                className={`${
                  isPulsing ? 'hotspot-word-pulse' : 'opacity-80'
                } p-3.5 rounded-2xl border-2 ${cfg.bgClass} ${cfg.borderClass} flex flex-col justify-between gap-2.5 transition-all shadow-xs`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isPulsing && (
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"
                          title="تنبيه بصري نشط (Pulse) للمراجعة والتثبيت"
                        />
                      )}
                      <span className="font-uthmanic-hafs text-xl font-black text-[#14281d] dark:text-[#dfbd69] bg-white/90 dark:bg-black/30 px-2.5 py-0.5 rounded-xl border border-[#c59b27]/50">
                        {item.word ? `﴿ ${item.word} ﴾` : item.subType || item.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${cfg.badgeClass}`}>
                        {cfg.shortBadge}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-[10px] font-bold">
                        {source === 'current_session' ? 'حصة اليوم' : 'حصص سابقة'}
                      </span>
                    </div>

                    <div className="text-xs font-extrabold text-neutral-700 dark:text-neutral-200 flex flex-wrap items-center gap-2">
                      <span>
                        📖 سورة {sName} • الآية ({aNum})
                      </span>
                      {item.context && (
                        <span className="text-[11px] text-neutral-500">
                          • المحور: {item.context}
                        </span>
                      )}
                      {repeatCount > 1 && (
                        <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                          • تكرر {repeatCount} مرات
                        </span>
                      )}
                    </div>
                  </div>

                  {source === 'current_session' && onRemoveCurrentError && (
                    <button
                      type="button"
                      onClick={() => onRemoveCurrentError(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-100/60 cursor-pointer"
                      title="حذف الخطأ من حصة اليوم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Action Bar: Mark Mastered, Keep Pulsing, Repeated, or Open in Mushaf */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFollowUpStatus(
                          student.id,
                          item.compositeKey || item.id,
                          'mastered'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black cursor-pointer transition"
                      title="تأكيد إتقان الكلمة وإيقاف الوميض"
                    >
                      ✅ أتقن الكلمة
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFollowUpStatus(
                          student.id,
                          item.compositeKey || item.id,
                          'needs_practice'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer transition"
                      title="إبقاء الوميض نشطاً للمراجعة في الحصة القادمة"
                    >
                      ⏳ يحتاج تثبيت
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFollowUpStatus(
                          student.id,
                          item.compositeKey || item.id,
                          'repeated_error'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black cursor-pointer transition"
                      title="تسجيل تكرار الخطأ في هذه الكلمة"
                    >
                      🔁 أخطأ مجدداً
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {onOpenInMushaf && (
                      <button
                        type="button"
                        onClick={() => onOpenInMushaf(sName, aNum)}
                        className="px-2 py-1 rounded-lg bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-[10px] font-black flex items-center gap-1 cursor-pointer"
                        title="فتح الآية في المصحف التفاعلي مع وميض الكلمة"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>المصحف</span>
                      </button>
                    )}
                    {onAssignToNearReview && (
                      <button
                        type="button"
                        onClick={() => {
                          const found =
                            SURAHS.find((s) => s.name === sName) || SURAHS[0];
                          const startA = Math.max(1, aNum - 2);
                          const endA = Math.min(found.ayahs, aNum + 3);
                          onAssignToNearReview(found.id, found.name, startA, endA);
                        }}
                        className="px-2 py-1 rounded-lg bg-[#c59b27]/25 hover:bg-[#c59b27]/40 border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-[10px] font-black cursor-pointer"
                        title="إدراج موضع الآية في المراجعة القريبة"
                      >
                        + للمراجعة القريبة
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
