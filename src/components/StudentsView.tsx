import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
   DAY_NAMES,
  JUZ_NAMES,
  SURAHS,
} from '../data/quranData';
import {
  FeeRecord,
  LinkLogic,
  QuranRiwayah,
  Student,
  StudentLevel,
  StudentPlan,
} from '../types';
import {
  buildWhatsAppUrl,
  isValidWhatsAppPhone,
  normalizeWhatsAppPhone,
} from '../utils/whatsapp';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import {
  HYBRID_FOUNDATION_LEVELS,
  OFFICIAL_ACADEMY_WHATSAPP,
} from '../data/hybridFoundationData';
import { QURAN_RIWAYAT_GUIDE } from '../data/educationalInnovationsData';
import {
  downloadPaymentReceiptPng,
  downloadStudentIdCardPng,
  generateOfflineQrMatrix,
  MilestoneBisharahModal,
  PaymentReceiptModal,
  StudentIdCardModal,
} from './StudentIdAndReceiptModals';
import { QuranTextModal } from './QuranTextModal';
import {
  FamilyGuidanceGeneratorSection,
  PedagogicalDiagnosticCard,
} from './PedagogicalAdvisorModal';
import { ERROR_PEDAGOGICAL_COACHING_MAP } from '../data/pedagogicalAdvisorData';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Crown,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  IdCard,
  MapPin,
  Phone,
  Plus,
  Printer,
  QrCode,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react';

