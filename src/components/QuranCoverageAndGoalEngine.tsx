import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Student, SessionRecord, MakeupSessionCard } from '../types';
import { SURAHS, JUZ_NAMES, getPageNumberForSurahAyah } from '../data/quranData';

interface QuranCoverageAndGoalEngineProps {
  student: Student;
  sessions: SessionRecord[];
  roleMode?: 'teacher' | 'student' | 'guardian';
  onUpdateStudent?: (id: string, patch: Partial<Student>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onOpenSurahInMushaf?: (surahId: number, surahName: string) => void;
}

// Build 30-Juz to Surah IDs mapping from SURAHS metadata + multi-Juz Surahs
const JUZ_SURAH_MAPPING: Record<number, number[]> = (() => {
  const map: Record<number, number[]> = {};
  for (let j = 1; j <= 30; j++) {
    map[j] = [];
  }
  SURAHS.forEach((s) => {
    if (!map[s.juz]) map[s.juz] = [];
    map[s.juz].push(s.id);
  });
  // Ensure multi-juz long surahs are represented across their respective Juzs
  if (!map[2].includes(2)) map[2].push(2);
  if (!map[3].includes(2)) map[3].push(2);
  if (!map[4].includes(3)) map[4].push(3);
  if (!map[5].includes(4)) map[5].push(4);
  if (!map[6].includes(4)) map[6].push(4);
  if (!map[7].includes(5)) map[7].push(5);
  if (!map[8].includes(6)) map[8].push(6);
  if (!map[9].includes(7)) map[9].push(7);
  if (!map[10].includes(8)) map[10].push(8);
  if (!map[11].includes(9)) map[11].push(9);
  if (!map[12].includes(11)) map[12].push(11);
  if (!map[13].includes(12)) map[13].push(12);
  if (!map[17].includes(21)) map[17].push(21);
  if (!map[20].includes(27)) map[20].push(27);
  if (!map[21].includes(29)) map[21].push(29);
  if (!map[22].includes(33)) map[22].push(33);
  if (!map[23].includes(36)) map[23].push(36);
  if (!map[24].includes(39)) map[24].push(39);
  if (!map[25].includes(41)) map[25].push(41);
  if (!map[27].includes(51)) map[27].push(51);
  return map;
})();

// Approximate page counts per Juz in Madinah Mushaf (total 604 pages)
const JUZ_PAGES_COUNT = 20.1333;
const TOTAL_MUSHAF_PAGES = 604;
const TOTAL_QURAN_AYAHS = 6236;

export const QuranCoverageAndGoalEngine: React.FC<QuranCoverageAndGoalEngineProps> = ({
  student,
  sessions,
  roleMode = 'teacher',
  onUpdateStudent,
  onShowToast,
  onOpenSurahInMushaf,
}) => {
  const [activeGridTab, setActiveGridTab] = useState<'juz_30' | 'surah_114' | 'khatmah_calc'>('juz_30');
  const [customWeeklyPagesOverride, setCustomWeeklyPagesOverride] = useState<number | null>(null);
  const [schedulingCardId, setSchedulingCardId] = useState<string | null>(null);
  const [scheduleDateInput, setScheduleDateInput] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [scheduleTimeInput, setScheduleTimeInput] = useState<string>(student.scheduleTime || '17:00');

  // Compute exact Quran coverage (Pages out of 604, Percentage, 30 Juz states, 114 Surah states)
  const coverageStats = useMemo(() => {
    const memSurahSet = new Set<number>(student.memorizedSurahs || []);
    const revSurahSet = new Set<number>(student.inProgressSurahs || []);
    const memJuzSet = new Set<number>(student.memorizedJuz || []);
    const currentStopSurahId = student.currentStop?.surahId || 1;
    const currentStopJuz = student.currentStop?.juzNumber || 30;
    const currentStopAyah = student.currentStop?.ayah || 1;

    // Recent reviewed surahs from sessions (last 30 days)
    const recentReviewSurahs = new Set<number>();
    const studentSessions = sessions.filter((s) => s.studentId === student.id && s.status === 'حضر');
    studentSessions.slice(0, 15).forEach((sess) => {
      if (sess.nearReview?.surahId) recentReviewSurahs.add(sess.nearReview.surahId);
      if (sess.farReview?.surahId) recentReviewSurahs.add(sess.farReview.surahId);
    });

    // Calculate memorized ayahs & pages accurately
    let memorizedAyahsCount = 0;
    SURAHS.forEach((surah) => {
      const surahJuzList = Object.entries(JUZ_SURAH_MAPPING)
        .filter(([, sIds]) => sIds.includes(surah.id))
        .map(([j]) => Number(j));
      const isInMemorizedJuz = surahJuzList.some((j) => memJuzSet.has(j));

      if (memSurahSet.has(surah.id) || isInMemorizedJuz) {
        memorizedAyahsCount += surah.ayahs;
      } else if (surah.id === currentStopSurahId) {
        memorizedAyahsCount += Math.min(surah.ayahs, Math.max(0, currentStopAyah));
      } else if (revSurahSet.has(surah.id)) {
        memorizedAyahsCount += Math.round(surah.ayahs * 0.6);
      }
    });

    // Combine Juz-based and Ayah-based page estimation for maximum accuracy out of 604 pages
    const pagesFromAyahs = Math.round((memorizedAyahsCount / TOTAL_QURAN_AYAHS) * TOTAL_MUSHAF_PAGES);
    const pagesFromJuz = Math.round(memJuzSet.size * JUZ_PAGES_COUNT);
    const completedPages = Math.min(
      TOTAL_MUSHAF_PAGES,
      Math.max(pagesFromAyahs, pagesFromJuz, memSurahSet.size > 0 ? Math.max(1, pagesFromAyahs) : 0)
    );
    const exactPercentage = Number(((completedPages / TOTAL_MUSHAF_PAGES) * 100).toFixed(1));
    const remainingPages = Math.max(0, TOTAL_MUSHAF_PAGES - completedPages);

    // 30 Juz statuses: 'mastered' (🟢 محفوظ متقن) | 'reviewing' (🟡 قيد المراجعة) | 'current_goal' (🔵 الهدف الحالي) | 'not_started' (⚪ لم يبدأ)
    const juzGrid = Array.from({ length: 30 }, (_, idx) => {
      const juzNum = idx + 1;
      const surahsInJuz = JUZ_SURAH_MAPPING[juzNum] || [];
      const allSurahsMem = surahsInJuz.length > 0 && surahsInJuz.every((id) => memSurahSet.has(id));
      const someSurahsMemOrRev = surahsInJuz.some(
        (id) => memSurahSet.has(id) || revSurahSet.has(id) || recentReviewSurahs.has(id)
      );

      let state: 'mastered' | 'reviewing' | 'current_goal' | 'not_started' = 'not_started';
      if (memJuzSet.has(juzNum) || allSurahsMem) {
        state = 'mastered';
      } else if (juzNum === currentStopJuz || surahsInJuz.includes(currentStopSurahId)) {
        state = 'current_goal';
      } else if (someSurahsMemOrRev) {
        state = 'reviewing';
      }

      return {
        juzNumber: juzNum,
        juzName: JUZ_NAMES[idx] || `الجزء ${juzNum}`,
        state,
        surahCount: surahsInJuz.length,
      };
    });

    // 114 Surahs statuses
    const surahGrid = SURAHS.map((surah) => {
      const surahJuzList = Object.entries(JUZ_SURAH_MAPPING)
        .filter(([, sIds]) => sIds.includes(surah.id))
        .map(([j]) => Number(j));
      const isInMemorizedJuz = surahJuzList.some((j) => memJuzSet.has(j));

      let state: 'mastered' | 'reviewing' | 'current_goal' | 'not_started' = 'not_started';
      if (memSurahSet.has(surah.id) || isInMemorizedJuz) {
        state = 'mastered';
      } else if (surah.id === currentStopSurahId) {
        state = 'current_goal';
      } else if (revSurahSet.has(surah.id) || recentReviewSurahs.has(surah.id)) {
        state = 'reviewing';
      }

      return {
        ...surah,
        state,
        startPage: getPageNumberForSurahAyah(surah.id, 1),
      };
    });

    // Calculate student's average weekly pages rate from recorded sessions & schedule
    const sessionsPerWeek = Math.max(1, (student.scheduleDays || [0, 2, 4]).length);
    let avgPagesPerSession = 1.0;
    if (studentSessions.length > 0) {
      let totalEstimatedPages = 0;
      studentSessions.slice(0, 12).forEach((s) => {
        const fromA = s.actualRecitation?.fromAyah || s.newMemorization?.fromAyah || 1;
        const toA = s.actualRecitation?.toAyah || s.newMemorization?.toAyah || 8;
        const ayahSpan = Math.max(3, Math.abs(toA - fromA) + 1);
        totalEstimatedPages += Math.max(0.5, Number((ayahSpan / 15).toFixed(2)));
      });
      avgPagesPerSession = Number((totalEstimatedPages / Math.min(12, studentSessions.length)).toFixed(2));
    }

    const calculatedWeeklyPages = Number(Math.max(1, avgPagesPerSession * sessionsPerWeek).toFixed(1));
    const effectiveWeeklyPages = customWeeklyPagesOverride ?? calculatedWeeklyPages;
    const weeksRemaining = remainingPages > 0 ? Math.ceil(remainingPages / Math.max(0.5, effectiveWeeklyPages)) : 0;

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + weeksRemaining * 7);
    const expectedDateFormatted = expectedDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      completedPages,
      remainingPages,
      exactPercentage,
      juzGrid,
      surahGrid,
      masteredJuzCount: juzGrid.filter((j) => j.state === 'mastered').length,
      reviewingJuzCount: juzGrid.filter((j) => j.state === 'reviewing').length,
      masteredSurahCount: surahGrid.filter((s) => s.state === 'mastered').length,
      reviewingSurahCount: surahGrid.filter((s) => s.state === 'reviewing').length,
      calculatedWeeklyPages,
      effectiveWeeklyPages,
      weeksRemaining,
      expectedDateFormatted,
      sessionsPerWeek,
    };
  }, [student, sessions, customWeeklyPagesOverride]);

  const makeupCards: MakeupSessionCard[] = useMemo(() => {
    const explicitCards = student.makeupSessions || [];
    // Also synthesize from recent absent/excused sessions if not yet in makeupSessions
    const existingDates = new Set(explicitCards.map((c) => c.absentDate));
    const autoFromSessions: MakeupSessionCard[] = sessions
      .filter(
        (s) =>
          s.studentId === student.id &&
          (s.status === 'غاب' || s.status === 'إجازة') &&
          !existingDates.has(s.date)
      )
      .slice(0, 5)
      .map((s) => ({
        id: `makeup-${s.id}`,
        studentId: student.id,
        studentName: student.name,
        absentDate: s.date,
        attendanceStatus: s.status === 'غاب' ? 'غاب' : 'إجازة',
        missedSurahId: s.newMemorization?.surahId || student.currentStop?.surahId || 1,
        missedSurahName: s.newMemorization?.surahName || student.currentStop?.surahName || 'البقرة',
        missedFromAyah: s.newMemorization?.fromAyah || student.currentStop?.ayah || 1,
        missedToAyah: s.newMemorization?.toAyah || (student.currentStop?.ayah || 1) + 7,
        missedReviewLabel: s.nearReview?.surahName ? `مراجعة سورة ${s.nearReview.surahName}` : undefined,
        resolutionStatus: 'pending',
        createdAt: s.createdAt || s.date,
      }));

    return [...explicitCards, ...autoFromSessions];
  }, [student, sessions]);

  const handleScheduleMakeup = (card: MakeupSessionCard) => {
    if (!onUpdateStudent) return;
    const updatedCard: MakeupSessionCard = {
      ...card,
      resolutionStatus: 'scheduled_makeup',
      scheduledMakeupDate: scheduleDateInput,
      scheduledMakeupTime: scheduleTimeInput,
      resolvedByRole: roleMode === 'guardian' ? 'guardian' : 'teacher',
      resolvedAt: new Date().toISOString(),
    };

    const existing = student.makeupSessions || [];
    const existsIdx = existing.findIndex((c) => c.id === card.id || c.absentDate === card.absentDate);
    const nextList =
      existsIdx >= 0
        ? existing.map((c, i) => (i === existsIdx ? updatedCard : c))
        : [updatedCard, ...existing];

    onUpdateStudent(student.id, { makeupSessions: nextList });
    setSchedulingCardId(null);
    onShowToast?.(
      `تم اعتماد موعد حصة التعويض يوم ${scheduleDateInput} الساعة ${scheduleTimeInput} بنجاح 📅`,
      'success'
    );
  };

  const handleAutoMergeNextWeek = (card: MakeupSessionCard) => {
    if (!onUpdateStudent) return;
    const spanAyahs = Math.max(1, card.missedToAyah - card.missedFromAyah + 1);
    const perSessionAdd = Math.max(1, Math.ceil(spanAyahs / Math.max(1, coverageStats.sessionsPerWeek)));
    const mergedNote = `تم توزيع ورد (${card.missedSurahName}: ${card.missedFromAyah}-${card.missedToAyah}) بمعدل +${perSessionAdd} آيات إضافية على حصص الأسبوع القادم دون تأخير موعد الختمة.`;

    const updatedCard: MakeupSessionCard = {
      ...card,
      resolutionStatus: 'merged_next_week',
      mergedPlanNote: mergedNote,
      resolvedByRole: roleMode === 'guardian' ? 'guardian' : 'teacher',
      resolvedAt: new Date().toISOString(),
    };

    const existing = student.makeupSessions || [];
    const existsIdx = existing.findIndex((c) => c.id === card.id || c.absentDate === card.absentDate);
    const nextList =
      existsIdx >= 0
        ? existing.map((c, i) => (i === existsIdx ? updatedCard : c))
        : [updatedCard, ...existing];

    onUpdateStudent(student.id, {
      makeupSessions: nextList,
    });

    onShowToast?.(
      `تم دمج الورد الفائت تلقائياً في خطة الأسبوع القادم (+${perSessionAdd} آيات لكل حصة) للحفاظ على جدول الختمة 🔄`,
      'success'
    );
  };

  const getStateStyles = (state: 'mastered' | 'reviewing' | 'current_goal' | 'not_started') => {
    switch (state) {
      case 'mastered':
        return {
          badge: 'محفوظ متقن',
          cardClass:
            'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-900/15 hover:bg-emerald-700',
          dotClass: 'bg-emerald-500',
        };
      case 'reviewing':
        return {
          badge: 'قيد المراجعة',
          cardClass:
            'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-900/15 hover:bg-amber-400',
          dotClass: 'bg-amber-400',
        };
      case 'current_goal':
        return {
          badge: 'الهدف الحالي',
          cardClass:
            'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50 shadow-md hover:bg-blue-700',
          dotClass: 'bg-blue-500',
        };
      default:
        return {
          badge: 'لم يبدأ',
          cardClass:
            'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400',
          dotClass: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Quran Coverage % & Goal Planning Engine Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-700/40 shadow-md overflow-hidden">
        {/* Top Banner with Exact Coverage % and Pages */}
        <div className="bg-gradient-to-l from-[#09291e] via-[#114232] to-[#145a3a] p-5 text-white relative overflow-hidden">
          <img
            src="/mushaf-corner.svg"
            alt=""
            className="w-20 h-20 absolute top-1 left-1 opacity-25 pointer-events-none -scale-x-100"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-extrabold">
                <Compass className="w-3.5 h-3.5" />
                <span>خريطة تغطية القرآن الكريم وتخطيط الأهداف (30 جزءاً • 114 سورة • 604 صفحات)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                أتم حفظ{' '}
                <span className="text-amber-300 font-mono text-2xl">{coverageStats.exactPercentage}%</span> من
                القرآن الكريم —{' '}
                <span className="text-emerald-200 font-mono">{coverageStats.completedPages} صفحة</span> من 604
              </h3>
              <p className="text-xs text-emerald-100/90 font-bold">
                المحطة الحالية: سورة {student.currentStop?.surahName || 'الفاتحة'} (آية{' '}
                {student.currentStop?.ayah || 1} • الجزء {student.currentStop?.juzNumber || 30}) • المتبقي للختمة:{' '}
                {coverageStats.remainingPages} صفحة
              </p>
            </div>

            {/* Expected Khatmah Date Pill */}
            <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-amber-300/40 px-4 py-3 text-right min-w-[230px]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>حاسبة موعد الختمة المتوقع:</span>
              </div>
              <div className="text-sm sm:text-base font-black text-white mt-0.5">
                {coverageStats.remainingPages === 0 ? '🎉 أتم حفظ القرآن كاملاً!' : coverageStats.expectedDateFormatted}
              </div>
              <div className="text-[11px] text-emerald-200 font-bold mt-0.5">
                بمعدل {coverageStats.effectiveWeeklyPages} صفحة/أسبوعياً ({coverageStats.weeksRemaining} أسبوعاً متبقياً)
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-3 w-full rounded-full bg-black/35 overflow-hidden p-0.5 border border-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-400 via-emerald-400 to-teal-300 transition-all duration-500"
                style={{ width: `${Math.max(2, coverageStats.exactPercentage)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold text-emerald-100">
              <span>🟢 محفوظ متقن: {coverageStats.masteredJuzCount} جزء ({coverageStats.masteredSurahCount} سورة)</span>
              <span>🟡 قيد المراجعة: {coverageStats.reviewingJuzCount} جزء ({coverageStats.reviewingSurahCount} سورة)</span>
              <span>🔵 الهدف الحالي: الجزء {student.currentStop?.juzNumber || 30} (سورة {student.currentStop?.surahName || 'البقرة'})</span>
            </div>
          </div>
        </div>

        {/* Navigation & Legend Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveGridTab('juz_30')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
                activeGridTab === 'juz_30'
                  ? 'bg-[#145a3a] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>خريطة الأجزاء الثلاثين (30 جزءاً)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGridTab('surah_114')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
                activeGridTab === 'surah_114'
                  ? 'bg-[#145a3a] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>خريطة السور الكاملة (114 سورة)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGridTab('khatmah_calc')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition ${
                activeGridTab === 'khatmah_calc'
                  ? 'bg-[#145a3a] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>حاسبة موعد الختمة وتخطيط الأهداف</span>
            </button>
          </div>

          {/* 4-Color Status Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span>أخضر: محفوظ متقن</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>ذهبي: قيد المراجعة</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
              <span>أزرق: الهدف الحالي</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
              <span>رمادي: لم يبدأ</span>
            </span>
          </div>
        </div>

        {/* Grid Body */}
        <div className="p-4">
          {activeGridTab === 'juz_30' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
              {coverageStats.juzGrid.map((jItem) => {
                const st = getStateStyles(jItem.state);
                return (
                  <div
                    key={jItem.juzNumber}
                    className={`rounded-2xl p-2.5 border transition flex flex-col justify-between ${st.cardClass}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black font-mono opacity-90">جزء {jItem.juzNumber}</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-black/15">
                        {st.badge}
                      </span>
                    </div>
                    <div className="text-xs font-black mt-1.5 truncate" title={jItem.juzName}>
                      {jItem.juzName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeGridTab === 'surah_114' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-1">
              {coverageStats.surahGrid.map((sItem) => {
                const st = getStateStyles(sItem.state);
                return (
                  <button
                    key={sItem.id}
                    type="button"
                    onClick={() => onOpenSurahInMushaf?.(sItem.id, sItem.name)}
                    className={`rounded-xl p-2 border text-right transition flex flex-col justify-between cursor-pointer ${st.cardClass}`}
                    title={`سورة ${sItem.name} (${sItem.ayahs} آية • صفحة ${sItem.startPage}) — ${st.badge}`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] font-bold opacity-85">
                      <span>#{sItem.id}</span>
                      <span>ص {sItem.startPage}</span>
                    </div>
                    <div className="text-xs font-black my-1 truncate">سورة {sItem.name}</div>
                    <div className="text-[9px] font-extrabold opacity-90">{st.badge}</div>
                  </button>
                );
              })}
            </div>
          )}

          {activeGridTab === 'khatmah_calc' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-emerald-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-emerald-200 dark:border-slate-700">
              <div className="space-y-2">
                <label className="block text-xs font-black text-emerald-950 dark:text-emerald-200">
                  معدل الإنجاز الأسبوعي المستهدف (صفحة / أسبوع):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={0.5}
                    value={coverageStats.effectiveWeeklyPages}
                    onChange={(e) => setCustomWeeklyPagesOverride(Number(e.target.value))}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                  <span className="px-3 py-1 rounded-xl bg-emerald-700 text-white font-mono text-xs font-black">
                    {coverageStats.effectiveWeeklyPages} ص/أسبوع
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                  المعدل الفعلي المحسوب من حصص الطالب الأخيرة: {coverageStats.calculatedWeeklyPages} صفحة أسبوعياً (
                  {coverageStats.sessionsPerWeek} حصص/أسبوع).
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700 space-y-1 text-center">
                <div className="text-xs font-bold text-slate-500">الصفحات المتبقية لإتمام الختمة المباركة</div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {coverageStats.remainingPages} صفحة
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  تم إنجاز {coverageStats.completedPages} صفحة ({coverageStats.exactPercentage}%)
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-l from-amber-500/20 to-emerald-500/20 p-4 border-2 border-amber-400/60 space-y-1 text-center">
                <div className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>موعد الختمة المتوقع بإذن الله</span>
                </div>
                <div className="text-lg font-black text-emerald-950 dark:text-white">
                  {coverageStats.remainingPages === 0 ? 'مبارك! أتم الختمة' : coverageStats.expectedDateFormatted}
                </div>
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  خلال {coverageStats.weeksRemaining} أسبوعاً من الانتظام المستمر
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Absence Makeup & Auto-Reschedule Engine Cards (منظومة تعويض الغياب الآلي وترحيل الأوراد) */}
      {makeupCards.length > 0 && (
        <div className="rounded-3xl bg-amber-50/90 dark:bg-slate-900 border-2 border-amber-400/70 dark:border-amber-600/50 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-amber-500 text-slate-950">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200">
                  منظومة تعويض الغياب الآلي وترحيل الأوراد ({makeupCards.length})
                </h4>
                <p className="text-xs font-bold text-amber-800/90 dark:text-slate-400">
                  بطاقات تعويض الحصص التي تغيب أو اعتذر عنها الطالب لضمان عدم اختلال جدول الختمة
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {makeupCards.map((card) => {
              const isPending = card.resolutionStatus === 'pending';
              return (
                <div
                  key={card.id}
                  className="rounded-2xl bg-white dark:bg-slate-800/90 border border-amber-300 dark:border-slate-700 p-3.5 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-[11px] font-black">
                      {card.attendanceStatus === 'غاب' ? '🔴 غياب حصة' : '🟡 اعتذار / إجازة'} • {card.absentDate}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                        card.resolutionStatus === 'scheduled_makeup'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200'
                          : card.resolutionStatus === 'merged_next_week'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
                      }`}
                    >
                      {card.resolutionStatus === 'scheduled_makeup'
                        ? `📅 مجدولة للتعويض (${card.scheduledMakeupDate})`
                        : card.resolutionStatus === 'merged_next_week'
                        ? '🔄 تم دمج الورد في خطة الأسبوع'
                        : '⏳ بانتظار جدولة التعويض أو الدمج'}
                    </span>
                  </div>

                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    الورد الفائت: سورة {card.missedSurahName} (من آية {card.missedFromAyah} إلى {card.missedToAyah})
                    {card.missedReviewLabel ? ` • ${card.missedReviewLabel}` : ''}
                  </div>

                  {card.mergedPlanNote && (
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-900 dark:text-blue-200">
                      {card.mergedPlanNote}
                    </div>
                  )}

                  {card.scheduledMakeupDate && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                      ✅ موعد حصة التعويض المعتمد: {card.scheduledMakeupDate} الساعة {card.scheduledMakeupTime || '17:00'}
                    </div>
                  )}

                  {onUpdateStudent && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {schedulingCardId === card.id ? (
                        <div className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">تاريخ التعويض</label>
                              <input
                                type="date"
                                value={scheduleDateInput}
                                onChange={(e) => setScheduleDateInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">وقت الحصة</label>
                              <input
                                type="time"
                                value={scheduleTimeInput}
                                onChange={(e) => setScheduleTimeInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleScheduleMakeup(card)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                            >
                              تأكيد موعد حصة التعويض ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setSchedulingCardId(null)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSchedulingCardId(card.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>تحديد موعد حصة التعويض</span>
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleAutoMergeNextWeek(card)}
                              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>دمج الورد مع خطة الأسبوع القادم تلقائياً</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
