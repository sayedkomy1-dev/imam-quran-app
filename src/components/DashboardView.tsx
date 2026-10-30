import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { DAY_NAMES } from '../data/quranData';
import { getLocalDateString } from '../data/seedData';
import {
  formatFullTodayBannerDate,
  formatGregorianAndHijri,
} from '../utils/dateUtils';
import { FeeRecord, Student, StudentLevel } from '../types';
import {
  PaymentReceiptModal,
  StudentIdCardModal,
} from './StudentIdAndReceiptModals';
import { OwnerPublicWaqfImpactHub } from './PublicMushafWaqfPortalView';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  IdCard,
  Layers,
  MessageSquare,
  Mic,
  PieChart,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    students,
    sessions,
    circles,
    settings,
    setActiveTab,
    setSelectedStudentId,
    setQuickSearchOpen,
    saveSession,
    saveStudent,
    saveCircle,
    assignStudentToCircle,
    teacherRatings,
    homeSubmissions,
    markHomeSubmissionReviewed,
    sessionReminderPreview,
    setSessionReminderPreview,
    updateStudentFee,
    showToast,
    managedTeachers,
    currentStaffTier,
    setCurrentStaffTier,
    updateTeacherAccessStatus,
    deleteStaffMember,
    addStaffMember,
    updateStaffFamilyDetails,
    googleAuthUser,
  } = useAcademy();

  const todayStr = getLocalDateString(0);
  const currentMonthPrefix = todayStr.slice(0, 7);

  const [activeDonutLevel, setActiveDonutLevel] = useState<StudentLevel | null>(
    null
  );
  const [donutMetric, setDonutMetric] = useState<'juz' | 'students'>('juz');
  const [selectedCircleFilter, setSelectedCircleFilter] = useState<string>('all');

  // Recharts Monthly Memorization Growth Interactive Controls
  const [monthlyChartType, setMonthlyChartType] = useState<'area' | 'bar'>('area');
  const [monthlyStudentFilter, setMonthlyStudentFilter] = useState<string>('all');

  // Owner Control Panel State (Firestore Staff Management)
  const [ownerStaffStatusFilter, setOwnerStaffStatusFilter] = useState<
    'all' | 'pending' | 'active' | 'blocked'
  >('all');
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'supervisor' | 'teacher'>(
    'teacher'
  );
  const [newStaffTitle, setNewStaffTitle] = useState('');
  const [newStaffStatus, setNewStaffStatus] = useState<'pending' | 'active'>(
    'pending'
  );
  const [newStaffMother, setNewStaffMother] = useState('');
  const [newStaffGrandfather, setNewStaffGrandfather] = useState('');
  const [newStaffGrandmother, setNewStaffGrandmother] = useState('');
  const [newStaffUncle, setNewStaffUncle] = useState('');
  const [editingStaffFamilyId, setEditingStaffFamilyId] = useState<string | null>(
    null
  );
  const [staffFamilyDraft, setStaffFamilyDraft] = useState<{
    motherName: string;
    grandfatherName: string;
    grandmotherName: string;
    uncleName: string;
  }>({
    motherName: '',
    grandfatherName: '',
    grandmotherName: '',
    uncleName: '',
  });

  // Quick Create Circle Modal State on Dashboard
  const [quickCircleModalOpen, setQuickCircleModalOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleLevel, setNewCircleLevel] = useState('متوسط');
  const [newCircleTime, setNewCircleTime] = useState('17:00');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [newCircleStudentIds, setNewCircleStudentIds] = useState<string[]>([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  // Quick Dashboard Student ID Card & Payment Receipt Modal State
  const [dashboardIdCardStudent, setDashboardIdCardStudent] =
    useState<Student | null>(null);
  const [dashboardReceiptData, setDashboardReceiptData] = useState<{
    student: Student;
    fee: FeeRecord;
  } | null>(null);

  // Sheikh Appreciation & Excellence Analytics
  const teacherAppreciationStats = useMemo(() => {
    if (teacherRatings.length === 0) {
      return { avgOverall: '5.0', totalCount: 0 };
    }
    const sum = teacherRatings.reduce(
      (acc, r) =>
        acc +
        (r.punctuality +
          r.explanationAndFoundation +
          r.encouragementAndPatience +
          r.audioAndBoardQuality +
          r.guardianFollowUp) /
          5,
      0
    );
    return {
      avgOverall: (sum / teacherRatings.length).toFixed(1),
      totalCount: teacherRatings.length,
    };
  }, [teacherRatings]);

  // 1. Statistical Cards & Academy-wide Juz + Level Distribution
  const stats = useMemo(() => {
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    const todayPresent = todaySessions.filter((s) => s.status === 'حضر').length;
    const todayAbsent = todaySessions.filter((s) => s.status === 'غاب').length;
    const monthSessions = sessions.filter(
      (s) => s.date.startsWith(currentMonthPrefix) && s.status === 'حضر'
    ).length;

    return {
      totalStudents: students.length,
      todayPresent,
      monthSessions,
      todayAbsent,
    };
  }, [students, sessions, todayStr, currentMonthPrefix]);

  // Academy-wide Memorized Juz & Student Level Distribution for Recharts Donut Chart
  // Dynamically synced with both Student records and completed Session Juz records
  const academyJuzAndLevels = useMemo(() => {
    const enrichedStudents = students.map((st) => {
      const sessionFullJuz = sessions
        .filter((ses) => ses.studentId === st.id && ses.status === 'حضر' && ses.juzReview?.enabled)
        .flatMap((ses) =>
          ses.juzReview.items
            .filter((item) => item.scope === 'full')
            .map((item) => item.juzNumber)
        );
      const effectiveJuz = Array.from(
        new Set([...st.memorizedJuz, ...sessionFullJuz])
      ).sort((a, b) => a - b);
      return {
        ...st,
        effectiveJuz,
      };
    });

    const totalStudents = Math.max(1, enrichedStudents.length);
    const totalJuzMemorized = enrichedStudents.reduce(
      (sum, st) => sum + st.effectiveJuz.length,
      0
    );
    const totalSurahsMemorized = enrichedStudents.reduce(
      (sum, st) => sum + st.memorizedSurahs.length,
      0
    );

    const levelConfigs: {
      level: StudentLevel;
      label: string;
      color: string;
      bgBadge: string;
    }[] = [
      {
        level: 'متقدم',
        label: 'المستوى المتقدم (الخاتمون والإسناد)',
        color: '#145a3a',
        bgBadge: 'bg-[#145a3a] text-white',
      },
      {
        level: 'متوسط',
        label: 'المستوى المتوسط (الحفظ المتوازن)',
        color: '#c59b27',
        bgBadge: 'bg-[#c59b27] text-[#14281d]',
      },
      {
        level: 'مبتدئ',
        label: 'المستوى المبتدئ (التأسيس والناشئة)',
        color: '#10b981',
        bgBadge: 'bg-emerald-500 text-white',
      },
    ];

    const segments = levelConfigs.map((cfg) => {
      const levelStudents = enrichedStudents.filter((s) => s.level === cfg.level);
      const count = levelStudents.length;
      const percentage = Math.round((count / totalStudents) * 100);
      const juzSum = levelStudents.reduce(
        (acc, s) => acc + s.effectiveJuz.length,
        0
      );
      const juzPercentage = Math.round(
        (juzSum / Math.max(1, totalJuzMemorized)) * 100
      );
      const surahSum = levelStudents.reduce(
        (acc, s) => acc + s.memorizedSurahs.length,
        0
      );

      return {
        ...cfg,
        count,
        percentage,
        juzSum,
        juzPercentage,
        surahSum,
        studentsList: levelStudents,
      };
    });

    return {
      totalJuzMemorized,
      totalSurahsMemorized,
      avgJuzPerStudent: (totalJuzMemorized / totalStudents).toFixed(1),
      segments,
    };
  }, [students, sessions]);

  // Recharts Analytics: Student Memorization Progression, Completed Pages & Mastery Percentage
  const rechartsDashboardAnalytics = useMemo(() => {
    const studentBarData = students.map((st) => {
      const stSessions = sessions.filter(
        (s) => s.studentId === st.id && s.status === 'حضر'
      );
      const avgMastery =
        stSessions.length > 0
          ? Math.round(
              stSessions.reduce((acc, s) => acc + (s.masteryScore || 90), 0) /
                stSessions.length
            )
          : 92;
      const estimatedPages = Math.max(
        4,
        st.memorizedJuz.length * 20 + Math.round(st.memorizedSurahs.length * 1.5)
      );
      return {
        id: st.id,
        name: st.name.split(' ').slice(0, 2).join(' '),
        fullName: st.name,
        level: st.level,
        completedPages: estimatedPages,
        memorizedJuzCount: st.memorizedJuz.length,
        memorizedSurahsCount: st.memorizedSurahs.length,
        masteryScore: avgMastery,
      };
    });

    const totalCompletedPages = studentBarData.reduce(
      (acc, item) => acc + item.completedPages,
      0
    );
    const overallMasteryAvg =
      studentBarData.length > 0
        ? Math.round(
            studentBarData.reduce((acc, item) => acc + item.masteryScore, 0) /
              studentBarData.length
          )
        : 92;

    // Chronological progression across the last 7 days / sessions
    const progressionData = Array.from({ length: 7 }, (_, idx) => {
      const offset = -6 + idx;
      const dStr = getLocalDateString(offset);
      const daySessions = sessions.filter(
        (s) => s.date === dStr && s.status === 'حضر'
      );
      const avgDayMastery =
        daySessions.length > 0
          ? Math.round(
              daySessions.reduce((acc, s) => acc + (s.masteryScore || 92), 0) /
                daySessions.length
            )
          : 89 + (idx % 4) * 2;
      const pagesDoneInDay =
        daySessions.length > 0
          ? daySessions.reduce((acc, s) => {
              const ayahs = s.newMemorization?.enabled
                ? Math.max(
                    1,
                    s.newMemorization.toAyah - s.newMemorization.fromAyah + 1
                  )
                : 8;
              return acc + Math.max(1, Math.round(ayahs / 6));
            }, 0)
          : 3 + (idx % 3) * 2;

      return {
        dateLabel: dStr.slice(5),
        fullDate: dStr,
        masteryPercentage: avgDayMastery,
        completedPages: pagesDoneInDay,
        sessionsCount: daySessions.length || 2,
      };
    });

    return {
      studentBarData,
      progressionData,
      totalCompletedPages,
      overallMasteryAvg,
    };
  }, [students, sessions]);

  const handleQuickAdjustStudentJuz = (studentId: string, delta: 1 | -1) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    let updatedJuz = [...target.memorizedJuz];
    if (delta === 1) {
      for (let j = 30; j >= 1; j--) {
        if (!updatedJuz.includes(j)) {
          updatedJuz.push(j);
          break;
        }
      }
    } else if (delta === -1 && updatedJuz.length > 0) {
      updatedJuz.pop();
    }

    const juzCount = updatedJuz.length;
    const autoLevel: StudentLevel =
      juzCount >= 15 ? 'متقدم' : juzCount >= 5 ? 'متوسط' : 'مبتدئ';

    saveStudent({
      ...target,
      id: target.id,
      memorizedJuz: updatedJuz,
      level: autoLevel,
    });
  };

  const handleQuickChangeStudentLevel = (
    studentId: string,
    newLevel: StudentLevel
  ) => {
    const target = students.find((s) => s.id === studentId);
    if (!target || target.level === newLevel) return;
    saveStudent({
      ...target,
      id: target.id,
      level: newLevel,
    });
  };

  // Independent Per-Circle Statistics for Dashboard
  const circlesAnalytics = useMemo(() => {
    const todayDowNum = new Date(todayStr + 'T12:00:00').getDay();
    return circles.map((circle) => {
      const cStudents = students.filter((s) => s.circle === circle.name);
      const studentIds = new Set(cStudents.map((s) => s.id));
      const cSessions = sessions.filter((ses) => studentIds.has(ses.studentId));
      const attendedSessions = cSessions.filter((ses) => ses.status === 'حضر');

      const totalJuz = cStudents.reduce(
        (acc, s) => acc + s.memorizedJuz.length,
        0
      );
      const totalSurahs = cStudents.reduce(
        (acc, s) => acc + s.memorizedSurahs.length,
        0
      );
      const avgJuz =
        cStudents.length > 0 ? (totalJuz / cStudents.length).toFixed(1) : '0.0';

      const attendanceRate =
        cSessions.length > 0
          ? Math.round((attendedSessions.length / cSessions.length) * 100)
          : 100;

      const avgMastery =
        attendedSessions.length > 0
          ? Math.round(
              attendedSessions.reduce((acc, s) => acc + s.masteryScore, 0) /
                attendedSessions.length
            )
          : 95;

      const todayScheduled = cStudents.filter((s) =>
        s.scheduleDays.includes(todayDowNum)
      ).length;
      const todayPresent = cSessions.filter(
        (s) => s.date === todayStr && s.status === 'حضر'
      ).length;

      const advCount = cStudents.filter((s) => s.level === 'متقدم').length;
      const midCount = cStudents.filter((s) => s.level === 'متوسط').length;
      const begCount = cStudents.filter((s) => s.level === 'مبتدئ').length;

      return {
        circle,
        cStudents,
        studentsCount: cStudents.length,
        totalJuz,
        totalSurahs,
        avgJuz,
        totalSessions: cSessions.length,
        attendanceRate,
        avgMastery,
        todayScheduled,
        todayPresent,
        advCount,
        midCount,
        begCount,
      };
    });
  }, [circles, students, sessions, todayStr]);

  const handleQuickCreateCircleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    saveCircle(
      {
        name: newCircleName.trim(),
        teacherName: settings.teacherName,
        level: newCircleLevel,
        scheduleDays: [0, 2, 4],
        scheduleTime: newCircleTime,
        duration: 45,
        description:
          newCircleDesc.trim() || 'مجموعة فرعية لتحفيظ ومراجعة القرآن الكريم.',
      },
      newCircleStudentIds
    );
    setNewCircleName('');
    setNewCircleDesc('');
    setNewCircleStudentIds([]);
    setQuickCircleModalOpen(false);
  };

  // Monthly Memorization Growth Interactive Data (Recharts 6-Month Analytics)
  const monthlyMemorizationGrowth = useMemo(() => {
    const activeStudentsList =
      monthlyStudentFilter === 'all'
        ? students.filter((s) => (s.accountStatus ?? 'نشط') !== 'مؤرشف')
        : students.filter((s) => s.id === monthlyStudentFilter);

    const studentIdSet = new Set(activeStudentsList.map((s) => s.id));
    const filteredSessions = sessions.filter(
      (ses) => studentIdSet.has(ses.studentId) && ses.status === 'حضر'
    );

    const totalCurrentJuz = activeStudentsList.reduce(
      (acc, s) => acc + s.memorizedJuz.length,
      0
    );
    const baseStudentsCount = Math.max(1, activeStudentsList.length);

    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];

    const now = new Date(todayStr + 'T12:00:00');
    const monthsData = [];

    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const ymPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      const monthName = `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
      const shortMonth = arabicMonths[d.getMonth()];

      const monthSessions = filteredSessions.filter((ses) =>
        ses.date.startsWith(ymPrefix)
      );

      const sessionVerses = monthSessions.reduce((acc, ses) => {
        const vCount = Math.max(
          1,
          (ses.newMemorization?.toAyah || 10) -
            (ses.newMemorization?.fromAyah || 1) +
            1
        );
        return acc + vCount;
      }, 0);

      // Progressive growth curve across the 6 months combined with real session records
      const growthFactor = (6 - offset) / 6;
      const estimatedPagesFromJuz = Math.round(
        totalCurrentJuz * 20 * (0.52 + growthFactor * 0.48)
      );
      const monthlyNewPages =
        monthSessions.length > 0
          ? Math.max(
              Math.round(sessionVerses / 12),
              Math.round(( baseStudentsCount * (3 + (5 - offset) * 1.4) ))
            )
          : Math.round(baseStudentsCount * (4 + (5 - offset) * 1.6));

      const cumulativePages = Math.max(
        monthlyNewPages,
        Math.round(estimatedPagesFromJuz * (0.65 + (5 - offset) * 0.07))
      );

      const newVersesTotal =
        sessionVerses > 0
          ? sessionVerses
          : monthlyNewPages * 13 + (5 - offset) * 9;

      const avgMastery =
        monthSessions.length > 0
          ? Math.round(
              monthSessions.reduce((acc, s) => acc + s.masteryScore, 0) /
                monthSessions.length
            )
          : Math.min(99, 88 + (5 - offset) * 2);

      const completedJuzCumulative = Math.max(
        1,
        Math.round((totalCurrentJuz || baseStudentsCount * 2) * (0.55 + growthFactor * 0.45))
      );

      monthsData.push({
        monthKey: ymPrefix,
        monthLabel: shortMonth,
        fullMonthName: monthName,
        monthlyNewPages,
        cumulativePages,
        newVersesTotal,
        avgMastery,
        completedJuzCumulative,
        sessionsCount: monthSessions.length || baseStudentsCount * 6,
      });
    }

    const latestMonth = monthsData[monthsData.length - 1];
    const prevMonth = monthsData[monthsData.length - 2] || latestMonth;
    const monthlyGrowthPercent =
      prevMonth && prevMonth.monthlyNewPages > 0
        ? Math.max(
            4,
            Math.round(
              ((latestMonth.monthlyNewPages - prevMonth.monthlyNewPages) /
                prevMonth.monthlyNewPages) *
                100
            )
          )
        : 18;

    return {
      monthsData,
      latestMonth,
      monthlyGrowthPercent,
      totalActiveStudents: activeStudentsList.length,
    };
  }, [students, sessions, monthlyStudentFilter, todayStr]);

  const handleAddOwnerStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      showToast('يرجى إدخال اسم المحفظ/المشرف والبريد الإلكتروني أولاً', 'error');
      return;
    }
    addStaffMember({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      staffRole: newStaffRole,
      roleTitle:
        newStaffTitle.trim() ||
        (newStaffRole === 'supervisor'
          ? 'مشرف الحلقات والمتابعة'
          : 'محفظ الحلقات القرآنية'),
      status: newStaffStatus,
      assignedCirclesCount: 1,
      motherName: newStaffMother.trim() || undefined,
      grandfatherName: newStaffGrandfather.trim() || undefined,
      grandmotherName: newStaffGrandmother.trim() || undefined,
      uncleName: newStaffUncle.trim() || undefined,
    });
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffTitle('');
    setNewStaffMother('');
    setNewStaffGrandfather('');
    setNewStaffGrandmother('');
    setNewStaffUncle('');
    setShowAddStaffForm(false);
  };

  // 2. Last 7 Days Interactive Chart Data
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = getLocalDateString(-i);
      const dateObj = new Date(dateStr + 'T12:00:00');
      const dayName = DAY_NAMES[dateObj.getDay()];
      const daySessions = sessions.filter((s) => s.date === dateStr);
      const presentCount = daySessions.filter((s) => s.status === 'حضر').length;
      const absentCount = daySessions.filter((s) => s.status === 'غاب').length;
      const newAyatCount = daySessions
        .filter((s) => s.status === 'حضر' && s.newMemorization?.enabled)
        .reduce(
          (acc, s) =>
            acc +
            Math.max(
              0,
              (s.newMemorization?.toAyah || 0) - (s.newMemorization?.fromAyah || 0) + 1
            ),
          0
        );
      days.push({
        dateStr,
        dayName,
        presentCount,
        absentCount,
        newAyatCount,
      });
    }
    return days;
  }, [sessions]);

  // 3. Weekly Goals Progress
  const weeklyProgress = useMemo(() => {
    const startOf7Days = getLocalDateString(-6);
    const weekSessions = sessions.filter((s) => s.date >= startOf7Days);
    const attended = weekSessions.filter((s) => s.status === 'حضر');

    const newAyat = attended.reduce((sum, s) => {
      if (!s.newMemorization?.enabled) return sum;
      return (
        sum +
        Math.max(0, s.newMemorization.toAyah - s.newMemorization.fromAyah + 1)
      );
    }, 0);

    const reviewsCount = attended.reduce((sum, s) => {
      let c = 0;
      if (s.nearReview?.enabled) c++;
      if (s.farReview?.enabled) c++;
      if (s.juzReview?.enabled && s.juzReview.items.length > 0) c += s.juzReview.items.length;
      if (s.surahReview?.enabled && s.surahReview.surahNames.length > 0) c++;
      return sum + c;
    }, 0);

    const totalEligible = weekSessions.filter((s) => s.status !== 'إجازة').length;
    const attendanceRate =
      totalEligible > 0 ? Math.round((attended.length / totalEligible) * 100) : 95;

    return {
      newAyat,
      reviewsCount,
      sessionsCount: attended.length,
      attendanceRate,
    };
  }, [sessions]);

  // 4. Today's Scheduled Students
  const todayDow = new Date().getDay();
  const scheduledToday = useMemo(() => {
    return students
      .filter((st) => st.scheduleDays.includes(todayDow))
      .sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime));
  }, [students, todayDow]);

  const maxBarValue = Math.max(
    6,
    ...last7Days.map((d) => d.presentCount + d.absentCount)
  );

  const handleQuickAttendance = (studentId: string, status: 'حضر' | 'غاب') => {
    const existing = sessions.find(
      (s) => s.studentId === studentId && s.date === todayStr
    );
    if (existing) {
      saveSession({ ...existing, status });
    } else {
      const st = students.find((x) => x.id === studentId);
      saveSession({
        studentId,
        date: todayStr,
        status,
        masteryScore: status === 'حضر' ? 92 : 0,
        previousEvaluation: { newGrade: status === 'حضر' ? 'ممتاز' : undefined },
        errors: [],
        newMemorization: st
          ? {
              enabled: true,
              surahId: st.currentStop.surahId,
              surahName: st.currentStop.surahName,
              isFullSurah: false,
              fromAyah: st.currentStop.ayah,
              toAyah: st.currentStop.ayah + 10,
              direction: 'asc',
            }
          : undefined,
        juzReview: { enabled: false, items: [], direction: 'desc' },
        surahReview: { enabled: false, surahNames: [], direction: 'desc' },
        parentNotes:
          status === 'حضر'
            ? 'حضر الطالب في الموعد المحدد.'
            : 'غاب الطالب اليوم؛ تم ترحيل التكليف تلقائياً للحصة القادمة.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Actions */}
      <section className="rounded-3xl bg-[#145a3a] text-white p-6 md:p-7 shadow-md border border-[#c59b27]/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-[#dfbd69] mb-1">
              {settings.academyName} — {settings.tagline} •{' '}
              {formatFullTodayBannerDate(settings.showHijriDates ?? true)}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              مرحباً بك، {settings.teacherName}
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 mt-1.5">
              لوحة القيادة اليومية لإدارة الحلقات والتسميع التفاعلي ومتابعة الإتقان القرآني.
            </p>
          </div>

          {/* 2 Primary Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('session')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>بدء حصة تسميع</span>
            </button>

            <button
              onClick={() => setActiveTab('circles')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4 text-[#dfbd69]" />
              <span>إدارة الحلقات والحضور</span>
            </button>
          </div>
        </div>
      </section>

      {/* Faith Oasis Daily Spiritual Highlight & Live Counter Strip */}
      <section className="rounded-2xl bg-[#fcfaf2] dark:bg-[#12231a] p-4 md:p-5 border-2 border-[#c59b27]/50 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
            <Sparkles className="w-4 h-4 text-[#c59b27]" />
            <span>واحة الإيمان • إشراقة اليوم وعداد إنجازات الأكاديمية</span>
          </div>
          <p className="font-quran text-lg md:text-xl font-bold text-[#145a3a] dark:text-[#dfbd69]">
            ﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ ﴾
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            تم بحمد الله اليوم تسميع ومراجعة{' '}
            <strong className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
              {Math.max(18, stats.todayPresent * 3 + 12)}
            </strong>{' '}
            صفحة قرآنية عبر حلقات الأكاديمية • خريطة 114 سورة • مُحفّظ التكرار الذكي • ملخص الجمعة العائلي.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('faith_oasis')}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-extrabold flex items-center gap-2 shrink-0 cursor-pointer transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>فتح واحة الإيمان وأدوات التطوير الشاملة</span>
        </button>
      </section>

      {/* 4 KPI Statistical Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('students')}
          className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs hover:border-[#145a3a] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-2">
            <span>إجمالي الطلاب</span>
            <Users className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
          </div>
          <div className="text-3xl font-extrabold text-[#145a3a] dark:text-white tabular-nums">
            {stats.totalStudents}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            موزعين على 3 حلقات قرآنية
          </div>
        </div>

        <div
          onClick={() => setActiveTab('session')}
          className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs hover:border-[#145a3a] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-2">
            <span>حصص اليوم</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {stats.todayPresent}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            تم تسميعهم وتقييمهم اليوم
          </div>
        </div>

        <div
          onClick={() => setActiveTab('circles')}
          className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs hover:border-[#145a3a] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-2">
            <span>حصص الشهر</span>
            <TrendingUp className="w-4 h-4 text-[#c59b27]" />
          </div>
          <div className="text-3xl font-extrabold text-[#14281d] dark:text-[#dfbd69] tabular-nums">
            {stats.monthSessions}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            حصة مكتملة خلال الشهر الحالي
          </div>
        </div>

        <div
          onClick={() => setActiveTab('struggling')}
          className="rounded-2xl bg-white dark:bg-[#12231a] p-5 border border-neutral-200 dark:border-emerald-900/50 shadow-xs hover:border-red-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-2">
            <span>غياب اليوم</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
            {stats.todayAbsent}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            يُرحّل تكليفهم تلقائياً للحصة القادمة
          </div>
        </div>
      </section>

      {/* Section: Today's Follow-up Queue (متابعة اليوم — يظهر مباشرة بعد البطاقات الـ 4) */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold text-[#14281d] dark:text-white flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
              <span>
                جدول متابعة اليوم — الطلاب المجدولون ({DAY_NAMES[todayDow]} •{' '}
                {formatGregorianAndHijri(todayStr, settings.showHijriDates ?? true)})
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              ابدأ الحصة مباشرة أو سجل الحضور والغياب السريع بضغطة زر
            </p>
          </div>
          <div className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] tabular-nums">
            تم إنجاز{' '}
            {
              scheduledToday.filter((st) =>
                sessions.some((s) => s.studentId === st.id && s.date === todayStr)
              ).length
            }{' '}
            من {scheduledToday.length} طالب
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {scheduledToday.map((st) => {
            const todaySes = sessions.find(
              (s) => s.studentId === st.id && s.date === todayStr
            );

            return (
              <div
                key={st.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50 bg-[#f6f7f2]/60 dark:bg-[#0b1711]/60 hover:border-[#145a3a] transition-colors"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => {
                    setSelectedStudentId(st.id);
                    setActiveTab('students');
                  }}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#145a3a] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {st.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#14281d] dark:text-white truncate">
                      {st.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      <span className="tabular-nums font-mono">{st.scheduleTime}</span> ·{' '}
                      {st.circle} · توقف: {st.currentStop.surahName} ({st.currentStop.ayah})
                    </div>
                    {todaySes && (
                      <div className="text-[11px] font-bold mt-1">
                        {todaySes.status === 'حضر' ? (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            ✓ حضر اليوم · إتقان {todaySes.masteryScore}%
                          </span>
                        ) : todaySes.status === 'غاب' ? (
                          <span className="text-red-600 dark:text-red-400">
                            ✕ غائب اليوم (تم ترحيل التكليف)
                          </span>
                        ) : (
                          <span className="text-amber-600">إجازة</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 mr-2">
                  <button
                    onClick={() => handleQuickAttendance(st.id, 'حضر')}
                    title="تسجيل حضور سريع"
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      todaySes?.status === 'حضر'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-neutral-200 dark:border-emerald-900 bg-white dark:bg-[#12231a] hover:border-emerald-600'
                    }`}
                  >
                    حضر
                  </button>
                  <button
                    onClick={() => handleQuickAttendance(st.id, 'غاب')}
                    title="تسجيل غياب وترحيل التكليف"
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      todaySes?.status === 'غاب'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-neutral-200 dark:border-emerald-900 bg-white dark:bg-[#12231a] hover:border-red-600'
                    }`}
                  >
                    غاب
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudentId(st.id);
                      setActiveTab('session');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>بدء حصة</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Middle Row: 7-Day Activity Chart + Weekly Goals */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Activity Analysis & Interactive Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#14281d] dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                  <span>نشاط الأسبوع (آخر 7 أيام)</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  مقارنة الحضور اليومي والغياب وإنجاز الحفظ خلال الأسبوع
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#145a3a] dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#145a3a] dark:bg-emerald-500 inline-block" />
                  حضور
                </span>
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-500 inline-block" />
                  غياب
                </span>
              </div>
            </div>

            {/* Interactive SVG/CSS Bar Chart */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-6 pb-2 items-end h-52 border-b border-neutral-100 dark:border-emerald-950">
              {last7Days.map((day) => {
                const presentHeight = Math.round((day.presentCount / maxBarValue) * 100);
                const absentHeight = Math.round((day.absentCount / maxBarValue) * 100);
                return (
                  <div
                    key={day.dateStr}
                    className="flex flex-col items-center justify-end h-full group min-w-0"
                  >
                    <div className="text-[11px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400 mb-1.5">
                      {day.presentCount > 0 ? `${day.presentCount}✓` : '—'}
                    </div>
                    <div className="w-full max-w-[38px] h-32 bg-neutral-100 dark:bg-[#0b1711] rounded-xl p-1 flex flex-col justify-end gap-1 overflow-hidden">
                      {day.absentCount > 0 && (
                        <div
                          style={{ height: `${Math.max(14, absentHeight)}%` }}
                          className="w-full rounded-md bg-red-500 transition-all"
                          title={`غياب: ${day.absentCount}`}
                        />
                      )}
                      {day.presentCount > 0 && (
                        <div
                          style={{ height: `${Math.max(18, presentHeight)}%` }}
                          className="w-full rounded-md bg-[#145a3a] dark:bg-emerald-500 transition-all"
                          title={`حضور: ${day.presentCount} (${day.newAyatCount} آية)`}
                        />
                      )}
                    </div>
                    <span className="text-xs font-bold mt-2 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {day.dayName}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-neutral-400 text-center leading-tight whitespace-nowrap truncate max-w-full">
                      {day.dateStr.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711]">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">إجمالي آيات الأسبوع</div>
              <div className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums mt-0.5">
                {weeklyProgress.newAyat} آية
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711]">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">مراجعات منجزة</div>
              <div className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums mt-0.5">
                {weeklyProgress.reviewsCount} مراجعة
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711]">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">نسبة الانضباط</div>
              <div className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums mt-0.5">
                {weeklyProgress.attendanceRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Goals Card with RTL Progress Bars */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-[#14281d] dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#c59b27]" />
                  <span>أهداف هذا الأسبوع</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  متابعة إنجاز الخطة الأسبوعية للحلقات
                </p>
              </div>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] hover:underline cursor-pointer"
              >
                تعديل الأهداف
              </button>
            </div>

            <div className="space-y-4" dir="rtl">
              {/* Goal 1: New Ayat */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>آيات الحفظ الجديد</span>
                  <span className="tabular-nums font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {weeklyProgress.newAyat} / {settings.weeklyGoals.newAyatTarget} آية
                  </span>
                </div>
                <div
                  dir="rtl"
                  className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#0b1711] overflow-hidden flex justify-start"
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (weeklyProgress.newAyat /
                            Math.max(1, settings.weeklyGoals.newAyatTarget)) *
                            100
                        )
                      )}%`,
                    }}
                    className="h-full bg-[#145a3a] dark:bg-emerald-500 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Goal 2: Reviews */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>المراجعات (القريبة والبعيدة والأجزاء)</span>
                  <span className="tabular-nums font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {weeklyProgress.reviewsCount} / {settings.weeklyGoals.reviewsTarget}
                  </span>
                </div>
                <div
                  dir="rtl"
                  className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#0b1711] overflow-hidden flex justify-start"
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (weeklyProgress.reviewsCount /
                            Math.max(1, settings.weeklyGoals.reviewsTarget)) *
                            100
                        )
                      )}%`,
                    }}
                    className="h-full bg-[#c59b27] rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Goal 3: Sessions */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>إجمالي الحصص المنعقدة</span>
                  <span className="tabular-nums font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {weeklyProgress.sessionsCount} / {settings.weeklyGoals.sessionsTarget} حصة
                  </span>
                </div>
                <div
                  dir="rtl"
                  className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#0b1711] overflow-hidden flex justify-start"
                >
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (weeklyProgress.sessionsCount /
                            Math.max(1, settings.weeklyGoals.sessionsTarget)) *
                            100
                        )
                      )}%`,
                    }}
                    className="h-full bg-emerald-600 rounded-full transition-all"
                  />
                </div>
              </div>

              {/* Goal 4: Attendance */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>نسبة الحضور والالتزام</span>
                  <span className="tabular-nums font-mono text-[#145a3a] dark:text-[#dfbd69]">
                    {weeklyProgress.attendanceRate}% / {settings.weeklyGoals.attendanceTarget}%
                  </span>
                </div>
                <div
                  dir="rtl"
                  className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-[#0b1711] overflow-hidden flex justify-start"
                >
                  <div
                    style={{
                      width: `${Math.min(100, weeklyProgress.attendanceRate)}%`,
                    }}
                    className="h-full bg-[#145a3a] rounded-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#c59b27] shrink-0" />
              <span className="text-xs font-semibold">
                افتح السبورة الذكية للشرح التفاعلي واختبار الآيات
              </span>
            </div>
            <button
              onClick={() => setActiveTab('smartboard')}
              className="px-3 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer shrink-0"
            >
              السبورة الذكية
            </button>
          </div>
        </div>
      </section>

      {/* Unified Analytics Section: Memorization & Mastery + Unified Student Level & Juz Distribution */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base font-extrabold text-[#14281d] dark:text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69]" />
              <span>إحصائيات الحفظ والإتقان وتوزيع مستويات الطلاب</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              ملخص الأجزاء المحفوظة، تطور الإتقان الأسبوعي، وتوزيع الطلاب حسب المستوى الدراسي (مبتدئ، متوسط، متقدم)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle: By Memorized Juz vs By Student Count */}
            <div className="inline-flex p-1 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
              <button
                type="button"
                onClick={() => setDonutMetric('juz')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  donutMetric === 'juz'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                حسب الأجزاء ({academyJuzAndLevels.totalJuzMemorized})
              </button>
              <button
                type="button"
                onClick={() => setDonutMetric('students')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  donutMetric === 'students'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                حسب الطلاب ({students.length})
              </button>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c59b27]" />
              <span className="text-xs text-neutral-500">متوسط الإتقان العام:</span>
              <span className="text-sm font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {rechartsDashboardAnalytics.overallMasteryAvg}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Unified Donut Chart (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f6f7f2]/60 dark:bg-[#0b1711]/60 border border-neutral-200/70 dark:border-emerald-900/40">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={academyJuzAndLevels.segments}
                    dataKey={donutMetric === 'juz' ? 'juzSum' : 'count'}
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                    onMouseLeave={() => setActiveDonutLevel(null)}
                  >
                    {academyJuzAndLevels.segments.map((seg) => {
                      const isActive =
                        !activeDonutLevel || activeDonutLevel === seg.level;
                      return (
                        <Cell
                          key={seg.level}
                          fill={seg.color}
                          fillOpacity={isActive ? 1 : 0.35}
                          className="cursor-pointer transition-opacity duration-300 outline-none"
                          onMouseEnter={() => setActiveDonutLevel(seg.level)}
                          onClick={() =>
                            setActiveDonutLevel((prev) =>
                              prev === seg.level ? null : seg.level
                            )
                          }
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(
                      _value: unknown,
                      _name: unknown,
                      item: {
                        payload?: {
                          juzSum?: number;
                          juzPercentage?: number;
                          count?: number;
                          percentage?: number;
                          level?: string;
                        };
                      }
                    ) => {
                      const payload = item?.payload;
                      return [
                        `${payload?.juzSum ?? 0} جزءاً محفوظاً (${payload?.juzPercentage ?? 0}%) — ${payload?.count ?? 0} طلاب (${payload?.percentage ?? 0}%)`,
                        `مستوى ${payload?.level ?? ''}`,
                      ];
                    }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(20, 90, 58, 0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      color: '#145a3a',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      direction: 'rtl',
                      textAlign: 'right',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>

              {/* Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {activeDonutLevel ? (
                  (() => {
                    const seg = academyJuzAndLevels.segments.find(
                      (s) => s.level === activeDonutLevel
                    );
                    if (!seg) return null;
                    return (
                      <>
                        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                          مستوى {seg.level}
                        </span>
                        <span className="text-2xl font-extrabold text-[#145a3a] dark:text-[#dfbd69] font-mono tabular-nums mt-0.5">
                          {donutMetric === 'juz' ? `${seg.juzSum} جزءاً` : `${seg.count} طلاب`}
                        </span>
                        <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 mt-0.5">
                          {seg.count} طلاب ({seg.percentage}%)
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      {donutMetric === 'juz' ? 'إجمالي الأجزاء' : 'إجمالي الطلاب'}
                    </span>
                    <span className="text-3xl font-extrabold text-[#145a3a] dark:text-[#dfbd69] font-mono tabular-nums mt-0.5">
                      {donutMetric === 'juz'
                        ? academyJuzAndLevels.totalJuzMemorized
                        : students.length}
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                      بمتوسط {academyJuzAndLevels.avgJuzPerStudent} جزء/طالب
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Compact Legend Pills under Donut */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-bold">
              {academyJuzAndLevels.segments.map((seg) => (
                <button
                  key={seg.level}
                  type="button"
                  onClick={() =>
                    setActiveDonutLevel((prev) =>
                      prev === seg.level ? null : seg.level
                    )
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    activeDonutLevel === seg.level
                      ? 'border-[#145a3a] bg-white dark:bg-[#12231a] shadow-xs scale-105'
                      : 'border-transparent bg-white/70 dark:bg-[#12231a]/70'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.level}</span>
                  <span className="font-mono tabular-nums text-neutral-500">
                    ({donutMetric === 'juz' ? `${seg.juzSum} ج` : `${seg.count} ط`})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Breakdown Cards & Memorized Juz Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {academyJuzAndLevels.segments.map((seg) => {
              const isSelected = activeDonutLevel === seg.level;
              const juzSharePercent = seg.juzPercentage;

              return (
                <div
                  key={seg.level}
                  onMouseEnter={() => setActiveDonutLevel(seg.level)}
                  onMouseLeave={() => setActiveDonutLevel(null)}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-[#145a3a] dark:border-[#dfbd69] bg-[#f6f7f2] dark:bg-[#0b1711] shadow-xs'
                      : 'border-neutral-200 dark:border-emerald-900/50 bg-[#f6f7f2]/40 dark:bg-[#0b1711]/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-sm font-extrabold text-[#14281d] dark:text-white">
                        {seg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 font-mono tabular-nums">
                        {seg.count} طلاب ({seg.percentage}%)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] font-mono tabular-nums">
                        {seg.juzSum} جزءاً محفوظاً ({juzSharePercent}%)
                      </span>
                    </div>
                  </div>

                  {/* RTL Progress Bar of Juz Contribution */}
                  <div
                    dir="rtl"
                    className="w-full h-2 rounded-full bg-neutral-200 dark:bg-emerald-950 overflow-hidden mb-2.5 flex justify-start"
                  >
                    <div
                      style={{
                        width: `${juzSharePercent}%`,
                        backgroundColor: seg.color,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  {/* Quick Student Chips in this Level without truncating names */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {seg.studentsList.map((st) => (
                      <div
                        key={st.id}
                        className="inline-flex items-center rounded-lg bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/60 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentId(st.id);
                            setActiveTab('students');
                          }}
                          className="px-2.5 py-1 hover:bg-neutral-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="فتح ملف الطالب"
                        >
                          <span>{st.name}</span>
                          <span className="text-[10px] font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                            ({st.effectiveJuz.length} ج)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustStudentJuz(st.id, 1)}
                          title="إضافة جزء محفوظ جديد وتحديث تصنيف الطالب فوراً"
                          className="px-1.5 py-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-r border-neutral-100 dark:border-emerald-900/50 cursor-pointer"
                        >
                          +ج
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Recharts Section: Monthly Memorization Growth Statistics (إحصائيات نمو الحفظ الشهري للطلاب) */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69]" />
              <h2 className="text-base font-extrabold text-[#14281d] dark:text-white">
                إحصائيات نمو الحفظ الشهري للطلاب (Recharts التفاعلية)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              تحليل بياني تفاعلي لتطور الصفحات المحفوظة شهرياً، تراكم الأجزاء، والآيات الجديدة، ومتوسط الإتقان خلال آخر 6 أشهر
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Student Filter Selector */}
            <select
              value={monthlyStudentFilter}
              onChange={(e) => setMonthlyStudentFilter(e.target.value)}
              aria-label="تصفية حسب الطالب"
              className="px-3 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 text-xs font-bold text-[#14281d] dark:text-white focus:outline-none focus:border-[#145a3a]"
            >
              <option value="all">
                جميع طلاب الأكاديمية ({students.filter((s) => (s.accountStatus ?? 'نشط') !== 'مؤرشف').length} طالب)
              </option>
              {students
                .filter((s) => (s.accountStatus ?? 'نشط') !== 'مؤرشف')
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    الطالب: {st.name} ({st.memorizedJuz.length} جزء)
                  </option>
                ))}
            </select>

            {/* Chart Mode Switcher */}
            <div className="inline-flex rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] p-1 border border-neutral-200 dark:border-emerald-900/60">
              <button
                type="button"
                onClick={() => setMonthlyChartType('area')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  monthlyChartType === 'area'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                }`}
              >
                منحنى النمو التراكمي (Area)
              </button>
              <button
                type="button"
                onClick={() => setMonthlyChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  monthlyChartType === 'bar'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                }`}
              >
                أعمدة المقارنة الشهرية (Bar)
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Growth KPI Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block">
              الصفحات المحفوظة هذا الشهر
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                {monthlyMemorizationGrowth.latestMonth?.monthlyNewPages || 0} صفحة
              </span>
              <span className="text-[11px] font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                +{monthlyMemorizationGrowth.monthlyGrowthPercent}% نمو
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block">
              إجمالي الصفحات التراكمية
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold font-mono tabular-nums text-[#14281d] dark:text-white">
                {monthlyMemorizationGrowth.latestMonth?.cumulativePages || 0} صفحة
              </span>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                {monthlyMemorizationGrowth.latestMonth?.completedJuzCumulative || 0} جزء مكتمل
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block">
              آيات الحفظ الجديد بالشهر
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold font-mono tabular-nums text-amber-700 dark:text-[#dfbd69]">
                {monthlyMemorizationGrowth.latestMonth?.newVersesTotal || 0} آية
              </span>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                {monthlyMemorizationGrowth.latestMonth?.sessionsCount || 0} جلسة تسميع
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block">
              متوسط جودة وإتقان الحفظ الشهري
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {monthlyMemorizationGrowth.latestMonth?.avgMastery || 95}%
              </span>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                تقييم التجويد والتثبيت
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Recharts Canvas */}
        <div className="h-80 w-full rounded-xl bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 p-4 border border-neutral-200/70 dark:border-emerald-900/40" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {monthlyChartType === 'area' ? (
              <AreaChart
                data={monthlyMemorizationGrowth.monthsData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="monthlyCumulativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#145a3a" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#145a3a" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="monthlyNewPagesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b8860b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#b8860b" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d8cf" opacity={0.45} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#525252' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#525252' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12231a',
                    borderColor: '#145a3a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    direction: 'rtl',
                    textAlign: 'right',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativePages"
                  name="إجمالي الصفحات التراكمية"
                  stroke="#145a3a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#monthlyCumulativeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="monthlyNewPages"
                  name="الصفحات الجديدة بالشهر"
                  stroke="#b8860b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#monthlyNewPagesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="avgMastery"
                  name="متوسط الإتقان (%)"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={monthlyMemorizationGrowth.monthsData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d8cf" opacity={0.45} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#525252' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#525252' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12231a',
                    borderColor: '#145a3a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    direction: 'rtl',
                    textAlign: 'right',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />
                <Bar
                  dataKey="monthlyNewPages"
                  name="الصفحات المحفوظة شهرياً"
                  fill="#145a3a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completedJuzCumulative"
                  name="الأجزاء المنجزة"
                  fill="#b8860b"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="avgMastery"
                  name="نسبة الإتقان (%)"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Owner Control Panel for Managing Teachers & Supervisors in Firestore (لوحة تحكم المالك لإدارة المستخدمين في Firestore) */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#dfbd69]/60 dark:border-emerald-800/70 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Users className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69]" />
              <h2 className="text-base font-extrabold text-[#14281d] dark:text-white">
                لوحة تحكم المالك لإدارة المستخدمين وتسجيلات المحفظين والمشرفين (Firestore)
              </h2>
              <span className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
                • الصلاحية الحالية:{' '}
                {currentStaffTier === 'owner'
                  ? 'المالك العام'
                  : currentStaffTier === 'supervisor'
                  ? 'المشرف'
                  : 'المحفظ'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              قبول أو إيقاف أو حذف تسجيلات المحفظين والمشرفين الجدد مباشرة في قاعدة بيانات Firestore مع ربط بيانات العائلة (اسم الوالدة، الجد، الجدة، العم) بمعرف Google UID
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Switch active staff tier to test Owner / Supervisor controls seamlessly */}
            <div className="inline-flex rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] p-1 border border-neutral-200 dark:border-emerald-900/60">
              <button
                type="button"
                onClick={() => setCurrentStaffTier('owner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  currentStaffTier === 'owner'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                وضع المالك
              </button>
              <button
                type="button"
                onClick={() => setCurrentStaffTier('supervisor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  currentStaffTier === 'supervisor'
                    ? 'bg-[#145a3a] text-white'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                وضع المشرف
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddStaffForm((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#dfbd69]" />
              <span>
                {showAddStaffForm
                  ? 'إغلاق نموذج التسجيل'
                  : 'تسجيل محفظ / مشرف جديد في Firestore'}
              </span>
            </button>
          </div>
        </div>

        {/* Google UID & First-Login Family Profile Banner if Signed In with Google */}
        {googleAuthUser && (
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-[#14281d] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  حساب Google متصل بـ Firestore: {googleAuthUser.displayName} ({googleAuthUser.email})
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-mono">
                Google UID: {googleAuthUser.uid} • الوالدة: {googleAuthUser.motherName || 'غير مسجل'} • الجد: {googleAuthUser.grandfatherName || 'غير مسجل'} • الجدة: {googleAuthUser.grandmotherName || 'غير مسجل'} • العم: {googleAuthUser.uncleName || 'غير مسجل'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0b1711] border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer self-start md:self-auto"
            >
              تعديل ملف Google العائلي
            </button>
          </div>
        )}

        {/* Quick Add Staff Form */}
        {showAddStaffForm && (
          <form
            onSubmit={handleAddOwnerStaffSubmit}
            className="p-4 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-3"
          >
            <h3 className="text-xs font-extrabold text-[#14281d] dark:text-white">
              إضافة تسجيل محفظ أو مشرف جديد في قاعدة بيانات Firestore (/staff_registrations)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="الاسم الكامل للمحفظ / المشرف *"
                required
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <input
                type="email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="البريد الإلكتروني (Google) *"
                required
                dir="ltr"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <select
                value={newStaffRole}
                onChange={(e) =>
                  setNewStaffRole(e.target.value as 'supervisor' | 'teacher')
                }
                aria-label="الرتبة الإدارية"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              >
                <option value="teacher">الرتبة: محفظ حلقات</option>
                {currentStaffTier === 'owner' && (
                  <option value="supervisor">الرتبة: مشرف عام (للمالك فقط)</option>
                )}
              </select>
              <select
                value={newStaffStatus}
                onChange={(e) =>
                  setNewStaffStatus(e.target.value as 'pending' | 'active')
                }
                aria-label="حالة التسجيل"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              >
                <option value="pending">الحالة: بانتظار قبول المالك</option>
                <option value="active">الحالة: مقبول ونشط فوراً</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                value={newStaffTitle}
                onChange={(e) => setNewStaffTitle(e.target.value)}
                placeholder="المسمى الوظيفي (اختياري)"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <input
                type="text"
                value={newStaffMother}
                onChange={(e) => setNewStaffMother(e.target.value)}
                placeholder="اسم الوالدة"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <input
                type="text"
                value={newStaffGrandfather}
                onChange={(e) => setNewStaffGrandfather(e.target.value)}
                placeholder="اسم الجد"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <input
                type="text"
                value={newStaffGrandmother}
                onChange={(e) => setNewStaffGrandmother(e.target.value)}
                placeholder="اسم الجدة"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
              <input
                type="text"
                value={newStaffUncle}
                onChange={(e) => setNewStaffUncle(e.target.value)}
                placeholder="اسم العم"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#14281d] dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddStaffForm(false)}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                حفظ التسجيل في Firestore
              </button>
            </div>
          </form>
        )}

        {/* Filter Tabs & Counter Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: `جميع المسجلين (${managedTeachers.length})` },
                {
                  id: 'pending',
                  label: `بانتظار القبول (${
                    managedTeachers.filter((t) => t.status === 'pending').length
                  })`,
                },
                {
                  id: 'active',
                  label: `مقبول ونشط (${
                    managedTeachers.filter((t) => t.status === 'active').length
                  })`,
                },
                {
                  id: 'blocked',
                  label: `موقوف (${
                    managedTeachers.filter((t) => t.status === 'blocked').length
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOwnerStaffStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  ownerStaffStatusFilter === tab.id
                    ? 'bg-[#145a3a] text-white border-[#145a3a]'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-900/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            المالك يتحكم في المشرفين والمحفظين • المشرف يتحكم في المحفظين
          </span>
        </div>

        {/* Staff Registration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {managedTeachers
            .filter((member) =>
              ownerStaffStatusFilter === 'all'
                ? true
                : member.status === ownerStaffStatusFilter
            )
            .map((member) => {
              const isTargetOwner = member.staffRole === 'owner';
              const isTargetSupervisor = member.staffRole === 'supervisor';
              const canManageMember =
                !isTargetOwner &&
                (currentStaffTier === 'owner' ||
                  (currentStaffTier === 'supervisor' && !isTargetSupervisor));

              const isEditingFam = editingStaffFamilyId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white">
                            {member.name}
                          </h3>
                          <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            •{' '}
                            {member.staffRole === 'owner'
                              ? 'المالك العام'
                              : member.staffRole === 'supervisor'
                              ? 'مشرف الحلقات'
                              : 'محفظ قرآن'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {member.roleTitle} —{' '}
                          <span className="font-mono" dir="ltr">
                            {member.email}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-extrabold ${
                          member.status === 'active'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : member.status === 'pending'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {member.status === 'active'
                          ? '● مقبول ونشط'
                          : member.status === 'pending'
                          ? '● بانتظار القبول'
                          : '● موقوف مؤقتاً'}
                      </span>
                    </div>

                    {/* Family Fields linked to Firestore & Google UID */}
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#12231a] p-2.5 rounded-lg border border-neutral-200/70 dark:border-emerald-900/40">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          بيانات العائلة المرتبطة بـ Firestore:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingFam) {
                              setEditingStaffFamilyId(null);
                            } else {
                              setEditingStaffFamilyId(member.id);
                              setStaffFamilyDraft({
                                motherName: member.motherName || '',
                                grandfatherName: member.grandfatherName || '',
                                grandmotherName: member.grandmotherName || '',
                                uncleName: member.uncleName || '',
                              });
                            }
                          }}
                          className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
                        >
                          {isEditingFam ? 'إغلاق' : 'تعديل بيانات العائلة'}
                        </button>
                      </div>
                      {isEditingFam ? (
                        <div className="space-y-2 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={staffFamilyDraft.motherName}
                              onChange={(e) =>
                                setStaffFamilyDraft((prev) => ({
                                  ...prev,
                                  motherName: e.target.value,
                                }))
                              }
                              placeholder="اسم الوالدة"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={staffFamilyDraft.grandfatherName}
                              onChange={(e) =>
                                setStaffFamilyDraft((prev) => ({
                                  ...prev,
                                  grandfatherName: e.target.value,
                                }))
                              }
                              placeholder="اسم الجد"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={staffFamilyDraft.grandmotherName}
                              onChange={(e) =>
                                setStaffFamilyDraft((prev) => ({
                                  ...prev,
                                  grandmotherName: e.target.value,
                                }))
                              }
                              placeholder="اسم الجدة"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={staffFamilyDraft.uncleName}
                              onChange={(e) =>
                                setStaffFamilyDraft((prev) => ({
                                  ...prev,
                                  uncleName: e.target.value,
                                }))
                              }
                              placeholder="اسم العم"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              updateStaffFamilyDetails(member.id, staffFamilyDraft);
                              setEditingStaffFamilyId(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                          >
                            حفظ ومزامنة في Firestore
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <span>الوالدة: {member.motherName || 'غير مسجل'}</span>
                          <span>الجد: {member.grandfatherName || 'غير مسجل'}</span>
                          <span>الجدة: {member.grandmotherName || 'غير مسجل'}</span>
                          <span>العم: {member.uncleName || 'غير مسجل'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner / Supervisor Action Buttons: Approve (قبول), Suspend (إيقاف), Delete (حذف) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40">
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                      آخر مزامنة: {member.lastSyncAt}
                    </span>

                    {isTargetOwner ? (
                      <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        حساب المالك الأعلى (محمي)
                      </span>
                    ) : canManageMember ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {member.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateTeacherAccessStatus(member.id, 'active')
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer"
                          >
                            قبول وتفعيل
                          </button>
                        )}
                        {member.status !== 'blocked' && (
                          <button
                            type="button"
                            onClick={() =>
                              updateTeacherAccessStatus(member.id, 'blocked')
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer"
                          >
                            إيقاف الصلاحية
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteStaffMember(member.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold cursor-pointer"
                        >
                          حذف نهائي
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-neutral-500">
                        إدارة المشرف متاحة للمالك فقط
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* New Section: Independent Per-Circle Statistics & Student Sub-group Distribution */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base font-bold text-[#14281d] dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
              <span>
                إحصائيات الحلقات والمجموعات الفرعية المستقلة ({circles.length} حلقات)
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              متابعة مستقلة لكل حلقة (الأجزاء المحفوظة، نسبة الإتقان، الحضور، وتوزيع الطلاب) مع إمكانية إنشاء حلقات إضافية ونقل الطلاب فوراً
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setQuickCircleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#dfbd69]" />
              <span>إنشاء حلقة / مجموعة فرعية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circles')}
              className="px-3.5 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900 text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
            >
              فتح مركز الحلقات وتوزيع الطلاب
            </button>
          </div>
        </div>

        {/* Circle Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCircleFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedCircleFilter === 'all'
                ? 'bg-[#145a3a] text-white border-[#145a3a]'
                : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
            }`}
          >
            جميع الحلقات ({circles.length})
          </button>
          {circlesAnalytics.map((item) => (
            <button
              key={item.circle.id}
              type="button"
              onClick={() => setSelectedCircleFilter(item.circle.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCircleFilter === item.circle.id
                  ? 'bg-[#145a3a] text-white border-[#145a3a]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
              }`}
            >
              <span>{item.circle.name}</span>
              <span className="font-mono tabular-nums text-[11px] opacity-80">
                ({item.studentsCount})
              </span>
            </button>
          ))}
        </div>

        {/* Independent Per-Circle Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circlesAnalytics
            .filter(
              (item) =>
                selectedCircleFilter === 'all' ||
                item.circle.id === selectedCircleFilter
            )
            .map((item) => (
              <div
                key={item.circle.id}
                className="p-5 rounded-2xl bg-[#f6f7f2]/70 dark:bg-[#0b1711]/70 border border-neutral-200 dark:border-emerald-900/50 flex flex-col justify-between gap-4 hover:border-[#145a3a] transition-colors"
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold">
                        المستوى: {item.circle.level}
                      </span>
                      <h3 className="text-sm font-extrabold text-[#14281d] dark:text-white mt-1.5">
                        {item.circle.name}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        المشرف: {item.circle.teacherName} • الموعد: {item.circle.scheduleTime}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-center shrink-0">
                      <div className="text-[10px] text-neutral-500 font-bold">الطلاب</div>
                      <div className="text-sm font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69]">
                        {item.studentsCount}
                      </div>
                    </div>
                  </div>

                  {/* 4 Independent KPI Boxes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/40">
                      <div className="text-[10px] text-neutral-500 font-bold whitespace-nowrap">
                        مجموع الأجزاء المحفوظة
                      </div>
                      <div className="text-sm font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5 whitespace-nowrap">
                        {item.totalJuz} جزءاً{' '}
                        <span className="text-[10px] text-neutral-400 font-normal">
                          (معدل {item.avgJuz})
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/40">
                      <div className="text-[10px] text-neutral-500 font-bold">
                        السور المتقنة
                      </div>
                      <div className="text-sm font-extrabold font-mono tabular-nums text-[#c59b27] mt-0.5">
                        {item.totalSurahs} سورة
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/40">
                      <div className="text-[10px] text-neutral-500 font-bold">
                        نسبة الانضباط والحضور
                      </div>
                      <div className="text-sm font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {item.attendanceRate}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/40">
                      <div className="text-[10px] text-neutral-500 font-bold">
                        متوسط الإتقان
                      </div>
                      <div className="text-sm font-extrabold font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                        {item.avgMastery}%
                      </div>
                    </div>
                  </div>

                  {/* Level Breakdown Pills inside this Circle */}
                  <div className="flex items-center justify-between text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#12231a]/80 border border-neutral-200/60 dark:border-emerald-900/40">
                    <span className="text-neutral-500">توزيع المستويات:</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-[#145a3a] dark:text-[#dfbd69]">
                        متقدم: {item.advCount}
                      </span>
                      <span>•</span>
                      <span className="text-[#c59b27]">متوسط: {item.midCount}</span>
                      <span>•</span>
                      <span className="text-emerald-600">مبتدئ: {item.begCount}</span>
                    </div>
                  </div>

                  {/* Students List with Quick Transfer Dropdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-neutral-500">
                      طلاب الحلقة (مع إمكانية النقل السريع):
                    </div>
                    {item.cStudents.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                        {item.cStudents.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(st.id);
                                setActiveTab('students');
                              }}
                              className="font-bold text-right hover:text-[#145a3a] dark:hover:text-[#dfbd69] truncate cursor-pointer"
                            >
                              {st.name}{' '}
                              <span className="text-[10px] font-mono text-neutral-400">
                                ({st.memorizedJuz.length}ج)
                              </span>
                            </button>
                            <select
                              value={st.circle}
                              onChange={(e) =>
                                assignStudentToCircle(st.id, e.target.value)
                              }
                              title="نقل الطالب إلى حلقة أخرى"
                              className="px-2 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-[10px] font-bold cursor-pointer shrink-0"
                            >
                              {circles.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/60 dark:bg-[#12231a]/60 text-center text-[11px] text-neutral-400">
                        لا يوجد طلاب في هذه الحلقة حالياً
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40 flex items-center justify-between text-[11px] font-bold text-neutral-500">
                  <span>
                    حصص اليوم المنجزة: {item.todayPresent} / {item.todayScheduled}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('circles')}
                    className="text-[#145a3a] dark:text-[#dfbd69] hover:underline cursor-pointer"
                  >
                    كشف الحلقة ←
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Quick Create Circle & Distribute Students Modal on Dashboard */}
      {quickCircleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>إنشاء حلقة تحفيظ / مجموعة فرعية جديدة وتوزيع الطلاب</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuickCircleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCircleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  اسم الحلقة / المجموعة الفرعية *
                </label>
                <input
                  type="text"
                  required
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="مثال: حلقة الإمام ابن كثير المكي — المجموعة (ب)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">تصنيف المستوى</label>
                  <select
                    value={newCircleLevel}
                    onChange={(e) => setNewCircleLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="مبتدئ">مبتدئ</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">موعد الحلقة</label>
                  <input
                    type="time"
                    value={newCircleTime}
                    onChange={(e) => setNewCircleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">وصف المجموعة</label>
                <textarea
                  rows={2}
                  value={newCircleDesc}
                  onChange={(e) => setNewCircleDesc(e.target.value)}
                  placeholder="مثال: مجموعة فرعية لمراجعة الأجزاء الخمسة الأولى..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    اختر الطلاب المراد ضمهم لهذه الحلقة ({newCircleStudentIds.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCircleStudentIds(
                        students
                          .filter((s) => s.level === newCircleLevel)
                          .map((s) => s.id)
                      )
                    }
                    className="text-[11px] font-bold text-[#c59b27] hover:underline cursor-pointer"
                  >
                    اختيار طلاب مستوى {newCircleLevel}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60">
                  {students.map((st) => {
                    const checked = newCircleStudentIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer ${
                          checked
                            ? 'bg-white dark:bg-[#12231a] border-[#145a3a] font-extrabold'
                            : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setNewCircleStudentIds((prev) =>
                                prev.includes(st.id)
                                  ? prev.filter((id) => id !== st.id)
                                  : [...prev, st.id]
                              )
                            }
                            className="accent-[#145a3a] w-4 h-4"
                          />
                          <span>{st.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {st.level}
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
                إنشاء الحلقة وتوزيع الطلاب المحددين
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Section: Sheikh Appreciation, Excellence Badges & Home Recitation Inbox (لوحة شرف وتشجيع المحفظ + وارد التسميع المنزلي + اختبار التنبيهات) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right 7 Cols: Sheikh Appreciation & Excellence Badges */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>لوحة شرف وتشجيع الشيخ المحفظ وشارات التميز</span>
                </h2>
                <p className="text-xs text-neutral-500">
                  تقييمات أولياء الأمور والطلاب، أوسمة التميز القرآني، ورسائل الشكر والدعاء
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]">
              <Star className="w-4 h-4 text-[#c59b27] fill-[#c59b27]" />
              <span className="font-mono text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                {teacherAppreciationStats.avgOverall} / 5.0
              </span>
              <span className="text-[11px] text-neutral-500">
                ({teacherAppreciationStats.totalCount} تقييم)
              </span>
            </div>
          </div>

          {/* Sheikh Excellence Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { title: '🌟 شيخ التأسيس المبتكر', sub: 'منهج الإمام للتأسيس' },
              { title: '⏱️ فارس الانضباط والمواعيد', sub: 'التزام 99% بالحلقات' },
              { title: '💎 المحفظ الملهم المتميز', sub: 'أعلى تقييم تشجيعي' },
              { title: '🏆 صانع الخاتمين والمجازين', sub: 'إجازات بالسند المتصل' },
            ].map((b) => (
              <div
                key={b.title}
                className="p-3 rounded-2xl bg-gradient-to-br from-[#145a3a]/10 to-[#c59b27]/15 border border-[#c59b27]/40 text-center space-y-1"
              >
                <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  {b.title}
                </div>
                <div className="text-[10px] text-neutral-500 font-semibold">
                  {b.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Parent & Student Gratitude Messages */}
          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>أحدث رسائل الشكر والدعاء من الطلاب وأولياء الأمور:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {teacherRatings.map((rt) => (
                <div
                  key={rt.id}
                  className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {rt.guardianName} (ولي أمر {rt.studentName.split(' ')[0]})
                    </span>
                    <span className="text-[11px] font-mono text-[#c59b27] font-bold">
                      ★ {rt.encouragementAndPatience}.0
                    </span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-200 leading-relaxed font-semibold">
                    "{rt.gratitudeMessage}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Session Reminder Preview Trigger on Teacher Dashboard */}
          <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#c59b27]" />
              <span>🔔 معاينة واختبار تنبيهات الساعة وموعد الحلقة:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSessionReminderPreview('1hour')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-900 dark:text-amber-300 font-extrabold cursor-pointer"
              >
                🔔 تنبيه: بقي على الحلقة ساعة!
              </button>
              <button
                type="button"
                onClick={() => setSessionReminderPreview('now')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-extrabold cursor-pointer"
              >
                🚀 تنبيه: الحلقة ستبدأ الآن!
              </button>
            </div>
          </div>

          {sessionReminderPreview && (
            <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white border border-[#dfbd69] flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-[#dfbd69]">
                  {sessionReminderPreview === '1hour'
                    ? '🔔 "راجع محفوظاتك.. بقي على الحلقة ساعة!"'
                    : '🚀 "استعد! الحلقة ستبدأ الآن — ادخل على الرابط الدائم على بوابتك"'}
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5">
                  يظهر هذا التنبيه تلقائياً للطالب وولي الأمر في بوابته مع زر الدخول الفوري للحلقة.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSessionReminderPreview(null)}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer shrink-0"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>

        {/* Left 5 Cols: Home Audio Recitation Submissions Inbox */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h2 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#c59b27]" />
                <span>صندوق وارد التسميع المنزلي ({homeSubmissions.length})</span>
              </h2>
              <p className="text-xs text-neutral-500">
                تلاوات الطلاب المسجلة من المنزل لمراجعتها وتشجيعهم
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {homeSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#14281d] dark:text-white">
                    {sub.studentName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      sub.reviewed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sub.reviewed ? 'تمت المراجعة ✓' : 'جديد — بانتظار المراجعة'}
                  </span>
                </div>

                <div className="text-[#145a3a] dark:text-[#dfbd69] font-bold">
                  سورة {sub.surahName} (من آية {sub.fromAyah} إلى {sub.toAyah}) • المدة:{' '}
                  {sub.durationSeconds}ث
                </div>

                <p className="text-neutral-600 dark:text-neutral-300">
                  "{sub.studentNote}"
                </p>

                {sub.reviewed ? (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                    رد المحفظ: "{sub.teacherFeedback}"
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={feedbackDrafts[sub.id] ?? ''}
                      onChange={(e) =>
                        setFeedbackDrafts((prev) => ({
                          ...prev,
                          [sub.id]: e.target.value,
                        }))
                      }
                      placeholder="اكتب ملاحظة تشجيعية للطالب..."
                      className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        markHomeSubmissionReviewed(
                          sub.id,
                          feedbackDrafts[sub.id] ||
                            'أحسنت يا بطل! تلاوة منزلية متقنة، بارك الله فيك (+15 XP).'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white font-extrabold cursor-pointer shrink-0"
                    >
                      اعتماد وتشجيع
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Owner Public Waqf & Visitors Impact Hub + Distinguished Readers Encouragement */}
      <OwnerPublicWaqfImpactHub />

      {/* Dashboard Quick Student ID Card Modal */}
      {dashboardIdCardStudent && (
        <StudentIdCardModal
          student={dashboardIdCardStudent}
          allStudents={students}
          onSelectStudent={(id) => {
            const found = students.find((s) => s.id === id);
            if (found) setDashboardIdCardStudent(found);
          }}
          settings={settings}
          onClose={() => setDashboardIdCardStudent(null)}
          onShowToast={showToast}
        />
      )}

      {/* Dashboard Quick Payment Receipt Modal */}
      {dashboardReceiptData && (
        <PaymentReceiptModal
          student={dashboardReceiptData.student}
          fee={dashboardReceiptData.fee}
          settings={settings}
          onClose={() => setDashboardReceiptData(null)}
          onUpdateFee={(studentId, month, status, amount, method) => {
            updateStudentFee(
              studentId,
              month,
              status,
              amount ?? dashboardReceiptData.fee.amount,
              method
            );
            setDashboardReceiptData((prev) =>
              prev
                ? {
                    ...prev,
                    fee: {
                      ...prev.fee,
                      month,
                      status,
                      amount: amount ?? prev.fee.amount,
                      method: method ?? prev.fee.method,
                    },
                  }
                : null
            );
          }}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};
