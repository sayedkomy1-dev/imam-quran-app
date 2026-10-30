import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CheckCircle2,
  Cloud,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Download,
  Lock,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';
import {
  DEFAULT_SUPERVISOR_PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS,
} from '../data/seedData';
import { exportDataToJsonBackup } from '../utils/exportService';

export const OwnerControlPanelView: React.FC = () => {
  const {
    students,
    sessions,
    circles,
    exams,
    ijazahs,
    tasks,
    settings,
    managedTeachers,
    currentStaffTier,
    setCurrentStaffTier,
    setSelectedStudentId,
    setActiveTab,
    updateTeacherAccessStatus,
    deleteStaffMember,
    addStaffMember,
    updateStaffFamilyDetails,
    updateStaffRoleAndDetails,
    updateSupervisorPermissions,
    updateTeacherPermissions,
    resetTeacherCustomPermissions,
    importFullBackup,
    exportTeacherScopedJsonBackup,
    importTeacherScopedJsonBackup,
    triggerCloudSyncNow,
    restoreFromCloudFirestoreNow,
    syncAllStaffToFirestoreNow,
    googleAuthUser,
    startGoogleOAuthRedirect,
    auditLogs,
    showToast,
  } = useAcademy();

  const supervisorPerms =
    settings.supervisorPermissions || DEFAULT_SUPERVISOR_PERMISSIONS;
  const teacherPerms =
    settings.teacherPermissions || DEFAULT_TEACHER_PERMISSIONS;
  const canAccessBackups =
    currentStaffTier === 'owner' ||
    (currentStaffTier === 'supervisor' &&
      supervisorPerms.canAccessAndExportBackups);

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'active' | 'blocked'
  >('all');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'supervisor' | 'teacher'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

  // New Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'supervisor' | 'teacher'>('teacher');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'active'>('pending');
  const [newCirclesCount, setNewCirclesCount] = useState<number>(1);
  const [newMother, setNewMother] = useState('');
  const [newGrandfather, setNewGrandfather] = useState('');
  const [newGrandmother, setNewGrandmother] = useState('');
  const [newUncle, setNewUncle] = useState('');

  // Inline Family & Role Edit State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    staffRole: 'supervisor' | 'teacher';
    roleTitle: string;
    assignedCirclesCount: number;
    motherName: string;
    grandfatherName: string;
    grandmotherName: string;
    uncleName: string;
  }>({
    staffRole: 'teacher',
    roleTitle: '',
    assignedCirclesCount: 1,
    motherName: '',
    grandfatherName: '',
    grandmotherName: '',
    uncleName: '',
  });

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const summaryCounts = useMemo(() => {
    const total = managedTeachers.length;
    const pending = managedTeachers.filter((t) => t.status === 'pending').length;
    const active = managedTeachers.filter((t) => t.status === 'active').length;
    const blocked = managedTeachers.filter((t) => t.status === 'blocked').length;
    const supervisors = managedTeachers.filter(
      (t) => t.staffRole === 'supervisor'
    ).length;
    const teachers = managedTeachers.filter(
      (t) => !t.staffRole || t.staffRole === 'teacher'
    ).length;

    return { total, pending, active, blocked, supervisors, teachers };
  }, [managedTeachers]);

  const pendingRegistrations = useMemo(
    () => managedTeachers.filter((t) => t.status === 'pending'),
    [managedTeachers]
  );

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return managedTeachers.filter((member) => {
      if (statusFilter !== 'all' && member.status !== statusFilter) {
        return false;
      }
      if (roleFilter !== 'all') {
        const mRole = member.staffRole || 'teacher';
        if (mRole !== roleFilter) return false;
      }
      if (!q) return true;
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.roleTitle.toLowerCase().includes(q) ||
        (member.googleUid || '').toLowerCase().includes(q)
      );
    });
  }, [managedTeachers, statusFilter, roleFilter, searchQuery]);

  const handleCreateRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('يرجى إدخال الاسم الكامل والبريد الإلكتروني أولاً', 'error');
      return;
    }
    addStaffMember({
      name: newName.trim(),
      email: newEmail.trim(),
      staffRole: newRole,
      roleTitle:
        newTitle.trim() ||
        (newRole === 'supervisor'
          ? 'مشرف عام الحلقات والمتابعة'
          : 'محفظ الحلقات القرآنية'),
      status: newStatus,
      assignedCirclesCount: newCirclesCount,
      motherName: newMother.trim() || undefined,
      grandfatherName: newGrandfather.trim() || undefined,
      grandmotherName: newGrandmother.trim() || undefined,
      uncleName: newUncle.trim() || undefined,
    });
    setNewName('');
    setNewEmail('');
    setNewTitle('');
    setNewMother('');
    setNewGrandfather('');
    setNewGrandmother('');
    setNewUncle('');
    setShowAddForm(false);
  };

  const handleManualFirestoreSync = async () => {
    setIsSyncingFirestore(true);
    try {
      await syncAllStaffToFirestoreNow();
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const permissionAuditLogs = useMemo(
    () =>
      auditLogs
        .filter((l) => l.actionCategory === 'صلاحيات وأمان')
        .slice(0, 8),
    [auditLogs]
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27]/60 dark:border-emerald-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-extrabold text-[#14281d] dark:text-white">
                  لوحة تحكم المالك — إدارة المحفظين والمشرفين والصلاحيات
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  قبول أو إيقاف أو حذف حسابات المحفظين والمشرفين مع المزامنة السحابية الفورية
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/staff-and-permissions-guide.txt"
              download="دليل-إدارة-المحفظين-والمشرفين-والصلاحيات.txt"
              className="px-3.5 py-2 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
              title="تحميل الملف النصي الإرشادي لكيفية إضافة محفظ أو مشرف وصلاحيات كل دور"
            >
              <Download className="w-3.5 h-3.5" />
              <span>📄 تحميل دليل المحفظين والمشرفين والصلاحيات (.txt)</span>
            </a>

            {/* Role Simulator Switcher */}
            <div className="inline-flex rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] p-1 border border-neutral-200 dark:border-emerald-900">
              <button
                type="button"
                onClick={() => setCurrentStaffTier('owner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  currentStaffTier === 'owner'
                    ? 'bg-[#145a3a] text-[#dfbd69]'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                صلاحية المالك العام
              </button>
              <button
                type="button"
                onClick={() => setCurrentStaffTier('supervisor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  currentStaffTier === 'supervisor'
                    ? 'bg-[#145a3a] text-[#dfbd69]'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                صلاحية المشرف
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleManualFirestoreSync()}
              disabled={isSyncingFirestore}
              className="px-3.5 py-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-neutral-200 dark:border-emerald-900 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSyncingFirestore ? 'animate-spin' : ''
                }`}
              />
              <span>☁️ حفظ ومزامنة سحابية الآن</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#dfbd69]" />
              <span>
                {showAddForm
                  ? 'إغلاق نموذج الإضافة'
                  : 'إضافة محفظ / مشرف جديد'}
              </span>
            </button>
          </div>
        </div>

        {/* Cloud Connection Status Bar */}
        <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Cloud className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69] shrink-0" />
            <div>
              <span className="font-extrabold text-[#14281d] dark:text-white">
                حالة النسخ السحابي ومزامنة حسابات الإدارة:{' '}
              </span>
              {googleAuthUser ? (
                <span className="mr-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  • متصل سحابياً بحساب Google ({googleAuthUser.email}) ✓
                </span>
              ) : (
                <span className="mr-2 text-amber-700 dark:text-amber-400 font-bold">
                  • الحفظ السحابي التلقائي مفعل (يمكنك ربط حساب Google للمالك من هنا)
                </span>
              )}
            </div>
          </div>

          {!googleAuthUser && (
            <button
              type="button"
              onClick={() => void startGoogleOAuthRedirect('teacher')}
              className="px-3 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer self-start sm:self-auto"
            >
              ربط حساب Google للمالك
            </button>
          )}
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block">
              إجمالي الكادر التعليمي والإشرافي
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-[#14281d] dark:text-white">
                {summaryCounts.total}
              </span>
              <span className="text-[11px] font-bold text-neutral-500">
                {summaryCounts.supervisors} مشرف • {summaryCounts.teachers} محفظ
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-800/60">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 block">
              تسجيلات جديدة بانتظار القبول
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                {summaryCounts.pending}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                تحتاج قرار المالك
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/70 dark:border-emerald-800/60">
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 block">
              حسابات مقبولة ونشطة (Active)
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {summaryCounts.active}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                مصرح لها بالدخول
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-300/70 dark:border-red-800/60">
            <span className="text-xs font-extrabold text-red-800 dark:text-red-300 block">
              حسابات موقوفة (Blocked)
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-red-700 dark:text-red-400">
                {summaryCounts.blocked}
              </span>
              <span className="text-[11px] font-bold text-red-700 dark:text-red-300">
                ممنوعة من الدخول
              </span>
            </div>
          </div>
        </div>

        {/* Add New Staff Registration Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateRegistration}
            className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border-2 border-[#145a3a]/40 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                إضافة واعتماد محفظ أو مشرف جديد في الأكاديمية
              </h2>
              <span className="text-[11px] text-neutral-500">
                يتم حفظ الحساب ومزامنته سحابياً فوراً
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">
                  اسم المحفظ / المشرف الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: الشيخ عبد الله المقرئ"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  البريد الإلكتروني المعتمد (Google) *
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  الرتبة في الأكاديمية
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as 'supervisor' | 'teacher')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                >
                  <option value="teacher">محفظ حلقات قرآنية</option>
                  {currentStaffTier === 'owner' && (
                    <option value="supervisor">مشرف عام حلقات (خاص بالمالك)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  حالة الحساب المبدئية
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as 'pending' | 'active')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                >
                  <option value="active">مقبول ونشط فوراً</option>
                  <option value="pending">بانتظار مراجعة المالك</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">
                  المسمى الوظيفي والتخصص
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: محفظ رواية حفص ومنهج التأسيس"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                />
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold">عدد الحلقات المسندة:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newCirclesCount}
                    onChange={(e) =>
                      setNewCirclesCount(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-20 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
                  >
                    حفظ واعتماد الحساب ✓
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </section>

      {/* Owner Master Data, Backups & Supervisor Permissions Matrix */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#145a3a]/40 dark:border-emerald-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#c59b27]" />
              <span>
                مركز بيانات المالك الشامل: النسخ الاحتياطي، طلاب المحفظين، وتحديد صلاحيات المشرفين
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              جميع البيانات والنسخ الاحتياطي والطلاب لدى المحفظين متاحون بالكامل للمالك العام، مع تحكم المالك الفوري في صلاحيات المشرفين
            </p>
          </div>

          {canAccessBackups && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void triggerCloudSyncNow(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-[#dfbd69]" />
                <span>☁️ مزامنة السحابة (Firestore) يدوياً الآن</span>
              </button>

              <button
                type="button"
                onClick={() => void restoreFromCloudFirestoreNow()}
                className="px-3.5 py-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:border-emerald-600 border border-emerald-600/60 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>🔄 استعادة أحدث نسخة من السحابة</span>
              </button>

              <button
                type="button"
                onClick={() => {
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
                    'تم تصدير النسخة الاحتياطية الشاملة لجميع بيانات الأكاديمية وطلاب المحفظين (JSON) بنجاح ✓',
                    'success'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#dfbd69]" />
                <span>تصدير النسخة الاحتياطية الشاملة للمالك (JSON)</span>
              </button>

              <label className="px-4 py-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] hover:border-[#145a3a] border border-[#c59b27]/60 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>استيراد نسخة احتياطية شاملة (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(String(ev.target?.result || '{}'));
                        importFullBackup(parsed);
                      } catch {
                        showToast('تعذر قراءة ملف النسخة الاحتياطية JSON', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Supervisor Permissions Matrix (Controlled by Owner) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#14281d] dark:text-white">
              🛡️ مصفوفة صلاحيات المشرفين (يحددها المالك العام فقط):
            </h3>
            <span className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
              {currentStaffTier === 'owner'
                ? 'اضغط على أي صلاحية لمنحها أو حجبها عن المشرفين'
                : 'للعرض فقط — التعديل خاص بالمالك العام'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {(
              [
                {
                  key: 'canViewAllTeachersStudents',
                  title: 'رؤية طلاب جميع المحفظين',
                  desc: 'السماح للمشرف بالاطلاع على كافة طلاب وحلقات المحفظين',
                },
                {
                  key: 'canAccessAndExportBackups',
                  title: 'الوصول للنسخ الاحتياطي وتصدير البيانات',
                  desc: 'السماح للمشرف بتحميل واستيراد ملفات النسخ الاحتياطي',
                },
                {
                  key: 'canManageTeachers',
                  title: 'إدارة حسابات المحفظين',
                  desc: 'السماح للمشرف بقبول أو إيقاف المحفظين',
                },
                {
                  key: 'canManageStudentsAndAdmissions',
                  title: 'إدارة ملفات الطلاب وطابور القبول',
                  desc: 'السماح للمشرف بإضافة وتعديل الطلاب وقبول المستجدين',
                },
                {
                  key: 'canViewFinancialRecords',
                  title: 'الاطلاع على السجلات المالية والرسوم',
                  desc: 'السماح للمشرف بمراجعة المدفوعات وإيصالات السداد',
                },
                {
                  key: 'canViewSensitiveStudentContact',
                  title: 'إظهار أرقام الهواتف ورموز PIN الكاملة',
                  desc: 'السماح للمشرف برؤية أرقام الهواتف بدون تمويه الخصوصية',
                },
              ] as const
            ).map((perm) => {
              const checked = Boolean(supervisorPerms[perm.key]);
              return (
                <label
                  key={perm.key}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                    checked
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
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
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {perm.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={currentStaffTier !== 'owner'}
                    checked={checked}
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

        {/* Teacher Additional Permissions Matrix (Controlled by Owner) */}
        <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#14281d] dark:text-white">
              📖 مصفوفة الصلاحيات الإضافية للمحفظين (يحددها المالك العام):
            </h3>
            <span className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69]">
              {currentStaffTier === 'owner'
                ? 'تحكم في صلاحيات الشيخ المحفظ (إضافة طلاب، تنزيل ورفع JSON، الحلقات، الاختبارات)'
                : 'للعرض فقط — التعديل خاص بالمالك العام'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {(
              [
                {
                  key: 'canAddAndEditStudents',
                  title: 'إضافة طلاب جدد وتعديل ملفات طلابه',
                  desc: 'يستطيع المحفظ إضافة طلاب جدد وتحديث بيانات طلاب حلقاته مباشرة',
                },
                {
                  key: 'canExportTeacherJsonBackup',
                  title: 'تنزيل نسخة JSON من طلابه وحلقاته',
                  desc: 'يستطيع المحفظ تحميل ملف JSON يحتوي على طلابه وحلقاته وجلساته',
                },
                {
                  key: 'canImportTeacherJsonBackup',
                  title: 'رفع واستعادة نسخة JSON لطلابه وحلقاته',
                  desc: 'يستطيع المحفظ رفع ملف JSON لطلابه وحلقاته ودمجه مع السحابة تلقائياً',
                },
                {
                  key: 'canCreateAndEditCircles',
                  title: 'إنشاء وتعديل الحلقات القرآنية',
                  desc: 'السماح للمحفظ بإنشاء حلقات جديدة أو تعديل مواعيد حلقاته',
                },
                {
                  key: 'canIssueExamsAndCertificates',
                  title: 'إجراء الاختبارات وإصدار الشهادات والأوسمة',
                  desc: 'السماح للمحفظ باعتماد الاختبارات ومنح شهادات التقدير والإجازات',
                },
                {
                  key: 'canManageStudentFees',
                  title: 'تسجيل سداد الرسوم وإصدار الإيصالات',
                  desc: 'السماح للمحفظ بتحديث حالة سداد رسوم طلابه وإصدار إيصال رقمي',
                },
                {
                  key: 'canApproveAdmissionRequests',
                  title: 'قبول الطلاب الجدد من طابور التسجيل',
                  desc: 'السماح للمحفظ بقبول طلبات الالتحاق الجديدة وإلحاق الطالب بحلقته',
                },
              ] as const
            ).map((perm) => {
              const checked = Boolean(teacherPerms[perm.key]);
              return (
                <label
                  key={perm.key}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition ${
                    checked
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
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
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {perm.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    disabled={currentStaffTier !== 'owner'}
                    checked={checked}
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

        {/* All Teachers' Students Overview for Owner */}
        {(currentStaffTier === 'owner' ||
          (currentStaffTier === 'supervisor' &&
            supervisorPerms.canViewAllTeachersStudents)) && (
          <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                📖 جميع الطلاب لدى المحفظين ({students.length} طلاب • {sessions.length} حصة مسجلة):
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                عرض وإدارة جميع الطلاب ←
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
                    const c = circles.find((ci) => ci.name === st.circle);
                    if (c && c.teacherName === teacher.name) return true;
                    return teacher.staffRole === 'owner';
                  });

                  return (
                    <div
                      key={teacher.id}
                      className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[#14281d] dark:text-white">
                          {teacher.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => exportTeacherScopedJsonBackup(teacher.email)}
                            className="px-2 py-0.5 rounded-lg bg-[#fcfaf2] dark:bg-[#12231a] border border-[#c59b27]/60 text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                            title="تنزيل نسخة JSON لطلاب وحلقات هذا المحفظ"
                          >
                            📥 JSON المحفظ
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-[#145a3a] text-[#dfbd69] font-mono text-[10px] font-extrabold">
                            {teacherStudents.length} طلاب
                          </span>
                        </div>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1">
                        {teacherStudents.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between py-1 px-2 rounded-lg bg-white dark:bg-[#12231a] border border-neutral-200/60 dark:border-emerald-900/40"
                          >
                            <span className="font-bold truncate">{st.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentId(st.id);
                                setActiveTab('students');
                              }}
                              className="text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
                            >
                              فتح الملف
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      {/* Priority Queue: New Registrations Awaiting Approval */}
      {pendingRegistrations.length > 0 && (
        <section className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 p-5 border-2 border-amber-400/70 dark:border-amber-700/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <h2 className="text-sm md:text-base font-extrabold text-[#14281d] dark:text-white">
                طلبات تسجيل المحفظين والمشرفين الجدد بانتظار الموافقة ({pendingRegistrations.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              اختر (قبول وتفعيل) أو (إيقاف) أو (حذف نهائي) ليتم التحديث فوراً في Firestore
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingRegistrations.map((req) => {
              const isSupervisor = req.staffRole === 'supervisor';
              const canAct =
                currentStaffTier === 'owner' ||
                (currentStaffTier === 'supervisor' && !isSupervisor);

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#12231a] border border-amber-300 dark:border-amber-800/70 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#14281d] dark:text-white">
                          {req.name}
                        </span>
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          • {isSupervisor ? 'طلب تسجيل مشرف' : 'طلب تسجيل محفظ'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {req.roleTitle} —{' '}
                        <span className="font-mono" dir="ltr">
                          {req.email}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                      ● بانتظار القبول
                    </span>
                  </div>

                  {canAct ? (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/50">
                      <button
                        type="button"
                        onClick={() => updateTeacherAccessStatus(req.id, 'active')}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>قبول التسجيل وتفعيله</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTeacherAccessStatus(req.id, 'blocked')}
                        className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-4 h-4" />
                        <span>إيقاف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStaffMember(req.id)}
                        className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-neutral-500 pt-2 border-t border-neutral-100 dark:border-emerald-900/50">
                      اعتماد أو حذف المشرفين متاح للمالك العام فقط.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Staff Directory & Controls */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69]" />
            <h2 className="text-base font-extrabold text-[#14281d] dark:text-white">
              سجل الكادر التعليمي والإشرافي المعتمد (المحفظون والمشرفون)
            </h2>
          </div>

          {/* Search & Role Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو المعرف..."
                className="pr-8 pl-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold w-60"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value as 'all' | 'supervisor' | 'teacher'
                )
              }
              aria-label="تصفية حسب الرتبة"
              className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold"
            >
              <option value="all">جميع الرتب (المالك والمشرفون والمحفظون)</option>
              <option value="supervisor">المشرفون فقط</option>
              <option value="teacher">المحفظون فقط</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: `الكل (${summaryCounts.total})` },
              {
                id: 'pending',
                label: `بانتظار القبول (${summaryCounts.pending})`,
              },
              {
                id: 'active',
                label: `مقبول ونشط (${summaryCounts.active})`,
              },
              {
                id: 'blocked',
                label: `موقوف (${summaryCounts.blocked})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#145a3a] text-white border-[#145a3a]'
                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStaff.map((member) => {
            const isTargetOwner = member.staffRole === 'owner';
            const isTargetSupervisor = member.staffRole === 'supervisor';
            const canManage =
              !isTargetOwner &&
              (currentStaffTier === 'owner' ||
                (currentStaffTier === 'supervisor' && !isTargetSupervisor));
            const isEditing = editingMemberId === member.id;
            const isConfirmingDelete = confirmDeleteId === member.id;

            return (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                          {member.name}
                        </h3>
                        <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          •{' '}
                          {isTargetOwner
                            ? 'المالك العام'
                            : isTargetSupervisor
                            ? 'مشرف عام'
                            : 'محفظ حلقات'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {member.roleTitle} —{' '}
                        <span className="font-mono" dir="ltr">
                          {member.email}
                        </span>
                      </p>
                      <div className="text-[11px] font-bold text-neutral-500 mt-1">
                        عدد الحلقات المسندة: {member.assignedCirclesCount ?? 1} حلقة
                      </div>
                    </div>

                    <span
                      className={`text-xs font-extrabold shrink-0 ${
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
                        : '● موقوف'}
                    </span>
                  </div>

                  {/* Role & Title Details Box */}
                  <div className="p-3 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        الرتبة الوظيفية والتخصص في الأكاديمية:
                      </span>
                      {!isTargetOwner && currentStaffTier === 'owner' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingMemberId(null);
                            } else {
                              setEditingMemberId(member.id);
                              setEditDraft({
                                staffRole:
                                  member.staffRole === 'supervisor'
                                    ? 'supervisor'
                                    : 'teacher',
                                roleTitle: member.roleTitle,
                                assignedCirclesCount:
                                  member.assignedCirclesCount ?? 1,
                                motherName: member.motherName || '',
                                grandfatherName: member.grandfatherName || '',
                                grandmotherName: member.grandmotherName || '',
                                uncleName: member.uncleName || '',
                              });
                            }
                          }}
                          className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
                        >
                          {isEditing ? 'إغلاق التعديل' : 'تعديل الرتبة والمسمى'}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2.5 pt-1">
                        {currentStaffTier === 'owner' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={editDraft.staffRole}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  staffRole: e.target.value as
                                    | 'supervisor'
                                    | 'teacher',
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            >
                              <option value="teacher">الرتبة: محفظ قرآن</option>
                              <option value="supervisor">الرتبة: مشرف عام</option>
                            </select>
                            <input
                              type="text"
                              value={editDraft.roleTitle}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  roleTitle: e.target.value,
                                }))
                              }
                              placeholder="المسمى الوظيفي"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentStaffTier === 'owner') {
                                updateStaffRoleAndDetails(member.id, {
                                  staffRole: editDraft.staffRole,
                                  roleTitle: editDraft.roleTitle,
                                  assignedCirclesCount:
                                    editDraft.assignedCirclesCount,
                                });
                              }
                              setEditingMemberId(null);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                          >
                            حفظ التعديلات ✓
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                        <span>المسمى: {member.roleTitle}</span>
                        <span>الحلقات المسندة: {member.assignedCirclesCount ?? 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Per-Teacher Custom Permissions Box (تخصيص صلاحيات هذا المحفظ بشكل مستقل) */}
                  {!isTargetOwner && !isTargetSupervisor && (
                    <div className="p-3 rounded-xl bg-[#fcfaf2] dark:bg-[#12231a] border border-[#c59b27]/60 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          🎯 صلاحيات مخصصة لهذا المحفظ:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {member.customTeacherPermissions &&
                            Object.keys(member.customTeacherPermissions).length > 0 &&
                            currentStaffTier === 'owner' && (
                              <button
                                type="button"
                                onClick={() => resetTeacherCustomPermissions(member.id)}
                                className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] font-bold cursor-pointer"
                              >
                                إعادة للافتراضي
                              </button>
                            )}
                          <button
                            type="button"
                            onClick={() => setActiveTab('settings')}
                            className="text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
                          >
                            شاشة التخصيص الكاملة ←
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {(
                          [
                            {
                              key: 'canAddAndEditStudents',
                              label: 'إضافة وتعديل الطلاب',
                            },
                            {
                              key: 'canExportTeacherJsonBackup',
                              label: 'تصدير ملفات JSON',
                            },
                            {
                              key: 'canImportTeacherJsonBackup',
                              label: 'رفع واستعادة JSON',
                            },
                            {
                              key: 'canManageStudentFees',
                              label: 'السجلات المالية والرسوم',
                            },
                          ] as const
                        ).map((pItem) => {
                          const effectiveVal = Boolean(
                            ({
                              ...DEFAULT_TEACHER_PERMISSIONS,
                              ...(settings.teacherPermissions || {}),
                              ...(member.customTeacherPermissions || {}),
                            } as Record<string, boolean>)[pItem.key]
                          );
                          return (
                            <label
                              key={pItem.key}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1.5 ${
                                effectiveVal
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/40'
                                  : 'bg-white dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                              } ${
                                currentStaffTier === 'owner'
                                  ? 'cursor-pointer'
                                  : 'opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <span className="font-bold text-[#14281d] dark:text-white truncate">
                                {pItem.label}
                              </span>
                              <input
                                type="checkbox"
                                disabled={currentStaffTier !== 'owner'}
                                checked={effectiveVal}
                                onChange={(e) =>
                                  updateTeacherPermissions(
                                    { [pItem.key]: e.target.checked },
                                    member.id
                                  )
                                }
                                className="w-3.5 h-3.5 accent-[#145a3a] shrink-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Controls: Approve (قبول), Suspend (إيقاف), Delete (حذف) */}
                <div className="pt-3 border-t border-neutral-200/80 dark:border-emerald-900/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-neutral-500">
                    آخر مزامنة سحابية: {member.lastSyncAt}
                  </span>

                  {isTargetOwner ? (
                    <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>حساب المالك العام (محمي من الإيقاف أو الحذف)</span>
                    </span>
                  ) : canManage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {member.status !== 'active' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateTeacherAccessStatus(member.id, 'active')
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>قبول وتفعيل</span>
                        </button>
                      )}

                      {member.status !== 'blocked' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateTeacherAccessStatus(member.id, 'blocked')
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>إيقاف الحساب</span>
                        </button>
                      )}

                      {member.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateTeacherAccessStatus(member.id, 'pending')
                          }
                          className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer"
                        >
                          تعليق للمراجعة
                        </button>
                      )}

                      {isConfirmingDelete ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-xl border border-red-300 dark:border-red-800">
                          <span className="text-[11px] font-extrabold text-red-700 dark:text-red-300">
                            تأكيد الحذف؟
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteStaffMember(member.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-extrabold cursor-pointer"
                          >
                            نعم، احذف
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            تراجع
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(member.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف نهائي</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-neutral-500">
                      إدارة المشرفين متاحة للمالك العام فقط
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Security & Staff Audit Log */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-3">
        <h2 className="text-sm font-extrabold text-[#14281d] dark:text-white">
          سجل عمليات الإدارة والاعتماد (القبول، الإيقاف، وتحديث الصلاحيات)
        </h2>
        <div className="space-y-2">
          {permissionAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <span className="font-bold text-[#14281d] dark:text-white">
                {log.summary}
              </span>
              <span className="font-mono text-[11px] text-neutral-500 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
