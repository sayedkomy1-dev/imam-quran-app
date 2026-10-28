import React, { useEffect, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { RECITERS } from '../data/quranData';
import { ReciterId } from '../types';
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../utils/notificationService';
import {
  formatFullTodayBannerDate,
  formatGregorianAndHijri,
} from '../utils/dateUtils';
import {
  ExportReportScope,
  exportCombinedMasterCSV,
  exportDataToJsonBackup,
  exportFinanceToCSV,
  exportRecordsToPDF,
  exportStudentsToCSV,
} from '../utils/exportService';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';
import { OwnerPublicWaqfImpactHub } from './PublicMushafWaqfPortalView';
import {
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Moon,
  Printer,
  RefreshCw,
  Save,
  Settings,
  Sun,
  Type,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    students,
    sessions,
    circles,
    exams,
    ijazahs,
    tasks,
    teacherAlerts,
    auditLogs,
    admissionRequests,
    managedTeachers,
    currentStaffTier,
    setCurrentStaffTier,
    googleAuthUser,
    startGoogleOAuthRedirect,
    cloudSyncStatus,
    lastSyncTimestamp,
    triggerCloudSyncNow,
    updateTeacherAccessStatus,
    deleteStaffMember,
    addStaffMember,
    updateStaffFamilyDetails,
    linkStudentGoogleAccount,
    approveAdmissionAsStudent,
    triggerPushReminderNow,
    updateSettings,
    resetToSeedData,
    clearAllStudentsAndStartEmpty,
    importFullBackup,
    showToast,
  } = useAcademy();

  const [auditFilterCategory, setAuditFilterCategory] = useState<string>('all');

  // New Staff Member Form State (Supervisor or Teacher)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRoleTitle, setNewStaffRoleTitle] = useState('');
  const [newStaffRoleType, setNewStaffRoleType] = useState<'supervisor' | 'teacher'>('teacher');
  const [newStaffMotherName, setNewStaffMotherName] = useState('');
  const [newStaffGrandfatherName, setNewStaffGrandfatherName] = useState('');
  const [newStaffGrandmotherName, setNewStaffGrandmotherName] = useState('');
  const [newStaffUncleName, setNewStaffUncleName] = useState('');

  // Editing Family Details for Existing Staff Member
  const [editingStaffFamilyId, setEditingStaffFamilyId] = useState<string | null>(null);
  const [staffMotherInput, setStaffMotherInput] = useState('');
  const [staffGrandfatherInput, setStaffGrandfatherInput] = useState('');
  const [staffGrandmotherInput, setStaffGrandmotherInput] = useState('');
  const [staffUncleInput, setStaffUncleInput] = useState('');

  const [selectedStudentForGoogle, setSelectedStudentForGoogle] = useState<string>(
    students[0]?.id || ''
  );
  const [studentGoogleEmailInput, setStudentGoogleEmailInput] = useState<string>(
    students[0]?.googleEmail || ''
  );
  const [studentMotherInput, setStudentMotherInput] = useState<string>(
    students[0]?.motherName || ''
  );
  const [studentGrandfatherInput, setStudentGrandfatherInput] = useState<string>(
    students[0]?.grandfatherName || ''
  );
  const [studentGrandmotherInput, setStudentGrandmotherInput] = useState<string>(
    students[0]?.grandmotherName || ''
  );
  const [studentUncleInput, setStudentUncleInput] = useState<string>(
    students[0]?.uncleName || ''
  );

  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [teacherPin, setTeacherPin] = useState(settings.teacherPin || '1234');
  const [academyName, setAcademyName] = useState(settings.academyName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [newAyatTarget, setNewAyatTarget] = useState(
    settings.weeklyGoals.newAyatTarget
  );
  const [reviewsTarget, setReviewsTarget] = useState(
    settings.weeklyGoals.reviewsTarget
  );
  const [sessionsTarget, setSessionsTarget] = useState(
    settings.weeklyGoals.sessionsTarget
  );
  const [attendanceTarget, setAttendanceTarget] = useState(
    settings.weeklyGoals.attendanceTarget
  );
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | 'unsupported'
  >(getBrowserNotificationPermission());
  const [pdfScope, setPdfScope] = useState<ExportReportScope>('all');
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  useEffect(() => {
    setNotifPermission(getBrowserNotificationPermission());
  }, []);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    addStaffMember({
      name: newStaffName,
      email: newStaffEmail,
      roleTitle:
        newStaffRoleTitle.trim() ||
        (newStaffRoleType === 'supervisor'
          ? 'مشرف الحلقات والمتابعة'
          : 'محفظ الحلقات القرآنية'),
      staffRole: newStaffRoleType,
      status: 'active',
      motherName: newStaffMotherName,
      grandfatherName: newStaffGrandfatherName,
      grandmotherName: newStaffGrandmotherName,
      uncleName: newStaffUncleName,
    });
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRoleTitle('');
    setNewStaffMotherName('');
    setNewStaffGrandfatherName('');
    setNewStaffGrandmotherName('');
    setNewStaffUncleName('');
  };

  const handleToggleMasterNotifications = async () => {
    const nextEnabled = !settings.notificationsEnabled;
    if (nextEnabled) {
      const perm = await requestBrowserNotificationPermission();
      setNotifPermission(perm);
      updateSettings({ notificationsEnabled: true });
      if (perm === 'granted') {
        showToast('تم تفعيل نظام التنبيهات الدفعية المحلية ومنح إذن المتصفح', 'success');
      } else {
        showToast('تم تفعيل التنبيهات المحلية الذكية داخل النظام', 'info');
      }
    } else {
      updateSettings({ notificationsEnabled: false });
      showToast('تم إيقاف التنبيهات الدفعية المحلية', 'info');
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      teacherName,
      teacherPin: teacherPin.trim() || '1234',
      academyName,
      tagline,
      weeklyGoals: {
        newAyatTarget: Number(newAyatTarget) || 100,
        reviewsTarget: Number(reviewsTarget) || 20,
        sessionsTarget: Number(sessionsTarget) || 20,
        attendanceTarget: Number(attendanceTarget) || 90,
      },
    });
  };

  const handleExportJsonBackup = () => {
    exportDataToJsonBackup({
      students,
      sessions,
      circles,
      exams,
      ijazahs,
      tasks,
      settings,
    });
    showToast(
      'تم تصدير البيانات (الطلاب، الحصص، والمالية) إلى ملف احتياطي JSON بنجاح',
      'success'
    );
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const ok = importFullBackup(parsed);
        if (!ok) {
          showToast('ملف النسخة الاحتياطية غير صالح', 'error');
        }
      } catch {
        showToast('تعذر قراءة ملف JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const overdueTaskAlertsCount = teacherAlerts.filter(
    (a) => a.category === 'overdue_task'
  ).length;
  const urgentStudentAlertsCount = teacherAlerts.filter(
    (a) => a.category === 'urgent_student'
  ).length;

  const showHijri = settings.showHijriDates ?? true;

  const totalFeesRecords = students.reduce((acc, s) => acc + s.fees.length, 0);
  const totalPaidAmount = students.reduce(
    (acc, s) =>
      acc +
      s.fees
        .filter((f) => f.status === 'مدفوع')
        .reduce((sum, f) => sum + f.amount, 0),
    0
  );
  const totalOverdueAmount = students.reduce(
    (acc, s) =>
      acc +
      s.fees
        .filter((f) => f.status === 'متأخر')
        .reduce((sum, f) => sum + f.amount, 0),
    0
  );

  const handleExportStudentsCsv = () => {
    exportStudentsToCSV(students, sessions, showHijri);
    showToast('تم تصدير سجل الطلاب الشامل بصيغة CSV (متوافق مع Excel)', 'success');
  };

  const handleExportFinanceCsv = () => {
    exportFinanceToCSV(students, showHijri);
    showToast('تم تصدير السجل المالي وتحصيل الرسوم بصيغة CSV', 'success');
  };

  const handleExportMasterCsv = () => {
    exportCombinedMasterCSV(students, sessions, showHijri);
    showToast('تم تصدير الملف الموحد (الطلاب والمالية) بصيغة CSV', 'success');
  };

  const handleDownloadPdf = (scope: ExportReportScope = pdfScope) => {
    exportRecordsToPDF({
      scope,
      students,
      sessions,
      settings,
    });
    const scopeLabel =
      scope === 'students'
        ? 'سجلات الطلاب'
        : scope === 'finance'
        ? 'السجل المالي'
        : 'التقرير الشامل للطلاب والمالية';
    showToast(`تم إنشاء وتنزيل ملف PDF المحلي (${scopeLabel}) بنجاح`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>إعدادات الأكاديمية، التنبيهات الدفعية، والنسخ الاحتياطي المحلي</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            تخصيص الهوية، التحكم في إشعارات المتابعة والمهام المتأخرة (Notification API)، وتصدير البيانات كملف احتياطي
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/index-github-pages.html?v=12.0.3"
            download="index.html"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
            title="ارفع هذا الملف الواحد (index.html) فقط على GitHub مكان القديم ليعمل الموقع فوراً"
          >
            <Download className="w-4 h-4" />
            <span>⚡ تحميل index.html الشامل (ملف واحد لـ GitHub)</span>
          </a>

          <a
            href="/al-imam-quran-academy-complete.zip?v=12.0.3"
            download="al-imam-quran-academy-complete.zip"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c59b27] to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
            title="تحميل النسخة المضغوطة للبرنامج كاملة بدون أخطاء (Release v12.0.0)"
          >
            <Download className="w-4 h-4" />
            <span>📦 تحميل النسخة المضغوطة للبرنامج كاملة (ZIP)</span>
          </a>

          <a
            href={`https://wa.me/${settings.officialWhatsappPhone || OFFICIAL_ACADEMY_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>واتساب الإدارة والدعم ({settings.officialWhatsappPhone || OFFICIAL_ACADEMY_WHATSAPP})</span>
          </a>

          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="px-4 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#dfbd69]" />
            <span>تصدير البيانات (Backup JSON)</span>
          </button>
        </div>
      </div>

      {/* Owner Public Waqf & Visitors Impact Hub + Distinguished Readers Encouragement */}
      <OwnerPublicWaqfImpactHub />

      {/* Local Push Notification Control Card (Notification API) */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                settings.notificationsEnabled
                  ? 'bg-[#145a3a] text-[#dfbd69]'
                  : 'bg-neutral-100 dark:bg-emerald-950 text-neutral-400'
              }`}
            >
              {settings.notificationsEnabled ? (
                <Bell className="w-5 h-5" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-[#14281d] dark:text-[#e9f2ec]">
                  نظام التنبيهات الدفعية المحلية (Notification API)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                    notifPermission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : notifPermission === 'denied'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-emerald-950 dark:text-neutral-300'
                  }`}
                >
                  {notifPermission === 'granted'
                    ? 'إذن المتصفح: مفعّل (Granted)'
                    : notifPermission === 'denied'
                    ? 'إشعارات داخلية ذكية (مقيد من المتصفح)'
                    : notifPermission === 'default'
                    ? 'إذن المتصفح: بانتظار التفعيل'
                    : 'مدعوم داخلياً'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                يقوم بتذكير المعلم تلقائياً بالمهام المتأخرة والطلاب الذين يحتاجون إلى متابعة عاجلة أو خطة إنقاذ
              </p>
            </div>
          </div>

          {/* Master Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              {settings.notificationsEnabled ? 'التنبيهات مفعّلة' : 'التنبيهات متوقفة'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.notificationsEnabled}
              onClick={handleToggleMasterNotifications}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.notificationsEnabled
                  ? 'bg-[#145a3a]'
                  : 'bg-neutral-300 dark:bg-emerald-950'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.notificationsEnabled ? '-translate-x-7 bg-[#dfbd69]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sub-controls when notifications are enabled */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-opacity ${
            settings.notificationsEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'
          }`}
        >
          {/* Toggle 1: Overdue Tasks */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold">تذكير المهام المتأخرة والمستحقة</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                مرصود حالياً: <strong className="font-mono tabular-nums text-red-600">{overdueTaskAlertsCount}</strong> مهام عاجلة
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOverdueTasks ?? true}
              onChange={(e) =>
                updateSettings({ notifyOverdueTasks: e.target.checked })
              }
              className="w-4 h-4 accent-[#145a3a] cursor-pointer"
            />
          </div>

          {/* Toggle 2: Urgent Students */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold">تنبيه الطلاب بحاجة لمتابعة عاجلة</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                مرصود حالياً: <strong className="font-mono tabular-nums text-amber-600">{urgentStudentAlertsCount}</strong> طلاب متعثرين/غياب
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyUrgentStudents ?? true}
              onChange={(e) =>
                updateSettings({ notifyUrgentStudents: e.target.checked })
              }
              className="w-4 h-4 accent-[#145a3a] cursor-pointer"
            />
          </div>

          {/* Reminder Interval & Instant Test Trigger */}
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-extrabold">تكرار التذكير التلقائي:</label>
              <select
                value={settings.reminderIntervalMinutes || 30}
                onChange={(e) =>
                  updateSettings({ reminderIntervalMinutes: Number(e.target.value) })
                }
                className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-white dark:bg-[#12231a] text-xs font-bold"
              >
                <option value={15}>كل 15 دقيقة</option>
                <option value={30}>كل 30 دقيقة</option>
                <option value={60}>كل ساعة</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => void triggerPushReminderNow()}
              className="w-full py-2 px-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>إرسال تنبيه فوري للتجربة الآن</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appearance & Font Scaling */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Type className="w-4 h-4 text-[#c59b27]" />
              <span>المظهر وتكبير الخطوط</span>
            </h3>

            <div>
              <label className="block text-xs font-bold mb-2">وضع الإضاءة (Theme)</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    settings.theme === 'light'
                      ? 'bg-[#145a3a] text-white border-[#145a3a]'
                      : 'border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>☀️ نهاري</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'bg-[#145a3a] text-white border-[#145a3a]'
                      : 'border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>🌙 ليلي</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'sepia' })}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    settings.theme === 'sepia'
                      ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                      : 'border-neutral-200 dark:border-emerald-900'
                  }`}
                >
                  <span>📜 كريمي للمصحف</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">حجم الخط في التطبيق</label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'sm', label: 'صغير' },
                    { id: 'md', label: 'متوسط' },
                    { id: 'lg', label: 'كبير' },
                    { id: 'xl', label: 'كبير جداً' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => updateSettings({ fontSize: sz.id })}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      settings.fontSize === sz.id
                        ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                        : 'border-neutral-200 dark:border-emerald-900'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5">القارئ الافتراضي للتلاوة</label>
              <select
                value={settings.defaultReciter}
                onChange={(e) =>
                  updateSettings({ defaultReciter: e.target.value as ReciterId })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hijri Date Toggle Switch */}
            <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c59b27]" />
                  <div>
                    <div className="text-xs font-extrabold">
                      عرض التاريخ الهجري بجانب الميلادي
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      تقويم أم القرى القياسي (Intl Islamic Calendar)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showHijriDates ?? true}
                  onClick={() =>
                    updateSettings({
                      showHijriDates: !(settings.showHijriDates ?? true),
                    })
                  }
                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    settings.showHijriDates ?? true
                      ? 'bg-[#145a3a]'
                      : 'bg-neutral-300 dark:bg-emerald-950'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      settings.showHijriDates ?? true
                        ? '-translate-x-6 bg-[#dfbd69]'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
                معاينة التاريخ: {formatFullTodayBannerDate(settings.showHijriDates ?? true)}
              </div>
            </div>
          </div>

          {/* Backup & Seed Reset */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold">
                النسخ الاحتياطي المحلي وتصدير البيانات (JSON Backup)
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                يحوّل كافة بيانات الطلاب وسجلات الحصص والسجلات المالية إلى ملف JSON منظم يمكن تحميله واستعادته في أي وقت:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50">
                <div className="text-neutral-500">الطلاب</div>
                <div className="font-mono tabular-nums text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  {students.length}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50">
                <div className="text-neutral-500">سجل الحصص</div>
                <div className="font-mono tabular-nums text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  {sessions.length}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50">
                <div className="text-neutral-500">السجلات المالية</div>
                <div className="font-mono tabular-nums text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  {totalFeesRecords}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportJsonBackup}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#dfbd69]" />
                <span>تصدير البيانات (تحميل ملف احتياطي JSON)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-emerald-900 text-xs font-bold cursor-pointer hover:border-[#145a3a]">
                <Upload className="w-4 h-4" />
                <span>استيراد نسخة احتياطية من ملف JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={clearAllStudentsAndStartEmpty}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-extrabold cursor-pointer transition"
              >
                <X className="w-4 h-4" />
                <span>بدء نظام جديد فارغ (تفريغ القائمة بالكامل)</span>
              </button>

              <button
                type="button"
                onClick={resetToSeedData}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>استعادة النماذج الرمزية الافتراضية (طالب ١ - طالب ٨)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Academy Info & Weekly Goals Form */}
        <form
          onSubmit={handleSaveGeneral}
          className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4"
        >
          <h3 className="text-sm font-extrabold">بيانات الأكاديمية، رمز الأمان، وأهداف الأسبوع</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">اسم المعلم / المشرف</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">رمز مرور المعلم / المشرف (PIN)</label>
              <input
                type="text"
                dir="ltr"
                value={teacherPin}
                onChange={(e) => setTeacherPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c59b27] bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-mono font-extrabold text-center text-[#145a3a] dark:text-[#dfbd69]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">اسم الأكاديمية</label>
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">الشعار اللفظي للأكاديمية</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-emerald-950">
            <h4 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] mb-3">
              مستهدفات بطاقة "أهداف هذا الأسبوع" في الصفحة الرئيسية:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">آيات حفظ جديد</label>
                <input
                  type="number"
                  value={newAyatTarget}
                  onChange={(e) => setNewAyatTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">عدد المراجعات</label>
                <input
                  type="number"
                  value={reviewsTarget}
                  onChange={(e) => setReviewsTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">عدد الحصص</label>
                <input
                  type="number"
                  value={sessionsTarget}
                  onChange={(e) => setSessionsTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">نسبة الحضور %</label>
                <input
                  type="number"
                  max={100}
                  value={attendanceTarget}
                  onChange={(e) => setAttendanceTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#dfbd69]" />
            <span>حفظ إعدادات الأكاديمية والأهداف</span>
          </button>
        </form>
      </div>

      {/* Export Student & Financial Records to Local CSV or PDF Card */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14281d] dark:text-[#e9f2ec]">
                تصدير سجلات الطلاب والمالية إلى ملف CSV أو PDF محلي
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                احتفظ بنسخة احتياطية خارجية منظمة لسجلات الطلاب الأكاديمية وتحصيل الرسوم الشهرية بصيغة جداول CSV (تدعم العربية في Excel) أو تقارير PDF رسمية جاهزة للطباعة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 font-bold text-[#145a3a] dark:text-[#dfbd69]">
              الطلاب: <strong className="font-mono tabular-nums">{students.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 font-bold text-emerald-700 dark:text-emerald-300">
              المحصل: <strong className="font-mono tabular-nums">{totalPaidAmount}</strong> ج.م
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 font-bold text-red-600 dark:text-red-400">
              المتأخرات: <strong className="font-mono tabular-nums">{totalOverdueAmount}</strong> ج.م
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CSV Exports Column */}
          <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                <h4 className="text-xs font-extrabold">
                  تصدير جداول البيانات المحلية (CSV — متوافق مع Excel)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                ترميز UTF-8 BOM
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              يتم تصدير الملفات بترميز قياسي يدعم اللغة العربية والتاريخ الهجري/الميلادي مباشرة عند فتحها في برنامج Microsoft Excel أو Google Sheets.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleExportStudentsCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900/70 flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                  <span>تصدير سجل الطلاب والتقدم القرآني (CSV)</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                  {students.length} طلاب
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportFinanceCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900/70 flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#c59b27]" />
                  <span>تصدير السجل المالي وتحصيل الرسوم الشهرية (CSV)</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                  {totalFeesRecords} سجل مالي
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportMasterCsv}
                className="w-full py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white flex items-center justify-center gap-2 text-xs font-extrabold transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#dfbd69]" />
                <span>تصدير السجل الموحد الشامل (الطلاب + الملخص المالي CSV)</span>
              </button>
            </div>
          </div>

          {/* PDF Exports Column */}
          <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#c59b27]" />
                  <h4 className="text-xs font-extrabold">
                    تصدير تقرير رسمي منسق بصيغة PDF محلي
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  A4 RTL جاهز للطباعة
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                اختر نطاق التقرير لتنزيله مباشرة كملف PDF محلي بترويسة الأكاديمية أو استعراضه للطباعة الفورية:
              </p>

              {/* Scope Selector */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'all', label: 'تقرير شامل (الكل)' },
                    { id: 'students', label: 'سجل الطلاب فقط' },
                    { id: 'finance', label: 'السجل المالي فقط' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPdfScope(opt.id)}
                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      pdfScope === opt.id
                        ? 'bg-[#145a3a] text-white border-[#145a3a]'
                        : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(pdfScope)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل ملف PDF محلي مباشر (.pdf)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfPreviewModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#145a3a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                <span>معاينة التقرير الرسمي وطباعته (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. حوكمة المالك والمشرفين: إدارة قبول وإيقاف وحذف المشرفين والمحفظين + ربط حسابات Google Firebase */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-6">
        {/* Cloud Sync & Active Authority Level Header */}
        <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex flex-wrap items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#c59b27]" />
                <span>
                  بوابة حوكمة المالك والمشرفين — إدارة قبول وإيقاف وحذف المشرفين والمحفظين (Google Auth)
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                يتحكم <strong>المالك العام</strong> في قبول أو إيقاف أو حذف <strong>المشرفين والمحفظين</strong>، بينما يتحكم <strong>المشرف</strong> في قبول أو إيقاف أو حذف <strong>المحفظين</strong> وربط حسابات Google بالطلاب
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Switcher to preview/operate as Owner vs Supervisor */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setCurrentStaffTier('owner')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    currentStaffTier === 'owner'
                      ? 'bg-[#145a3a] text-[#dfbd69]'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  👑 وضع المالك العام
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStaffTier('supervisor')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    currentStaffTier === 'supervisor'
                      ? 'bg-[#145a3a] text-[#dfbd69]'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  🛡️ وضع المشرف العام
                </button>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-[11px] font-mono font-bold text-[#145a3a] dark:text-[#dfbd69]">
                المزامنة: {cloudSyncStatus === 'syncing' ? 'جارٍ المزامنة...' : `متزامن ✓ (${lastSyncTimestamp})`}
              </span>
              <button
                type="button"
                onClick={triggerCloudSyncNow}
                className="px-3.5 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>مزامنة فورية</span>
              </button>
            </div>
          </div>

          {/* Connected Google Firebase Account Banner */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231a] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {googleAuthUser?.photoURL ? (
                <img
                  src={googleAuthUser.photoURL}
                  alt={googleAuthUser.displayName}
                  className="w-10 h-10 rounded-full border border-amber-400/50 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-900/15 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center font-extrabold text-sm">
                  G
                </div>
              )}
              <div>
                <div className="text-xs font-extrabold text-[#14281d] dark:text-white flex items-center gap-2">
                  <span>
                    {googleAuthUser
                      ? `حساب Google المتصل: ${googleAuthUser.displayName}`
                      : 'حالة مصادقة Google Firebase'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {currentStaffTier === 'owner'
                      ? 'صلاحية المالك الكاملة'
                      : 'صلاحية المشرف العام'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  {googleAuthUser?.email || 'يمكنك ربط أو تبديل حساب Google للمزامنة المباشرة مع ملفات المحفظين والطلاب'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void startGoogleOAuthRedirect('supervisor')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0b1711] hover:bg-emerald-50 border border-emerald-600/40 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>{googleAuthUser ? 'تبديل حساب Google المتصل' : 'ربط حساب Google الآن'}</span>
            </button>
          </div>

          {/* Add New Supervisor or Teacher Form */}
          <form
            onSubmit={handleAddStaffSubmit}
            className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 space-y-3"
          >
            <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#c59b27]" />
              <span>
                إضافة وتخويل {currentStaffTier === 'owner' ? 'مشرف أو محفظ جديد' : 'محفظ جديد'} عبر بريد Google مع بيانات العائلة (Firestore):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="الاسم الكامل للمحفظ/المشرف *"
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
                required
              />
              <input
                type="email"
                dir="ltr"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="teacher@gmail.com"
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-mono text-left"
                required
              />
              <select
                value={currentStaffTier === 'owner' ? newStaffRoleType : 'teacher'}
                disabled={currentStaffTier !== 'owner'}
                onChange={(e) =>
                  setNewStaffRoleType(e.target.value as 'supervisor' | 'teacher')
                }
                className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
              >
                <option value="teacher">محفظ (معلم حلقات)</option>
                {currentStaffTier === 'owner' && (
                  <option value="supervisor">مشرف عام (صلاحية إشرافية)</option>
                )}
              </select>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>إضافة وقبول فوري</span>
              </button>
            </div>

            {/* 4 Family Fields for New Teacher / Supervisor */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <input
                type="text"
                value={newStaffMotherName}
                onChange={(e) => setNewStaffMotherName(e.target.value)}
                placeholder="اسم الوالدة (اختياري)"
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
              />
              <input
                type="text"
                value={newStaffGrandfatherName}
                onChange={(e) => setNewStaffGrandfatherName(e.target.value)}
                placeholder="اسم الجد (اختياري)"
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
              />
              <input
                type="text"
                value={newStaffGrandmotherName}
                onChange={(e) => setNewStaffGrandmotherName(e.target.value)}
                placeholder="اسم الجدة (اختياري)"
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
              />
              <input
                type="text"
                value={newStaffUncleName}
                onChange={(e) => setNewStaffUncleName(e.target.value)}
                placeholder="اسم العم (اختياري)"
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
              />
            </div>
          </form>

          {/* SECTION A: OWNER GOVERNANCE OVER SUPERVISORS (إدارة المشرفين من قِبل المالك) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <span>🛡️ أولاً: إدارة المشرفين (خاص بالمالك العام — قبول / إيقاف / حذف مشرف)</span>
              </h4>
              <span className="text-[11px] font-bold text-neutral-500">
                {currentStaffTier === 'owner'
                  ? 'صلاحية المالك مفعّلة لإدارة المشرفين'
                  : 'للعرض فقط (التعديل متاح للمالك العام)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {managedTeachers
                .filter((t) => t.staffRole === 'owner' || t.staffRole === 'supervisor')
                .map((sup) => {
                  const isOwnerCard = sup.staffRole === 'owner';
                  const canManageSupervisor = currentStaffTier === 'owner' && !isOwnerCard;
                  const isEditingFamily = editingStaffFamilyId === sup.id;
                  return (
                    <div
                      key={sup.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-amber-500/40 flex flex-col justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[#14281d] dark:text-white flex items-center gap-1.5">
                            <span>{isOwnerCard ? '👑' : '🛡️'}</span>
                            <span>{sup.name}</span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              sup.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : sup.status === 'blocked'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sup.status === 'active'
                              ? 'مقبول ونشط ✓'
                              : sup.status === 'blocked'
                              ? 'موقوف ⛔'
                              : 'بانتظار القبول ⏳'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500">{sup.email}</div>
                        <div className="text-[11px] text-neutral-500">{sup.roleTitle}</div>
                        {sup.googleUid && (
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            Google UID: {sup.googleUid.slice(0, 12)}...
                          </div>
                        )}
                        {(sup.motherName ||
                          sup.grandfatherName ||
                          sup.grandmotherName ||
                          sup.uncleName) && (
                          <div className="text-[10px] text-neutral-600 dark:text-neutral-300 bg-[#fcfaf2] dark:bg-[#0b1711] p-2 rounded-xl border border-amber-500/20 mt-1 space-y-0.5">
                            {sup.motherName && <div>• الوالدة: {sup.motherName}</div>}
                            {sup.grandfatherName && <div>• الجد: {sup.grandfatherName}</div>}
                            {sup.grandmotherName && <div>• الجدة: {sup.grandmotherName}</div>}
                            {sup.uncleName && <div>• العم: {sup.uncleName}</div>}
                          </div>
                        )}
                      </div>

                      {isEditingFamily ? (
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={staffMotherInput}
                              onChange={(e) => setStaffMotherInput(e.target.value)}
                              placeholder="اسم الوالدة"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffGrandfatherInput}
                              onChange={(e) => setStaffGrandfatherInput(e.target.value)}
                              placeholder="اسم الجد"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffGrandmotherInput}
                              onChange={(e) => setStaffGrandmotherInput(e.target.value)}
                              placeholder="اسم الجدة"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffUncleInput}
                              onChange={(e) => setStaffUncleInput(e.target.value)}
                              placeholder="اسم العم"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                updateStaffFamilyDetails(sup.id, {
                                  motherName: staffMotherInput,
                                  grandfatherName: staffGrandfatherInput,
                                  grandmotherName: staffGrandmotherInput,
                                  uncleName: staffUncleInput,
                                });
                                setEditingStaffFamilyId(null);
                              }}
                              className="flex-1 py-1 rounded-lg bg-[#145a3a] text-white text-[10px] font-extrabold cursor-pointer"
                            >
                              حفظ في Firestore ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffFamilyId(null)}
                              className="px-2 py-1 rounded-lg border border-neutral-300 text-[10px] font-bold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffFamilyId(sup.id);
                            setStaffMotherInput(sup.motherName || '');
                            setStaffGrandfatherInput(sup.grandfatherName || '');
                            setStaffGrandmotherInput(sup.grandmotherName || '');
                            setStaffUncleInput(sup.uncleName || '');
                          }}
                          className="w-full py-1 px-2 rounded-lg bg-[#fcfaf2] dark:bg-[#0b1711] hover:bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                        >
                          ✏️ بيانات العائلة (الوالدة، الجد، الجدة، العم)
                        </button>
                      )}

                      {isOwnerCard ? (
                        <div className="py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-extrabold text-center text-[#145a3a] dark:text-[#dfbd69]">
                          حساب المالك العام للأكاديمية (محمي)
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                          <button
                            type="button"
                            disabled={!canManageSupervisor}
                            onClick={() => updateTeacherAccessStatus(sup.id, 'active')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border cursor-pointer disabled:opacity-40 ${
                              sup.status === 'active'
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>قبول</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canManageSupervisor}
                            onClick={() => updateTeacherAccessStatus(sup.id, 'blocked')}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border cursor-pointer disabled:opacity-40 ${
                              sup.status === 'blocked'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>إيقاف</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canManageSupervisor}
                            onClick={() => deleteStaffMember(sup.id)}
                            className="py-1.5 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition disabled:opacity-40"
                            title="حذف المشرف نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SECTION B: OWNER & SUPERVISOR GOVERNANCE OVER TEACHERS (إدارة المحفظين من قِبل المالك أو المشرف) */}
          <div className="space-y-2.5 pt-3 border-t border-neutral-200/70 dark:border-emerald-950">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                <span>📖 ثانياً: إدارة المحفظين (متاح للمالك العام وللمشرف — قبول / إيقاف / حذف محفظ)</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                متاح للمالك والمشرف ✓
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {managedTeachers
                .filter((t) => !t.staffRole || t.staffRole === 'teacher')
                .map((tch) => {
                  const isEditingFamily = editingStaffFamilyId === tch.id;
                  return (
                    <div
                      key={tch.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[#14281d] dark:text-white">
                            {tch.name}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              tch.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : tch.status === 'blocked'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tch.status === 'active'
                              ? 'مقبول ونشط ✓'
                              : tch.status === 'blocked'
                              ? 'موقوف ⛔'
                              : 'بانتظار القبول ⏳'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-500">{tch.email}</div>
                        <div className="text-[11px] text-neutral-500">
                          {tch.roleTitle} • {tch.assignedCirclesCount} حلقات
                        </div>
                        {tch.googleUid && (
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            Google UID: {tch.googleUid.slice(0, 12)}...
                          </div>
                        )}
                        {(tch.motherName ||
                          tch.grandfatherName ||
                          tch.grandmotherName ||
                          tch.uncleName) && (
                          <div className="text-[10px] text-neutral-600 dark:text-neutral-300 bg-[#fcfaf2] dark:bg-[#0b1711] p-2 rounded-xl border border-emerald-500/20 mt-1 space-y-0.5">
                            {tch.motherName && <div>• الوالدة: {tch.motherName}</div>}
                            {tch.grandfatherName && <div>• الجد: {tch.grandfatherName}</div>}
                            {tch.grandmotherName && <div>• الجدة: {tch.grandmotherName}</div>}
                            {tch.uncleName && <div>• العم: {tch.uncleName}</div>}
                          </div>
                        )}
                      </div>

                      {isEditingFamily ? (
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={staffMotherInput}
                              onChange={(e) => setStaffMotherInput(e.target.value)}
                              placeholder="اسم الوالدة"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffGrandfatherInput}
                              onChange={(e) => setStaffGrandfatherInput(e.target.value)}
                              placeholder="اسم الجد"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffGrandmotherInput}
                              onChange={(e) => setStaffGrandmotherInput(e.target.value)}
                              placeholder="اسم الجدة"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                            <input
                              type="text"
                              value={staffUncleInput}
                              onChange={(e) => setStaffUncleInput(e.target.value)}
                              placeholder="اسم العم"
                              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px]"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                updateStaffFamilyDetails(tch.id, {
                                  motherName: staffMotherInput,
                                  grandfatherName: staffGrandfatherInput,
                                  grandmotherName: staffGrandmotherInput,
                                  uncleName: staffUncleInput,
                                });
                                setEditingStaffFamilyId(null);
                              }}
                              className="flex-1 py-1 rounded-lg bg-[#145a3a] text-white text-[10px] font-extrabold cursor-pointer"
                            >
                              حفظ في Firestore ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStaffFamilyId(null)}
                              className="px-2 py-1 rounded-lg border border-neutral-300 text-[10px] font-bold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffFamilyId(tch.id);
                            setStaffMotherInput(tch.motherName || '');
                            setStaffGrandfatherInput(tch.grandfatherName || '');
                            setStaffGrandmotherInput(tch.grandmotherName || '');
                            setStaffUncleInput(tch.uncleName || '');
                          }}
                          className="w-full py-1 px-2 rounded-lg bg-[#fcfaf2] dark:bg-[#0b1711] hover:bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                        >
                          ✏️ بيانات العائلة (الوالدة، الجد، الجدة، العم)
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                        <button
                          type="button"
                          onClick={() => updateTeacherAccessStatus(tch.id, 'active')}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border cursor-pointer ${
                            tch.status === 'active'
                              ? 'bg-[#145a3a] text-white border-[#145a3a]'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>قبول</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => updateTeacherAccessStatus(tch.id, 'blocked')}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 border cursor-pointer ${
                            tch.status === 'blocked'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300'
                          }`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>إيقاف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteStaffMember(tch.id)}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition"
                          title="حذف المحفظ نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SECTION C: STUDENT GOOGLE ACCOUNT LINKING + EXTENDED FAMILY FIELDS */}
          <div className="pt-3 border-t border-neutral-200/70 dark:border-emerald-950 space-y-2.5">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              🎓 ثالثاً: ربط حسابات Google والبيانات العائلية (الوالدة، الجد، الجدة، العم) بملف الطالب في Firestore
            </h4>
            <div className="bg-white dark:bg-[#12231a] p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                <select
                  value={selectedStudentForGoogle}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedStudentForGoogle(id);
                    const st = students.find((s) => s.id === id);
                    setStudentGoogleEmailInput(st?.googleEmail || '');
                    setStudentMotherInput(st?.motherName || '');
                    setStudentGrandfatherInput(st?.grandfatherName || '');
                    setStudentGrandmotherInput(st?.grandmotherName || '');
                    setStudentUncleInput(st?.uncleName || '');
                  }}
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.circle}) {st.googleEmail ? `— ${st.googleEmail}` : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="email"
                  dir="ltr"
                  value={studentGoogleEmailInput}
                  onChange={(e) => setStudentGoogleEmailInput(e.target.value)}
                  placeholder="student.guardian@gmail.com"
                  className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-mono text-left"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentForGoogle) {
                      linkStudentGoogleAccount(
                        selectedStudentForGoogle,
                        studentGoogleEmailInput,
                        {
                          motherName: studentMotherInput,
                          grandfatherName: studentGrandfatherInput,
                          grandmotherName: studentGrandmotherInput,
                          uncleName: studentUncleInput,
                        }
                      );
                    }
                  }}
                  className="py-2 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                >
                  حفظ الربط وبيانات العائلة في Firestore ✓
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  value={studentMotherInput}
                  onChange={(e) => setStudentMotherInput(e.target.value)}
                  placeholder="اسم الوالدة"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
                />
                <input
                  type="text"
                  value={studentGrandfatherInput}
                  onChange={(e) => setStudentGrandfatherInput(e.target.value)}
                  placeholder="اسم الجد"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
                />
                <input
                  type="text"
                  value={studentGrandmotherInput}
                  onChange={(e) => setStudentGrandmotherInput(e.target.value)}
                  placeholder="اسم الجدة"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
                />
                <input
                  type="text"
                  value={studentUncleInput}
                  onChange={(e) => setStudentUncleInput(e.target.value)}
                  placeholder="اسم العم"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/70 bg-[#fcfaf2] dark:bg-[#0b1711] text-[11px] font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#c59b27]" />
              <span>
                سجل التدقيق الإداري للمالك (Owner Audit Log) — حوكمة ورقابة العمليات
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              توثيق آلي لكافة العمليات الإدارية والمالية (تعديل بيانات طالب، أرشفة، سداد رسوم، إصدار شهادة أو إجازة، وقبول الطلاب الجدد) بالتاريخ والوقت والمنفذ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={auditFilterCategory}
              onChange={(e) => setAuditFilterCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
            >
              <option value="all">جميع العمليات ({auditLogs.length})</option>
              <option value="تعديل بيانات طالب">تعديل بيانات طالب</option>
              <option value="أرشفة أو حالة حساب">أرشفة أو حالة حساب</option>
              <option value="سداد رسوم مالية">سداد رسوم مالية</option>
              <option value="إصدار شهادة أو إجازة">إصدار شهادة أو إجازة</option>
              <option value="قبول طالب جديد">قبول طالب جديد</option>
              <option value="صلاحيات وأمان">صلاحيات وأمان</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-900/60">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-[#145a3a] text-white">
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">تصنيف العملية</th>
                <th className="p-3">المنفذ</th>
                <th className="p-3">الهدف / الطالب</th>
                <th className="p-3">تفاصيل العملية الإدارية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-emerald-950">
              {auditLogs
                .filter(
                  (log) =>
                    auditFilterCategory === 'all' ||
                    (log.category || log.actionCategory) === auditFilterCategory
                )
                .slice(0, 20)
                .map((log) => (
                  <tr
                    key={log.id}
                    className="odd:bg-white even:bg-[#fcfaf2] dark:odd:bg-[#12231a] dark:even:bg-[#0b1711]"
                  >
                    <td className="p-3 font-mono text-[11px] text-neutral-500">
                      {log.timestamp}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[#145a3a] dark:text-[#dfbd69] font-extrabold text-[11px]">
                        {log.category || log.actionCategory}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      {log.actor || log.actorName}
                    </td>
                    <td className="p-3 font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                      {log.targetName || 'النظام'}
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-300">
                      {log.details || log.summary}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Summary of Pending Admission Requests in Owner Settings */}
        {admissionRequests.length > 0 && (
          <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 space-y-2">
            <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              📥 طابور القبول وطلبات الالتحاق المسجلة ({admissionRequests.length} طلبات):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {admissionRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <strong className="text-[#145a3a] dark:text-[#dfbd69]">
                      {req.studentName} ({req.age} سنوات)
                    </strong>{' '}
                    — رواية: {req.requestedRiwayah} • واتساب: {req.guardianPhone}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold">
                      {req.status}
                    </span>
                    {req.status !== 'تم القبول' && (
                      <button
                        type="button"
                        onClick={() =>
                          approveAdmissionAsStudent(
                            req.id,
                            circles[0]?.name || 'حلقة النور والبيان (الناشئة)'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-white text-[11px] font-extrabold cursor-pointer"
                      >
                        قبول فوري ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Printable PDF Preview Modal */}
      {showPdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#12231a] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-neutral-200 dark:border-emerald-900 shadow-2xl overflow-hidden">
            {/* Modal Action Bar */}
            <div className="px-6 py-4 bg-[#145a3a] text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#dfbd69]" />
                <h3 className="text-sm font-extrabold">
                  معاينة التقرير الرسمي للطلاب والمالية — جاهز للتنزيل أو الطباعة
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(pdfScope)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل PDF مباشر</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الصفحة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Official Report Banner */}
              <div className="p-5 rounded-2xl border-2 border-[#145a3a] bg-[#f6f7f2] dark:bg-[#0b1711] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    {settings.academyName}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                    {settings.tagline} — بإشراف: {settings.teacherName}
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                  <div>تاريخ التقرير: {formatFullTodayBannerDate(showHijri)}</div>
                  <div className="text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                    نطاق التقرير:{' '}
                    {pdfScope === 'all'
                      ? 'شامل (سجلات الطلاب + السجل المالي)'
                      : pdfScope === 'students'
                      ? 'سجلات الطلاب والتقدم القرآني'
                      : 'السجل المالي وتحصيل الرسوم'}
                  </div>
                </div>
              </div>

              {/* Students Table Section */}
              {(pdfScope === 'all' || pdfScope === 'students') && (
                <div className="space-y-3">
                  <h5 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    أولاً: سجل الطلاب والتقدم القرآني ({students.length} طلاب)
                  </h5>
                  <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-900/60">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#145a3a] text-white text-[11px]">
                          <th className="p-2.5">اسم الطالب</th>
                          <th className="p-2.5">المستوى / الحلقة</th>
                          <th className="p-2.5">ولي الأمر (واتساب)</th>
                          <th className="p-2.5">الأجزاء / السور</th>
                          <th className="p-2.5">موضع التوقف الحالي</th>
                          <th className="p-2.5">تاريخ الانضمام</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-emerald-950 text-[11px]">
                        {students.map((st) => (
                          <tr
                            key={st.id}
                            className="odd:bg-white even:bg-[#f6f7f2]/60 dark:odd:bg-[#12231a] dark:even:bg-[#0b1711]/60"
                          >
                            <td className="p-2.5 font-extrabold">{st.name}</td>
                            <td className="p-2.5">
                              {st.level} — {st.circle}
                            </td>
                            <td className="p-2.5">
                              {st.guardianName} ({st.whatsappPhone})
                            </td>
                            <td className="p-2.5 font-mono tabular-nums font-bold text-[#145a3a] dark:text-[#dfbd69]">
                              {st.memorizedJuz.length} جزء / {st.memorizedSurahs.length} سورة
                            </td>
                            <td className="p-2.5">
                              سورة {st.currentStop.surahName} آية {st.currentStop.ayah}
                            </td>
                            <td className="p-2.5">
                              {formatGregorianAndHijri(st.startDate, showHijri)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Table Section */}
              {(pdfScope === 'all' || pdfScope === 'finance') && (
                <div className="space-y-3">
                  <h5 className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    ثانياً: السجل المالي وتحصيل الرسوم الشهرية (المحصل: {totalPaidAmount} ج.م | المتأخر: {totalOverdueAmount} ج.م)
                  </h5>
                  <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-900/60">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-[#145a3a] text-white text-[11px]">
                          <th className="p-2.5">اسم الطالب</th>
                          <th className="p-2.5">الحلقة</th>
                          <th className="p-2.5">الشهر</th>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">الحالة</th>
                          <th className="p-2.5">تاريخ ووسيلة السداد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-emerald-950 text-[11px]">
                        {students.flatMap((st) =>
                          st.fees.map((fee, idx) => (
                            <tr
                              key={`${st.id}-${fee.month}-${idx}`}
                              className="odd:bg-white even:bg-[#f6f7f2]/60 dark:odd:bg-[#12231a] dark:even:bg-[#0b1711]/60"
                            >
                              <td className="p-2.5 font-bold">{st.name}</td>
                              <td className="p-2.5">{st.circle}</td>
                              <td className="p-2.5 font-mono tabular-nums">{fee.month}</td>
                              <td className="p-2.5 font-mono tabular-nums font-bold">
                                {fee.amount} ج.م
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold ${
                                    fee.status === 'مدفوع'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : fee.status === 'متأخر'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                >
                                  {fee.status}
                                </span>
                              </td>
                              <td className="p-2.5">
                                {fee.paidAt
                                  ? `${fee.method || 'نقدي'} — ${formatGregorianAndHijri(
                                      fee.paidAt,
                                      showHijri
                                    )}`
                                  : fee.notes || 'لم يسدد بعد'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
