import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CheckCircle2,
  Cloud,
  Crown,
  Download,
  KeyRound,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_SUPERVISOR_PERMISSIONS,
  DEFAULT_TEACHER_PERMISSIONS,
} from '../data/seedData';
import { exportDataToJsonBackup } from '../utils/exportService';
import {
  getEffectiveFirebaseConfig,
  isMasterOwnerEmail,
  resetCustomFirebaseConfig,
  saveCustomFirebaseConfig,
} from '../utils/firebaseClient';
import {
  MASTER_OWNER_EMAILS,
  StaffHierarchyRole,
  TeacherAccessRecord,
  TeacherPermissions,
} from '../types';
import { OFFICIAL_ACADEMY_WHATSAPP } from '../data/hybridFoundationData';

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
    updateStaffRoleAndDetails,
    updateSupervisorPermissions,
    updateTeacherPermissions,
    resetTeacherCustomPermissions,
    importFullBackup,
    exportTeacherScopedJsonBackup,
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
    'all' | 'owner' | 'supervisor' | 'teacher' | 'financial_manager'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);

  // Firebase Config Box State (⚙️ إعدادات الربط السحابي الفوري)
  const initialFbCfg = useMemo(() => getEffectiveFirebaseConfig(), []);
  const [showFirebaseConfigPanel, setShowFirebaseConfigPanel] = useState(false);
  const [fbApiKey, setFbApiKey] = useState(initialFbCfg.config.apiKey || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(
    initialFbCfg.config.authDomain || ''
  );
  const [fbProjectId, setFbProjectId] = useState(
    initialFbCfg.config.projectId || ''
  );
  const [fbAppId, setFbAppId] = useState(initialFbCfg.config.appId || '');
  const [fbDatabaseId, setFbDatabaseId] = useState(
    initialFbCfg.config.firestoreDatabaseId || ''
  );
  const [isCustomFbActive, setIsCustomFbActive] = useState(
    initialFbCfg.isCustom
  );

  // Granular Role & Permission Matrix Modal State (⚙️ تخصيص الدور والصلاحيات والحلقات)
  const [rbacTargetMemberId, setRbacTargetMemberId] = useState<string | null>(
    null
  );

  // New Registration Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newRole, setNewRole] = useState<StaffHierarchyRole>('teacher');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'active'>('active');
  const [newCirclesCount, setNewCirclesCount] = useState<number>(1);
  const [newSelectedCircles, setNewSelectedCircles] = useState<string[]>([]);

  // Inline Role Edit State
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    staffRole: StaffHierarchyRole;
    roleTitle: string;
    assignedCirclesCount: number;
    whatsappPhone: string;
  }>({
    staffRole: 'teacher',
    roleTitle: '',
    assignedCirclesCount: 1,
    whatsappPhone: '',
  });

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rbacTargetMember = useMemo(
    () => managedTeachers.find((m) => m.id === rbacTargetMemberId) || null,
    [managedTeachers, rbacTargetMemberId]
  );

  const summaryCounts = useMemo(() => {
    const total = managedTeachers.length;
    const pending = managedTeachers.filter((t) => t.status === 'pending').length;
    const active = managedTeachers.filter((t) => t.status === 'active').length;
    const blocked = managedTeachers.filter((t) => t.status === 'blocked').length;
    const owners = managedTeachers.filter((t) => t.staffRole === 'owner').length;
    const supervisors = managedTeachers.filter(
      (t) => t.staffRole === 'supervisor'
    ).length;
    const financialManagers = managedTeachers.filter(
      (t) => t.staffRole === 'financial_manager'
    ).length;
    const teachers = managedTeachers.filter(
      (t) => !t.staffRole || t.staffRole === 'teacher'
    ).length;

    return {
      total,
      pending,
      active,
      blocked,
      owners,
      supervisors,
      financialManagers,
      teachers,
    };
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
        (member.whatsappPhone || '').toLowerCase().includes(q) ||
        (member.googleUid || '').toLowerCase().includes(q)
      );
    });
  }, [managedTeachers, statusFilter, roleFilter, searchQuery]);

  const getRoleBadgeLabel = (role?: StaffHierarchyRole) => {
    if (role === 'owner') return '👑 مالك الأكاديمية (Owner)';
    if (role === 'supervisor') return '🛡️ مشرف عام (General Supervisor)';
    if (role === 'financial_manager')
      return '💼 مسؤول مالي / إداري (Financial Manager)';
    return '📖 محفظ حلقة (Circle Teacher)';
  };

  const buildStaffActivationWhatsAppUrl = (member: TeacherAccessRecord) => {
    const roleLabel =
      member.staffRole === 'supervisor'
        ? 'مشرف عام بالأكاديمية'
        : member.staffRole === 'financial_manager'
        ? 'مسؤول مالي وإداري'
        : 'محفظ حلقة قرآنية';
    const circlesText =
      member.assignedCircleNames && member.assignedCircleNames.length > 0
        ? member.assignedCircleNames.join('، ')
        : `عدد (${member.assignedCirclesCount || 1}) حلقة قرآنية`;
    const msg = `السلام عليكم ورحمة الله وبركاته فضيلة الشيخ / ${member.name} 🌿\n\nيسعدنا إبلاغكم بأنه قد تم **تفعيل واعتماد حسابكم رسمياً** من قِبل مالك أكاديمية الإمام لتحفيظ القرآن الكريم:\n• البريد المعتمد للدخول: ${member.email}\n• الصلاحية والدور: ${roleLabel}\n• الحلقات المسندة: ${circlesText}\n• رمز الدخول السري (PIN): ${settings.teacherPin || '1234'}\n\nيمكنكم الآن تسجيل الدخول مباشرة عبر بوابة المحفظين والمشرفين ومباشرة حلقاتكم المباركة. بارك الله في جهودكم وأجركم.`;
    const cleanPhone = (member.whatsappPhone || '').replace(/\D/g, '');
    const targetPhone =
      cleanPhone.length >= 8 ? cleanPhone : OFFICIAL_ACADEMY_WHATSAPP;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleApproveAndNotifyStaff = (member: TeacherAccessRecord) => {
    updateTeacherAccessStatus(member.id, 'active');
    showToast(
      `تم تفعيل حساب (${member.name}) بنجاح وحفظه في السحابة ✓`,
      'success'
    );
  };

  const handleSaveCustomFirebaseKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      showToast(
        'يرجى إدخال مفاتيح المشروع الأساسية (apiKey, projectId, appId)',
        'error'
      );
      return;
    }
    saveCustomFirebaseConfig({
      apiKey: fbApiKey.trim(),
      authDomain:
        fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      projectId: fbProjectId.trim(),
      appId: fbAppId.trim(),
      firestoreDatabaseId: fbDatabaseId.trim() || undefined,
    });
    setIsCustomFbActive(true);
    showToast(
      'تم حفظ إعدادات الربط السحابي (Firebase Config) بنجاح! جاري مزامنة البيانات...',
      'success'
    );
    void handleManualFirestoreSync();
  };

  const handleResetFirebaseKeys = () => {
    resetCustomFirebaseConfig();
    const def = getEffectiveFirebaseConfig();
    setFbApiKey(def.config.apiKey || '');
    setFbAuthDomain(def.config.authDomain || '');
    setFbProjectId(def.config.projectId || '');
    setFbAppId(def.config.appId || '');
    setFbDatabaseId(def.config.firestoreDatabaseId || '');
    setIsCustomFbActive(false);
    showToast('تمت استعادة إعدادات الربط السحابي الافتراضية للأكاديمية ✓', 'info');
  };

  const handleCreateRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('يرجى إدخال الاسم الكامل والبريد الإلكتروني أولاً', 'error');
      return;
    }
    addStaffMember({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      whatsappPhone: newWhatsapp.trim() || undefined,
      staffRole: newRole === 'owner' ? 'supervisor' : newRole,
      roleTitle:
        newTitle.trim() ||
        (newRole === 'supervisor'
          ? 'مشرف عام الحلقات والمتابعة'
          : newRole === 'financial_manager'
          ? 'مسؤول الإدارة المالية والاشتراكات'
          : 'محفظ الحلقات القرآنية'),
      status: newStatus,
      assignedCirclesCount:
        newSelectedCircles.length > 0
          ? newSelectedCircles.length
          : newCirclesCount,
      assignedCircleNames:
        newSelectedCircles.length > 0 ? newSelectedCircles : undefined,
      restrictToAssignedCircles: newSelectedCircles.length > 0,
    });
    setNewName('');
    setNewEmail('');
    setNewWhatsapp('');
    setNewTitle('');
    setNewSelectedCircles([]);
    setShowAddForm(false);
  };

  const handleManualFirestoreSync = async () => {
    setIsSyncingFirestore(true);
    try {
      await syncAllStaffToFirestoreNow();
      await triggerCloudSyncNow(true);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const toggleCircleForMember = (
    member: TeacherAccessRecord,
    circleName: string
  ) => {
    const currentList = member.assignedCircleNames || [];
    const exists = currentList.includes(circleName);
    const nextList = exists
      ? currentList.filter((c) => c !== circleName)
      : [...currentList, circleName];
    updateStaffRoleAndDetails(member.id, {
      assignedCircleNames: nextList,
      assignedCirclesCount: Math.max(1, nextList.length),
    });
  };

  const permissionAuditLogs = useMemo(
    () =>
      auditLogs
        .filter((l) => l.actionCategory === 'صلاحيات وأمان')
        .slice(0, 10),
    [auditLogs]
  );

  // Compute live session counts per teacher for the Staff Activity Audit table
  const staffActivityMetrics = useMemo(() => {
    return managedTeachers.map((member) => {
      const assignedStudents = students.filter((st) => {
        if (
          st.assignedTeacherEmail &&
          st.assignedTeacherEmail.toLowerCase() === member.email.toLowerCase()
        ) {
          return true;
        }
        if (st.assignedTeacherName && st.assignedTeacherName === member.name) {
          return true;
        }
        if (
          member.assignedCircleNames &&
          member.assignedCircleNames.includes(st.circle)
        ) {
          return true;
        }
        const cir = circles.find((c) => c.name === st.circle);
        if (cir && cir.teacherName === member.name) return true;
        return member.staffRole === 'owner';
      });
      const studentIds = new Set(assignedStudents.map((s) => s.id));
      const recordedSessionsCount =
        member.sessionsRecordedCount ??
        sessions.filter((sess) => studentIds.has(sess.studentId)).length;

      return {
        member,
        studentsCount: assignedStudents.length,
        recordedSessionsCount,
        lastActive: member.lastActiveAt || member.lastSyncAt || 'متصل حديثاً',
      };
    });
  }, [managedTeachers, students, circles, sessions]);

  return (
    <div className="space-y-6">
      {/* ====================================================================
          TOP ROYAL OWNER BANNER & MASTER ACCOUNTS BADGE
      ==================================================================== */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border-2 border-[#c59b27] dark:border-amber-500/70 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c59b27] via-amber-400 to-yellow-500 text-[#14281d] flex items-center justify-center shrink-0 shadow-md">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg md:text-xl font-extrabold text-[#14281d] dark:text-white">
                    👑 لوحة المالك والصلاحيات العليا (Super Admin & RBAC Center)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-[#c59b27] text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-black">
                    حسابات المالك المعتمدة محمية 100%
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  الاعتماد الفوري لطلبات المحفظين والمشرفين (Google / Microsoft SSO)، مصفوفة الصلاحيات الدقيقة، والربط السحابي المباشر
                </p>
              </div>
            </div>

            {/* Master Owner Emails Protection Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                حسابات المالك الأعلى المسجلة برمجياً (Super Owners):
              </span>
              {MASTER_OWNER_EMAILS.map((ownerMail) => (
                <span
                  key={ownerMail}
                  dir="ltr"
                  className="px-2.5 py-0.5 rounded-lg bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/60 font-mono font-extrabold text-[#14281d] dark:text-amber-300 flex items-center gap-1"
                >
                  <span>👑</span>
                  <span>{ownerMail}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                👑 صلاحية المالك
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
                🛡️ معاينة كمشرف
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFirebaseConfigPanel((prev) => !prev)
              }
              className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                showFirebaseConfigPanel
                  ? 'bg-[#c59b27] text-[#14281d] border-[#c59b27]'
                  : 'bg-[#fcfaf2] dark:bg-[#0b1711] border-[#c59b27]/60 text-[#145a3a] dark:text-[#dfbd69]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>⚙️ إعدادات الربط السحابي (Firebase Config)</span>
            </button>

            <button
              type="button"
              onClick={() => void handleManualFirestoreSync()}
              disabled={isSyncingFirestore}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSyncingFirestore ? 'animate-spin' : ''
                }`}
              />
              <span>☁️ مزامنة بيانات الحلقات والطلاب مع السحابة الآن</span>
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
                  : 'إضافة محفظ / مشرف يدوياً'}
              </span>
            </button>
          </div>
        </div>

        {/* ==================================================================
            SECTION 4B: FIREBASE CONFIG & INSTANT CLOUD SYNC PANEL
        ================================================================== */}
        {showFirebaseConfigPanel && (
          <form
            onSubmit={handleSaveCustomFirebaseKeys}
            className="p-5 rounded-2xl bg-[#fcfaf2] dark:bg-[#0b1711] border-2 border-[#c59b27] space-y-4 animate-in fade-in"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-emerald-900 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#c59b27]" />
                  <span>
                    ⚙️ إعدادات الربط السحابي الفوري (Firebase Config & Real-Time onSnapshot)
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  يمكنك لصق مفاتيح مشروع Firebase الخاص بك لتعمل المزامنة اللحظية بين مختلف الأجهزة، أو استخدام الربط السحابي المدمج.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  isCustomFbActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isCustomFbActive
                  ? '● مفاتيح Firebase مخصصة مفعلة'
                  : '● إعدادات السحابة الافتراضية مفعلة + LocalStorage Sync'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1 font-mono">
                  apiKey *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono text-[11px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1 font-mono">
                  authDomain *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={fbAuthDomain}
                  onChange={(e) => setFbAuthDomain(e.target.value)}
                  placeholder="project.firebaseapp.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono text-[11px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1 font-mono">
                  projectId *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  placeholder="my-quran-academy"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono text-[11px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1 font-mono">
                  appId *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  placeholder="1:123456:web:abcdef"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono text-[11px]"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1 font-mono">
                  databaseId (اختياري)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={fbDatabaseId}
                  onChange={(e) => setFbDatabaseId(e.target.value)}
                  placeholder="(default)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-800 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                {isCustomFbActive && (
                  <button
                    type="button"
                    onClick={handleResetFirebaseKeys}
                    className="px-3.5 py-2 rounded-xl border border-red-300 text-red-700 dark:text-red-300 text-xs font-bold cursor-pointer"
                  >
                    استعادة الإعدادات الافتراضية
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleManualFirestoreSync()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-4 h-4" />
                  <span>☁️ مزامنة بيانات الحلقات والطلاب مع السحابة الآن</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFirebaseConfigPanel(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-emerald-800 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black cursor-pointer shadow-sm"
                >
                  حفظ وتفعيل مفاتيح الربط السحابي ✓
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Cloud Connection Status Bar */}
        <div className="p-3.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Cloud className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69] shrink-0" />
            <div>
              <span className="font-extrabold text-[#14281d] dark:text-white">
                حالة المزامنة اللحظية (onSnapshot + Local Sync):{' '}
              </span>
              {googleAuthUser ? (
                <span className="mr-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  • متصل سحابياً بحساب ({googleAuthUser.email}) ✓
                </span>
              ) : (
                <span className="mr-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  • المزامنة الفورية مفعلة (Firestore + LocalStorage `imam_cloud_staff_users_v1`) ✓
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!googleAuthUser && (
              <button
                type="button"
                onClick={() => void startGoogleOAuthRedirect('teacher')}
                className="px-3 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
              >
                ربط حساب Google للمالك
              </button>
            )}
          </div>
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
                {summaryCounts.owners} مالك • {summaryCounts.supervisors} مشرف • {summaryCounts.teachers} محفظ
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-800/60">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 block">
              طابور طلبات الانضمام المعلقة
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                {summaryCounts.pending}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                بانتظار موافقة المالك
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/70 dark:border-emerald-800/60">
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 block">
              حسابات مفعلة ونشطة (Active)
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
              حسابات موقوفة / محظورة
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
                إضافة واعتماد محفظ أو مشرف أو مسؤول مالي جديد
              </h2>
              <span className="text-[11px] text-neutral-500">
                يتم حفظ الحساب ومزامنته سحابياً فوراً
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">
                  الاسم الثلاثي الكامل *
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
                  البريد الإلكتروني (Google / Microsoft) *
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="teacher@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  رقم الواتساب للتفعيل
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="201000000000"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  الدور الوظيفي (RBAC Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as StaffHierarchyRole)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                >
                  <option value="teacher">محفظ حلقة (Circle Teacher)</option>
                  <option value="supervisor">مشرف عام (General Supervisor)</option>
                  <option value="financial_manager">
                    مسؤول مالي / إداري (Financial Manager)
                  </option>
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
                  <option value="pending">قيد انتظار موافقة المالك</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">
                  التخصص / الإجازات القرآنية والمسمى الوظيفي
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مجاز بالقراءات العشر ومنهج التأسيس"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-300 dark:border-emerald-900 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">
                  تخصيص الحلقات المسندة (اختيار متعدد):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {circles.map((c) => {
                    const selected = newSelectedCircles.includes(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setNewSelectedCircles((prev) =>
                            prev.includes(c.name)
                              ? prev.filter((x) => x !== c.name)
                              : [...prev, c.name]
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                          selected
                            ? 'bg-[#145a3a] text-white border-[#145a3a]'
                            : 'bg-white dark:bg-[#12231a] border-neutral-300 dark:border-emerald-800'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
          </form>
        )}
      </section>

      {/* ====================================================================
          SECTION 1: REAL-TIME PENDING REQUESTS QUEUE (طابور طلبات الانضمام المعلقة الفوري)
      ==================================================================== */}
      <section className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 p-5 border-2 border-amber-400/80 dark:border-amber-700/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-[#14281d] dark:text-white">
                ١. طابور طلبات الانضمام المعلقة الفوري (Pending Requests Queue — {pendingRegistrations.length})
              </h2>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                يستمع لحظياً لطلبات المحفظين والمشرفين الجدد عبر Google و Microsoft مع التفعيل الفوري وإشعار واتساب
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-900 dark:text-amber-200">
            ● تحديث فوري (Real-Time onSnapshot)
          </span>
        </div>

        {pendingRegistrations.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/80 dark:bg-[#12231a]/80 border border-amber-200 dark:border-amber-900/50 text-center text-xs text-neutral-500 font-bold">
            لا توجد طلبات انضمام معلقة حالياً. أي محفظ أو مشرف يسجل دخوله لأول مرة عبر Google أو Microsoft سيظهر طلبه هنا فوراً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRegistrations.map((req) => {
              const isSupervisor = req.staffRole === 'supervisor';
              const provider = req.authProvider || 'google';
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border-2 border-amber-400 dark:border-amber-700 flex flex-col justify-between gap-3.5 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-extrabold text-[#14281d] dark:text-white">
                            {req.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-black">
                            {isSupervisor ? 'طلب مشرف تعليمي' : 'طلب محفظ حلقة'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              provider === 'microsoft'
                                ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200'
                            }`}
                          >
                            {provider === 'microsoft'
                              ? '🪟 حساب Microsoft'
                              : '🌐 حساب Google'}
                          </span>
                        </div>
                        <p
                          className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 mt-1"
                          dir="ltr"
                        >
                          {req.email}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-black shrink-0">
                        ⏳ قيد الانتظار
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-[11px]">
                      <div>
                        <span className="text-neutral-500">رقم الواتساب: </span>
                        <span className="font-mono font-extrabold" dir="ltr">
                          {req.whatsappPhone || 'غير مرفق'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">تاريخ الطلب: </span>
                        <span className="font-mono font-bold">
                          {req.requestedAt || req.lastSyncAt}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-neutral-500">
                          التخصص والإجازات:{' '}
                        </span>
                        <span className="font-bold text-[#14281d] dark:text-white">
                          {req.specialization || req.roleTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Instant Decision Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/50">
                    <button
                      type="button"
                      onClick={() => handleApproveAndNotifyStaff(req)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>✅ قبول وتفعيل الحساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRbacTargetMemberId(req.id)}
                      className="py-2 px-3 rounded-xl bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>⚙️ تخصيص الدور والصلاحيات</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateTeacherAccessStatus(req.id, 'blocked')}
                      className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>❌ رفض / حظر</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ====================================================================
          SECTION 2 & 3: ACTIVE STAFF DIRECTORY, GRANULAR RBAC, & WHATSAPP NOTIFY
      ==================================================================== */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-950">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69]" />
            <div>
              <h2 className="text-base font-extrabold text-[#14281d] dark:text-white">
                ٢. إدارة الحسابات النشطة ومصفوفة الأدوار والصلاحيات الدقيقة (RBAC Matrix)
              </h2>
              <p className="text-xs text-neutral-500">
                تخصيص الأدوار الأربعة، إسناد الحلقات، مفاتيح الصلاحيات الستة، وإرسال إشعار التفعيل عبر واتساب
              </p>
            </div>
          </div>

          {/* Search & Role Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو الواتساب..."
                className="pr-8 pl-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold w-60"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(
                  e.target.value as
                    | 'all'
                    | 'owner'
                    | 'supervisor'
                    | 'teacher'
                    | 'financial_manager'
                )
              }
              aria-label="تصفية حسب الرتبة"
              className="px-3 py-1.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200 dark:border-emerald-900 text-xs font-bold"
            >
              <option value="all">جميع الأدوار (المالك والمشرفون والمحفظون)</option>
              <option value="owner">👑 مالك الأكاديمية (Owner)</option>
              <option value="supervisor">🛡️ مشرف عام (Supervisor)</option>
              <option value="teacher">📖 محفظ حلقة (Teacher)</option>
              <option value="financial_manager">💼 مسؤول مالي / إداري</option>
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
                label: `مفعل ونشط (${summaryCounts.active})`,
              },
              {
                id: 'blocked',
                label: `موقوف / محظور (${summaryCounts.blocked})`,
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

        {/* Staff Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStaff.map((member) => {
            const isTargetOwner =
              member.staffRole === 'owner' || isMasterOwnerEmail(member.email);
            const isTargetSupervisor = member.staffRole === 'supervisor';
            const canManage =
              !isTargetOwner &&
              (currentStaffTier === 'owner' ||
                (currentStaffTier === 'supervisor' && !isTargetSupervisor));
            const isEditing = editingMemberId === member.id;
            const isConfirmingDelete = confirmDeleteId === member.id;
            const effectivePerms: TeacherPermissions = {
              ...DEFAULT_TEACHER_PERMISSIONS,
              ...(settings.teacherPermissions || {}),
              ...(member.customTeacherPermissions || {}),
            };

            return (
              <div
                key={member.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                  isTargetOwner
                    ? 'bg-gradient-to-br from-[#fcfaf2] to-amber-50/40 dark:from-[#12231a] dark:to-[#0b1711] border-2 border-[#c59b27]'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                          {member.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-[11px] font-black">
                          {getRoleBadgeLabel(
                            isTargetOwner ? 'owner' : member.staffRole
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {member.specialization || member.roleTitle} —{' '}
                        <span className="font-mono font-bold" dir="ltr">
                          {member.email}
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-neutral-500 mt-1">
                        <span>
                          الحلقات المسندة:{' '}
                          {member.assignedCircleNames &&
                          member.assignedCircleNames.length > 0
                            ? member.assignedCircleNames.join('، ')
                            : `${member.assignedCirclesCount ?? 1} حلقة`}
                        </span>
                        {member.whatsappPhone && (
                          <span className="font-mono" dir="ltr">
                            📱 {member.whatsappPhone}
                          </span>
                        )}
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
                        ? '● مفعل ونشط'
                        : member.status === 'pending'
                        ? '● قيد الانتظار'
                        : '● موقوف'}
                    </span>
                  </div>

                  {/* Role & Assigned Circles Quick Control Box */}
                  {!isTargetOwner && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#12231a] border border-neutral-200/80 dark:border-emerald-900/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          ⚙️ الدور والصلاحيات والحلقات المسندة:
                        </span>
                        <div className="flex items-center gap-2">
                          {currentStaffTier === 'owner' && (
                            <button
                              type="button"
                              onClick={() => setRbacTargetMemberId(member.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#c59b27] hover:bg-[#b58c1e] text-[#14281d] text-[11px] font-black flex items-center gap-1 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>مصفوفة الصلاحيات الكاملة (6 مفاتيح)</span>
                            </button>
                          )}
                          {currentStaffTier === 'owner' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingMemberId(null);
                                } else {
                                  setEditingMemberId(member.id);
                                  setEditDraft({
                                    staffRole: member.staffRole || 'teacher',
                                    roleTitle: member.roleTitle,
                                    assignedCirclesCount:
                                      member.assignedCirclesCount ?? 1,
                                    whatsappPhone: member.whatsappPhone || '',
                                  });
                                }
                              }}
                              className="text-[11px] font-bold text-[#145a3a] dark:text-[#dfbd69] underline cursor-pointer"
                            >
                              {isEditing ? 'إغلاق' : 'تعديل الدور'}
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing && currentStaffTier === 'owner' && (
                        <div className="space-y-2.5 pt-1 border-t border-neutral-100 dark:border-emerald-900">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={editDraft.staffRole}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  staffRole: e.target
                                    .value as StaffHierarchyRole,
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-bold"
                            >
                              <option value="teacher">
                                محفظ حلقة (Circle Teacher)
                              </option>
                              <option value="supervisor">
                                مشرف عام (General Supervisor)
                              </option>
                              <option value="financial_manager">
                                مسؤول مالي / إداري (Financial Manager)
                              </option>
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
                            <input
                              type="tel"
                              dir="ltr"
                              value={editDraft.whatsappPhone}
                              onChange={(e) =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  whatsappPhone: e.target.value,
                                }))
                              }
                              placeholder="رقم واتساب (2010...)"
                              className="px-2.5 py-1.5 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-300 dark:border-emerald-800 text-xs font-mono"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateStaffRoleAndDetails(member.id, {
                                  staffRole: editDraft.staffRole,
                                  roleTitle: editDraft.roleTitle,
                                  assignedCirclesCount:
                                    editDraft.assignedCirclesCount,
                                  whatsappPhone: editDraft.whatsappPhone,
                                });
                                setEditingMemberId(null);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-extrabold cursor-pointer"
                            >
                              حفظ التعديلات ✓
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Assigned Circles Multi-Select Chips */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-neutral-500 block">
                          إسناد الحلقات القرآنية لهذا الحساب:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {circles.map((cir) => {
                            const isAssigned = (
                              member.assignedCircleNames || []
                            ).includes(cir.name);
                            return (
                              <button
                                key={cir.id}
                                type="button"
                                disabled={currentStaffTier !== 'owner'}
                                onClick={() =>
                                  toggleCircleForMember(member, cir.name)
                                }
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  isAssigned
                                    ? 'bg-[#145a3a] text-[#dfbd69] border-[#145a3a]'
                                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-emerald-900'
                                }`}
                              >
                                {isAssigned ? '✓ ' : '+ '}
                                {cir.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 6 Granular Toggle Switches Inline Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-neutral-100 dark:border-emerald-900/50 text-[11px]">
                        {(
                          [
                            {
                              key: 'restrictToAssignedCircles',
                              label: 'حصر الوصول في حلقات محددة',
                            },
                            {
                              key: 'canAccessFinanceSection',
                              label: 'الدخول لقسم الإدارة المالية',
                            },
                            {
                              key: 'canIssueExamsAndCertificates',
                              label: 'إصدار واعتماد الشهادات والإجازات',
                            },
                            {
                              key: 'canManageCompetitionsAndQuizzes',
                              label: 'إدارة المسابقات والاختبارات',
                            },
                            {
                              key: 'canDeleteOrEditCoreStudentData',
                              label: 'حذف أو تعديل بيانات الطلاب',
                            },
                            {
                              key: 'canExportDatabaseBackups',
                              label: 'تصدير النسخ الاحتياطية',
                            },
                          ] as const
                        ).map((sw) => {
                          const checked =
                            sw.key === 'restrictToAssignedCircles'
                              ? Boolean(
                                  member.restrictToAssignedCircles ??
                                    effectivePerms.restrictToAssignedCircles
                                )
                              : Boolean(effectivePerms[sw.key]);
                          return (
                            <label
                              key={sw.key}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1.5 ${
                                checked
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/40'
                                  : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900/50'
                              } ${
                                currentStaffTier === 'owner'
                                  ? 'cursor-pointer'
                                  : 'opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <span className="font-bold text-[#14281d] dark:text-white truncate">
                                {sw.label}
                              </span>
                              <input
                                type="checkbox"
                                disabled={currentStaffTier !== 'owner'}
                                checked={checked}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  if (sw.key === 'restrictToAssignedCircles') {
                                    updateStaffRoleAndDetails(member.id, {
                                      restrictToAssignedCircles: val,
                                    });
                                  }
                                  updateTeacherPermissions(
                                    { [sw.key]: val },
                                    member.id
                                  );
                                }}
                                className="w-3.5 h-3.5 accent-[#145a3a] shrink-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Controls: WhatsApp Notify, Approve, Suspend, Delete */}
                <div className="pt-3 border-t border-neutral-200/80 dark:border-emerald-900/50 space-y-2.5">
                  {/* Section 3: Instant Activation WhatsApp Notification Button */}
                  {!isTargetOwner && (
                    <a
                      href={buildStaffActivationWhatsAppUrl(member)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-l from-[#25D366] to-[#128C7E] hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        إرسال إشعار التفعيل ورمز الدخول عبر واتساب
                      </span>
                    </a>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-neutral-500">
                      آخر نشاط: {member.lastActiveAt || member.lastSyncAt}
                    </span>

                    {isTargetOwner ? (
                      <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#c59b27]" />
                        <span>👑 حساب مالك الأكاديمية الأعلى (محمي برمجياً)</span>
                      </span>
                    ) : canManage ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {member.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => handleApproveAndNotifyStaff(member)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
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
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>إيقاف مؤقت</span>
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
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          SECTION 4A: STAFF ACTIVITY & AUDIT LOG (سجل نشاط المحفظين وعمليات الأمان)
      ==================================================================== */}
      <section className="rounded-2xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-emerald-950">
          <div>
            <h2 className="text-base font-extrabold text-[#14281d] dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c59b27]" />
              <span>
                ٤. سجل نشاط المحفظين والمشرفين (Staff Activity & Security Audit Log)
              </span>
            </h2>
            <p className="text-xs text-neutral-500">
              متابعة آخر ظهور لكل محفظ، عدد الحصص التي سجلها، وعدد الطلاب المسندين إليه
            </p>
          </div>
          {canAccessBackups && (
            <div className="flex flex-wrap items-center gap-2">
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
                    'تم تصدير النسخة الاحتياطية الشاملة لجميع بيانات الأكاديمية (JSON) ✓',
                    'success'
                  );
                }}
                className="px-3.5 py-2 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#dfbd69]" />
                <span>تصدير النسخة الاحتياطية الشاملة (JSON)</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/60 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد نسخة شاملة (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(
                          String(ev.target?.result || '{}')
                        );
                        importFullBackup(parsed);
                      } catch {
                        showToast(
                          'تعذر قراءة ملف النسخة الاحتياطية JSON',
                          'error'
                        );
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

        {/* Staff Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-emerald-900">
                <th className="py-2.5 px-3 font-extrabold">الاسم والدور</th>
                <th className="py-2.5 px-3 font-extrabold">البريد والمزود</th>
                <th className="py-2.5 px-3 font-extrabold">الحلقات المسندة</th>
                <th className="py-2.5 px-3 font-extrabold">الطلاب</th>
                <th className="py-2.5 px-3 font-extrabold">الحصص المسجلة</th>
                <th className="py-2.5 px-3 font-extrabold">آخر ظهور / مزامنة</th>
                <th className="py-2.5 px-3 font-extrabold">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-emerald-900/40">
              {staffActivityMetrics.map(
                ({
                  member,
                  studentsCount,
                  recordedSessionsCount,
                  lastActive,
                }) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#f6f7f2]/60 dark:hover:bg-[#0b1711]/60"
                  >
                    <td className="py-2.5 px-3 font-extrabold text-[#14281d] dark:text-white">
                      <div>{member.name}</div>
                      <div className="text-[10px] text-[#145a3a] dark:text-[#dfbd69]">
                        {getRoleBadgeLabel(member.staffRole)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]" dir="ltr">
                      <div>{member.email}</div>
                      <div className="text-[10px] text-neutral-400">
                        {member.authProvider === 'microsoft'
                          ? 'Microsoft SSO'
                          : 'Google SSO'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {member.assignedCircleNames &&
                      member.assignedCircleNames.length > 0
                        ? member.assignedCircleNames.join('، ')
                        : `${member.assignedCirclesCount ?? 1} حلقة`}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {studentsCount} طالب
                    </td>
                    <td className="py-2.5 px-3 font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      {recordedSessionsCount} حصة
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">
                      {lastActive}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            exportTeacherScopedJsonBackup(member.email)
                          }
                          className="px-2 py-1 rounded-lg bg-[#fcfaf2] dark:bg-[#0b1711] border border-[#c59b27]/60 text-[10px] font-extrabold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer"
                        >
                          📥 JSON المحفظ
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Security Audit Logs */}
        {permissionAuditLogs.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-emerald-950">
            <h3 className="text-xs font-extrabold text-neutral-500">
              سجل عمليات الاعتماد وتغيير الصلاحيات الأخيرة:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissionAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-neutral-200/70 dark:border-emerald-900/40 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-bold text-[#14281d] dark:text-white truncate">
                    {log.summary}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ====================================================================
          MODAL: GRANULAR ROLE & PERMISSION MATRIX FOR A SPECIFIC STAFF MEMBER
      ==================================================================== */}
      {rbacTargetMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRbacTargetMemberId(null);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#12231a] border-2 border-[#c59b27] p-6 shadow-2xl space-y-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
              <div>
                <h3 className="text-base font-black text-[#145a3a] dark:text-[#dfbd69]">
                  ⚙️ مصفوفة الدور والصلاحيات الدقيقة — {rbacTargetMember.name}
                </h3>
                <p className="text-xs text-neutral-500 font-mono" dir="ltr">
                  {rbacTargetMember.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRbacTargetMemberId(null)}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-emerald-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Primary Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[#14281d] dark:text-white">
                ١. تحديد الدور الأساسي في الأكاديمية:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {(
                  [
                    {
                      id: 'supervisor' as const,
                      title: '🛡️ مشرف عام',
                      desc: 'متابعة الحلقات والطلاب والتقارير والاختبارات',
                    },
                    {
                      id: 'teacher' as const,
                      title: '📖 محفظ حلقة',
                      desc: 'محرك الحصة الخماسي والسبورة الذكية وطلابه المسندين',
                    },
                    {
                      id: 'financial_manager' as const,
                      title: '💼 مسؤول مالي / إداري',
                      desc: 'إدارة الاشتراكات والمصروفات وطلبات الالتحاق',
                    },
                  ]
                ).map((rOpt) => {
                  const selected =
                    (rbacTargetMember.staffRole || 'teacher') === rOpt.id;
                  return (
                    <button
                      key={rOpt.id}
                      type="button"
                      onClick={() =>
                        updateStaffRoleAndDetails(rbacTargetMember.id, {
                          staffRole: rOpt.id,
                          roleTitle:
                            rOpt.id === 'supervisor'
                              ? 'مشرف عام الحلقات والمتابعة'
                              : rOpt.id === 'financial_manager'
                              ? 'مسؤول الإدارة المالية والاشتراكات'
                              : 'محفظ الحلقات القرآنية',
                        })
                      }
                      className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                        selected
                          ? 'bg-[#145a3a] text-white border-[#c59b27]'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      <div className="font-extrabold">{rOpt.title}</div>
                      <div
                        className={`text-[10px] mt-1 ${
                          selected ? 'text-emerald-100' : 'text-neutral-500'
                        }`}
                      >
                        {rOpt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Multi-Select Assigned Circles */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[#14281d] dark:text-white">
                ٢. اختيار الحلقات المسندة (Assigned Circles Multi-Select):
              </label>
              <div className="flex flex-wrap gap-2">
                {circles.map((cir) => {
                  const isAssigned = (
                    rbacTargetMember.assignedCircleNames || []
                  ).includes(cir.name);
                  return (
                    <button
                      key={cir.id}
                      type="button"
                      onClick={() =>
                        toggleCircleForMember(rbacTargetMember, cir.name)
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                        isAssigned
                          ? 'bg-[#145a3a] text-[#dfbd69] border-[#c59b27]'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-300 dark:border-emerald-800'
                      }`}
                    >
                      {isAssigned ? '✓ ' : '+ '}
                      {cir.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. The 6 Granular Toggle Switches */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[#14281d] dark:text-white">
                ٣. مفاتيح الصلاحيات الدقيقة (Granular Toggle Switches):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(
                  [
                    {
                      key: 'restrictToAssignedCircles',
                      label: 'حصر الوصول في حلقات محددة',
                      desc: 'يمنع المحفظ من رؤية طلاب الحلقات الأخرى غير المسندة إليه',
                    },
                    {
                      key: 'canAccessFinanceSection',
                      label: 'السماح بالدخول إلى قسم الإدارة المالية والاشتراكات',
                      desc: 'فتح تبويب الإدارة المالية ومراجعة الاشتراكات',
                    },
                    {
                      key: 'canIssueExamsAndCertificates',
                      label: 'السماح بإصدار واعتماد الشهادات والإجازات',
                      desc: 'منح شهادات الختم والإجازات القرآنية للطلاب',
                    },
                    {
                      key: 'canManageCompetitionsAndQuizzes',
                      label: 'السماح بإدارة المسابقات والاختبارات',
                      desc: 'إطلاق التحديات التنافسية وتوليد الاختبارات الآلية',
                    },
                    {
                      key: 'canDeleteOrEditCoreStudentData',
                      label: 'السماح بحذف أو تعديل بيانات الطلاب الأساسية',
                      desc: 'تعديل بيانات ملف الطالب أو حذف سجل طالب',
                    },
                    {
                      key: 'canExportDatabaseBackups',
                      label: 'السماح بتصدير النسخ الاحتياطية لقاعدة البيانات',
                      desc: 'تنزيل ملفات النسخ الاحتياطي JSON لقاعدة البيانات',
                    },
                  ] as const
                ).map((item) => {
                  const mergedPerms: TeacherPermissions = {
                    ...DEFAULT_TEACHER_PERMISSIONS,
                    ...(settings.teacherPermissions || {}),
                    ...(rbacTargetMember.customTeacherPermissions || {}),
                  };
                  const checked =
                    item.key === 'restrictToAssignedCircles'
                      ? Boolean(
                          rbacTargetMember.restrictToAssignedCircles ??
                            mergedPerms.restrictToAssignedCircles
                        )
                      : Boolean(mergedPerms[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-2 cursor-pointer ${
                        checked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/50'
                          : 'bg-[#f6f7f2] dark:bg-[#0b1711] border-neutral-200 dark:border-emerald-900'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-[#14281d] dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (item.key === 'restrictToAssignedCircles') {
                            updateStaffRoleAndDetails(rbacTargetMember.id, {
                              restrictToAssignedCircles: val,
                            });
                          }
                          updateTeacherPermissions(
                            { [item.key]: val },
                            rbacTargetMember.id
                          );
                        }}
                        className="w-4 h-4 mt-0.5 accent-[#145a3a] shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-200 dark:border-emerald-900">
              <a
                href={buildStaffActivationWhatsAppUrl(rbacTargetMember)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#25D366] to-[#128C7E] text-white text-xs font-extrabold flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال إشعار التفعيل ورمز الدخول عبر واتساب</span>
              </a>

              <div className="flex items-center gap-2">
                {rbacTargetMember.status !== 'active' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveAndNotifyStaff(rbacTargetMember);
                      setRbacTargetMemberId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer"
                  >
                    ✅ قبول وتفعيل الحساب الآن
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRbacTargetMemberId(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-black cursor-pointer"
                >
                  حفظ وإغلاق ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