export const StudentsView: React.FC = () => {
  const {
    students,
    sessions,
    circles,
    settings,
    selectedStudentId,
    setSelectedStudentId,
    setActiveTab,
    saveStudent,
    deleteStudent,
    setStudentAccountStatus,
    updateStudentFee,
    loginAsGuardianDirect,
    linkStudentStopToAyah,
    addStudentCustomMutashabih,
    deleteStudentCustomMutashabih,
    admissionRequests,
    approveAdmissionAsStudent,
    updateAdmissionRequestStatus,
    showToast,
  } = useAcademy();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [circleFilter, setCircleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'نشط' | 'متوقف' | 'مؤرشف' | 'all'>('نشط');
  const [profileTab, setProfileTab] = useState<
    'overview' | 'id_and_receipts' | 'mushaf' | 'errors' | 'sessions'
  >('overview');
  const [mushafViewMode, setMushafViewMode] = useState<'surahs' | 'juz'>('surahs');

  // Add/Edit Student Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formGuardian, setFormGuardian] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPin, setFormPin] = useState('123456');
  const [formLevel, setFormLevel] = useState<StudentLevel>('مبتدئ');
  const [formRiwayah, setFormRiwayah] = useState<QuranRiwayah>('حفص عن عاصم');
  const [formCircle, setFormCircle] = useState(circles[0]?.name || '');
  const [formPlan, setFormPlan] = useState<StudentPlan>('متوازنة');
  const [formLinkLogic, setFormLinkLogic] = useState<LinkLogic>('الآية التالية');
  const [formDays, setFormDays] = useState<number[]>([0, 2, 4]);
  const [formTime, setFormTime] = useState('17:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formFee, setFormFee] = useState(300);
  const [formNotes, setFormNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showAdmissionDrawer, setShowAdmissionDrawer] = useState(false);

  // Certificate Modal State
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [certificateReason, setCertificateReason] = useState(
    'إتمام حفظ ومراجعة المقرر بتقدير ممتاز'
  );

  // Smart Student ID Card + Payment Receipt + Milestone Bisharah + Unified Mushaf Modal State
  const [studentIdCardOpen, setStudentIdCardOpen] = useState(false);
  const [bisharahModalOpen, setBisharahModalOpen] = useState(false);
  const [mushafModalOpen, setMushafModalOpen] = useState(false);
  const [activeReceiptFee, setActiveReceiptFee] = useState<FeeRecord | null>(
    null
  );

  // Personal Student Mutashabihat Form State
  const [mutFormOpen, setMutFormOpen] = useState(false);
  const [mutPrimarySurahId, setMutPrimarySurahId] = useState(78);
  const [mutPrimaryAyah, setMutPrimaryAyah] = useState(1);
  const [mutPrimaryText, setMutPrimaryText] = useState('');
  const [mutSimilarSurahId, setMutSimilarSurahId] = useState(79);
  const [mutSimilarAyah, setMutSimilarAyah] = useState(1);
  const [mutSimilarText, setMutSimilarText] = useState('');
  const [mutDiffWord1, setMutDiffWord1] = useState('');
  const [mutDiffWord2, setMutDiffWord2] = useState('');
  const [mutRuleNote, setMutRuleNote] = useState('');

  const openReceiptForStudent = (st: Student, feeItem?: FeeRecord) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existing =
      feeItem ||
      st.fees.find((f) => f.month === currentMonth) ||
      st.fees[0] || {
        month: currentMonth,
        amount: st.monthlyFee || 350,
        status: 'مدفوع' as const,
        paidAt: new Date().toISOString().slice(0, 10),
        method: 'إنستا باي (InstaPay)',
        receiptNumber: `REC-${currentMonth.replace('-', '')}-${
          st.id.replace(/\D/g, '') || '101'
        }`,
      };
    setSelectedStudentId(st.id);
    setActiveReceiptFee({
      ...existing,
      receiptNumber:
        existing.receiptNumber ||
        `REC-${existing.month.replace('-', '')}-${
          st.id.replace(/\D/g, '') || '101'
        }`,
      paidAt: existing.paidAt || new Date().toISOString().slice(0, 10),
      method: existing.method || 'إنستا باي (InstaPay)',
    });
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim();
    return students.filter((st) => {
      const matchSearch =
        !q ||
        st.name.includes(q) ||
        st.guardianName.includes(q) ||
        st.whatsappPhone.includes(q) ||
        st.circle.includes(q);
      const matchLevel = !levelFilter || st.level === levelFilter;
      const matchCircle = !circleFilter || st.circle === circleFilter;
      const stStatus = st.accountStatus || 'نشط';
      const matchStatus = statusFilter === 'all' || stStatus === statusFilter;
      return matchSearch && matchLevel && matchCircle && matchStatus;
    });
  }, [students, searchQuery, levelFilter, circleFilter, statusFilter]);

  const activeStudent = useMemo(() => {
    return (
      students.find((s) => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0] ||
      null
    );
  }, [students, selectedStudentId, filteredStudents]);

  const studentSessions = useMemo(() => {
    if (!activeStudent) return [];
    return sessions
      .filter((s) => s.studentId === activeStudent.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, activeStudent]);

  // Repeated Errors Analysis
  const errorStats = useMemo(() => {
    const counts: Record<string, number> = {
      حفظ: 0,
      تردد: 0,
      تلقين: 0,
      تجويد: 0,
      تشكيل: 0,
      'نسيان آية': 0,
    };
    const detailedList = studentSessions.flatMap((s) => s.errors || []);
    detailedList.forEach((err) => {
      counts[err.type] = (counts[err.type] || 0) + 1;
    });
    return { counts, detailedList };
  }, [studentSessions]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormGuardian('');
    setFormPhone('010');
    setFormPin('123456');
    setFormLevel('مبتدئ');
    setFormRiwayah('حفص عن عاصم');
    setFormCircle(circles[0]?.name || 'حلقة النور والبيان (الناشئة)');
    setFormPlan('متوازنة');
    setFormLinkLogic('الآية التالية');
    setFormDays([0, 2, 4]);
    setFormTime('17:00');
    setFormDuration(30);
    setFormFee(300);
    setFormNotes('');
    setPhoneError('');
    setModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    setEditingStudent(st);
    setFormName(st.name);
    setFormGuardian(st.guardianName);
    setFormPhone(st.whatsappPhone);
    setFormPin(st.guardianPin || '123456');
    setFormLevel(st.level);
    setFormRiwayah(st.riwayah || 'حفص عن عاصم');
    setFormCircle(st.circle);
    setFormPlan(st.plan);
    setFormLinkLogic(st.linkLogic);
    setFormDays(st.scheduleDays);
    setFormTime(st.scheduleTime);
    setFormDuration(st.sessionDuration);
    setFormFee(st.monthlyFee);
    setFormNotes(st.notes);
    setPhoneError('');
    setModalOpen(true);
  };

  const handleToggleDay = (dayIndex: number) => {
    setFormDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    if (!isValidWhatsAppPhone(formPhone)) {
      setPhoneError('رقم واتساب غير صحيح. أدخل رقماً صحيحاً مثل 01012345678 أو 966501234567');
      return;
    }

    const saved = saveStudent({
      id: editingStudent?.id,
      name: formName.trim(),
      guardianName: formGuardian.trim() || 'ولي الأمر',
      whatsappPhone: normalizeWhatsAppPhone(formPhone),
      guardianPin: formPin.trim() || '123456',
      level: formLevel,
      riwayah: formRiwayah,
      circle: formCircle,
      plan: formPlan,
      linkLogic: formLinkLogic,
      scheduleDays: formDays,
      scheduleTime: formTime,
      sessionDuration: formDuration,
      startDate: editingStudent?.startDate || new Date().toISOString().slice(0, 10),
      notes: formNotes.trim(),
      memorizedSurahs: editingStudent?.memorizedSurahs || [1, 112, 113, 114],
      inProgressSurahs: editingStudent?.inProgressSurahs || [78],
      memorizedJuz: editingStudent?.memorizedJuz || [],
      currentStop: editingStudent?.currentStop || {
        surahId: 78,
        surahName: 'النبأ',
        ayah: 1,
        juzNumber: 30,
      },
      monthlyFee: Number(formFee) || 300,
      fees: editingStudent?.fees || [],
      disciplineWarnings: editingStudent?.disciplineWarnings || [],
    });

    setSelectedStudentId(saved.id);
    setModalOpen(false);
  };

  const toggleSurahMemorized = (surahId: number) => {
    if (!activeStudent) return;
    const isMem = activeStudent.memorizedSurahs.includes(surahId);
    const nextList = isMem
      ? activeStudent.memorizedSurahs.filter((id) => id !== surahId)
      : [...activeStudent.memorizedSurahs, surahId];
    saveStudent({ ...activeStudent, memorizedSurahs: nextList });
  };

  const toggleJuzMemorized = (juzNum: number) => {
    if (!activeStudent) return;
    const isMem = activeStudent.memorizedJuz.includes(juzNum);
    const nextList = isMem
      ? activeStudent.memorizedJuz.filter((j) => j !== juzNum)
      : [...activeStudent.memorizedJuz, juzNum];
    saveStudent({ ...activeStudent, memorizedJuz: nextList });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#12231a] p-4 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطالب، ولي الأمر، أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold focus:outline-hidden focus:border-[#145a3a]"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
          >
            <option value="">جميع المستويات</option>
            <option value="مبتدئ">مبتدئ</option>
            <option value="متوسط">متوسط</option>
            <option value="متقدم">متقدم</option>
          </select>

          <select
            value={circleFilter}
            onChange={(e) => setCircleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
          >
            <option value="">جميع الحلقات والمجموعات</option>
            {circles.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'نشط' | 'متوقف' | 'مؤرشف' | 'all'
              )
            }
            className="px-3.5 py-2.5 rounded-xl border border-[#c59b27]/60 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
            title="تصفية الطلاب حسب حالة الملف وسياسة الأرشفة الآمنة"
          >
            <option value="نشط">الطلاب النشطون ({students.filter((s) => (s.accountStatus || 'نشط') === 'نشط').length})</option>
            <option value="متوقف">المتوقفون مؤقتاً ({students.filter((s) => s.accountStatus === 'متوقف').length})</option>
            <option value="مؤرشف">الأرشيف الآمن ({students.filter((s) => s.accountStatus === 'مؤرشف').length})</option>
            <option value="all">جميع الملفات ({students.length})</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeStudent && (
            <>
              <button
                type="button"
                onClick={() => setStudentIdCardOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-xs font-extrabold hover:bg-[#c59b27]/15 transition-colors cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-[#c59b27]" />
                <span>بطاقة الطالب الذكية</span>
              </button>

              <button
                type="button"
                onClick={() => openReceiptForStudent(activeStudent)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>إصدار إيصال سداد</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowAdmissionDrawer((p) => !p)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[#c59b27]" />
            <span>
              طابور القبول ({admissionRequests.filter((r) => r.status !== 'تم القبول').length})
            </span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#dfbd69]" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* 4. طابور القبول وطلبات الالتحاق للطلاب الجدد (New Student Admission Queue) */}
      {showAdmissionDrawer && (
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-5 border-2 border-[#c59b27] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-emerald-950">
            <div>
              <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c59b27]" />
                <span>طلبات الالتحاق وطابور القبول وتحديد المستوى ({admissionRequests.length})</span>
              </h3>
              <p className="text-xs text-neutral-500">
                راجع طلبات أولياء الأمور الجدد واقبل الطالب بضغطة واحدة لإنشاء ملفه وإلحاقه بالحلقة المناسبة
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdmissionDrawer(false)}
              className="px-3 py-1 rounded-xl bg-neutral-100 dark:bg-emerald-950 text-xs font-bold cursor-pointer"
            >
              إخفاء ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {admissionRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-[#145a3a] dark:text-[#dfbd69]">
                    {req.studentName} ({req.age} سنوات)
                  </strong>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                    {req.status}
                  </span>
                </div>
                <div className="text-neutral-600 dark:text-neutral-300 space-y-0.5">
                  <div>
                    ولي الأمر: <strong>{req.guardianName}</strong> • واتساب:{' '}
                    <span className="font-mono">{req.guardianPhone}</span>
                  </div>
                  <div>
                    الرواية المطلوبة: <strong>{req.requestedRiwayah}</strong> • المستوى:{' '}
                    {req.currentLevel}
                  </div>
                  <div>
                    الموعد المفضل: {req.preferredDays} ({req.preferredTime}) • المنطقة:{' '}
                    {req.countryOrTimezone}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40">
                  {req.status !== 'تم القبول' && (
                    <button
                      type="button"
                      onClick={() =>
                        approveAdmissionAsStudent(
                          req.id,
                          circles[0]?.name || 'حلقة النور والبيان (الناشئة)'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white font-extrabold cursor-pointer"
                    >
                      ✅ قبول وإنشاء ملف طالب فوراً
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateAdmissionRequestStatus(req.id, 'تم تحديد الموعد')
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#c59b27]/25 text-[#14281d] dark:text-[#dfbd69] font-bold cursor-pointer"
                  >
                    📅 تحديد موعد المقابلة
                  </button>
                  <a
                    href={buildWhatsAppUrl(
                      req.guardianPhone || req.whatsappPhone || '',
                      `السلام عليكم ورحمة الله، مرحباً بكم في ${settings.academyName}. بخصوص طلب التحاق الطالب (${req.studentName}) برواية (${req.requestedRiwayah || req.preferredRiwayah})، يسعدنا تحديد موعد المقابلة وتحديد المستوى.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                  >
                    💬 مراسلة ولي الأمر
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Split View: Students List (Right 4 cols) + Comprehensive Student Profile (Left 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Students List Column */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-neutral-500">
            <span>قائمة الطلاب ({filteredStudents.length})</span>
            <span>انقر لعرض الملف الشامل</span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pl-1">
            {filteredStudents.map((st) => {
              const isSelected = activeStudent?.id === st.id;
              const stSessions = sessions.filter(
                (s) => s.studentId === st.id && s.status === 'حضر'
              );
              const avgMastery =
                stSessions.length > 0
                  ? Math.round(
                      stSessions.reduce((a, b) => a + b.masteryScore, 0) /
                        stSessions.length
                    )
                  : 90;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#145a3a] text-white border-[#145a3a] shadow-md'
                      : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50 hover:border-[#145a3a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white/15 text-[#dfbd69]'
                            : 'bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69]'
                        }`}
                      >
                        {st.name
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{st.name}</div>
                        <div
                          className={`text-xs truncate mt-0.5 ${
                            isSelected
                              ? 'text-emerald-100'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {st.level} · خطة {st.plan} · إتقان {avgMastery}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                      isSelected
                        ? 'border-emerald-700/70 text-emerald-100'
                        : 'border-neutral-100 dark:border-emerald-950 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <span>
                      توقف: سورة {st.currentStop.surahName} ({st.currentStop.ayah})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(st.id);
                          setStudentIdCardOpen(true);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                          isSelected
                            ? 'bg-white/20 text-[#dfbd69]'
                            : 'bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69]'
                        }`}
                        title="عرض بطاقة الطالب الذكية"
                      >
                        🪪 البطاقة
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReceiptForStudent(st);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer ${
                          isSelected
                            ? 'bg-[#c59b27] text-[#14281d]'
                            : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        }`}
                        title="إصدار إيصال سداد"
                      >
                        🧾 إيصال
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comprehensive Student Profile Column */}
        <div className="lg:col-span-8">
          {activeStudent ? (
            <div className="rounded-3xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 shadow-xs overflow-hidden">
              {/* Profile Header */}
              <div className="p-6 bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 border border-[#c59b27]/50 flex items-center justify-center text-xl font-extrabold text-[#dfbd69]">
                      {activeStudent.name
                        .split(' ')
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">{activeStudent.name}</h2>
                      <p className="text-xs text-emerald-100 mt-1">
                        {activeStudent.circle} · المستوى: {activeStudent.level} · الخطة:{' '}
                        {activeStudent.plan} · الربط: من {activeStudent.linkLogic}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#dfbd69] mt-2">
                        <span>ولي الأمر: {activeStudent.guardianName}</span>
                        <span>·</span>
                        <span className="tabular-nums font-mono" dir="ltr">
                          +{activeStudent.whatsappPhone}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums font-mono">
                          PIN البوابة: {activeStudent.guardianPin}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudentId(activeStudent.id);
                        setActiveTab('session');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-bold cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>بدء حصة</span>
                    </button>

                    <button
                      onClick={() => setStudentIdCardOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-[#dfbd69]/50 text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                      title="إصدار بطاقة الطالب الذكية ومشاركة QR أوفلاين"
                    >
                      <IdCard className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>بطاقة الطالب (QR)</span>
                    </button>

                    <button
                      onClick={() => openReceiptForStudent(activeStudent)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-300/40 text-white text-xs font-extrabold cursor-pointer"
                      title="إصدار إيصال سداد رقمي للطالب"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>إيصال سداد</span>
                    </button>

                    <button
                      onClick={() => setCertificateOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>شهادة تقدير</span>
                    </button>

                    <button
                      onClick={() => setBisharahModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer shadow-xs"
                      title="توليد بطاقة بشارة عائلية مصورة ومشاركتها عبر واتساب"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🎉 بطاقة بشارة</span>
                    </button>

                    <button
                      onClick={() => openEditModal(activeStudent)}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                      title="تعديل بيانات الطالب"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <a
                      href={buildWhatsAppUrl(
                        activeStudent.whatsappPhone,
                        `${settings.whatsappHeader}\n\nولي أمر الطالب *${activeStudent.name}*، نود إطلاعكم بأن الطالب متوقف حالياً عند سورة ${activeStudent.currentStop.surahName} آية ${activeStudent.currentStop.ayah}.\n\n${settings.whatsappFooter}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                      title="مراسلة ولي الأمر عبر واتساب"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => loginAsGuardianDirect(activeStudent.id)}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                      title="معاينة بوابة ولي الأمر لهذا الطالب"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {(activeStudent.accountStatus || 'نشط') !== 'نشط' ? (
                      <button
                        onClick={() =>
                          setStudentAccountStatus(activeStudent.id, 'نشط')
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-extrabold cursor-pointer"
                        title="إعادة تفعيل ملف الطالب في الحلقات النشطة مع كامل سجله"
                      >
                        إعادة تفعيل الملف
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setStudentAccountStatus(
                              activeStudent.id,
                              'متوقف',
                              'إيقاف مؤقت مع حفظ السجل'
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 text-[11px] font-bold cursor-pointer"
                          title="تحويل الطالب إلى متوقف مؤقتاً دون فقدان أي بيانات"
                        >
                          إيقاف مؤقت
                        </button>
                        <button
                          onClick={() =>
                            setStudentAccountStatus(
                              activeStudent.id,
                              'مؤرشف',
                              'أرشفة آمنة مع الاحتفاظ الكامل بالسجل'
                            )
                          }
                          className="p-2 rounded-xl bg-red-500/30 hover:bg-red-500/60 text-red-100 cursor-pointer"
                          title="أرشفة آمنة لملف الطالب (يحتفظ بكامل السجل التاريخي والأخطاء والمدفوعات)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs inside Student Profile */}
              <div className="flex border-b border-neutral-200 dark:border-emerald-900/50 px-6 bg-[#f6f7f2]/50 dark:bg-[#0b1711]/50 overflow-x-auto">
                {[
                  { id: 'overview', label: 'لوحة التقدم وأين توقفنا؟' },
                  {
                    id: 'id_and_receipts',
                    label: '🪪 بطاقة الطالب وإيصالات السداد',
                  },
                  {
                    id: 'mushaf',
                    label: 'خريطة التقدم في المصحف (30 جزءاً / 114 سورة)',
                  },
                  {
                    id: 'errors',
                    label: `سجل الأخطاء المتكررة (${errorStats.detailedList.length})`,
                  },
                  {
                    id: 'sessions',
                    label: `سجل الحصص (${studentSessions.length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setProfileTab(tab.id as typeof profileTab)}
                    className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      profileTab === tab.id
                        ? 'border-[#145a3a] dark:border-[#dfbd69] text-[#145a3a] dark:text-[#dfbd69]'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Profile Body Content */}
              <div className="p-6">
                {/* Tab 1: Overview & Where We Stopped & Evaluation Trajectory */}
                {profileTab === 'overview' && (
                  <div className="space-y-6">
                    {/* "Where Did We Stop?" Card */}
                    <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#c59b27]">
                            أين توقفنا؟ (موضع التسميع والربط الحالي)
                          </div>
                          <div className="text-lg font-extrabold text-[#14281d] dark:text-white mt-0.5">
                            سورة {activeStudent.currentStop.surahName} — الآية{' '}
                            <span className="tabular-nums font-mono">
                              {activeStudent.currentStop.ayah}
                            </span>{' '}
                            (الجزء {activeStudent.currentStop.juzNumber})
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            منطق الربط المعتمد: البدء من{' '}
                            <strong>{activeStudent.linkLogic}</strong> · أيام الحصة:{' '}
                            {activeStudent.scheduleDays.map((d) => DAY_NAMES[d]).join('، ')} الساعة{' '}
                            <span className="tabular-nums font-mono">
                              {activeStudent.scheduleTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setMushafModalOpen(true)}
                          className="px-3.5 py-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold hover:bg-[#b58c1e] transition-colors cursor-pointer"
                        >
                          📖 المصحف الموحد / ربط الطالب بالآية
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentId(activeStudent.id);
                            setActiveTab('smartboard');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] transition-colors cursor-pointer"
                        >
                          فتح الموضع في السبورة الذكية
                        </button>
                      </div>
                    </div>

                    {/* Progress KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50">
                        <div className="text-xs text-neutral-500">سور محفوظة</div>
                        <div className="text-2xl font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums mt-1">
                          {activeStudent.memorizedSurahs.length}{' '}
                          <span className="text-xs font-normal text-neutral-400">/ 114</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50">
                        <div className="text-xs text-neutral-500">أجزاء مكتملة</div>
                        <div className="text-2xl font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums mt-1">
                          {activeStudent.memorizedJuz.length}{' '}
                          <span className="text-xs font-normal text-neutral-400">/ 30</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50">
                        <div className="text-xs text-neutral-500">متوسط الإتقان</div>
                        <div className="text-2xl font-extrabold text-emerald-600 tabular-nums mt-1">
                          {studentSessions.filter((s) => s.status === 'حضر').length > 0
                            ? Math.round(
                                studentSessions
                                  .filter((s) => s.status === 'حضر')
                                  .reduce((a, b) => a + b.masteryScore, 0) /
                                  studentSessions.filter((s) => s.status === 'حضر').length
                              )
                            : 92}
                          %
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50">
                        <div className="text-xs text-neutral-500">إجمالي الحصص</div>
                        <div className="text-2xl font-extrabold text-[#14281d] dark:text-white tabular-nums mt-1">
                          {studentSessions.filter((s) => s.status === 'حضر').length}
                        </div>
                      </div>
                    </div>

                    {/* Al-Imam Hybrid Foundation & Live Gamification Progress Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-l from-[#145a3a]/10 to-[#c59b27]/10 border border-[#c59b27]/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-xl bg-[#145a3a] text-[#dfbd69]">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                                منهج الإمام للتأسيس ونقاط الهمة
                              </span>
                              {activeStudent.hasGoldenCrown && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/25 border border-amber-500 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                                  <Crown className="w-3 h-3" /> تاج الإتقان الذهبي
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-extrabold text-[#14281d] dark:text-white mt-0.5">
                              {HYBRID_FOUNDATION_LEVELS.find(
                                (l) => l.level === (activeStudent.foundationLevel || 1)
                              )?.title || 'المستوى 1: الحروف الهجائية مجردة'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold font-mono">
                            ⚡ {activeStudent.xpPoints || 120} XP نقطة همة
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(activeStudent.id);
                              setActiveTab('foundation');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold cursor-pointer"
                          >
                            فتح منهج الإمام للتأسيس ←
                          </button>
                        </div>
                      </div>

                      {activeStudent.badges && activeStudent.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#c59b27]/25">
                          <span className="text-[11px] font-bold text-neutral-500 ml-1">
                            الأوسمة المكتسبة:
                          </span>
                          {activeStudent.badges.map((badge) => (
                            <span
                              key={badge}
                              className="px-2.5 py-1 rounded-full bg-white dark:bg-[#12231a] border border-[#c59b27]/50 text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
                            >
                              🏅 {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pedagogical Advisor & Learning Style Diagnostic Card + Family Guidance Generator */}
                    <div id="pg-profile" className="space-y-4">
                      <PedagogicalDiagnosticCard
                        student={activeStudent}
                        errors={errorStats.detailedList}
                      />
                      <FamilyGuidanceGeneratorSection
                        student={activeStudent}
                        errors={errorStats.detailedList}
                        surahName={activeStudent.currentStop.surahName}
                        fromAyah={activeStudent.currentStop.ayah}
                        toAyah={activeStudent.currentStop.ayah + 5}
                      />
                    </div>

                    {/* Evaluation Trajectory Chart */}
                    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-emerald-900/50">
                      <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                        <span>مسار التقييم ونسبة الإتقان عبر الحصص</span>
                      </h3>
                      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 items-end h-36 pt-4">
                        {studentSessions
                          .filter((s) => s.status === 'حضر')
                          .slice(0, 8)
                          .reverse()
                          .map((ses) => (
                            <div
                              key={ses.id}
                              className="flex flex-col items-center justify-end h-full"
                            >
                              <span className="text-[11px] font-mono tabular-nums font-bold text-[#145a3a] dark:text-[#dfbd69] mb-1">
                                {ses.masteryScore}%
                              </span>
                              <div className="w-full max-w-[34px] h-24 bg-neutral-100 dark:bg-[#0b1711] rounded-xl p-1 flex items-end">
                                <div
                                  style={{ height: `${Math.max(20, ses.masteryScore)}%` }}
                                  className={`w-full rounded-lg ${
                                    ses.masteryScore >= 90
                                      ? 'bg-[#145a3a]'
                                      : ses.masteryScore >= 75
                                      ? 'bg-[#c59b27]'
                                      : 'bg-red-500'
                                  }`}
                                />
                              </div>
                              <span className="text-[10px] font-mono tabular-nums text-neutral-400 mt-1.5 text-center leading-tight">
                                {formatGregorianAndHijri(
                                  ses.date,
                                  settings.showHijriDates ?? true,
                                  'compact'
                                )}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Notes & Discipline */}
                    <div className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] text-xs leading-relaxed">
                      <strong className="block mb-1 text-[#145a3a] dark:text-[#dfbd69]">
                        ملاحظات المعلم حول الطالب:
                      </strong>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {activeStudent.notes || 'لا توجد ملاحظات مسجلة.'}
                      </p>
                    </div>

                    {/* Personal Student Mutashabihat Cards (بطاقات متشابهاتي الخاصة للطالب) */}
                    <div className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                            <span>🔗 بطاقات «متشابهاتي الخاصة» للطالب ({activeStudent.customMutashabihat?.length || 0})</span>
                          </h3>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            ربط الآيات المتشابهة التي التبست على الطالب أثناء التسميع مع تلوين موضع الاختلاف وكتابة ضابط التفرقة
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMushafModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                          >
                            📖 ربط من المصحف
                          </button>
                          <button
                            type="button"
                            onClick={() => setMutFormOpen((prev) => !prev)}
                            className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                          >
                            {mutFormOpen ? 'إغلاق النموذج' : '➕ إضافة بطاقة متشابهات'}
                          </button>
                        </div>
                      </div>

                      {mutFormOpen && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/40 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                                الموضع الأول (السورة والآية والنص)
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={mutPrimarySurahId}
                                  onChange={(e) => setMutPrimarySurahId(Number(e.target.value))}
                                  className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                                >
                                  {SURAHS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.id}. {s.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  value={mutPrimaryAyah}
                                  onChange={(e) => setMutPrimaryAyah(Number(e.target.value) || 1)}
                                  className="w-20 px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                                  placeholder="الآية"
                                />
                              </div>
                              <input
                                type="text"
                                value={mutPrimaryText}
                                onChange={(e) => setMutPrimaryText(e.target.value)}
                                placeholder="نص الآية الأولى أو موضع الاشتباه..."
                                className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                              />
                              <input
                                type="text"
                                value={mutDiffWord1}
                                onChange={(e) => setMutDiffWord1(e.target.value)}
                                placeholder="الكلمة المميزة في الآية الأولى (تُلون بالأحمر)"
                                className="w-full px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                                الموضع الثاني المشابه (السورة والآية والنص)
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={mutSimilarSurahId}
                                  onChange={(e) => setMutSimilarSurahId(Number(e.target.value))}
                                  className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                                >
                                  {SURAHS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.id}. {s.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min={1}
                                  value={mutSimilarAyah}
                                  onChange={(e) => setMutSimilarAyah(Number(e.target.value) || 1)}
                                  className="w-20 px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                                  placeholder="الآية"
                                />
                              </div>
                              <input
                                type="text"
                                value={mutSimilarText}
                                onChange={(e) => setMutSimilarText(e.target.value)}
                                placeholder="نص الآية الثانية المشابهة..."
                                className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                              />
                              <input
                                type="text"
                                value={mutDiffWord2}
                                onChange={(e) => setMutDiffWord2(e.target.value)}
                                placeholder="الكلمة المميزة في الآية الثانية (تُلون بالأحمر)"
                                className="w-full px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={mutRuleNote}
                              onChange={(e) => setMutRuleNote(e.target.value)}
                              placeholder="ضابط التفرقة الذهني (مثال: اربط الواو باسم السورة أو سياق القصة)..."
                              className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const s1 = SURAHS.find((s) => s.id === mutPrimarySurahId) || SURAHS[0];
                                const s2 = SURAHS.find((s) => s.id === mutSimilarSurahId) || SURAHS[0];
                                addStudentCustomMutashabih(activeStudent.id, {
                                  primarySurahId: s1.id,
                                  primarySurahName: s1.name,
                                  primaryAyah: mutPrimaryAyah,
                                  primaryText:
                                    mutPrimaryText.trim() ||
                                    `سورة ${s1.name} — الآية ${mutPrimaryAyah}`,
                                  similarSurahId: s2.id,
                                  similarSurahName: s2.name,
                                  similarAyah: mutSimilarAyah,
                                  similarText:
                                    mutSimilarText.trim() ||
                                    `سورة ${s2.name} — الآية ${mutSimilarAyah}`,
                                  differenceWord1: mutDiffWord1.trim() || 'موضع 1',
                                  differenceWord2: mutDiffWord2.trim() || 'موضع 2',
                                  ruleNote:
                                    mutRuleNote.trim() ||
                                    'الانتباه لسياق السورة وضبط الكلمة المميزة عند التسميع.',
                                });
                                setMutPrimaryText('');
                                setMutSimilarText('');
                                setMutDiffWord1('');
                                setMutDiffWord2('');
                                setMutRuleNote('');
                                setMutFormOpen(false);
                              }}
                              className="px-4 py-2 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold cursor-pointer shrink-0"
                            >
                              💾 حفظ البطاقة في ملف الطالب
                            </button>
                          </div>
                        </div>
                      )}

                      {activeStudent.customMutashabihat &&
                      activeStudent.customMutashabihat.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeStudent.customMutashabihat.map((card) => (
                            <div
                              key={card.id}
                              className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-2"
                            >
                              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                                <span>
                                  سورة {card.primarySurahName} ({card.primaryAyah}) ⇄ سورة{' '}
                                  {card.similarSurahName} ({card.similarAyah})
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteStudentCustomMutashabih(activeStudent.id, card.id)
                                  }
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  title="حذف بطاقة المتشابهات"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="text-xs font-quran p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] leading-relaxed">
                                <div>
                                  1️⃣ {card.primaryText}{' '}
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                                    {card.differenceWord1}
                                  </span>
                                </div>
                                <div className="mt-1">
                                  2️⃣ {card.similarText}{' '}
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
                                    {card.differenceWord2}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                💡 ضابط التفرقة: {card.ruleNote}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500">
                          لا توجد بطاقات متشابهات خاصة مضافة لهذا الطالب بعد. يمكنك إضافتها من هنا أو مباشرة أثناء التسميع من نافذة المصحف الموحد.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 1.5: Smart Student ID Card & Official Payment Receipts Hub */}
                {profileTab === 'id_and_receipts' && (
                  <div className="space-y-6">
                    {/* Live Interactive Smart Student ID Card Preview */}
                    <div className="p-5 rounded-3xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27]/50 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-2xl bg-[#145a3a] text-[#dfbd69]">
                            <IdCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                              بطاقة الهوية القرآنية الذكية للطالب (Student ID + Offline QR)
                            </h3>
                            <p className="text-xs text-neutral-500">
                              بطاقة معتمدة تحتوي على QR كود أوفلاين، رمز الدخول (PIN)، وإحصائيات الحفظ
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              downloadStudentIdCardPng(activeStudent, settings);
                              showToast(
                                'تم تحميل بطاقة الطالب الذكية كصورة PNG عالية الدقة',
                                'success'
                              );
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل البطاقة كصورة (PNG)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentIdCardOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#dfbd69]" />
                            <span>معاينة كاملة وطباعة البطاقة</span>
                          </button>
                        </div>
                      </div>

                      {/* Embedded Card Preview */}
                      <div className="rounded-3xl bg-gradient-to-br from-[#145a3a] via-[#0f452c] to-[#082618] text-white p-5 border-3 border-[#c59b27] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5">
                        <div className="space-y-2 text-center sm:text-right flex-1">
                          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/15 border border-[#dfbd69]/40 text-[11px] font-extrabold text-[#dfbd69]">
                            <span>{settings.academyName}</span>
                            <span>•</span>
                            <span className="font-mono">
                              ID #{activeStudent.id.slice(-4)}
                            </span>
                          </div>
                          <h4 className="text-xl font-extrabold text-white">
                            {activeStudent.name}{' '}
                            {activeStudent.hasGoldenCrown ? '👑' : ''}
                          </h4>
                          <p className="text-xs text-emerald-100">
                            {activeStudent.circle} • المستوى: {activeStudent.level} •
                            التأسيس: {activeStudent.foundationLevel || 1}/8
                          </p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                            <span className="px-2.5 py-1 rounded-xl bg-white/10 font-mono text-[#dfbd69] font-bold">
                              السور: {activeStudent.memorizedSurahs.length}/114
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-white/10 font-mono text-[#dfbd69] font-bold">
                              الأجزاء: {activeStudent.memorizedJuz.length}/30
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-white/10 font-mono text-[#dfbd69] font-bold">
                              ⚡ {activeStudent.xpPoints || 120} XP
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-[#c59b27] text-[#14281d] font-mono font-extrabold">
                              PIN: {activeStudent.guardianPin}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border-2 border-[#c59b27] flex flex-col items-center shrink-0">
                          {(() => {
                            const qrPayload = `IMAM-ID:${activeStudent.id}|PIN:${activeStudent.guardianPin}|SURAH:${activeStudent.currentStop.surahId}:${activeStudent.currentStop.ayah}`;
                            const matrix = generateOfflineQrMatrix(qrPayload);
                            return (
                              <svg
                                viewBox="0 0 21 21"
                                className="w-24 h-24"
                                shapeRendering="crispEdges"
                              >
                                {matrix.map((row, rIdx) =>
                                  row.map((cell, cIdx) =>
                                    cell ? (
                                      <rect
                                        key={`${rIdx}-${cIdx}`}
                                        x={cIdx}
                                        y={rIdx}
                                        width={1}
                                        height={1}
                                        fill="#14281d"
                                      />
                                    ) : null
                                  )
                                )}
                              </svg>
                            );
                          })()}
                          <span className="text-[10px] font-mono font-extrabold text-[#145a3a] mt-1">
                            QR OFFLINE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student Payment Receipts Ledger & Generator */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-2xl bg-[#c59b27]/20 text-[#145a3a] dark:text-[#dfbd69]">
                            <Wallet className="w-5 h-5 text-[#c59b27]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                              إيصالات السداد المعتمدة وسجل اشتراكات الطالب
                            </h3>
                            <p className="text-xs text-neutral-500">
                              الرسوم الشهرية المقررة: {activeStudent.monthlyFee} ج.م •
                              إصدار وتحميل سندات القبض الرقمية
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openReceiptForStudent(activeStudent)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-[#dfbd69]" />
                          <span>➕ إصدار إيصال سداد جديد</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(activeStudent.fees.length > 0
                          ? activeStudent.fees
                          : [
                              {
                                month: new Date().toISOString().slice(0, 7),
                                amount: activeStudent.monthlyFee || 350,
                                status: 'مدفوع' as const,
                                paidAt: new Date().toISOString().slice(0, 10),
                                method: 'إنستا باي (InstaPay)',
                                receiptNumber: `REC-${new Date()
                                  .toISOString()
                                  .slice(0, 7)
                                  .replace('-', '')}-${
                                  activeStudent.id.replace(/\D/g, '') || '101'
                                }`,
                              },
                            ]
                        ).map((feeItem) => {
                          const recNo =
                            feeItem.receiptNumber ||
                            `REC-${feeItem.month.replace('-', '')}-${
                              activeStudent.id.replace(/\D/g, '') || '101'
                            }`;
                          return (
                            <div
                              key={feeItem.month}
                              className="p-4 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-col justify-between gap-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-extrabold font-mono text-[#145a3a] dark:text-[#dfbd69]">
                                      شهر {feeItem.month}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        feeItem.status === 'مدفوع'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : feeItem.status === 'متأخر'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {feeItem.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                    رقم السند: {recNo} •{' '}
                                    {feeItem.method || 'نقدي / تحويل'}
                                  </div>
                                </div>
                                <div className="text-left font-mono text-base font-extrabold text-[#14281d] dark:text-white">
                                  {feeItem.amount} ج.م
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-200/70 dark:border-emerald-900/40">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReceiptForStudent(activeStudent, {
                                      ...feeItem,
                                      receiptNumber: recNo,
                                    })
                                  }
                                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#145a3a] text-white text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#dfbd69]" />
                                  <span>معاينة وطباعة الإيصال</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    downloadPaymentReceiptPng(
                                      activeStudent,
                                      { ...feeItem, receiptNumber: recNo },
                                      settings
                                    );
                                    showToast(
                                      'تم تحميل إيصال السداد كصورة PNG',
                                      'success'
                                    );
                                  }}
                                  className="py-1.5 px-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                                  title="تحميل كصورة PNG"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>PNG</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Interactive Mushaf Progress Map (30 Juz / 114 Surahs) */}
                {profileTab === 'mushaf' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-neutral-500">
                        انقر على أي سورة أو جزء لتبديل حالة الحفظ (محفوظ / غير محفوظ) مباشرةً:
                      </div>
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#0b1711]">
                        <button
                          onClick={() => setMushafViewMode('surahs')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            mushafViewMode === 'surahs'
                              ? 'bg-[#145a3a] text-white'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          السور (114 سورة)
                        </button>
                        <button
                          onClick={() => setMushafViewMode('juz')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            mushafViewMode === 'juz'
                              ? 'bg-[#145a3a] text-white'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          الأجزاء (30 جزءاً)
                        </button>
                      </div>
                    </div>

                    {mushafViewMode === 'surahs' ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[55vh] overflow-y-auto p-1">
                        {SURAHS.map((s) => {
                          const isMem = activeStudent.memorizedSurahs.includes(s.id);
                          const isCurrent = activeStudent.currentStop.surahId === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSurahMemorized(s.id)}
                              className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                isMem
                                  ? 'bg-[#145a3a] text-white border-[#145a3a]'
                                  : isCurrent
                                  ? 'bg-[#c59b27]/20 border-[#c59b27] text-[#14281d] dark:text-white'
                                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/40 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] opacity-80 tabular-nums font-mono">
                                <span>#{s.id}</span>
                                <span>{s.ayahs} آية</span>
                              </div>
                              <div className="text-xs font-bold mt-1 truncate">{s.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {JUZ_NAMES.map((jName, idx) => {
                          const juzNum = idx + 1;
                          const isMem = activeStudent.memorizedJuz.includes(juzNum);
                          return (
                            <button
                              key={juzNum}
                              type="button"
                              onClick={() => toggleJuzMemorized(juzNum)}
                              className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                                isMem
                                  ? 'bg-[#145a3a] text-white border-[#145a3a]'
                                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/40'
                              }`}
                            >
                              <div className="text-[11px] font-mono tabular-nums opacity-75">
                                الجزء {juzNum}
                              </div>
                              <div className="text-xs font-bold mt-1">{jName}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Repeated Errors Log */}
                {profileTab === 'errors' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {Object.entries(errorStats.counts).map(([type, count]) => (
                        <div
                          key={type}
                          className="p-3 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/40 text-center"
                        >
                          <div className="text-xs font-bold text-neutral-500">{type}</div>
                          <div className="text-xl font-extrabold text-red-600 dark:text-red-400 tabular-nums mt-1">
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>

                    {errorStats.detailedList.length > 0 ? (
                      <div className="space-y-2">
                        {errorStats.detailedList.map((err) => (
                          <div
                            key={err.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-emerald-900/40 text-xs"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-bold text-red-600 dark:text-red-400">
                                خطأ {err.type}
                              </span>
                              {err.tajweedRule && (
                                <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-bold text-[11px]">
                                  {err.tajweedRule}
                                </span>
                              )}
                              {err.word && (
                                <span className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 dark:bg-emerald-950 text-[#145a3a] dark:text-[#dfbd69] font-quran text-sm font-bold">
                                  ﴿{err.word}﴾
                                </span>
                              )}
                              <span>في سياق: {err.context}</span>
                              {err.surah && (
                                <span className="font-semibold">
                                  · سورة {err.surah} {err.ayah ? `(آية ${err.ayah})` : ''}
                                </span>
                              )}
                              {ERROR_PEDAGOGICAL_COACHING_MAP[err.type] && (
                                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
                                  {ERROR_PEDAGOGICAL_COACHING_MAP[err.type].badgeTitle}:{' '}
                                  {ERROR_PEDAGOGICAL_COACHING_MAP[err.type].oneLineAdvice}
                                </span>
                              )}
                            </div>
                            <span className="text-neutral-400 font-mono tabular-nums">
                              {formatGregorianAndHijri(
                                err.timestamp.slice(0, 10),
                                settings.showHijriDates ?? true
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-neutral-500">
                        سجل الطالب خالٍ من الأخطاء المتكررة، ما شاء الله!
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Sessions History */}
                {profileTab === 'sessions' && (
                  <div className="space-y-3">
                    {studentSessions.map((ses) => (
                      <div
                        key={ses.id}
                        className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/50 bg-[#f6f7f2]/50 dark:bg-[#0b1711]/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                            <Calendar className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                            <span className="tabular-nums font-mono">
                              {formatGregorianAndHijri(
                                ses.date,
                                settings.showHijriDates ?? true
                              )}
                            </span>
                            <span>·</span>
                            <span
                              className={
                                ses.status === 'حضر'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-red-600'
                              }
                            >
                              {ses.status}
                            </span>
                          </div>
                          {ses.status === 'حضر' && (
                            <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] tabular-nums">
                              نسبة الإتقان: {ses.masteryScore}%
                            </span>
                          )}
                        </div>

                        {ses.status === 'حضر' && (
                          <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                            {ses.newMemorization?.enabled && (
                              <div>
                                • حفظ جديد: سورة {ses.newMemorization.surahName} (من{' '}
                                {ses.newMemorization.fromAyah} إلى {ses.newMemorization.toAyah})
                              </div>
                            )}
                            {ses.nearReview?.enabled && (
                              <div>
                                • مراجعة قريبة: سورة {ses.nearReview.surahName} (من{' '}
                                {ses.nearReview.fromAyah} إلى {ses.nearReview.toAyah})
                              </div>
                            )}
                            {ses.juzReview?.enabled && ses.juzReview.items.length > 0 && (
                              <div>
                                • مراجعة الأجزاء:{' '}
                                {ses.juzReview.items.map((i) => i.label).join('، ')}
                              </div>
                            )}
                            {ses.surahReview?.enabled &&
                              ses.surahReview.surahNames.length > 0 && (
                                <div>
                                  • مراجعة السور: {ses.surahReview.surahNames.join('، ')}
                                </div>
                              )}
                          </div>
                        )}

                        {ses.errors && ses.errors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ses.errors.map((err) => (
                              <span
                                key={err.id}
                                className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[11px] font-bold text-red-700 dark:text-red-300"
                              >
                                {err.type}
                                {err.tajweedRule ? ` (${err.tajweedRule})` : ''}
                                {err.word ? ` ﴿${err.word}﴾` : ''}
                                {err.surah ? ` — ${err.surah}` : ''}
                                {err.ayah ? `:${err.ayah}` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        {ses.parentNotes && (
                          <div className="text-xs text-neutral-500 italic pt-1 border-t border-neutral-200/60 dark:border-emerald-950">
                            "{ses.parentNotes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#12231a] p-12 text-center border border-neutral-200 dark:border-emerald-900/50">
              اختر طالباً من القائمة لعرض ملفه الشامل
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add / Edit Student */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-emerald-900/50 mb-5">
              <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <User className="w-5 h-5" />
                <span>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">اسم الطالب ثلاثياً *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: عبد الله محمد الشاطبي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">اسم ولي الأمر *</label>
                  <input
                    type="text"
                    required
                    value={formGuardian}
                    onChange={(e) => setFormGuardian(e.target.value)}
                    placeholder="مثال: أ. محمد الشاطبي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1">
                    رقم واتساب ولي الأمر (مع فحص صحة الرقم) *
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder="01012345678 أو +966501234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums text-left"
                  />
                  {phoneError && (
                    <span className="text-[11px] text-red-600 font-bold block mt-1">
                      {phoneError}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">رمز بوابة ولي الأمر (PIN)</label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">المستوى</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as StudentLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="مبتدئ">مبتدئ</option>
                    <option value="متوسط">متوسط</option>
                    <option value="متقدم">متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">الرواية القرآنية المعتمدة</label>
                  <select
                    value={formRiwayah}
                    onChange={(e) => setFormRiwayah(e.target.value as QuranRiwayah)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#c59b27] bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]"
                  >
                    {Object.values(QURAN_RIWAYAT_GUIDE).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">الحلقة / المجموعة</label>
                  <select
                    value={formCircle}
                    onChange={(e) => setFormCircle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    {circles.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">خطة الطالب</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as StudentPlan)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="متوازنة">متوازنة (حفظ ومراجعة)</option>
                    <option value="مكثفة">مكثفة</option>
                    <option value="مراجعة فقط">مراجعة فقط</option>
                    <option value="تثبيت">تثبيت</option>
                    <option value="قصار السور">قصار السور</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">منطق الربط في الحفظ</label>
                  <select
                    value={formLinkLogic}
                    onChange={(e) => setFormLinkLogic(e.target.value as LinkLogic)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="الآية التالية">البدء من الآية التالية مباشرة</option>
                    <option value="آخر آية">البدء من آخر آية تم تسميعها (للربط)</option>
                  </select>
                </div>
              </div>

              {/* Weekly Schedule Days */}
              <div>
                <label className="block text-xs font-bold mb-2">أيام الحصة الأسبوعية</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((dayName, idx) => {
                    const selected = formDays.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => handleToggleDay(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          selected
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">موعد الحصة</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">مدة الحصة (دقيقة)</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value={30}>30 دقيقة</option>
                    <option value={45}>45 دقيقة</option>
                    <option value={60}>60 دقيقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الرسوم الشهرية (ج.م / ر.س)</label>
                  <input
                    type="number"
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">ملاحظات حول الطالب</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-emerald-900/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ بيانات الطالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Printable Certificate of Appreciation */}
      {certificateOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white text-[#14281d] p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 no-print">
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs font-bold shrink-0">سبب التكريم:</label>
                <input
                  type="text"
                  value={certificateReason}
                  onChange={(e) => setCertificateReason(e.target.value)}
                  className="w-full max-w-md px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الشهادة / PDF</span>
                </button>
                <button
                  onClick={() => setCertificateOpen(false)}
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Canvas */}
            <div className="border-8 border-double border-[#c59b27] rounded-2xl p-8 md:p-10 bg-[#fcfaf2] text-center relative overflow-hidden">
              <img
                src="/assets/aistudio/icon-192_29a1c2ce.png"
                alt="شعار الأكاديمية"
                referrerPolicy="no-referrer"
                className="w-20 h-20 mx-auto rounded-2xl border-2 border-[#c59b27] mb-3"
              />
              <div className="text-sm font-bold text-[#145a3a]">
                {settings.academyName} — {settings.tagline}
              </div>
              <h2 className="font-quran text-3xl md:text-4xl font-bold text-[#145a3a] my-4">
                شهادة تقدير وتفوق قرآني
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed max-w-xl mx-auto">
                تسر إدارة {settings.academyName} أن تمنح هذه الشهادة التقديرية للطالب/ـة:
              </p>
              <div className="font-quran text-2xl md:text-3xl font-bold text-[#c59b27] my-4 py-2 border-y border-[#c59b27]/40 max-w-md mx-auto">
                {activeStudent.name}
              </div>
              <p className="text-sm text-neutral-800 leading-relaxed max-w-xl mx-auto font-semibold">
                وذلك تقديراً لجهوده المباركة في: {certificateReason}، وإتمام حفظ{' '}
                {activeStudent.memorizedSurahs.length} سورة كريمة ضمن {activeStudent.circle}.
              </p>
              <p className="font-quran text-base text-[#145a3a] mt-4">
                ﴿ خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ ﴾
              </p>

              <div className="mt-8 pt-4 border-t border-[#c59b27]/30 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-neutral-700">
                <div>
                  <span className="block text-neutral-500">المعلم المشرف</span>
                  <span className="text-sm text-[#145a3a]">{settings.teacherName}</span>
                </div>
                <div>
                  <span className="block text-neutral-500">الرواية المعتمدة</span>
                  <span className="text-sm text-[#145a3a]">
                    {activeStudent.riwayah || 'حفص عن عاصم'}
                  </span>
                </div>
                <div>
                  <span className="block text-neutral-500">كود التوثيق المرجعي</span>
                  <span className="font-mono text-sm text-[#145a3a]">
                    IMAM-CERT-{new Date().getFullYear()}-{activeStudent.id.replace(/\D/g, '') || '101'}
                  </span>
                </div>
                <div>
                  <span className="block text-neutral-500">تاريخ الإصدار</span>
                  <span className="tabular-nums font-mono">
                    {formatGregorianAndHijri(
                      new Date().toISOString().slice(0, 10),
                      settings.showHijriDates ?? true
                    )}
                  </span>
                </div>
                <div>
                  <span className="block text-neutral-500">ختم التوثيق الرقمي</span>
                  <span className="text-[#c59b27]">معتمد برمز QR ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Smart Student ID Card & Offline QR Share */}
      {studentIdCardOpen && activeStudent && (
        <StudentIdCardModal
          student={activeStudent}
          allStudents={students}
          onSelectStudent={(id) => setSelectedStudentId(id)}
          settings={settings}
          onClose={() => setStudentIdCardOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Modal 4: Official Digital Payment Receipt Modal */}
      {activeReceiptFee && activeStudent && (
        <PaymentReceiptModal
          student={activeStudent}
          fee={activeReceiptFee}
          settings={settings}
          onClose={() => setActiveReceiptFee(null)}
          onUpdateFee={(studentId, month, status, amount, method) => {
            updateStudentFee(
              studentId,
              month,
              status,
              amount ?? activeReceiptFee.amount,
              method
            );
            setActiveReceiptFee((prev) =>
              prev
                ? {
                    ...prev,
                    month,
                    status,
                    amount: amount ?? prev.amount,
                    method: method ?? prev.method,
                  }
                : null
            );
          }}
          onShowToast={showToast}
        />
      )}

      {/* Modal 5: Milestone Bisharah Family Share Card Modal */}
      {bisharahModalOpen && activeStudent && (
        <MilestoneBisharahModal
          student={activeStudent}
          settings={settings}
          defaultMilestoneTitle={`إتمام حفظ سورة ${activeStudent.currentStop.surahName} والوصول إلى الآية ${activeStudent.currentStop.ayah} بإتقان`}
          onClose={() => setBisharahModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Modal 6: Unified Mushaf Selector & Direct Student-Ayah Linker */}
      {mushafModalOpen && activeStudent && (
        <QuranTextModal
          isOpen={mushafModalOpen}
          onClose={() => setMushafModalOpen(false)}
          surahId={activeStudent.currentStop.surahId}
          fromAyah={activeStudent.currentStop.ayah}
          toAyah={Math.min(
            SURAHS.find((s) => s.id === activeStudent.currentStop.surahId)?.ayahs || 20,
            activeStudent.currentStop.ayah + 10
          )}
          sectionTitle={`المصحف الموحد وربط آية التوقف — الطالب: ${activeStudent.name}`}
          studentId={activeStudent.id}
          studentName={activeStudent.name}
          onApplyRange={(selSurahId, _selSurahName, selFromAyah) => {
            linkStudentStopToAyah(activeStudent.id, selSurahId, selFromAyah);
          }}
        />
      )}
    </div>
  );
};
