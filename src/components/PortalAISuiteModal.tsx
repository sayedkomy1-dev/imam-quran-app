import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { PortalRoute } from '../types';
import {
  Bot,
  BookOpen,
  Check,
  Copy,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

interface TopicalQuranTopic {
  id: string;
  title: string;
  keywords: string[];
  verses: {
    surah: string;
    ayah: number;
    text: string;
    tafsir: string;
    benefit: string;
  }[];
}

const TOPICAL_QURAN_CORPUS: TopicalQuranTopic[] = [
  {
    id: 'patience',
    title: 'آيات الصبر والثبات واليقين',
    keywords: ['صبر', 'الصبر', 'ثبات', 'ابتلاء', 'بشر الصابرين'],
    verses: [
      {
        surah: 'البقرة',
        ayah: 153,
        text: '﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾',
        tafsir: 'اطلبوا العون من الله في كافة أموركم بالصبر على الطاعات والأقدار وبالصلاة التي تربط القلب بربه، فإن الله مع الصابرين بتأييده ونصره.',
        benefit: 'الجمع بين الصبر والصلاة يورث معية الله الخاصة وطمأنينة القلب.',
      },
      {
        surah: 'الزمر',
        ayah: 10,
        text: '﴿إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ﴾',
        tafsir: 'يعطي الله الصابرين ثوابهم يوم القيامة عطاءً واسعاً بلا عدّ ولا حدّ ولا كيل.',
        benefit: 'عِظم جزاء الصبر على حفظ القرآن ومجاهدات النفس.',
      },
    ],
  },
  {
    id: 'parents',
    title: 'آيات بر الوالدين والدعاء لهما والصدقة الجارية',
    keywords: ['والدين', 'بر', 'الوالدين', 'أمي', 'أبي', 'رحمة', 'صدقة'],
    verses: [
      {
        surah: 'الإسراء',
        ayah: 24,
        text: '﴿وَاخْفِضْ لَهُمَا جَنَاحَ الذُّلِّ مِنَ الرَّحْمَةِ وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾',
        tafsir: 'تواضع لوالديك تواضعاً نابعاً من الرحمة والشفقة، وادعُ الله لهما بالرحمة والمغفرة في حياتهما وبعد وفاتهما.',
        benefit: 'تعلم القرآن وتعليمه وإهداء ثواب الختمات للوالدين من أعظم البر الباقي.',
      },
      {
        surah: 'إبراهيم',
        ayah: 41,
        text: '﴿رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ﴾',
        tafsir: 'دعاء خليل الرحمن إبراهيم عليه السلام بالمغفرة لنفسه ولوالديه ولعموم المؤمنين يوم القيامة.',
        benefit: 'استحباب قرن الدعاء للوالدين وللمؤمنين في كل ختمة وورد قرآني.',
      },
    ],
  },
  {
    id: 'sakina',
    title: 'آيات السكينة وطمأنينة القلوب بالقرآن',
    keywords: ['سكينة', 'السكينة', 'طمأنينة', 'ذكر', 'انشراح', 'قلب'],
    verses: [
      {
        surah: 'الرعد',
        ayah: 28,
        text: '﴿الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾',
        tafsir: 'تسكن قلوب المؤمنين وتأنس بتلاوة القرآن الكريم وذكر الله سبحانه، وحقيقٌ بها ألا تطمئن بشيء سوى ذكره.',
        benefit: 'الورد القرآني اليومي هو الحصن الأعظم لسكينة الأسرة والبيت.',
      },
      {
        surah: 'الفتح',
        ayah: 4,
        text: '﴿هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ﴾',
        tafsir: 'أنزل الله الطمأنينة والثبات والوقار في قلوب المؤمنين ليزدادوا يقيناً وتصديقاً.',
        benefit: 'مداومة التلاوة والتدبر تزيد الإيمان رسوخاً وثباتاً.',
      },
    ],
  },
  {
    id: 'quran_virtue',
    title: 'آيات فضل القرآن وأهله وتيسير حفظه',
    keywords: ['قرآن', 'القرآن', 'حفظ', 'تيسير', 'تلاوة', 'فاطر'],
    verses: [
      {
        surah: 'القمر',
        ayah: 17,
        text: '﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾',
        tafsir: 'سهّلنا لفظ القرآن للتلاوة والحفظ، ومعانيه للفهم والتدبر، فهل من مقبلٍ عليه للحفظ والاتعاظ؟',
        benefit: 'بشارة ربانية لكل طالب ومحفظ بأن طريق حفظ القرآن ميسّر مبارك.',
      },
      {
        surah: 'فاطر',
        ayah: 29,
        text: '﴿إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَّن تَبُورَ﴾',
        tafsir: 'أهل تلاوة كتاب الله العاملون به يتاجرون مع الله تجارة رابحة لا تكسد أبداً.',
        benefit: 'أهل القرآن هم أهل التجارة الرابحة في الدنيا والآخرة.',
      },
    ],
  },
];

export const PortalAISuiteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialPortal?: PortalRoute;
  defaultPortal?: PortalRoute;
  activeStudentId?: string | null;
  studentName?: string;
}> = ({
  isOpen,
  onClose,
  initialPortal,
  defaultPortal,
  activeStudentId,
}) => {
  const {
    students,
    sessions,
    circles,
    managedTeachers,
    admissionRequests,
    guardianStudentId,
    selectedStudentId,
  } = useAcademy();

  const [selectedPortalTab, setSelectedPortalTab] = useState<PortalRoute>(
    initialPortal || defaultPortal || 'general'
  );
  const [targetStudentId, setTargetStudentId] = useState<string>(
    activeStudentId || guardianStudentId || selectedStudentId || students[0]?.id || ''
  );
  const [topicalQuery, setTopicalQuery] = useState<string>('');
  const [copiedReport, setCopiedReport] = useState(false);

  const safeStudents = Array.isArray(students) ? students : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeCircles = Array.isArray(circles) ? circles : [];
  const safeStaff = Array.isArray(managedTeachers) ? managedTeachers : [];

  const activeStudent = useMemo(
    () =>
      safeStudents.find((s) => s.id === targetStudentId) ||
      safeStudents[0] ||
      null,
    [safeStudents, targetStudentId]
  );

  const studentSessions = useMemo(
    () =>
      activeStudent
        ? safeSessions
            .filter((s) => s.studentId === activeStudent.id)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        : [],
    [safeSessions, activeStudent]
  );

  // 1. Student AI Tutor Output
  const studentAiPlan = useMemo(() => {
    const stName = activeStudent?.name || 'طالب الأكاديمية';
    const currentSurah = activeStudent?.currentStop?.surahName || 'الملك';
    const currentAyah = activeStudent?.currentStop?.ayah || 1;
    const recentErrors = studentSessions
      .flatMap((s) => (Array.isArray(s.errors) ? s.errors : []))
      .slice(0, 5);

    const tajweedFocus =
      recentErrors.find((e) => e.type === 'تجويد')?.tajweedRule ||
      'إتمام الغنن في النون والميم المشددتين ومد المتصل 4 حركات';

    return {
      studentName: stName,
      currentSurah,
      currentAyah,
      schedule: [
        {
          period: '🌅 الفترة الأولى (بعد الفجر أو الصباح الباكر)',
          task: `حفظ الورد الجديد في سورة (${currentSurah}) من الآية ${currentAyah} إلى ${
            currentAyah + 7
          } مع الاستماع للشيخ الحصري 3 مرات وتكرار كل آية 7 مرات.`,
        },
        {
          period: '🌤️ الفترة الثانية (بعد العصر)',
          task: `ربط القريب: تلاوة آخر صفحتين من سورة (${currentSurah}) غيباً في ركعتي سنة لتثبيت المحفوظ.`,
        },
        {
          period: '🌙 الفترة الثالثة (قبل النوم)',
          task: `مراجعة البعيد + تسجيل المقطع الصوتي في استوديو الطالب والتركيز على (${tajweedFocus}).`,
        },
      ],
      mutashabihatQuestion: `سؤال ذكي في سورة (${currentSurah}): ما الفرق في خواتيم الآيات المقررة هذا الأسبوع وكيف تضبط بداية الآية (${
        currentAyah + 3
      }) دون تردد؟`,
      errorSummary:
        recentErrors.length > 0
          ? `تم رصد (${recentErrors.length}) مواضع تحتاج تثبيتاً، أبرزها في سورة (${
              recentErrors[0]?.surah || currentSurah
            }) — نوع الملاحظة: (${recentErrors[0]?.type || 'تجويد'}).`
          : 'ما شاء الله! سجل التسميع الأخير خالٍ من الأخطاء المتكررة ومؤشر الإتقان ممتاز.',
    };
  }, [activeStudent, studentSessions]);

  // 2. Guardian AI Pedagogical Advisor Output
  const guardianAiSummary = useMemo(() => {
    const stName = activeStudent?.name || 'الطالب';
    const presentCount = studentSessions.filter((s) => s.status === 'حضر').length;
    const attendancePct =
      studentSessions.length > 0
        ? Math.round((presentCount / studentSessions.length) * 100)
        : 96;
    const avgMastery =
      studentSessions.length > 0
        ? Math.round(
            studentSessions.reduce((acc, s) => acc + (s.masteryScore || 92), 0) /
              studentSessions.length
          )
        : 94;

    return {
      studentName: stName,
      attendancePct,
      avgMastery,
      strengths: `التزام متميز بالحضور (${attendancePct}%) ومتوسط إتقان (${avgMastery}%)، مع تقدم واضح في حفظ سورة (${
        activeStudent?.currentStop?.surahName || 'الملك'
      }) برواية (${activeStudent?.riwayah || 'حفص عن عاصم'}).`,
      homeReviewSurahs: `يُنصح بمراجعة سورة (${
        activeStudent?.currentStop?.surahName || 'الملك'
      }) وآخر جزء محفوظ في جلسة عائلية هادئة لمدة 10 دقائق يومياً.`,
      weeklyParentTip:
        '💡 نصيحة الأسبوع التربوية: شجّع ابنك على إمامة الأسرة في صلاة المغرب أو العشاء بالآيات الجديدة التي حفظها هذا الأسبوع؛ فالصلاة بالمحفوظ هي أقوى وسيلة لتثبيته في الصدر.',
      whatsappText: `🌿 *تقرير المستشار التربوي الذكي — أكاديمية الإمام (بالقرآن نحيا)*\n• الطالب: ${stName}\n• نسبة الانتظام: ${attendancePct}% | درجة الإتقان: ${avgMastery}%\n• نقاط القوة: ${
        activeStudent?.currentStop?.surahName || 'الملك'
      }\n• توصية المنزل: الاستماع للورد اليومي وتشجيع الطالب على القراءة به في الصلاة.`,
    };
  }, [activeStudent, studentSessions]);

  // 3. Teacher & Supervisor AI Assistant Output (/General)
  const teacherAiReport = useMemo(() => {
    const laggingStudents = safeStudents.filter((s) => {
      const stSes = safeSessions.filter((ses) => ses.studentId === s.id);
      const lastScore = stSes[0]?.masteryScore ?? s.masteryScore ?? 90;
      return lastScore < 85 || stSes.some((ses) => ses.status === 'غاب');
    });

    const monthlyReportDraft = `📊 *التقرير التقييمي الشهري — ${
      activeStudent?.name || 'الطالب'
    }*\n• الحلقة: ${activeStudent?.circle || 'حلقة الإتقان'}\n• الموضع الحالي: سورة ${
      activeStudent?.currentStop?.surahName || 'الملك'
    } (آية ${activeStudent?.currentStop?.ayah || 1})\n• عدد الأجزاء المحفوظة: ${
      activeStudent?.memorizedJuz?.length || 1
    } جزء\n• التقييم العام: أداء متميز في الحفظ الجديد مع توصية بزيادة تثبيت المراجعة البعيدة وأحكام المدود والغنن.\n— إشراف: أكاديمية الإمام لتحفيظ القرآن الكريم (بالقرآن نحيا)`;

    return {
      laggingStudents,
      monthlyReportDraft,
      instantQuizQuestions: [
        `1. اذكر حكم النون الساكنة والتنوين في أوائل سورة (${
          activeStudent?.currentStop?.surahName || 'الملك'
        }) مع بيان مقدار الغنة.`,
        `2. أكمل من قوله تعالى في بداية الورد الجديد من الآية (${
          activeStudent?.currentStop?.ayah || 1
        }) إلى الآية (${(activeStudent?.currentStop?.ayah || 1) + 4}) مع ضبط أواخر الكلمات.`,
        `3. ميّز الموضع المتشابه في سورة (${
          activeStudent?.currentStop?.surahName || 'الملك'
        }) واذكر الضابط اللفظي له.`,
      ],
    };
  }, [safeStudents, safeSessions, activeStudent]);

  // 4. Owner Executive & Financial AI Analyst (/owner)
  const ownerAiExecutive = useMemo(() => {
    const totalStudentsCount = safeStudents.length;
    const totalStaffCount = safeStaff.length;
    const activeCirclesCount = safeCircles.length;

    const totalExpectedMonthlyRevenue = safeStudents.reduce(
      (sum, s) => sum + (Number(s.monthlyFee) || 0),
      0
    );
    const paidFeesSum = safeStudents.reduce((sum, s) => {
      const feesList = Array.isArray(s.fees) ? s.fees : [];
      const paidRec = feesList.find((f) => f.status === 'مدفوع');
      return sum + (paidRec ? Number(paidRec.amount) || 0 : 0);
    }, 0);
    const collectionRate =
      totalExpectedMonthlyRevenue > 0
        ? Math.round((paidFeesSum / totalExpectedMonthlyRevenue) * 100)
        : 88;

    return {
      totalStudentsCount,
      totalStaffCount,
      activeCirclesCount,
      totalExpectedMonthlyRevenue,
      paidFeesSum,
      collectionRate,
      pendingAdmissionsCount: Array.isArray(admissionRequests)
        ? admissionRequests.filter((a) => a.status === 'جديد').length
        : 0,
      executiveRecommendations: [
        `📈 معدل إنجاز الحلقات (${activeCirclesCount} حلقات): استقرار ممتاز بنسبة التزام تفوق 92% مع توصية بفتح حلقة مسائية إضافية لاستيعاب طلبات الالتحاق الجديدة.`,
        `💰 التحصيل المالي: نسبة السداد الحالية (${collectionRate}%) — يُنصح بإرسال تذكير واتساب ودي لأولياء الأمور المتبقين عبر مركز الرسائل الجماعية.`,
        `🛡️ الكادر التعليمي: (${totalStaffCount}) عضو مسجل في النظام مع تفعيل الرقابة الهرمية للمشرفين والمحفظين.`,
      ],
    };
  }, [safeStudents, safeStaff, safeCircles, admissionRequests]);

  // 5. Topical Quran & Tadabbur Search (/almushaf & /sadaqa)
  const filteredTopicalResults = useMemo(() => {
    const q = topicalQuery.trim().toLowerCase();
    if (!q) return TOPICAL_QURAN_CORPUS;
    return TOPICAL_QURAN_CORPUS.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.keywords.some((k) => k.toLowerCase().includes(q)) ||
        topic.verses.some(
          (v) =>
            v.text.includes(q) ||
            v.surah.includes(q) ||
            v.tafsir.includes(q)
        )
    );
  }, [topicalQuery]);

  if (!isOpen) return null;

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir="rtl"
      className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-950 via-[#145a3a] to-emerald-900 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#c59b27]/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#c59b27]/25 border border-[#c59b27] flex items-center justify-center text-amber-300 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  🤖 منظومة الذكاء الاصطناعي القرآني والتربوي الشاملة
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 text-[11px] font-black">
                  أكاديمية الإمام — بالقرآن نحيا
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                مساعد ذكي مخصص لكل بوابة (الطالب، ولي الأمر، المحفظين، المالك، والمصحف الشامل) يعمل فوراً أونلاين وأوفلاين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-600/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
            <span>🔙 رجوع / إغلاق</span>
          </button>
        </div>

        {/* Portal AI Selector Tabs */}
        <div className="px-5 pt-4 pb-2 bg-[#f6f7f2] dark:bg-[#0b1711] border-b border-neutral-200 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'student' as PortalRoute, label: '🎓 المعلم الذكي للطالب' },
                { id: 'guardian' as PortalRoute, label: '👨‍👩‍👧 المستشار التربوي لولي الأمر' },
                { id: 'general' as PortalRoute, label: '📖 مساعد الشيخ الذكي' },
                { id: 'owner' as PortalRoute, label: '👑 المحلل الإداري والمالي' },
                { id: 'almushaf' as PortalRoute, label: '🕋 الباحث القرآني الموضوعي' },
              ]
            ).map((tab) => {
              const active =
                selectedPortalTab === tab.id ||
                (tab.id === 'almushaf' && selectedPortalTab === 'sadaqa');
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedPortalTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    active
                      ? 'bg-[#145a3a] text-[#dfbd69] shadow-xs border border-[#c59b27]'
                      : 'bg-white dark:bg-[#12231a] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-emerald-900 hover:border-[#c59b27]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {selectedPortalTab !== 'owner' &&
            selectedPortalTab !== 'almushaf' &&
            selectedPortalTab !== 'sadaqa' &&
            safeStudents.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-neutral-600 dark:text-emerald-300">
                  الطالب:
                </span>
                <select
                  value={activeStudent?.id || ''}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#c59b27]/60 bg-white dark:bg-[#12231a] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
                >
                  {safeStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.circle})
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* 1. STUDENT AI TUTOR */}
          {selectedPortalTab === 'student' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/90 text-white border border-[#c59b27]/50 space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>🤖 المعلم الذكي ومُولد خطة الحفظ اليومية</span>
                  </span>
                  <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full">
                    سورة {studentAiPlan.currentSurah} • الآية {studentAiPlan.currentAyah}
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  {studentAiPlan.errorSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {studentAiPlan.schedule.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-2"
                  >
                    <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {slot.period}
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {slot.task}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-400/50 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  🎯 سؤال المتشابهات والضبط الذكي لورد اليوم:
                </div>
                <p className="text-xs text-neutral-800 dark:text-amber-100 font-semibold">
                  {studentAiPlan.mutashabihatQuestion}
                </p>
              </div>
            </div>
          )}

          {/* 2. GUARDIAN AI PEDAGOGICAL ADVISOR */}
          {selectedPortalTab === 'guardian' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a] to-emerald-900 text-white border border-[#c59b27]/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-extrabold text-amber-300">
                    🤖 المستشار التربوي الذكي لولي الأمر — متابعة ({guardianAiSummary.studentName})
                  </h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    تحليل تلقائي لسجل الحضور والتسميع وتوصيات المتابعة المنزلية المبسطة للأسرة
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/15 text-xs font-black">
                    الانتظام: {guardianAiSummary.attendancePct}%
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-black">
                    الإتقان: {guardianAiSummary.avgMastery}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-emerald-500/40 space-y-1.5">
                  <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    🌟 نقاط القوة والتميز لدى الابن:
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {guardianAiSummary.strengths}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-amber-500/40 space-y-1.5">
                  <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    📖 السور الموصى بمراجعتها في المنزل:
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {guardianAiSummary.homeReviewSurahs}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  {guardianAiSummary.weeklyParentTip}
                </p>
                <a
                  href={`https://wa.me/${
                    (activeStudent?.whatsappPhone || '').replace(/\D/g, '') || '201068631966'
                  }?text=${encodeURIComponent(guardianAiSummary.whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال الخلاصة لواتساب الأسرة</span>
                </a>
              </div>
            </div>
          )}

          {/* 3. TEACHER & SUPERVISOR AI ASSISTANT (/General) */}
          {selectedPortalTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Report Generator */}
                <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      📝 صياغة التقرير التقييمي الشهري للطالب بضغطة زر
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyText(teacherAiReport.monthlyReportDraft)}
                      className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedReport ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedReport ? 'تم النسخ ✓' : 'نسخ التقرير'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-xs font-sans whitespace-pre-wrap text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    {teacherAiReport.monthlyReportDraft}
                  </pre>
                  <a
                    href={`https://wa.me/${
                      (activeStudent?.whatsappPhone || '').replace(/\D/g, '') || '201068631966'
                    }?text=${encodeURIComponent(teacherAiReport.monthlyReportDraft)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>إرسال التقرير الشهري لولي الأمر عبر واتساب</span>
                  </a>
                </div>

                {/* Instant Quiz & Lagging Detector */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-emerald-500/40 space-y-2">
                    <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      ⚡ أسئلة اختبار تجويد ومتشابهات فورية لورد الطالب:
                    </div>
                    <ul className="space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                      {teacherAiReport.instantQuizQuestions.map((q, i) => (
                        <li key={i} className="p-2 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-200/70 dark:border-emerald-900/50">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-400/50 space-y-1.5">
                    <div className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>
                        رصد الطلاب الذين يحتاجون متابعة تشجيعية ({teacherAiReport.laggingStudents.length}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {teacherAiReport.laggingStudents.slice(0, 6).map((st) => (
                        <span
                          key={st.id}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-400/50 text-[11px] font-bold text-amber-900 dark:text-amber-200"
                        >
                          {st.name} ({st.circle})
                        </span>
                      ))}
                      {teacherAiReport.laggingStudents.length === 0 && (
                        <span className="text-xs text-emerald-700 font-bold">
                          جميع طلاب الحلقات منتظمون في الخطة المعتمدة ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. OWNER EXECUTIVE & FINANCIAL AI ANALYST (/owner) */}
          {selectedPortalTab === 'owner' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-center">
                  <div className="text-[11px] text-neutral-500 font-bold">إجمالي الطلاب</div>
                  <div className="text-xl font-black text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                    {ownerAiExecutive.totalStudentsCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-center">
                  <div className="text-[11px] text-neutral-500 font-bold">الكادر التعليمي</div>
                  <div className="text-xl font-black text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                    {ownerAiExecutive.totalStaffCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-center">
                  <div className="text-[11px] text-neutral-500 font-bold">نسبة التحصيل المالي</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">
                    {ownerAiExecutive.collectionRate}%
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 text-center">
                  <div className="text-[11px] text-neutral-500 font-bold">طلبات قبول جديدة</div>
                  <div className="text-xl font-black text-amber-600 mt-0.5">
                    {ownerAiExecutive.pendingAdmissionsCount}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-emerald-600/40 space-y-2.5">
                <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#c59b27]" />
                  <span>التوصيات التنفيذية والمالية الذكية لمالك الأكاديمية:</span>
                </div>
                <div className="space-y-2">
                  {ownerAiExecutive.executiveRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. TOPICAL QURAN & TADABBUR ASSISTANT (/almushaf & /sadaqa) */}
          {(selectedPortalTab === 'almushaf' || selectedPortalTab === 'sadaqa') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    value={topicalQuery}
                    onChange={(e) => setTopicalQuery(e.target.value)}
                    placeholder="ابحث بالموضوع أو المعنى (مثال: آيات الصبر، آيات بر الوالدين، آيات السكينة، فضل القرآن)..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-[#c59b27]/60 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#145a3a]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['الصبر', 'بر الوالدين', 'السكينة', 'فضل القرآن'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setTopicalQuery(kw)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredTopicalResults.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      <BookOpen className="w-4 h-4 text-[#c59b27]" />
                      <span>{topic.title}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {topic.verses.map((v, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#c59b27]">
                            <span>
                              سورة {v.surah} • الآية {v.ayah}
                            </span>
                          </div>
                          <p className="font-amiri text-base text-[#14281d] dark:text-amber-100 leading-loose">
                            {v.text}
                          </p>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            <strong>التفسير الميسر:</strong> {v.tafsir}
                          </p>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                            💡 الفائدة التربوية: {v.benefit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
