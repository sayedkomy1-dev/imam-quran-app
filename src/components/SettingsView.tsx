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
  EyeOff,
  Lock,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  DEFAULT_SUPERVISOR_PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS,
} from '../data/seedData';

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
    activeStaffEmail,
    setActiveStaffEmail,
    currentTeacherPermissions,
    setSelectedStudentId,
    setActiveTab,
    googleAuthUser,
    startGoogleOAuthRedirect,
    cloudSyncStatus,
    lastSyncTimestamp,
    triggerCloudSyncNow,
    restoreFromCloudFirestoreNow,
    exportTeacherScopedJsonBackup,
    importTeacherScopedJsonBackup,
    updateTeacherAccessStatus,
    deleteStaffMember,
    addStaffMember,
    updateStaffFamilyDetails,
    updateSupervisorPermissions,
    updateTeacherPermissions,
    resetTeacherCustomPermissions,
    applyBulkStudentPrivacyPreference,
    assignStudentToTeacher,
    linkStudentGoogleAccount,
    approveAdmissionAsStudent,
    triggerPushReminderNow,
    updateSettings,
    resetToSeedData,
    clearAllStudentsAndStartEmpty,
    importFullBackup,
    showToast,
  } = useAcademy();

  const supervisorPerms = settings.supervisorPermissions || DEFAULT_SUPERVISOR_PERMISSIONS;
  const teacherPerms = settings.teacherPermissions || DEFAULT_TEACHER_PERMISSIONS;
  const canAccessBackups =
    currentStaffTier === 'owner' ||
    (currentStaffTier === 'supervisor' && supervisorPerms.canAccessAndExportBackups);
  const canViewFinanceInSettings =
    currentStaffTier === 'owner' ||
    (currentStaffTier === 'supervisor' && supervisorPerms.canViewFinancialRecords) ||
    (currentStaffTier === 'teacher' && currentTeacherPermissions.canManageStudentFees);

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

  const [settingsSubTab, setSettingsSubTab] = useState<
    | 'custom_teacher_permissions'
    | 'backup_management'
    | 'privacy_permissions'
    | 'general_appearance'
    | 'all'
  >('custom_teacher_permissions');

  const [selectedTeacherFilterId, setSelectedTeacherFilterId] = useState<string>('all');

  const [lastBackupExportTime, setLastBackupExportTime] = useState<string | null>(
    () => localStorage.getItem('imam_last_json_backup_export_time')
  );
  const [restoredFileSummary, setRestoredFileSummary] = useState<{
    fileName: string;
    restoredAt: string;
    circlesCount: number;
    studentsCount: number;
    sessionsCount: number;
    rawPayload: Record<string, unknown>;
  } | null>(null);

  const handleExportJsonBackup = () => {
    exportDataToJsonBackup({
      students,
      sessions,
      circles,
      exams,
      ijazahs,
      tasks,
      settings,
      managedTeachers,
      filenamePrefix: 'quran-backup-v12',
    });
    const nowFormatted = new Date().toLocaleString('ar-EG');
    setLastBackupExportTime(nowFormatted);
    try {
      localStorage.setItem('imam_last_json_backup_export_time', nowFormatted);
    } catch {
      // ignore storage errors
    }
    showToast(
      `تم تحميل نسخة احتياطية كاملة من بيانات الحلقات (${circles.length}) والطلاب (${students.length}) بتنسيق JSON بنجاح`,
      'success'
    );
  };

  const handleExportCirclesAndStudentsOnlyJson = () => {
    exportDataToJsonBackup({
      students,
      sessions,
      circles,
      exams: [],
      ijazahs: [],
      tasks: [],
      settings,
      filenamePrefix: 'imam-circles-students-backup',
    });
    const nowFormatted = new Date().toLocaleString('ar-EG');
    setLastBackupExportTime(nowFormatted);
    showToast(
      `تم تحميل نسخة احتياطية لبيانات الحلقات (${circles.length}) والطلاب (${students.length}) بتنسيق JSON`,
      'success'
    );
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}')) as Record<
          string,
          unknown
        >;
        const ok = importFullBackup(parsed);
        if (!ok) {
          showToast(
            'ملف النسخة الاحتياطية غير صالح — تأكد من احتوائه على مصفوفة الطلاب والحلقات بتنسيق JSON',
            'error'
          );
          return;
        }
        const studentsArr = Array.isArray(parsed.students) ? parsed.students : [];
        const circlesArr = Array.isArray(parsed.circles)
          ? parsed.circles
          : circles;
        const sessionsArr = Array.isArray(parsed.sessions) ? parsed.sessions : [];
        const nowStr = new Date().toLocaleString('ar-EG');
        setRestoredFileSummary({
          fileName: file.name,
          restoredAt: nowStr,
          circlesCount: circlesArr.length,
          studentsCount: studentsArr.length,
          sessionsCount: sessionsArr.length,
          rawPayload: parsed,
        });
      } catch {
        showToast('تعذر قراءة ملف JSON المحلي — يرجى التحقق من سلامة الملف', 'error');
      } finally {
        e.target.value = '';
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
            <span>إعدادات الأكاديمية، إدارة النسخ الاحتياطي، والخصوصية</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            إدارة النسخ الاحتياطي واستعادة البيانات، إعدادات الخصوصية، وصلاحيات المالك والمشرفين
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/academy-vision-and-ui-ux-roadmap.txt"
            download="خطة-تطوير-الأكاديمية-والبوابات-والسبورة-وربط-القلوب.txt"
            className="px-3.5 py-2.5 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition"
            title="تحميل التقرير الاستراتيجي الشامل لتطوير البوابات والسبورة الذكية وتجربة المستخدم UI/UX"
          >
            <FileText className="w-4 h-4 text-[#c59b27]" />
            <span>📊 تقرير التطوير الشامل وخطة الـ UI/UX (.txt)</span>
          </a>

          <a
            href="/staff-and-permissions-guide.txt"
            download="دليل-إدارة-المحفظين-والمشرفين-والصلاحيات.txt"
            className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
            title="تحميل الملف النصي الإرشادي لكيفية إضافة محفظ أو مشرف وصلاحيات كل دور"
          >
            <FileText className="w-4 h-4" />
            <span>📄 تحميل دليل المحفظين والمشرفين والصلاحيات (.txt)</span>
          </a>

          <button
            type="button"
            onClick={() => void triggerCloudSyncNow()}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
          >
            <RefreshCw className="w-4 h-4 text-[#dfbd69]" />
            <span>☁️ حفظ ومزامنة سحابية فورية</span>
          </button>

          <a
            href={`https://wa.me/${settings.officialWhatsappPhone || OFFICIAL_ACADEMY_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>واتساب الإدارة والدعم ({settings.officialWhatsappPhone || OFFICIAL_ACADEMY_WHATSAPP})</span>
          </a>

          {canAccessBackups && (
            <button
              type="button"
              onClick={handleExportJsonBackup}
              className="px-4 py-2.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#dfbd69]" />
              <span>تحميل نسخة احتياطية (JSON)</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط تبويبات شاشة الإعدادات مع تبويب «صلاحيات مخصصة لكل محفظ» وتبويب «إدارة النسخ الاحتياطي» */}
      <div
        role="tablist"
        aria-label="تبويبات شاشة الإعدادات"
        className="rounded-2xl bg-white dark:bg-[#12231a] p-2 border-2 border-[#c59b27]/50 shadow-xs flex flex-wrap items-center gap-2"
      >
        {(
          [
            {
              id: 'custom_teacher_permissions' as const,
              label: 'صلاحيات مخصصة لكل محفظ',
              badge: `${managedTeachers.filter((t) => t.staffRole !== 'supervisor').length} محفظين`,
            },
            {
              id: 'backup_management' as const,
              label: 'إدارة النسخ الاحتياطي',
              badge: `${circles.length} حلقات · ${students.length} طلاب`,
            },
            {
              id: 'privacy_permissions' as const,
              label: 'إعدادات الخصوصية وصلاحيات المشرفين',
              badge: settings.limitedSharingMode ? 'مشاركة محدودة' : 'محمي',
            },
            {
              id: 'general_appearance' as const,
              label: 'الهوية والمظهر والتنبيهات',
              badge: 'عام',
            },
            {
              id: 'all' as const,
              label: 'عرض كافة الإعدادات',
              badge: 'شامل',
            },
          ]
        ).map((tabItem) => {
          const isActive = settingsSubTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSettingsSubTab(tabItem.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#145a3a] text-white shadow-xs ring-1 ring-[#c59b27]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-emerald-100 hover:bg-neutral-200/70 dark:hover:bg-emerald-950/60'
              }`}
            >
              <span>{tabItem.label}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${
                  isActive
                    ? 'bg-[#c59b27] text-[#14281d]'
                    : 'bg-white dark:bg-[#12231a] text-[#145a3a] dark:text-[#dfbd69]'
                }`}
              >
                {tabItem.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* شاشة تحديد صلاحيات مخصصة لكل محفظ بدلاً من الصلاحيات الافتراضية (Per-Teacher Custom Permissions Screen) */}
      {(settingsSubTab === 'custom_teacher_permissions' || settingsSubTab === 'all') && (
        <div
          role="tabpanel"
          aria-label="صلاحيات مخصصة لكل محفظ"
          className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#145a3a]/60 dark:border-emerald-700 shadow-md space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    تحديد صلاحيات مخصصة لكل محفظ (بدلاً من الصلاحيات الافتراضية)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#c59b27]/20 border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                    {currentStaffTier === 'owner'
                      ? '👑 تحكم المالك العام المباشر'
                      : '🔒 التعديل خاص بالمالك العام'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  يتيح للمالك العام تخصيص صلاحيات كل شيخ محفظ على حدة (مثل: السماح بإضافة طلاب، تصدير ورفع ملفات JSON، أو الوصول إلى السجلات المالية وإصدار الإيصالات) بدلاً من الاكتفاء بالصلاحيات الافتراضية العامة.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {currentStaffTier !== 'owner' && (
                <button
                  type="button"
                  onClick={() => setCurrentStaffTier('owner')}
                  className="px-3.5 py-2 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold cursor-pointer"
                >
                  👑 التبديل لوضع المالك للتخصيص
                </button>
              )}
              <button
                type="button"
                onClick={() => void triggerCloudSyncNow(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>☁️ حفظ ومزامنة الصلاحيات سحابياً</span>
              </button>
            </div>
          </div>

          {/* شريط اختيار المحفظ أو عرض جميع المحفظين */}
          <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#14281d] dark:text-white">
                اختر المحفظ لتخصيص صلاحياته:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTeacherFilterId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedTeacherFilterId === 'all'
                    ? 'bg-[#145a3a] text-[#dfbd69]'
                    : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-neutral-700 dark:text-neutral-200'
                }`}
              >
                عرض جميع المحفظين ({managedTeachers.filter((t) => t.staffRole !== 'supervisor').length})
              </button>
              {managedTeachers
                .filter((t) => t.staffRole !== 'supervisor')
                .map((t) => {
                  const hasCustom = Boolean(
                    t.customTeacherPermissions &&
                      Object.keys(t.customTeacherPermissions).length > 0
                  );
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTeacherFilterId(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedTeacherFilterId === t.id
                          ? 'bg-[#145a3a] text-[#dfbd69]'
                          : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          hasCustom
                            ? 'bg-[#c59b27] text-[#14281d]'
                            : 'bg-neutral-100 dark:bg-emerald-950 text-neutral-500'
                        }`}
                      >
                        {hasCustom ? 'مخصص' : 'افتراضي'}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="text-[11px] font-bold text-neutral-500">
              المخصصون حالياً:{' '}
              <strong className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                {
                  managedTeachers.filter(
                    (t) =>
                      t.staffRole !== 'supervisor' &&
                      t.customTeacherPermissions &&
                      Object.keys(t.customTeacherPermissions).length > 0
                  ).length
                }
              </strong>{' '}
              من أصل {managedTeachers.filter((t) => t.staffRole !== 'supervisor').length} محفظين
            </div>
          </div>

          {/* بطاقات تخصيص صلاحيات كل محفظ بشكل مستقل */}
          <div className="grid grid-cols-1 gap-5">
            {managedTeachers
              .filter(
                (t) =>
                  t.staffRole !== 'supervisor' &&
                  (selectedTeacherFilterId === 'all' || t.id === selectedTeacherFilterId)
              )
              .map((teacher) => {
                const isCustomActive = Boolean(
                  teacher.customTeacherPermissions &&
                    Object.keys(teacher.customTeacherPermissions).length > 0
                );
                const effectivePerms = {
                  ...DEFAULT_TEACHER_PERMISSIONS,
                  ...(settings.teacherPermissions || {}),
                  ...(teacher.customTeacherPermissions || {}),
                };
                const teacherStudentsCount = students.filter((st) => {
                  if (st.assignedTeacherEmail) {
                    return (
                      st.assignedTeacherEmail.toLowerCase() ===
                      teacher.email.toLowerCase()
                    );
                  }
                  if (st.assignedTeacherName) {
                    return st.assignedTeacherName === teacher.name;
                  }
                  const c = circles.find((ci) => ci.name === st.circle);
                  return Boolean(c && c.teacherName === teacher.name);
                }).length;

                return (
                  <div
                    key={teacher.id}
                    className={`p-5 rounded-2xl border-2 transition space-y-4 ${
                      isCustomActive
                        ? 'bg-[#fcfaf2] dark:bg-[#0b1711] border-[#c59b27]'
                        : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                    }`}
                  >
                    {/* رأس بطاقة المحفظ + أزرار القوالب السريعة */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-emerald-900/50">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-extrabold text-[#14281d] dark:text-white">
                            {teacher.name}
                          </h4>
                          <span className="text-xs font-mono text-neutral-500" dir="ltr">
                            ({teacher.email})
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold ${
                              isCustomActive
                                ? 'bg-[#c59b27] text-[#14281d]'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isCustomActive
                              ? '🎯 صلاحيات مخصصة لهذا المحفظ (Custom Override)'
                              : '⚙️ يتبع الصلاحيات الافتراضية العامة'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {teacher.roleTitle} · عدد الحلقات: {teacher.assignedCirclesCount ?? 1} · عدد الطلاب المرتبطين:{' '}
                          <strong className="font-mono text-[#145a3a] dark:text-[#dfbd69]">
                            {teacherStudentsCount}
                          </strong>{' '}
                          طالب
                        </p>
                      </div>

                      {/* أزرار التخصيص السريع والاستعادة للوضع الافتراضي */}
                      <div className="flex flex-wrap items-center gap-2">
                        {currentStaffTier === 'owner' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateTeacherPermissions(
                                  {
                                    canAddAndEditStudents: true,
                                    canExportTeacherJsonBackup: true,
                                    canImportTeacherJsonBackup: true,
                                    canManageStudentFees: true,
                                    canCreateAndEditCircles: true,
                                    canIssueExamsAndCertificates: true,
                                    canApproveAdmissionRequests: true,
                                  },
                                  teacher.id
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold cursor-pointer"
                            >
                              ✅ منح كامل الصلاحيات (شامل المالية وJSON)
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateTeacherPermissions(
                                  {
                                    canAddAndEditStudents: true,
                                    canExportTeacherJsonBackup: true,
                                    canImportTeacherJsonBackup: true,
                                    canManageStudentFees: false,
                                    canCreateAndEditCircles: false,
                                    canIssueExamsAndCertificates: true,
                                    canApproveAdmissionRequests: false,
                                  },
                                  teacher.id
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#145a3a] border border-neutral-300 dark:border-emerald-800 text-[#14281d] dark:text-white text-[11px] font-bold cursor-pointer"
                            >
                              📖 صلاحيات التعليم وJSON فقط (بدون مالية)
                            </button>

                            {isCustomActive && (
                              <button
                                type="button"
                                onClick={() => resetTeacherCustomPermissions(teacher.id)}
                                className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-[11px] font-extrabold cursor-pointer"
                              >
                                ↺ إعادة للصلاحيات الافتراضية
                              </button>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveStaffEmail(teacher.email);
                            setCurrentStaffTier('teacher');
                            showToast(
                              `تم التبديل لمعاينة النظام بصلاحيات المحفظ (${teacher.name})`,
                              'info'
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#c59b27]/25 hover:bg-[#c59b27]/40 border border-[#c59b27] text-[#14281d] dark:text-[#dfbd69] text-[11px] font-extrabold cursor-pointer"
                        >
                          👁️ معاينة النظام بصلاحيات هذا المحفظ
                        </button>
                      </div>
                    </div>

                    {/* شبكة الصلاحيات الـ 7 المخصصة لهذا المحفظ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {(
                        [
                          {
                            key: 'canAddAndEditStudents',
                            title: '١. السماح بإضافة طلاب وتعديلهم',
                            desc: 'إضافة طلاب جدد وتعديل خطط الحفظ والمستوى في حلقاته',
                            highlight: true,
                          },
                          {
                            key: 'canExportTeacherJsonBackup',
                            title: '٢. تصدير ملفات JSON لطلابه وحلقاته',
                            desc: 'تنزيل نسخة احتياطية JSON خاصة بطلابه وحلقاته وجلساته',
                            highlight: true,
                          },
                          {
                            key: 'canImportTeacherJsonBackup',
                            title: '٣. رفع واستعادة ملفات JSON لطلابه',
                            desc: 'استيراد ملف JSON لطلابه وحلقاته ومزامنته مع السحابة',
                            highlight: true,
                          },
                          {
                            key: 'canManageStudentFees',
                            title: '٤. الوصول إلى السجلات المالية والرسوم',
                            desc: 'الاطلاع على رسوم طلابه وتسجيل السداد وإصدار الإيصالات',
                            highlight: true,
                          },
                          {
                            key: 'canCreateAndEditCircles',
                            title: '٥. إنشاء وتعديل الحلقات القرآنية',
                            desc: 'إنشاء حلقة جديدة أو تعديل مواعيد وروابط حلقاته',
                            highlight: false,
                          },
                          {
                            key: 'canIssueExamsAndCertificates',
                            title: '٦. إجراء الاختبارات وإصدار الشهادات',
                            desc: 'اعتماد نتائج الاختبارات ومنح شهادات التقدير والأوسمة',
                            highlight: false,
                          },
                          {
                            key: 'canApproveAdmissionRequests',
                            title: '٧. قبول الطلاب من طابور التسجيل',
                            desc: 'مراجعة وقبول طلبات الالتحاق الجديدة وإلحاق الطالب بحلقته',
                            highlight: false,
                          },
                        ] as const
                      ).map((perm) => {
                        const checked = Boolean(effectivePerms[perm.key]);
                        return (
                          <label
                            key={perm.key}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                              checked
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/50'
                                : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50'
                            } ${
                              currentStaffTier === 'owner'
                                ? 'cursor-pointer'
                                : 'opacity-75 cursor-not-allowed'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="font-extrabold text-[#14281d] dark:text-white flex items-center gap-1.5">
                                <span>{perm.title}</span>
                              </div>
                              <div className="text-[11px] text-neutral-500 leading-relaxed">
                                {perm.desc}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              disabled={currentStaffTier !== 'owner'}
                              checked={checked}
                              onChange={(e) =>
                                updateTeacherPermissions(
                                  {
                                    [perm.key]: e.target.checked,
                                  },
                                  teacher.id
                                )
                              }
                              className="w-4 h-4 mt-0.5 accent-[#145a3a] shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* تبويب إدارة النسخ الاحتياطي واستعادة البيانات من ملف محلي (JSON Backup & Restore Tab) */}
      {(settingsSubTab === 'backup_management' || settingsSubTab === 'all') && (
        <div
          role="tabpanel"
          aria-label="إدارة النسخ الاحتياطي"
          className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27] shadow-md space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0 shadow-xs">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    إدارة النسخ الاحتياطي واستعادة البيانات الشاملة
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#c59b27]/20 border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold">
                    {currentStaffTier === 'owner'
                      ? '👑 صلاحية المالك الكاملة'
                      : canAccessBackups
                      ? '🛡️ مصرح للمشرف من المالك'
                      : '🔒 خاص بالمالك العام'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  يتيح للمالك تحميل نسخة احتياطية كاملة من بيانات الحلقات والطلاب وسجل الحصص، مع ميزة «استعادة البيانات» الفورية من ملف محلي لضمان أمان معلومات الأكاديمية.
                </p>
              </div>
            </div>

            {lastBackupExportTime && (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
                آخر تحميل للنسخة الاحتياطية: <span className="font-mono">{lastBackupExportTime}</span>
              </div>
            )}
          </div>

          {/* إحصائيات محتويات النسخة الاحتياطية الحالية */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">بيانات الحلقات</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {circles.length}
              </div>
              <div className="text-[10px] text-neutral-400">حلقة قرآنية</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">بيانات الطلاب</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {students.length}
              </div>
              <div className="text-[10px] text-neutral-400">ملف طالب متكامل</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">سجل الحصص</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {sessions.length}
              </div>
              <div className="text-[10px] text-neutral-400">حصة وتسميع</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">الاختبارات والإجازات</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {exams.length + ijazahs.length}
              </div>
              <div className="text-[10px] text-neutral-400">شهادة واختبار</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">المحفظون والمشرفون</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {managedTeachers.length}
              </div>
              <div className="text-[10px] text-neutral-400">حساب معتمد</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40">
              <div className="text-[11px] font-bold text-neutral-500">السجلات المالية</div>
              <div className="text-lg font-black font-mono tabular-nums text-[#145a3a] dark:text-[#dfbd69] mt-0.5">
                {canViewFinanceInSettings ? totalFeesRecords : '•••'}
              </div>
              <div className="text-[10px] text-neutral-400">إيصال ودفعة</div>
            </div>
          </div>

          {/* القسم السحابي الأول: دمج خدمة Firebase Cloud Firestore للنسخ السحابي التلقائي والمزامنة اليدوية */}
          <div className="p-5 rounded-2xl bg-gradient-to-l from-[#145a3a] via-[#10462d] to-[#0b2e1d] text-white border border-[#c59b27]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#c59b27] text-[#14281d] text-[10px] font-black">
                  ☁️ النسخ السحابي التلقائي الآمن
                </span>
                <span className="text-xs font-bold text-[#dfbd69]">
                  حالة السحابة: {cloudSyncStatus === 'syncing' ? 'جارٍ المزامنة السحابية...' : `محفوظ ومتزامن ✓ (${lastSyncTimestamp})`}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                النسخ الاحتياطي السحابي التلقائي والمزامنة الفورية مع السحابة
              </h4>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                بمجرد دخول الشيخ أو المالك للتطبيق من أي جهاز، يسترجع النظام طلابه وحلقاته وسجل حصصه تلقائياً من سحابة Firebase Cloud Firestore، مع حفظ تلقائي فوري لأي تعديل جديد.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <label className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-extrabold flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCloudBackupEnabled ?? true}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    updateSettings({ autoCloudBackupEnabled: enabled });
                    showToast(
                      enabled
                        ? '☁️ تم تفعيل النسخ الاحتياطي السحابي التلقائي عبر Firebase Cloud Firestore'
                        : 'تم إيقاف النسخ السحابي التلقائي والاكتفاء بالمزامنة اليدوية',
                      'info'
                    );
                  }}
                  className="w-4 h-4 accent-[#c59b27] cursor-pointer"
                />
                <span>النسخ السحابي التلقائي</span>
              </label>

              <button
                type="button"
                onClick={() => void triggerCloudSyncNow(true)}
                className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center gap-2 cursor-pointer transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>مزامنة البيانات يدوياً مع السحابة الآن</span>
              </button>

              <button
                type="button"
                onClick={() => void restoreFromCloudFirestoreNow(false)}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-[#dfbd69]/50 text-[#dfbd69] text-xs font-extrabold flex items-center gap-2 cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>استعادة أحدث نسخة من السحابة</span>
              </button>
            </div>
          </div>

          {/* قسم خاص بالشيخ المحفظ: تنزيل أو رفع نسخة JSON من طلابه وحلقاته + مزامنة سحابية تلقائية */}
          <div className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#145a3a]/40 dark:border-emerald-800/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200/70 dark:border-emerald-950">
              <div>
                <h4 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>📖 النسخ الاحتياطي الخاص بالمحفظ (طلابك وحلقاتك — JSON + سحابي تلقائي)</span>
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  يستطيع الشيخ المحفظ تنزيل نسخة JSON من طلابه وحلقاته أو رفع نسخة JSON لاستعادتها، بالإضافة إلى المزامنة السحابية التلقائية بمجرد دخوله من أي جهاز.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold shrink-0">
                البريد النشط: {activeStaffEmail || googleAuthUser?.email || settings.teacherName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={
                  currentStaffTier === 'teacher' &&
                  !currentTeacherPermissions.canExportTeacherJsonBackup
                }
                onClick={() => exportTeacherScopedJsonBackup()}
                className="py-3 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
              >
                <Download className="w-4 h-4 text-[#dfbd69]" />
                <span>تنزيل نسخة JSON من طلابي وحلقاتي</span>
              </button>

              <label
                className={`py-3 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs ${
                  currentStaffTier === 'teacher' &&
                  !currentTeacherPermissions.canImportTeacherJsonBackup
                    ? 'opacity-50 pointer-events-none'
                    : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>رفع واستعادة نسخة JSON لطلابي وحلقاتي</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(String(ev.target?.result || '{}'));
                        const ok = importTeacherScopedJsonBackup(parsed);
                        if (!ok) {
                          showToast('ملف JSON غير صالح — تأكد من احتوائه على قائمة الطلاب والحلقات', 'error');
                        }
                      } catch {
                        showToast('تعذر قراءة ملف JSON المرفوع', 'error');
                      } finally {
                        e.target.value = '';
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => void restoreFromCloudFirestoreNow(false)}
                className="py-3 px-4 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#145a3a] border border-neutral-300 dark:border-emerald-800 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>☁️ استرجاع طلابي وحلقاتي من السحابة الآن</span>
              </button>
            </div>
          </div>

          {canAccessBackups ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* القسم الأول: تحميل نسخة احتياطية كاملة بتنسيق JSON */}
              <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#c59b27]" />
                      <span>١. تحميل نسخة احتياطية شاملة للأكاديمية (JSON للمالك)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                      نسخة شاملة ومؤمّنة
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    قم بتحميل ملف احتياطي شامل يحتوي على كافة بيانات الحلقات ({circles.length} حلقات) وبيانات الطلاب ({students.length} طلاب) وسجلات التسميع والمالية والإعدادات لحفظه بأمان على جهازك.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleExportJsonBackup}
                    className="w-full py-3 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition"
                  >
                    <Download className="w-4 h-4 text-[#dfbd69]" />
                    <span>تحميل نسخة احتياطية كاملة من بيانات الحلقات والطلاب (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCirclesAndStudentsOnlyJson}
                    className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#12231a] hover:border-[#c59b27] border border-neutral-300 dark:border-emerald-900 text-[#14281d] dark:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <FileText className="w-4 h-4 text-[#c59b27]" />
                    <span>تحميل نسخة مخصصة لبيانات الحلقات والطلاب والحصص (JSON)</span>
                  </button>
                </div>
              </div>

              {/* القسم الثاني: استعادة البيانات من ملف محلي (Data Restore) */}
              <div className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-dashed border-[#c59b27]/70 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#c59b27]" />
                      <span>٢. استعادة البيانات الشاملة من ملف محلي (Restore JSON)</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-extrabold">
                      استعادة آمنة + مزامنة سحابية
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    اختر ملف نسخة احتياطية محلياً (بتنسيق <code className="font-mono">.json</code>) لاستعادة جميع الحلقات والطلاب وسجل الحصص والإعدادات فوراً إلى النظام ومزامنتها مع قاعدة البيانات.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="w-full py-3 px-4 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>استعادة البيانات من ملف محلي (JSON)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJsonBackup}
                      className="hidden"
                    />
                  </label>

                  {restoredFileSummary ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/60 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2 font-extrabold text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تمت استعادة البيانات بنجاح من: {restoredFileSummary.fileName}</span>
                        </span>
                        <span className="font-mono text-[10px]">{restoredFileSummary.restoredAt}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        <span>
                          الحلقات المستعادة: <strong>{restoredFileSummary.circlesCount}</strong> · الطلاب: <strong>{restoredFileSummary.studentsCount}</strong> · الحصص: <strong>{restoredFileSummary.sessionsCount}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            importFullBackup(restoredFileSummary.rawPayload);
                            void triggerCloudSyncNow(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-white text-[10px] font-extrabold cursor-pointer"
                        >
                          تأكيد ومزامنة مع السحابة الآن
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
                      <span>يدعم ملفات النسخ الاحتياطي القياسية (quran-backup-v12.json)</span>
                      <button
                        type="button"
                        onClick={() => void triggerCloudSyncNow(true)}
                        className="text-[#145a3a] dark:text-[#dfbd69] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>مزامنة فورية مع السحابة</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Factory Reset for Production Button & Confirmation */}
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-extrabold text-xs sm:text-sm">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>تجهيز الأكاديمية للعمل الفعلي المباشر (تصفير البيانات التجريبية)</span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                  يمسح الطلاب والحصص والتسجيلات التجريبية ويبقي الحلقات الثلاث وهيكل الأكاديمية فارغاً ونظيفاً لبدء العمل الحقيقي للعام الدراسي الجديد.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('⚠️ تحذير: هل أنت متأكد من تفريغ كافة بيانات الطلاب والحصص التجريبية وبدء نظام جديد فارغ؟ هذا الإجراء لا يمكن التراجع عنه إلا باستعادة نسخة احتياطية.')) {
                      clearAllStudentsAndStartEmpty();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تفريغ البيانات التجريبية وبدء نظام جديد فارغ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد إعادة تحميل البيانات الافتراضية المعيارية للأكاديمية؟')) {
                      resetToSeedData();
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-200 dark:bg-emerald-950 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط المصنع</span>
                </button>
              </div>
            </div>
          </>
        ) : (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-extrabold">
                <Lock className="w-4 h-4 text-[#c59b27]" />
                <span>النسخ الاحتياطي الشامل لكل الأكاديمية خاص بالمالك العام (بينما يمكنك كمحفظ تنزيل أو رفع نسخة JSON لطلابك وحلقاتك من البطاقة أعلاه).</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStaffTier('owner')}
                className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold cursor-pointer shrink-0"
              >
                التبديل لوضع المالك العام
              </button>
            </div>
          )}
        </div>
      )}

      {/* Privacy & Limited Sharing Mode (إعدادات الخصوصية ووضع المشاركة المحدودة) */}
      {(settingsSubTab === 'privacy_permissions' || settingsSubTab === 'all') && (
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#145a3a]/40 dark:border-emerald-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                settings.limitedSharingMode || (settings.hidePersonalDataFromPublic ?? true)
                  ? 'bg-[#145a3a] text-[#dfbd69]'
                  : 'bg-neutral-100 dark:bg-emerald-950 text-neutral-400'
              }`}
            >
              {settings.limitedSharingMode ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-[#14281d] dark:text-[#e9f2ec]">
                  إعدادات الخصوصية وحماية البيانات (Privacy &amp; Private Mode)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                    settings.limitedSharingMode
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  }`}
                >
                  {settings.limitedSharingMode
                    ? '🔒 وضع المشاركة المحدودة (Private Mode) نشط'
                    : '🛡️ إخفاء البيانات عن العامة مفعّل'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                تحكم في إخفاء بياناتك وبيانات الطلاب عن العامة، أو تفعيل وضع «المشاركة المحدودة» (Private Mode) لتمويه أرقام الهواتف ورموز PIN والمالية في واجهات الطلاب
              </p>
            </div>
          </div>

          {/* Primary Toggles: Hide From Public + Limited Sharing (Private Mode) */}
          <div className="flex flex-wrap items-center gap-4 self-end sm:self-center">
            <div className="flex items-center gap-2.5 bg-[#f6f7f2] dark:bg-[#0b1711] px-3.5 py-2 rounded-2xl border border-neutral-200 dark:border-emerald-900">
              <span className="text-xs font-extrabold text-[#14281d] dark:text-white">
                إخفاء البيانات عن العامة
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.hidePersonalDataFromPublic ?? true}
                onClick={() => {
                  const next = !(settings.hidePersonalDataFromPublic ?? true);
                  updateSettings({ hidePersonalDataFromPublic: next });
                  showToast(
                    next
                      ? 'تم تفعيل إخفاء البيانات الشخصية عن العامة ✓'
                      : 'تم إيقاف إخفاء البيانات عن العامة',
                    'info'
                  );
                }}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.hidePersonalDataFromPublic ?? true
                    ? 'bg-[#145a3a]'
                    : 'bg-neutral-300 dark:bg-emerald-950'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    settings.hidePersonalDataFromPublic ?? true
                      ? '-translate-x-6 bg-[#dfbd69]'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2.5 bg-[#fcfaf2] dark:bg-[#0b1711] px-3.5 py-2 rounded-2xl border border-[#c59b27]/60">
              <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                وضع المشاركة المحدودة (Private Mode)
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.limitedSharingMode ?? false}
                onClick={() => {
                  const next = !settings.limitedSharingMode;
                  updateSettings({
                    limitedSharingMode: next,
                    maskStudentPhoneAndPin: next ? true : settings.maskStudentPhoneAndPin,
                  });
                  showToast(
                    next
                      ? '🔒 تم تفعيل وضع المشاركة المحدودة (Private Mode) في واجهات الطلاب'
                      : 'تم إيقاف وضع المشاركة المحدودة والعودة للعرض القياسي',
                    'success'
                  );
                }}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.limitedSharingMode
                    ? 'bg-[#c59b27]'
                    : 'bg-neutral-300 dark:bg-emerald-950'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    settings.limitedSharingMode
                      ? '-translate-x-6 bg-[#14281d]'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-controls for Student Interfaces Privacy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold">تمويه أرقام الهواتف ورموز (PIN)</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                إخفاء أرقام واتساب ورمز دخول البوابة في واجهات الطلاب لغير المالك
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.maskStudentPhoneAndPin ?? true}
              onChange={(e) =>
                updateSettings({ maskStudentPhoneAndPin: e.target.checked })
              }
              className="w-4 h-4 accent-[#145a3a] cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold">إخفاء المبالغ المالية في واجهة الطالب</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                إخفاء تفاصيل الرسوم الشهرية في وضع الطالب والمشاركة المحدودة
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hideFinancialDetailsInStudentPortal ?? false}
              onChange={(e) =>
                updateSettings({
                  hideFinancialDetailsInStudentPortal: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#145a3a] cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold">إخفاء البيانات العائلية عن العامة</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                حصر ظهور بيانات العائلة التفصيلية على المالك فقط
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.hideFamilyLineageInPublicViews ?? true}
              onChange={(e) =>
                updateSettings({
                  hideFamilyLineageInPublicViews: e.target.checked,
                })
              }
              className="w-4 h-4 accent-[#145a3a] cursor-pointer"
            />
          </div>
        </div>

        {/* Bulk Apply Student Privacy Preference Bar */}
        <div className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              تعميم تفضيل الخصوصية على واجهات جميع الطلاب ({students.length} طلاب):
            </span>
            <span className="text-neutral-500 mr-1.5 text-[11px]">
              يمكنك أيضاً تخصيص مستوى الخصوصية لكل طالب منفرداً من داخل ملف الطالب أو بوابته
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyBulkStudentPrivacyPreference('private')}
              className="px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-[11px] font-extrabold cursor-pointer"
            >
              🔒 إخفاء كامل عن العامة للجميع
            </button>
            <button
              type="button"
              onClick={() => applyBulkStudentPrivacyPreference('limited')}
              className="px-3 py-1.5 rounded-xl bg-[#c59b27] hover:bg-[#b38a1e] text-[#14281d] text-[11px] font-extrabold cursor-pointer"
            >
              🛡️ مشاركة محدودة (Private Mode) للجميع
            </button>
            <button
              type="button"
              onClick={() => applyBulkStudentPrivacyPreference('standard')}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 text-[11px] font-bold cursor-pointer"
            >
              الوضع القياسي
            </button>
          </div>
        </div>
      </div>
      )}

      {(settingsSubTab === 'general_appearance' || settingsSubTab === 'all') && (
      <>
      {/* Owner Public Waqf & Visitors Impact Hub + Distinguished Readers Encouragement */}
      <OwnerPublicWaqfImpactHub />

      {/* Local Push Notification Control Card */}
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
                  نظام التذكيرات والتنبيهات الذكية للمحفظ والإدارة
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
                    ? 'إشعارات المتصفح: مفعّلة ✓'
                    : notifPermission === 'denied'
                    ? 'تنبيهات داخلية ذكية'
                    : notifPermission === 'default'
                    ? 'بانتظار التفعيل'
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
                      تقويم أم القرى الهجري المعتمد
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

          {/* Backup & Seed Reset (Owner & Authorized Supervisor) */}
          <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold">
                  النسخ الاحتياطي المحلي وتصدير البيانات (JSON Backup)
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  متاح بالكامل للمالك العام، وللمشرفين حسب الصلاحية التي يحددها المالك:
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] shrink-0">
                {currentStaffTier === 'owner'
                  ? '👑 صلاحية المالك الكاملة'
                  : canAccessBackups
                  ? '🛡️ مصرح للمشرف من المالك'
                  : '🔒 خاص بالمالك فقط'}
              </span>
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
                  {canViewFinanceInSettings ? totalFeesRecords : '•••'}
                </div>
              </div>
            </div>

            {canAccessBackups ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#dfbd69]" />
                  <span>تصدير جميع البيانات (تحميل ملف احتياطي JSON للمالك)</span>
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

                {currentStaffTier === 'owner' && (
                  <>
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
                      <span>استعادة بيانات الأكاديمية المرجعية المعتمدة</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#c59b27]" />
                  <span>النسخ الاحتياطي وتصدير جميع البيانات متاح للمالك العام فقط</span>
                </div>
                <p className="text-[11px] opacity-90">
                  يحدد المالك العام من مصفوفة الصلاحيات بالأسفل ما إذا كان يُسمح للمشرف بتحميل أو استيراد النسخ الاحتياطية.
                </p>
              </div>
            )}
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
      </>
      )}

      {/* Export Student & Financial Records to Local CSV or PDF Card */}
      {(settingsSubTab === 'backup_management' || settingsSubTab === 'all') && (
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#14281d] dark:text-[#e9f2ec]">
                تصدير سجلات الطلاب والمالية إلى ملف Excel (CSV) أو تقرير PDF للطباعة
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                احتفظ بنسخة خارجية منظمة لسجلات الطلاب الأكاديمية وتحصيل الرسوم الشهرية بصيغة جداول Excel أو تقارير PDF رسمية جاهزة للطباعة
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

        {canAccessBackups ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CSV Exports Column */}
            <div className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/80 dark:border-emerald-900/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                  <h4 className="text-xs font-extrabold">
                    تصدير جداول البيانات المحلية (متوافق مع Excel)
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  يدعم العربية بالكامل
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

                {canViewFinanceInSettings && (
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
                )}

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
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
            تصدير التقارير الشاملة والنسخ الاحتياطي (CSV / PDF) متاح للمالك العام، ويحدده المالك للمشرفين من مصفوفة الصلاحيات بالأسفل.
          </div>
        )}
      </div>
      )}

      {/* 6. حوكمة المالك والمشرفين: إدارة قبول وإيقاف وحذف المشرفين والمحفظين */}
      {(settingsSubTab === 'privacy_permissions' || settingsSubTab === 'all') && (
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-6">
        {/* Guide File Download Banner for Adding Teachers/Supervisors & Permissions */}
        <div className="p-4 rounded-2xl bg-gradient-to-l from-[#145a3a] to-[#0f452c] text-white border border-[#c59b27]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-[#dfbd69] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>الدليل النصي المعتمد: كيفية إضافة محفظ أو مشرف وصلاحيات كل دور</span>
            </h4>
            <p className="text-xs text-emerald-100/90">
              ملف نصي شامل يشرح خطوات إضافة محفظ أو مشرف جديد، وصلاحيات المالك العام والمشرف والمحفظ والمتاح لكل منهم إضافته أو تعديله.
            </p>
          </div>
          <a
            href="/staff-and-permissions-guide.txt"
            download="دليل-إدارة-المحفظين-والمشرفين-والصلاحيات.txt"
            className="px-4 py-2.5 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center justify-center gap-2 shrink-0 cursor-pointer transition"
          >
            <Download className="w-4 h-4" />
            <span>تحميل الملف النصي للشرح والصلاحيات (.txt)</span>
          </a>
        </div>

        {/* Cloud Sync & Active Authority Level Header */}
        <div className="p-4 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex flex-wrap items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#c59b27]" />
                <span>
                  بوابة حوكمة المالك والمشرفين — إدارة قبول وإيقاف وحذف المشرفين والمحفظين
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
                السحابة: {cloudSyncStatus === 'syncing' ? 'جارٍ الحفظ...' : `متزامن ✓ (${lastSyncTimestamp})`}
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

          {/* Connected Google Account Banner */}
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
                      : 'حالة الاتصال بحساب Google المعتمد'}
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
                إضافة وتخويل {currentStaffTier === 'owner' ? 'مشرف أو محفظ جديد' : 'محفظ جديد'} عبر البريد الإلكتروني المعتمد:
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
                <span>إضافة واعتماد فوري</span>
              </button>
            </div>
          </form>

          {/* OWNER-CONTROLLED SUPERVISOR PERMISSIONS MATRIX */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#145a3a]/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>👑 مصفوفة صلاحيات المشرفين (يحددها المالك العام فقط)</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  المالك العام يمتلك وصولاً كاملاً (100%) لجميع البيانات والنسخ الاحتياطي وطلاب المحفظين، ويحدد من هنا الصلاحيات الممنوحة للمشرفين:
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#145a3a] text-[#dfbd69] text-[10px] font-extrabold">
                {currentStaffTier === 'owner'
                  ? 'وضع تعديل المالك مفعل ✓'
                  : 'للعرض فقط — يحددها المالك'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {(
                [
                  {
                    key: 'canViewAllTeachersStudents',
                    title: 'الاطلاع على طلاب جميع المحفظين',
                    desc: 'رؤية قوائم الطلاب والحلقات لدى كافة المحفظين',
                  },
                  {
                    key: 'canAccessAndExportBackups',
                    title: 'الوصول للنسخ الاحتياطي وتصدير البيانات',
                    desc: 'تحميل واستيراد ملفات JSON و CSV و PDF الشاملة',
                  },
                  {
                    key: 'canManageTeachers',
                    title: 'إدارة حسابات المحفظين',
                    desc: 'قبول أو إيقاف أو حذف المحفظين المسجلين',
                  },
                  {
                    key: 'canManageStudentsAndAdmissions',
                    title: 'إدارة الطلاب وطابور القبول',
                    desc: 'إضافة وتعديل ملفات الطلاب وقبول المستجدين',
                  },
                  {
                    key: 'canViewFinancialRecords',
                    title: 'الاطلاع على السجلات المالية والرسوم',
                    desc: 'كشف المحصل والمتأخرات وإصدار إيصالات السداد',
                  },
                  {
                    key: 'canViewSensitiveStudentContact',
                    title: 'كشف أرقام الهواتف ورموز PIN الكاملة',
                    desc: 'إظهار أرقام واتساب ورموز الدخول بدون تمويه',
                  },
                ] as const
              ).map((perm) => {
                const isChecked = Boolean(supervisorPerms[perm.key]);
                return (
                  <label
                    key={perm.key}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                    } ${
                      currentStaffTier === 'owner'
                        ? 'cursor-pointer'
                        : 'opacity-75 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-[#14281d] dark:text-white">
                        {perm.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {perm.desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={currentStaffTier !== 'owner'}
                      checked={isChecked}
                      onChange={(e) =>
                        updateSupervisorPermissions({
                          [perm.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-0.5 accent-[#145a3a] shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* OWNER-CONTROLLED TEACHER ADDITIONAL PERMISSIONS MATRIX (صلاحيات المحفظين الإضافية المحددة من المالك) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27]/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <span>📖 مصفوفة الصلاحيات الإضافية للمحفظين (يحددها المالك العام)</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  يتحكم المالك العام في منح أو تقييد الصلاحيات الإضافية للمحفظين (مثل إضافة الطلاب، تنزيل ورفع نسخ JSON لطلابهم وحلقاتهم، إدارة الحلقات، الاختبارات، والرسوم):
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#c59b27] text-[#14281d] text-[10px] font-extrabold">
                {currentStaffTier === 'owner'
                  ? 'تحكم المالك بصلاحيات المحفظ مفعل ✓'
                  : 'للعرض فقط — يحددها المالك'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {(
                [
                  {
                    key: 'canAddAndEditStudents',
                    title: 'إضافة طلاب جدد وتعديل بيانات طلابه',
                    desc: 'السماح للمحفظ بإضافة طلاب جدد لحلقاته وتحديث مستواهم ووردهم',
                  },
                  {
                    key: 'canExportTeacherJsonBackup',
                    title: 'تنزيل نسخة JSON من طلابه وحلقاته',
                    desc: 'السماح للمحفظ بتحميل ملف نسخة احتياطية JSON خاص بطلابه وحلقاته',
                  },
                  {
                    key: 'canImportTeacherJsonBackup',
                    title: 'رفع واستعادة نسخة JSON لطلابه وحلقاته',
                    desc: 'السماح للمحفظ برفع ملف JSON لدمج واستعادة طلابه وحلقاته ومزامنتها سحابياً',
                  },
                  {
                    key: 'canCreateAndEditCircles',
                    title: 'إنشاء وتعديل حلقاته القرآنية',
                    desc: 'السماح للمحفظ بتحديث مواعيد الحلقات وروابط الغرف الصوتية',
                  },
                  {
                    key: 'canIssueExamsAndCertificates',
                    title: 'إجراء الاختبارات وإصدار الشهادات',
                    desc: 'السماح للمحفظ باختبار طلابه وإصدار شهادات التقدير والتميز',
                  },
                  {
                    key: 'canManageStudentFees',
                    title: 'متابعة وتسجيل الرسوم الشهرية لطلابه',
                    desc: 'السماح للمحفظ بتسجيل حالة سداد اشتراكات طلابه وإصدار إيصالاتهم',
                  },
                  {
                    key: 'canApproveAdmissionRequests',
                    title: 'قبول الطلاب الجدد من طابور القبول',
                    desc: 'السماح للمحفظ بقبول طلبات الالتحاق الجديدة وإلحاقهم بحلقته مباشرة',
                  },
                ] as const
              ).map((perm) => {
                const isChecked = Boolean(teacherPerms[perm.key]);
                return (
                  <label
                    key={perm.key}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                    } ${
                      currentStaffTier === 'owner'
                        ? 'cursor-pointer'
                        : 'opacity-75 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-[#14281d] dark:text-white">
                        {perm.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {perm.desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={currentStaffTier !== 'owner'}
                      checked={isChecked}
                      onChange={(e) =>
                        updateTeacherPermissions({
                          [perm.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-0.5 accent-[#145a3a] shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* OWNER HUB: ALL TEACHERS' STUDENTS & CIRCLES */}
          {(currentStaffTier === 'owner' ||
            (currentStaffTier === 'supervisor' &&
              supervisorPerms.canViewAllTeachersStudents)) && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-[#c59b27]/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    📚 سجل طلاب المحفظين الشامل للمالك العام ({students.length} طلاب موزعين على المحفظين والحلقات)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    جميع الطلاب لدى كافة المحفظين متاحون للمالك العام للمتابعة أو النقل بين المحفظين أو التصدير الفوري
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-[11px] font-extrabold cursor-pointer"
                >
                  فتح سجل الطلاب الشامل ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {managedTeachers
                  .filter((t) => t.staffRole !== 'supervisor')
                  .map((teacher) => {
                    const teacherStudents = students.filter((st) => {
                      if (st.assignedTeacherEmail) {
                        return (
                          st.assignedTeacherEmail.toLowerCase() ===
                          teacher.email.toLowerCase()
                        );
                      }
                      if (st.assignedTeacherName) {
                        return st.assignedTeacherName === teacher.name;
                      }
                      const circleObj = circles.find((c) => c.name === st.circle);
                      if (circleObj && circleObj.teacherName === teacher.name) {
                        return true;
                      }
                      return teacher.staffRole === 'owner';
                    });

                    return (
                      <div
                        key={teacher.id}
                        className="p-3.5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                            {teacher.staffRole === 'owner' ? '👑 ' : '📖 '}
                            {teacher.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] font-mono text-[10px] font-extrabold">
                            {teacherStudents.length} طلاب
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {teacher.roleTitle}
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 pt-1 border-t border-neutral-200/60 dark:border-emerald-950">
                          {teacherStudents.length === 0 ? (
                            <div className="text-[11px] text-neutral-400 py-1">
                              لا يوجد طلاب مسندون مباشرة حالياً
                            </div>
                          ) : (
                            teacherStudents.map((st) => (
                              <div
                                key={st.id}
                                className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-100 dark:border-emerald-900/40"
                              >
                                <span className="font-bold truncate">
                                  {st.name}{' '}
                                  <span className="text-[10px] text-neutral-400">
                                    ({st.currentStop.surahName})
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(st.id);
                                    setActiveTab('students');
                                  }}
                                  className="text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] underline shrink-0 cursor-pointer"
                                >
                                  ملف الطالب
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Quick Assign Student to Teacher Bar for Owner */}
              {currentStaffTier === 'owner' && students.length > 0 && (
                <div className="pt-2 border-t border-neutral-200/60 dark:border-emerald-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-neutral-600 dark:text-neutral-300">
                    إسناد طالب إلى محفظ محدد (بصلاحية المالك):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedStudentForGoogle}
                      onChange={(e) => setSelectedStudentForGoogle(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#fcfaf2] dark:bg-[#0b1711] text-xs font-bold"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.assignedTeacherName || settings.teacherName})
                        </option>
                      ))}
                    </select>
                    {managedTeachers
                      .filter((t) => t.staffRole !== 'supervisor')
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (selectedStudentForGoogle) {
                              assignStudentToTeacher(
                                selectedStudentForGoogle,
                                t.email,
                                t.name
                              );
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#145a3a]/10 hover:bg-[#145a3a] hover:text-white text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-extrabold transition cursor-pointer"
                        >
                          إسناد إلى: {t.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
                      </div>

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
                      </div>

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

          {/* SECTION C: STUDENT GOOGLE ACCOUNT LINKING */}
          <div className="pt-3 border-t border-neutral-200/70 dark:border-emerald-950 space-y-2.5">
            <h4 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
              🎓 ثالثاً: ربط البريد الإلكتروني بملف الطالب وولي الأمر للدخول السريع
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
                        studentGoogleEmailInput
                      );
                    }
                  }}
                  className="py-2 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                >
                  حفظ ربط البريد الإلكتروني ✓
                </button>
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
      )}

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
