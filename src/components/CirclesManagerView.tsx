import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { DAY_NAMES, SURAHS } from '../data/quranData';
import { getLocalDateString } from '../data/seedData';
import {
  computeStudentGamification,
  MUTASHABIHAT_DB,
} from '../data/smartSuiteData';
import { AttendanceStatus, CircleGroup, GradeType, SeasonalModeType } from '../types';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import { SEASONAL_PROGRAM_PRESETS } from '../data/educationalInnovationsData';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Flame,
  Layers,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Trash2,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';

type MosqueQueueStatus = 'waiting' | 'completed' | 'retry';

interface PeerPair {
  id: string;
  studentAId: string;
  studentBId?: string;
  completed: boolean;
  focusSurah: string;
}

export const CirclesManagerView: React.FC = () => {
  const {
    circles,
    students,
    sessions,
    settings,
    saveCircle,
    deleteCircle,
    assignStudentToCircle,
    saveSession,
    addDisciplineWarning,
    updateCircleSubstituteAndSeason,
    setSelectedStudentId,
    setActiveTab,
    showToast,
  } = useAcademy();

  const [selectedCircleName, setSelectedCircleName] = useState<string>(
    circles[0]?.name || ''
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(getLocalDateString(0));
  const [activeSubTab, setActiveSubTab] = useState<
    | 'mosqueRapidQueue'
    | 'substituteAndSeasons'
    | 'peerRecitation'
    | 'gamification'
    | 'attendance'
    | 'distribution'
    | 'groupRecitation'
    | 'discipline'
    | 'schedules'
  >('mosqueRapidQueue');

  // Mosque Rapid Queue State
  const [queueFilter, setQueueFilter] = useState<'all' | MosqueQueueStatus>('all');
  const [manualQueueOverrides, setManualQueueOverrides] = useState<
    Record<string, MosqueQueueStatus>
  >({});

  // Peer-to-Peer Recitation Pairs State
  const [peerPairs, setPeerPairs] = useState<PeerPair[]>([]);
  const [pairingStrategy, setPairingStrategy] = useState<'mentor' | 'sameLevel'>('mentor');

  // Collective Khatmah Target State
  const [khatmahTargetDays, setKhatmahTargetDays] = useState<number>(18);

  // Group Recitation State
  const [batchSurahId, setBatchSurahId] = useState<number>(67);
  const [batchFromAyah, setBatchFromAyah] = useState<number>(1);
  const [batchToAyah, setBatchToAyah] = useState<number>(15);
  const [batchGrades, setBatchGrades] = useState<Record<string, GradeType>>({});

  // Discipline Form State
  const [warnStudentId, setWarnStudentId] = useState<string>(students[0]?.id || '');
  const [warnLevel, setWarnLevel] = useState<'تنبيه' | 'إنذار أول' | 'إنذار نهائي'>('تنبيه');
  const [warnReason, setWarnReason] = useState<string>('');

  // Distribution Filter State
  const [distLevelFilter, setDistLevelFilter] = useState<string>('الكل');

  // Create / Edit Circle Modal State
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | undefined>(undefined);
  const [circleName, setCircleName] = useState('');
  const [circleTeacher, setCircleTeacher] = useState(settings.teacherName);
  const [circleLevel, setCircleLevel] = useState('متوسط');
  const [circleDays, setCircleDays] = useState<number[]>([0, 2, 4]);
  const [circleTime, setCircleTime] = useState('17:00');
  const [circleDuration, setCircleDuration] = useState<number>(45);
  const [circleDesc, setCircleDesc] = useState('');
  const [selectedStudentIdsForCircle, setSelectedStudentIdsForCircle] = useState<string[]>([]);

  const effectiveCircleName = useMemo(() => {
    if (circles.some((c) => c.name === selectedCircleName)) {
      return selectedCircleName;
    }
    return circles[0]?.name || '';
  }, [circles, selectedCircleName]);

  const activeCircleObj = useMemo(
    () => circles.find((c) => c.name === effectiveCircleName) || circles[0],
    [circles, effectiveCircleName]
  );

  // Substitute Teacher & Seasonal Mode Local Controls
  const [subTeacherInput, setSubTeacherInput] = useState('');
  const [subNotesInput, setSubNotesInput] = useState('');
  const [customSeasonGoalInput, setCustomSeasonGoalInput] = useState('');

  React.useEffect(() => {
    if (activeCircleObj) {
      setSubTeacherInput(activeCircleObj.substituteTeacherName || '');
      setSubNotesInput(
        activeCircleObj.substituteHandoverNotes ||
          'التركيز على تسميع الحفظ الجديد من موضع التوقف ومراجعة آخر سورة مع ضبط أحكام المدود.'
      );
      setCustomSeasonGoalInput(activeCircleObj.seasonalTargetLabel || '');
    }
  }, [activeCircleObj]);

  const circleStudents = useMemo(() => {
    if (!effectiveCircleName) return students;
    return students.filter((s) => s.circle === effectiveCircleName);
  }, [students, effectiveCircleName]);

  // Compute each student's queue status for today's mosque circle
  const studentQueueStatusMap = useMemo(() => {
    const map: Record<string, MosqueQueueStatus> = {};
    circleStudents.forEach((st) => {
      if (manualQueueOverrides[st.id]) {
        map[st.id] = manualQueueOverrides[st.id];
        return;
      }
      const todaySession = sessions.find(
        (s) => s.studentId === st.id && s.date === attendanceDate
      );
      if (!todaySession || todaySession.status !== 'حضر') {
        map[st.id] = 'waiting';
      } else if (
        todaySession.previousEvaluation?.newGrade === 'إعادة' ||
        todaySession.previousEvaluation?.newGrade === 'ضعيف' ||
        todaySession.masteryScore < 75
      ) {
        map[st.id] = 'retry';
      } else {
        map[st.id] = 'completed';
      }
    });
    return map;
  }, [circleStudents, sessions, attendanceDate, manualQueueOverrides]);

  // Rapid <15s One-Click Recitation Evaluation in Mosque Mode
  const handleRapidMosqueRecitation = (
    studentId: string,
    grade: GradeType,
    queueTarget: MosqueQueueStatus
  ) => {
    const st = students.find((x) => x.id === studentId);
    if (!st) return;
    const existing = sessions.find(
      (s) => s.studentId === studentId && s.date === attendanceDate
    );
    const score =
      grade === 'ممتاز'
        ? 97
        : grade === 'جيد جداً'
        ? 89
        : grade === 'جيد'
        ? 79
        : 65;

    const stopSurah =
      SURAHS.find((s) => s.id === st.currentStop.surahId) || SURAHS[0];
    const nextToAyah = Math.min(stopSurah.ayahs, st.currentStop.ayah + 10);

    saveSession({
      id: existing?.id,
      studentId: st.id,
      date: attendanceDate,
      status: 'حضر',
      masteryScore: score,
      previousEvaluation: { newGrade: grade },
      errors: existing?.errors || [],
      newMemorization: {
        enabled: true,
        surahId: stopSurah.id,
        surahName: stopSurah.name,
        isFullSurah: false,
        fromAyah: st.currentStop.ayah,
        toAyah: nextToAyah,
        direction: 'asc',
        grade,
      },
      juzReview: existing?.juzReview || { enabled: false, items: [], direction: 'desc' },
      surahReview: existing?.surahReview || {
        enabled: false,
        surahNames: [],
        direction: 'desc',
      },
      parentNotes:
        queueTarget === 'retry'
          ? 'يحتاج الطالب إلى تثبيت وإعادة تسميع المقرر في الحلقة.'
          : `أتم التسميع السريع في المسجد بتقدير (${grade}) ونسبة إتقان ${score}%.`,
    });

    setManualQueueOverrides((prev) => ({
      ...prev,
      [studentId]: queueTarget,
    }));
  };

  // Generate Peer-to-Peer Recitation Dyads
  const handleGeneratePeerPairs = () => {
    const list = [...circleStudents];
    if (list.length === 0) return;

    if (pairingStrategy === 'mentor') {
      // Sort advanced first, then pair top with bottom for mentorship
      const rank = { متقدم: 3, متوسط: 2, مبتدئ: 1 };
      list.sort((a, b) => rank[b.level] - rank[a.level]);
      const pairs: PeerPair[] = [];
      let left = 0;
      let right = list.length - 1;
      while (left <= right) {
        if (left === right) {
          pairs.push({
            id: `pair-${Date.now()}-${left}`,
            studentAId: list[left].id,
            completed: false,
            focusSurah: list[left].currentStop.surahName,
          });
        } else {
          pairs.push({
            id: `pair-${Date.now()}-${left}`,
            studentAId: list[left].id,
            studentBId: list[right].id,
            completed: false,
            focusSurah: list[right].currentStop.surahName,
          });
        }
        left++;
        right--;
      }
      setPeerPairs(pairs);
    } else {
      // Same-level sequential pairs
      const rank = { متقدم: 3, متوسط: 2, مبتدئ: 1 };
      list.sort((a, b) => rank[b.level] - rank[a.level]);
      const pairs: PeerPair[] = [];
      for (let i = 0; i < list.length; i += 2) {
        pairs.push({
          id: `pair-${Date.now()}-${i}`,
          studentAId: list[i].id,
          studentBId: list[i + 1]?.id,
          completed: false,
          focusSurah: list[i].currentStop.surahName,
        });
      }
      setPeerPairs(pairs);
    }
    showToast(
      `تم توزيع طلاب ${effectiveCircleName} في ثنائيات للتسميع المتبادل بنجاح`,
      'success'
    );
  };

  // Gamification & Leaderboard Computation
  const circleLeaderboard = useMemo(
    () => computeStudentGamification(circleStudents, sessions),
    [circleStudents, sessions]
  );

  const collectiveKhatmahStats = useMemo(() => {
    const uniqueJuzSet = new Set<number>();
    let totalJuzSum = 0;
    circleStudents.forEach((st) => {
      totalJuzSum += st.memorizedJuz.length;
      st.memorizedJuz.forEach((j) => uniqueJuzSet.add(j));
    });
    const completedKhatmahCount = Math.floor(totalJuzSum / 30);
    const currentKhatmahJuz = totalJuzSum % 30;
    const progressPercent = Math.min(100, Math.round((currentKhatmahJuz / 30) * 100));
    const remainingJuz = 30 - currentKhatmahJuz;
    return {
      totalJuzSum,
      completedKhatmahCount,
      currentKhatmahJuz,
      progressPercent,
      remainingJuz,
      uniqueJuzCovered: uniqueJuzSet.size,
    };
  }, [circleStudents]);

  const batchSurahMutashabihat = useMemo(
    () => MUTASHABIHAT_DB.filter((m) => m.surahId === batchSurahId),
    [batchSurahId]
  );

  const openCreateCircleModal = () => {
    setEditingCircleId(undefined);
    setCircleName('');
    setCircleTeacher(settings.teacherName);
    setCircleLevel('متوسط');
    setCircleDays([0, 2, 4]);
    setCircleTime('17:00');
    setCircleDuration(45);
    setCircleDesc('');
    setSelectedStudentIdsForCircle([]);
    setCircleModalOpen(true);
  };

  const openEditCircleModal = (circle: CircleGroup) => {
    setEditingCircleId(circle.id);
    setCircleName(circle.name);
    setCircleTeacher(circle.teacherName || settings.teacherName);
    setCircleLevel(circle.level);
    setCircleDays(circle.scheduleDays.length > 0 ? circle.scheduleDays : [0, 2, 4]);
    setCircleTime(circle.scheduleTime);
    setCircleDuration(circle.duration || 45);
    setCircleDesc(circle.description);
    setSelectedStudentIdsForCircle(
      students.filter((s) => s.circle === circle.name).map((s) => s.id)
    );
    setCircleModalOpen(true);
  };

  const handleToggleCircleDay = (dayIdx: number) => {
    setCircleDays((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleToggleStudentInModal = (studentId: string) => {
    setSelectedStudentIdsForCircle((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveCircleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circleName.trim()) return;
    saveCircle(
      {
        id: editingCircleId,
        name: circleName.trim(),
        teacherName: circleTeacher.trim() || settings.teacherName,
        level: circleLevel,
        scheduleDays: circleDays.length > 0 ? circleDays : [0, 2, 4],
        scheduleTime: circleTime,
        duration: Number(circleDuration) || 45,
        description: circleDesc.trim() || 'حلقة تحفيظ وتثبيت قرآني.',
      },
      selectedStudentIdsForCircle
    );
    setSelectedCircleName(circleName.trim());
    setCircleModalOpen(false);
  };

  const handleAutoDistributeByLevel = () => {
    students.forEach((st) => {
      const matchingCircle =
        circles.find((c) => c.level === st.level) || circles[0];
      if (matchingCircle && st.circle !== matchingCircle.name) {
        assignStudentToCircle(st.id, matchingCircle.name);
      }
    });
    showToast(
      'تم توزيع الطلاب تلقائياً على الحلقات الموافقة لمستوياتهم (مبتدئ / متوسط / متقدم)',
      'success'
    );
  };

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    const existing = sessions.find(
      (s) => s.studentId === studentId && s.date === attendanceDate
    );
    const st = students.find((x) => x.id === studentId);
    saveSession({
      id: existing?.id,
      studentId,
      date: attendanceDate,
      status,
      masteryScore: status === 'حضر' ? existing?.masteryScore || 92 : 0,
      previousEvaluation: existing?.previousEvaluation || { newGrade: 'ممتاز' },
      errors: existing?.errors || [],
      newMemorization:
        existing?.newMemorization ||
        (st
          ? {
              enabled: true,
              surahId: st.currentStop.surahId,
              surahName: st.currentStop.surahName,
              isFullSurah: false,
              fromAyah: st.currentStop.ayah,
              toAyah: st.currentStop.ayah + 10,
              direction: 'asc',
            }
          : undefined),
      juzReview: existing?.juzReview || { enabled: false, items: [], direction: 'desc' },
      surahReview: existing?.surahReview || {
        enabled: false,
        surahNames: [],
        direction: 'desc',
      },
      parentNotes:
        status === 'حضر'
          ? 'تم تسجيل الحضور في كشف الحلقة اليومي.'
          : 'غاب الطالب؛ تم ترحيل التكليف تلقائياً.',
    });
  };

  const handleMarkAllPresent = () => {
    circleStudents.forEach((st) => handleMarkAttendance(st.id, 'حضر'));
    showToast(`تم تسجيل حضور جميع طلاب ${effectiveCircleName}`, 'success');
  };

  const handleSaveGroupRecitation = () => {
    const surahMeta = SURAHS.find((s) => s.id === batchSurahId) || SURAHS[0];
    circleStudents.forEach((st) => {
      const grade = batchGrades[st.id] || 'ممتاز';
      const score =
        grade === 'ممتاز'
          ? 96
          : grade === 'جيد جداً'
          ? 88
          : grade === 'جيد'
          ? 78
          : 65;

      saveSession({
        studentId: st.id,
        date: attendanceDate,
        status: 'حضر',
        masteryScore: score,
        previousEvaluation: { newGrade: grade },
        errors: [],
        newMemorization: {
          enabled: true,
          surahId: surahMeta.id,
          surahName: surahMeta.name,
          isFullSurah: false,
          fromAyah: batchFromAyah,
          toAyah: batchToAyah,
          direction: 'asc',
          grade,
        },
        juzReview: { enabled: false, items: [], direction: 'desc' },
        surahReview: { enabled: false, surahNames: [], direction: 'desc' },
        parentNotes: `تسميع جماعي في ${effectiveCircleName}: سورة ${surahMeta.name} (${batchFromAyah}-${batchToAyah}) بتقدير ${grade}.`,
      });
    });
    showToast('تم حفظ نتائج التسميع الجماعي لجميع طلاب الحلقة بنجاح', 'success');
  };

  const filteredDistributionStudents = useMemo(() => {
    if (distLevelFilter === 'الكل') return students;
    return students.filter((s) => s.level === distLevelFilter);
  }, [students, distLevelFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Circle Selector */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>أدوات المعلم الميداني في المسجد والدار وإدارة الحلقات</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            وضع الحلقة الجماعية السريع (&lt;15 ثانية)، التسميع بالأقران، عداد الختمات ولوحة شرف فرسان القرآن، وتوزيع المجموعات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={effectiveCircleName}
            onChange={(e) => setSelectedCircleName(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold"
          >
            {circles.map((c) => {
              const count = students.filter((s) => s.circle === c.name).length;
              return (
                <option key={c.id} value={c.name}>
                  {c.name} ({count} طلاب)
                </option>
              );
            })}
          </select>

          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
          />

          <button
            type="button"
            onClick={openCreateCircleModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#dfbd69]" />
            <span>إنشاء حلقة / مجموعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Active Seasonal / Substitute Status Banner */}
      {activeCircleObj &&
        (activeCircleObj.substituteActive ||
          (activeCircleObj.seasonalMode && activeCircleObj.seasonalMode !== 'عادي')) && (
          <div className="rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white p-4 border border-[#c59b27]/60 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {activeCircleObj.substituteActive && (
                <span className="px-3 py-1 rounded-xl bg-amber-400 text-[#14281d] font-extrabold">
                  🔄 المعلم البديل النشط: {activeCircleObj.substituteTeacherName || 'معلم مناوب'}
                </span>
              )}
              {activeCircleObj.seasonalMode &&
                activeCircleObj.seasonalMode !== 'عادي' && (
                  <span className="px-3 py-1 rounded-xl bg-white/15 border border-[#dfbd69]/50 text-[#dfbd69] font-extrabold">
                    🌙 وضع الموسم النشط: {activeCircleObj.seasonalMode} (مع الحفاظ التام على خطة كل طالب الأصلية)
                  </span>
                )}
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('substituteAndSeasons')}
              className="px-3.5 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold cursor-pointer"
            >
              عرض بطاقة تسليم الحلقة وإعدادات الموسم ←
            </button>
          </div>
        )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'mosqueRapidQueue', label: '⚡ وضع الحلقة السريع (صف انتظار المسجد)' },
          {
            id: 'substituteAndSeasons',
            label: '🔄 المعلم البديل وبطاقة التسليم والمواسم المكثفة',
          },
          { id: 'peerRecitation', label: '🤝 التسميع بالأقران (الثنائيات)' },
          { id: 'gamification', label: '🏆 فرسان القرآن وعداد الختمة الجماعية' },
          { id: 'attendance', label: 'كشف الحضور اليومي' },
          { id: 'distribution', label: 'إدارة الحلقات وتوزيع الطلاب' },
          { id: 'groupRecitation', label: 'التسميع الجماعي والمتشابهات' },
          { id: 'discipline', label: 'متابعة الانضباط' },
          { id: 'schedules', label: 'جداول الحلقات' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSubTab(t.id as typeof activeSubTab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === t.id
                ? 'bg-[#145a3a] text-white shadow-xs'
                : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* NEW Tab: Substitute Teacher Handover Card & Seasonal Intensive Modes */}
      {activeSubTab === 'substituteAndSeasons' && activeCircleObj && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 cols: Substitute Assignment & Seasonal Mode Selector */}
            <div className="lg:col-span-5 space-y-5">
              {/* Substitute Teacher Assignment Box */}
              <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      🔄 نظام «المعلم البديل» للحلقة
                    </h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      تكليف معلم بديل مؤقت عند غياب الشيخ مع توليد بطاقة تسليم فورية
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      activeCircleObj.substituteActive
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-emerald-950'
                    }`}
                  >
                    {activeCircleObj.substituteActive ? 'مُفعّل حالياً' : 'غير مفعل'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      اسم المعلم البديل المكلف بالحلقة
                    </label>
                    <input
                      type="text"
                      value={subTeacherInput}
                      onChange={(e) => setSubTeacherInput(e.target.value)}
                      placeholder="مثال: الشيخ عبد الرحمن محمود (معلم مناوب)"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">
                      توجيهات الشيخ للمعلم البديل (تظهر في بطاقة التسليم)
                    </label>
                    <textarea
                      rows={2}
                      value={subNotesInput}
                      onChange={(e) => setSubNotesInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateCircleSubstituteAndSeason(activeCircleObj.id, {
                          substituteTeacherName:
                            subTeacherInput.trim() || 'الشيخ المناوب بالحلقة',
                          substituteActive: true,
                          substituteHandoverNotes: subNotesInput.trim(),
                        })
                      }
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                    >
                      ✅ تفعيل المعلم البديل وتوليد بطاقة التسليم
                    </button>
                    {activeCircleObj.substituteActive && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCircleSubstituteAndSeason(activeCircleObj.id, {
                            substituteActive: false,
                          })
                        }
                        className="py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-extrabold cursor-pointer"
                      >
                        إنهاء التكليف
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Seasonal & Intensive Modes Box */}
              <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    🌙 أوضاع المواسم والدورات المكثفة
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    تبديل الحلقة لوضع موسمي مؤقت (رمضان / الصيف / عشر ذي الحجة) دون المساس بخطة الطالب الأصلية
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {SEASONAL_PROGRAM_PRESETS.map((preset) => {
                    const isSelected =
                      (activeCircleObj.seasonalMode || 'عادي') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          updateCircleSubstituteAndSeason(activeCircleObj.id, {
                            seasonalMode: preset.id as SeasonalModeType,
                            seasonalTargetLabel:
                              customSeasonGoalInput.trim() || preset.dailyTargetRecommendation,
                          })
                        }
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#145a3a] text-white border-[#145a3a] shadow-xs'
                            : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold">{preset.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isSelected
                                ? 'bg-[#c59b27] text-[#14281d]'
                                : 'bg-white dark:bg-[#12231a] text-[#145a3a] dark:text-[#dfbd69]'
                            }`}
                          >
                            {preset.badge}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] mt-1 ${
                            isSelected ? 'text-emerald-100' : 'text-neutral-500'
                          }`}
                        >
                          {preset.description}
                        </p>
                        <div
                          className={`text-[10px] font-bold mt-1 ${
                            isSelected ? 'text-[#dfbd69]' : 'text-[#145a3a] dark:text-[#dfbd69]'
                          }`}
                        >
                          🎯 المقرر المقترح: {preset.dailyTargetRecommendation}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 7 cols: Instant Substitute Handover Card (بطاقة تسليم الحلقة السريعة) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-[#fcfaf2] dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/60 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#c59b27]/30">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold mb-1">
                      <span>بطاقة تسليم الحلقة الفورية (Substitute Handover Card)</span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                      {effectiveCircleName} — المعلم الأصلي: {activeCircleObj.teacherName}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      المعلم البديل:{' '}
                      <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                        {activeCircleObj.substituteTeacherName || subTeacherInput || 'غير محدد بعد'}
                      </strong>{' '}
                      • وضع الحلقة:{' '}
                      <strong className="text-amber-700 dark:text-amber-300">
                        {activeCircleObj.seasonalMode || 'عادي'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={buildWhatsAppUrl(
                        OFFICIAL_ACADEMY_WHATSAPP,
                        `📋 *بطاقة تسليم حلقة (${effectiveCircleName}) للمعلم البديل*\n• المعلم الأصلي: ${activeCircleObj.teacherName}\n• المعلم البديل: ${
                          activeCircleObj.substituteTeacherName || subTeacherInput || 'معلم مناوب'
                        }\n• وضع الموسم: ${activeCircleObj.seasonalMode || 'عادي'}\n• توجيهات الحلقة: ${subNotesInput}\n\n*بيان مواضع توقف الطلاب وأخطاء المتابعة المفتوحة:*\n${circleStudents
                          .map((st, idx) => {
                            const stErrs = sessions
                              .filter((s) => s.studentId === st.id)
                              .flatMap((s) => s.errors || [])
                              .slice(0, 2);
                            const errSummary =
                              stErrs.length > 0
                                ? stErrs
                                    .map((e) => `${e.type}${e.word ? ` (${e.word})` : ''}`)
                                    .join(' + ')
                                : 'لا توجد أخطاء متابعة مفتوحة';
                            return `${idx + 1}. *${st.name}* — توقف: سورة ${
                              st.currentStop.surahName
                            } آية ${st.currentStop.ayah} | أخطاء المتابعة: ${errSummary} | ملاحظة: ${
                              st.notes || 'منتظم'
                            }`;
                          })
                          .join('\n')}\n\n📞 واتساب الأكاديمية الرسمي: ${OFFICIAL_ACADEMY_WHATSAPP}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                    >
                      📲 إرسال بطاقة التسليم عبر واتساب
                    </a>
                  </div>
                </div>

                {subNotesInput && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 text-xs text-amber-900 dark:text-amber-200">
                    <strong>📌 توجيهات الشيخ للمعلم البديل:</strong> {subNotesInput}
                  </div>
                )}

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {circleStudents.map((st, idx) => {
                    const stSessions = sessions
                      .filter((s) => s.studentId === st.id)
                      .sort((a, b) => b.date.localeCompare(a.date));
                    const openErrors = stSessions
                      .flatMap((s) => s.errors || [])
                      .slice(0, 3);

                    return (
                      <div
                        key={st.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#145a3a] text-[#dfbd69] text-xs font-mono font-extrabold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-extrabold text-[#14281d] dark:text-white">
                              {st.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-extrabold">
                              خطة أصلية: {st.plan} ({st.level})
                            </span>
                          </div>

                          <div className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
                            📍 أين توقف الطالب: سورة {st.currentStop.surahName} — الآية{' '}
                            {st.currentStop.ayah} (الجزء {st.currentStop.juzNumber}) • الربط:{' '}
                            {st.linkLogic}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="font-bold text-neutral-500">
                              أخطاء المتابعة المفتوحة:
                            </span>
                            {openErrors.length > 0 ? (
                              openErrors.map((err) => (
                                <span
                                  key={err.id}
                                  className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-bold"
                                >
                                  {err.type}
                                  {err.word ? ` ﴿${err.word}﴾` : ''}
                                  {err.surah ? ` (${err.surah}:${err.ayah || ''})` : ''}
                                </span>
                              ))
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                ✓ لا توجد أخطاء متراكمة
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-neutral-500">
                            💡 <strong>ملاحظات التعامل التربوي:</strong>{' '}
                            {st.notes || 'يحب التشجيع الصوتي والبدء بمراجعة آخر آيتين.'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setActiveTab('session');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer shrink-0"
                        >
                          بدء الحصة كمعلم بديل ←
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW Tab A: Rapid Circle Queue & Multi-Student Grid (وضع الحلقة الجماعية السريع في المسجد) */}
      {activeSubTab === 'mosqueRapidQueue' && (
        <div className="space-y-5">
          {/* Queue Summary Bar */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                  شبكة التسميع الميداني السريع — {effectiveCircleName}
                </h3>
                <p className="text-xs text-neutral-500">
                  سجّل تسميع الطالب وانتقل للتالي في أقل من 15 ثانية بضغطة زر واحدة مع متابعة صف الانتظار الذكي
                </p>
              </div>
            </div>

            {/* Smart Queue Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  id: 'all',
                  label: `الكل (${circleStudents.length})`,
                  badgeClass: 'bg-neutral-100 dark:bg-emerald-950 text-neutral-700 dark:text-neutral-200',
                },
                {
                  id: 'waiting',
                  label: `ينتظر التسميع (${
                    circleStudents.filter((s) => studentQueueStatusMap[s.id] === 'waiting').length
                  })`,
                  badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
                },
                {
                  id: 'completed',
                  label: `سَمّع وأتقن (${
                    circleStudents.filter((s) => studentQueueStatusMap[s.id] === 'completed').length
                  })`,
                  badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
                },
                {
                  id: 'retry',
                  label: `يعيد التسميع (${
                    circleStudents.filter((s) => studentQueueStatusMap[s.id] === 'retry').length
                  })`,
                  badgeClass: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300',
                },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setQueueFilter(flt.id as typeof queueFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    queueFilter === flt.id
                      ? 'bg-[#145a3a] text-white border-[#145a3a]'
                      : `${flt.badgeClass} border-neutral-200 dark:border-emerald-900/50`
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Student Rapid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circleStudents
              .filter(
                (st) =>
                  queueFilter === 'all' || studentQueueStatusMap[st.id] === queueFilter
              )
              .map((st, idx) => {
                const qStatus = studentQueueStatusMap[st.id];
                const todaySes = sessions.find(
                  (s) => s.studentId === st.id && s.date === attendanceDate
                );
                const surahAlerts = MUTASHABIHAT_DB.filter(
                  (m) => m.surahId === st.currentStop.surahId
                );

                return (
                  <div
                    key={st.id}
                    className={`rounded-3xl bg-white dark:bg-[#12231a] p-5 border transition-all flex flex-col justify-between gap-4 shadow-xs ${
                      qStatus === 'completed'
                        ? 'border-emerald-500/60 dark:border-emerald-700'
                        : qStatus === 'retry'
                        ? 'border-red-400/70 dark:border-red-800'
                        : 'border-neutral-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] font-mono text-xs font-extrabold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                              {st.name}
                            </h4>
                            <span className="text-[11px] text-neutral-500">
                              المستوى: {st.level} · المحفوظ: {st.memorizedJuz.length} جزء
                            </span>
                          </div>
                        </div>

                        {/* Queue Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                            qStatus === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : qStatus === 'retry'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {qStatus === 'completed'
                            ? '✓ سَمّع'
                            : qStatus === 'retry'
                            ? '↻ يعيد التسميع'
                            : '⏳ ينتظر'}
                        </span>
                      </div>

                      {/* Current Stop & Quick Open in Session Engine / Smart Board */}
                      <div className="p-3 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-500 font-bold">موضع التسميع الحالي:</span>
                          <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            سورة {st.currentStop.surahName} (آية {st.currentStop.ayah})
                          </span>
                        </div>
                        {todaySes && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                            <span>تقييم اليوم المسجل:</span>
                            <span>
                              {todaySes.previousEvaluation?.newGrade || 'ممتاز'} ({todaySes.masteryScore}%)
                            </span>
                          </div>
                        )}
                        {surahAlerts.length > 0 && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 pt-1 border-t border-neutral-200/60 dark:border-emerald-900/40">
                            <Sparkles className="w-3 h-3 shrink-0 text-[#c59b27]" />
                            <span>
                              متشابهات السورة: آية ({surahAlerts[0].ayahNumber}) مع {surahAlerts[0].similarSurahName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 1-Click <15s Grading Buttons */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-neutral-400">
                        رصد سريع بضغطة واحدة (&lt;15 ثانية):
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleRapidMosqueRecitation(st.id, 'ممتاز', 'completed')
                          }
                          className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold cursor-pointer transition-colors"
                        >
                          ✓ ممتاز
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRapidMosqueRecitation(st.id, 'جيد جداً', 'completed')
                          }
                          className="py-2 px-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold cursor-pointer transition-colors"
                        >
                          ✓ جيد جداً
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRapidMosqueRecitation(st.id, 'إعادة', 'retry')
                          }
                          className="py-2 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold cursor-pointer transition-colors"
                        >
                          ↻ يعيد التسميع
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setActiveTab('smartboard');
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900 text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                        >
                          فتح في سبورة الإمام
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setActiveTab('session');
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        >
                          محرك الحصة التفصيلي
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* NEW Tab B: Peer-to-Peer Recitation (وضع التسميع بالأقران - الثنائيات) */}
      {activeSubTab === 'peerRecitation' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                <span>توزيع التسميع بالأقران (Peer-to-Peer Recitation) — {effectiveCircleName}</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                توزيع طلاب الحلقة الحاضرين في ثنائيات للتسميع المتبادل والمراجعة قبل العرض على الشيخ بضغطة زر
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pairingStrategy}
                onChange={(e) =>
                  setPairingStrategy(e.target.value as 'mentor' | 'sameLevel')
                }
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value="mentor">إقران مؤاخاة (متقدم مع مبتدئ/متوسط)</option>
                <option value="sameLevel">إقران متماثل (نفس المستوى الدراسي)</option>
              </select>

              <button
                type="button"
                onClick={handleGeneratePeerPairs}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>توليد ثنائيات التسميع الآن</span>
              </button>
            </div>
          </div>

          {peerPairs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peerPairs.map((pair, idx) => {
                const stA = students.find((s) => s.id === pair.studentAId);
                const stB = students.find((s) => s.id === pair.studentBId);
                if (!stA) return null;

                return (
                  <div
                    key={pair.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      pair.completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border-neutral-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
                        الثنائية #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-500">
                        مقرر المراجعة المشترك: سورة {pair.focusSurah}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                        <div className="text-[10px] font-bold text-[#c59b27]">الطالب الأول (مُسمِّع)</div>
                        <div className="text-sm font-extrabold mt-0.5">{stA.name}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {stA.level} · سورة {stA.currentStop.surahName} ({stA.currentStop.ayah})
                        </div>
                      </div>

                      {stB ? (
                        <div className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50">
                          <div className="text-[10px] font-bold text-emerald-600">الطالب الثاني (مُراجع)</div>
                          <div className="text-sm font-extrabold mt-0.5">{stB.name}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {stB.level} · سورة {stB.currentStop.surahName} ({stB.currentStop.ayah})
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-dashed border-amber-300 text-xs font-bold text-amber-800 dark:text-amber-300">
                          طالب منفرد — يُراجع مباشرة مع المعلم أو عريف الحلقة
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-emerald-900/40">
                      <span className="text-[11px] text-neutral-500">
                        {pair.completed
                          ? '✓ أتمّا التسميع المتبادل وجاهزان للعرض على الشيخ'
                          : 'جارٍ التسميع المتبادل وتصحيح الأخطاء بين الطالبين...'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPeerPairs((prev) =>
                            prev.map((p) =>
                              p.id === pair.id ? { ...p, completed: !p.completed } : p
                            )
                          );
                          if (!pair.completed) {
                            showToast('تم اعتماد إتمام المراجعة الثنائية؛ الطالبان جاهزان للتسميع', 'success');
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                          pair.completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#145a3a] text-white hover:bg-[#0f452c]'
                        }`}
                      >
                        {pair.completed ? '✓ جاهزان للشيخ' : 'اعتماد إتمام المراجعة الثنائية'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center rounded-2xl bg-[#f6f7f2]/50 dark:bg-[#0b1711]/50 border border-dashed border-neutral-300 dark:border-emerald-900 space-y-3">
              <Users className="w-8 h-8 text-[#c59b27] mx-auto" />
              <div className="text-sm font-extrabold">
                اضغط على «توليد ثنائيات التسميع الآن» لتوزيع طلاب {effectiveCircleName} ({circleStudents.length} طلاب)
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                يقوم النظام بتوزيع الطلاب تلقائياً إلى ثنائيات متوازنة ليسمّع كل طالب لزميله قبل العرض على المعلم، مما يضاعف إنتاجية الحلقة في المسجد.
              </p>
              <button
                type="button"
                onClick={handleGeneratePeerPairs}
                className="px-5 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                توزيع الطلاب في ثنائيات الآن
              </button>
            </div>
          )}
        </div>
      )}

      {/* NEW Tab C: Gamification, Collective Khatmah Countdown & Honor Roll Leaderboard */}
      {activeSubTab === 'gamification' && (
        <div className="space-y-6">
          {/* Collective Circle Khatmah Progress & Countdown Card */}
          <div className="rounded-3xl bg-gradient-to-l from-[#145a3a] to-[#0f3d27] text-white p-6 shadow-md border border-[#c59b27]/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c59b27] text-[#14281d] text-xs font-extrabold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>عداد الختمة الجماعية للحلقة</span>
                </span>
                <h3 className="text-xl font-extrabold mt-2">
                  مسيرة ختم القرآن الكريم في «{effectiveCircleName}»
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  مجموع الأجزاء المحفوظة والمثبتة لطلاب الحلقة: {collectiveKhatmahStats.totalJuzSum} جزءاً ({collectiveKhatmahStats.completedKhatmahCount} ختمة مكتملة + {collectiveKhatmahStats.currentKhatmahJuz} جزءاً في الختمة الحالية)
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
                <Clock className="w-6 h-6 text-[#dfbd69]" />
                <div>
                  <div className="text-[11px] text-emerald-100">العد التنازلي للختمة الجماعية</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-extrabold font-mono text-[#dfbd69]">
                      متبقي {collectiveKhatmahStats.remainingJuz} جزءاً ({khatmahTargetDays} يوماً)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setKhatmahTargetDays((d) => (d <= 5 ? 30 : d - 5))
                      }
                      className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold cursor-pointer"
                    >
                      تعديل المدة
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Khatmah Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>نسبة إنجاز الختمة الجماعية الحالية ({collectiveKhatmahStats.currentKhatmahJuz} / 30 جزءاً)</span>
                <span className="font-mono text-[#dfbd69]">{collectiveKhatmahStats.progressPercent}%</span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-black/30 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#dfbd69] to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(8, collectiveKhatmahStats.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Honor Roll Leaderboard (لوحة شرف فرسان القرآن والأوسمة التلقائية) */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-emerald-950">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-[#c59b27]" />
                <div>
                  <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                    لوحة شرف «فرسان القرآن» وأوسمة التميز التلقائية
                  </h3>
                  <p className="text-xs text-neutral-500">
                    تُحتسب النقاط والأوسمة تلقائياً بناءً على الأجزاء المحفوظة، المواظبة على الحضور، ونسب الإتقان
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {circleLeaderboard.map((entry, idx) => (
                <div
                  key={entry.student.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    idx === 0
                      ? 'bg-gradient-to-l from-[#c59b27]/15 to-transparent border-[#c59b27]'
                      : 'bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border-neutral-200 dark:border-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl font-mono text-sm font-extrabold flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-[#c59b27] text-[#14281d]'
                          : idx === 1
                          ? 'bg-[#145a3a] text-white'
                          : idx === 2
                          ? 'bg-emerald-700 text-white'
                          : 'bg-neutral-200 dark:bg-emerald-950 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#14281d] dark:text-white">
                          {entry.student.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] text-[10px] font-extrabold">
                          مستوى {entry.student.level} ({entry.juzCount} جزء)
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        الحصص الحاضرة: {entry.attendedCount} حصص · متوسط الإتقان: {entry.avgMastery}%
                      </div>
                    </div>
                  </div>

                  {/* Automatic Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {entry.badges.map((badge) => (
                      <span
                        key={badge.id}
                        className={`px-2.5 py-1 rounded-xl border border-[#c59b27]/40 text-[11px] font-bold ${badge.colorClass}`}
                      >
                        {badge.icon} {badge.title}
                      </span>
                    ))}
                  </div>

                  {/* Points */}
                  <div className="text-left md:min-w-[110px]">
                    <div className="text-[10px] text-neutral-500 font-bold">نقاط التميز</div>
                    <div className="text-base font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                      {entry.points} نقطة
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Fast Daily Attendance Sheet */}
      {activeSubTab === 'attendance' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h3 className="text-base font-extrabold">
                كشف حضور: {effectiveCircleName} ({circleStudents.length} طلاب)
              </h3>
              <p className="text-xs text-neutral-500">
                تاريخ الكشف:{' '}
                <span className="font-mono tabular-nums">
                  {formatGregorianAndHijri(
                    attendanceDate,
                    settings.showHijriDates ?? true
                  )}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('distribution')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 text-xs font-bold hover:border-[#145a3a] cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#c59b27]" />
                <span>توزيع أو نقل الطلاب</span>
              </button>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تحضير جميع طلاب الحلقة بضغطة واحدة</span>
              </button>
            </div>
          </div>

          {circleStudents.length > 0 ? (
            <div className="space-y-2.5">
              {circleStudents.map((st) => {
                const ses = sessions.find(
                  (s) => s.studentId === st.id && s.date === attendanceDate
                );
                return (
                  <div
                    key={st.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border border-neutral-200 dark:border-emerald-900/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{st.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-[10px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
                          {st.level} ({st.memorizedJuz.length} جزء)
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        موعده: {st.scheduleTime} · توقف عند: سورة {st.currentStop.surahName} (
                        {st.currentStop.ayah})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(['حضر', 'غاب', 'إجازة'] as AttendanceStatus[]).map((stVal) => (
                        <button
                          key={stVal}
                          type="button"
                          onClick={() => handleMarkAttendance(st.id, stVal)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                            ses?.status === stVal
                              ? stVal === 'حضر'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : stVal === 'غاب'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                              : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900'
                          }`}
                        >
                          {stVal}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[#f6f7f2]/50 dark:bg-[#0b1711]/50 border border-dashed border-neutral-300 dark:border-emerald-900 space-y-2">
              <p className="text-xs font-bold text-neutral-500">
                لا يوجد طلاب مسجلون في هذه الحلقة حالياً.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('distribution')}
                className="px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
              >
                ضم وتوزيع طلاب إلى هذه الحلقة
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Circles Management & Student Sub-group Distribution */}
      {activeSubTab === 'distribution' && (
        <div className="space-y-6">
          {/* Circles Grid with Independent Metrics & Edit/Delete */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circles.map((c) => {
              const cStudents = students.filter((s) => s.circle === c.name);
              const totalJuz = cStudents.reduce(
                (acc, s) => acc + s.memorizedJuz.length,
                0
              );
              const cStudentIds = new Set(cStudents.map((s) => s.id));
              const cSessions = sessions.filter((ses) =>
                cStudentIds.has(ses.studentId)
              );
              const attendedSessions = cSessions.filter((s) => s.status === 'حضر');
              const avgMastery =
                attendedSessions.length > 0
                  ? Math.round(
                      attendedSessions.reduce((acc, s) => acc + s.masteryScore, 0) /
                        attendedSessions.length
                    )
                  : 94;

              return (
                <div
                  key={c.id}
                  className={`rounded-3xl bg-white dark:bg-[#12231a] p-5 border transition-all flex flex-col justify-between gap-4 ${
                    effectiveCircleName === c.name
                      ? 'border-[#145a3a] dark:border-[#dfbd69] shadow-sm'
                      : 'border-neutral-200 dark:border-emerald-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                          المستوى: {c.level}
                        </span>
                        <h3 className="text-base font-extrabold text-[#14281d] dark:text-white mt-1.5">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          المشرف: {c.teacherName} · الموعد: {c.scheduleTime}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCircleModal(c)}
                          title="تعديل الحلقة وتحديد طلابها"
                          className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-neutral-200 dark:hover:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {circles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteCircle(c.id)}
                            title="حذف الحلقة ونقل طلابها"
                            className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Independent Circle Mini Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40">
                        <div className="text-[10px] text-neutral-500 font-bold">الطلاب</div>
                        <div className="text-sm font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                          {cStudents.length}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40">
                        <div className="text-[10px] text-neutral-500 font-bold">الأجزاء</div>
                        <div className="text-sm font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                          {totalJuz} ج
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40">
                        <div className="text-[10px] text-neutral-500 font-bold">الإتقان</div>
                        <div className="text-sm font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {avgMastery}%
                        </div>
                      </div>
                    </div>

                    {/* Assigned Students Pills */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-neutral-500 mb-1.5">
                        طلاب المجموعة ({cStudents.length}):
                      </div>
                      {cStudents.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cStudents.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(st.id);
                                setActiveTab('students');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>{st.name.split(' ').slice(0, 2).join(' ')}</span>
                              <span className="text-[10px] font-mono text-[#c59b27]">
                                ({st.level})
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-400 italic">
                          لم يتم ضم طلاب بعد
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditCircleModal(c)}
                    className="w-full py-2 rounded-xl border border-[#145a3a]/30 dark:border-emerald-800 hover:bg-[#145a3a] hover:text-white text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    إدارة أعضاء الحلقة وتعديل المواعيد
                  </button>
                </div>
              );
            })}

            {/* Add New Circle Card */}
            <button
              type="button"
              onClick={openCreateCircleModal}
              className="rounded-3xl border-2 border-dashed border-neutral-300 dark:border-emerald-900/70 hover:border-[#145a3a] dark:hover:border-[#dfbd69] p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[240px] transition-all cursor-pointer group bg-white/50 dark:bg-[#12231a]/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-[#14281d] dark:text-white">
                  إنشاء حلقة أو مجموعة فرعية جديدة
                </div>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  أضف حلقة جديدة للمبتدئين أو المتقدمين أو مجموعة مراجعة مكثفة وعيّن طلابها فوراً
                </p>
              </div>
            </button>
          </div>

          {/* Interactive Student Distribution Table */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2 text-[#14281d] dark:text-white">
                  <Layers className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                  <span>جدول توزيع ونقل الطلاب السريع بين الحلقات والمجموعات</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  اختر الحلقة المناسبة لكل طالب من القائمة المنسدلة أو استخدم التوزيع الذكي حسب المستوى
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['الكل', 'متقدم', 'متوسط', 'مبتدئ'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDistLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      distLevelFilter === lvl
                        ? 'bg-[#145a3a] text-white border-[#145a3a]'
                        : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                    }`}
                  >
                    {lvl === 'الكل' ? 'جميع المستويات' : `مستوى ${lvl}`}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleAutoDistributeByLevel}
                  className="px-3.5 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توزيع تلقائي حسب المستوى</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-emerald-900 text-xs text-neutral-500">
                    <th className="py-3 px-3">اسم الطالب</th>
                    <th className="py-3 px-3">المستوى</th>
                    <th className="py-3 px-3">خطة الحفظ</th>
                    <th className="py-3 px-3">الأجزاء المحفوظة</th>
                    <th className="py-3 px-3">الحلقة / المجموعة الحالية</th>
                    <th className="py-3 px-3">نقل إلى حلقة أخرى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-emerald-950/60 text-xs">
                  {filteredDistributionStudents.map((st) => (
                    <tr
                      key={st.id}
                      className="hover:bg-[#f6f7f2]/60 dark:hover:bg-[#0b1711]/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-extrabold text-[#14281d] dark:text-white">
                        {st.name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            st.level === 'متقدم'
                              ? 'bg-[#145a3a] text-white'
                              : st.level === 'متوسط'
                              ? 'bg-[#c59b27] text-[#14281d]'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {st.level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300 font-bold">
                        {st.plan}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        {st.memorizedJuz.length} جزء ({st.memorizedSurahs.length} سورة)
                      </td>
                      <td className="py-3 px-3 font-bold text-[#145a3a] dark:text-[#dfbd69]">
                        {st.circle}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={st.circle}
                          onChange={(e) =>
                            assignStudentToCircle(st.id, e.target.value)
                          }
                          className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-extrabold cursor-pointer"
                        >
                          {circles.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name} ({c.level})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Group Recitation (التسميع الجماعي) */}
      {activeSubTab === 'groupRecitation' && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
          <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">السورة الموحدة للحلقة</label>
              <select
                value={batchSurahId}
                onChange={(e) => setBatchSurahId(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-bold"
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. سورة {s.name} ({s.ayahs} آية)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">من آية</label>
              <input
                type="number"
                min={1}
                value={batchFromAyah}
                onChange={(e) => setBatchFromAyah(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">إلى آية</label>
              <input
                type="number"
                min={1}
                value={batchToAyah}
                onChange={(e) => setBatchToAyah(Number(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-mono tabular-nums"
              />
            </div>
          </div>

          {batchSurahMutashabihat.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-[#c59b27]/50 space-y-2">
              <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c59b27]" />
                <span>تنبيه متشابهات السورة المختارة (لاختبار ضبط وإتقان طلاب الحلقة):</span>
              </div>
              {batchSurahMutashabihat.map((m) => (
                <div
                  key={m.id}
                  className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed"
                >
                  • آية ({m.ayahNumber}): <strong className="font-quran">«{m.ayahSnippet}»</strong> — تتشابه مع <strong>سورة {m.similarSurahName} ({m.similarAyahNumber})</strong>: {m.dabitRule}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {circleStudents.map((st) => {
              const currentGrade = batchGrades[st.id] || 'ممتاز';
              return (
                <div
                  key={st.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/40"
                >
                  <div className="text-sm font-bold">{st.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['ممتاز', 'جيد جداً', 'جيد', 'ضعيف', 'إعادة'] as GradeType[]).map(
                      (g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setBatchGrades((prev) => ({ ...prev, [st.id]: g }))
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            currentGrade === g
                              ? 'bg-[#145a3a] text-white'
                              : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {g}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSaveGroupRecitation}
            className="w-full py-3.5 rounded-2xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-sm font-extrabold cursor-pointer flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#dfbd69]" />
            <span>اعتماد وحفظ التسميع الجماعي لجميع طلاب الحلقة</span>
          </button>
        </div>
      )}

      {/* Tab 4: Discipline Follow-up */}
      {activeSubTab === 'discipline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>تسجيل تنبيه أو إنذار انضباطي</span>
            </h3>

            <div>
              <label className="block text-xs font-bold mb-1">الطالب</label>
              <select
                value={warnStudentId}
                onChange={(e) => setWarnStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.circle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">درجة الإنذار</label>
              <select
                value={warnLevel}
                onChange={(e) =>
                  setWarnLevel(e.target.value as 'تنبيه' | 'إنذار أول' | 'إنذار نهائي')
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value="تنبيه">تنبيه أولي</option>
                <option value="إنذار أول">إنذار أول</option>
                <option value="إنذار نهائي">إنذار نهائي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">السبب والتوجيه</label>
              <textarea
                rows={3}
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="مثال: تكرار الغياب دون عذر أو عدم إتمام مراجعة المقرر..."
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!warnReason.trim()) return;
                addDisciplineWarning(warnStudentId, warnLevel, warnReason.trim());
                setWarnReason('');
              }}
              className="w-full py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
            >
              حفظ في سجل الانضباط
            </button>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-3">
            <h3 className="text-base font-extrabold">سجل الانضباط الحالي للطلاب</h3>
            {students.flatMap((st) =>
              st.disciplineWarnings.map((w) => ({ ...w, studentName: st.name }))
            ).length > 0 ? (
              students
                .flatMap((st) =>
                  st.disciplineWarnings.map((w) => ({ ...w, studentName: st.name }))
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-extrabold">
                          {item.studentName} —{' '}
                          <span className="text-amber-700 dark:text-amber-400">
                            {item.level}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                          {item.reason}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                      {formatGregorianAndHijri(
                        item.date,
                        settings.showHijriDates ?? true
                      )}
                    </span>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500">
                لا توجد إنذارات مسجلة.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Circle Schedules */}
      {activeSubTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {circles.map((c) => {
            const cStudents = students.filter((s) => s.circle === c.name);
            const totalJuz = cStudents.reduce(
              (acc, s) => acc + s.memorizedJuz.length,
              0
            );
            return (
              <div
                key={c.id}
                className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#c59b27]">
                      المستوى: {c.level}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-neutral-500">
                      {cStudents.length} طلاب · {totalJuz} جزءاً
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-white">
                    {c.name}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {c.description}
                  </p>
                  <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#145a3a]" />
                      <span>
                        الأيام: {c.scheduleDays.map((d) => DAY_NAMES[d]).join('، ')}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums text-neutral-500">
                      الموعد: الساعة {c.scheduleTime} ({c.duration} دقيقة)
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCircleModal(c)}
                    className="flex-1 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:bg-[#145a3a] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    تعديل الجدول والطلاب
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Circle & Assign Students Modal */}
      {circleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>
                  {editingCircleId
                    ? 'تعديل بيانات الحلقة وتوزيع الطلاب'
                    : 'إنشاء حلقة تحفيظ / مجموعة فرعية جديدة'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setCircleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCircleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    اسم الحلقة / المجموعة الفرعية *
                  </label>
                  <input
                    type="text"
                    required
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    placeholder="مثال: حلقة الإمام نافع المدني"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">المعلم المشرف</label>
                  <input
                    type="text"
                    value={circleTeacher}
                    onChange={(e) => setCircleTeacher(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">المستوى المستهدف</label>
                  <select
                    value={circleLevel}
                    onChange={(e) => setCircleLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="مبتدئ">مبتدئ</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">موعد الانعقاد</label>
                  <input
                    type="time"
                    value={circleTime}
                    onChange={(e) => setCircleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">المدة (دقيقة)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={circleDuration}
                    onChange={(e) => setCircleDuration(Number(e.target.value) || 45)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">أيام انعقاد الحلقة</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_NAMES.map((dayName, idx) => {
                    const active = circleDays.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => handleToggleCircleDay(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          active
                            ? 'bg-[#145a3a] text-white border-[#145a3a]'
                            : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">وصف الحلقة ومنهجها</label>
                <textarea
                  rows={2}
                  value={circleDesc}
                  onChange={(e) => setCircleDesc(e.target.value)}
                  placeholder="وصف مختصر لمنهج الحلقة..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>

              {/* Student Selection for Circle Assignment */}
              <div className="pt-2 border-t border-neutral-200 dark:border-emerald-900">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    تحديد وضم الطلاب إلى هذه الحلقة ({selectedStudentIdsForCircle.length} محددين):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const matchingIds = students
                        .filter((s) => s.level === circleLevel)
                        .map((s) => s.id);
                      setSelectedStudentIdsForCircle(matchingIds);
                    }}
                    className="text-[11px] font-bold text-[#c59b27] hover:underline cursor-pointer"
                  >
                    تحديد جميع طلاب مستوى «{circleLevel}»
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60">
                  {students.map((st) => {
                    const checked = selectedStudentIdsForCircle.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-white dark:bg-[#12231a] border-[#145a3a] font-extrabold'
                            : 'border-transparent hover:bg-white/60 dark:hover:bg-[#12231a]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleStudentInModal(st.id)}
                            className="accent-[#145a3a] w-4 h-4"
                          />
                          <div>
                            <div>{st.name}</div>
                            <div className="text-[10px] text-neutral-500">
                              الحالية: {st.circle}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-emerald-950 text-[10px] font-mono">
                          {st.level} · {st.memorizedJuz.length}ج
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                {editingCircleId
                  ? 'حفظ تعديلات الحلقة وتحديث توزيع الطلاب'
                  : 'إنشاء الحلقة وضم الطلاب المحددين'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
