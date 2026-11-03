import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ActiveTab, AcademyProvider, useAcademy } from './context/AcademyContext';
import { AuthGateModal } from './components/AuthGateModal';
import { DashboardView } from './components/DashboardView';
import {
  ExitConfirmationModal,
  OfflineIndicator,
  PWAInstallButton,
  PortalInstallAndShareBar,
  detectPortalRouteFromLocation,
  updatePortalManifest,
} from './components/PWAComponents';
import { useBackButtonGuard } from './hooks/useBackButtonGuard';
import { OFFICIAL_ACADEMY_WHATSAPP } from './data/hybridFoundationData';
import { ACADEMY_BRAND_CONFIG } from './constants/brandConfig';
import {
  DeveloperSignatureFooter,
  QuickSupportFloatingButton,
} from './components/DeveloperSupportModal';
import { formatGregorianAndHijri } from './utils/dateUtils';

const StudentsView = lazy(() =>
  import('./components/StudentsView').then((m) => ({ default: m.StudentsView }))
);
const SessionEngineView = lazy(() =>
  import('./components/SessionEngineView').then((m) => ({ default: m.SessionEngineView }))
);
const SmartBoardView = lazy(() =>
  import('./components/SmartBoardView').then((m) => ({ default: m.SmartBoardView }))
);
const MakharijTajweedView = lazy(() =>
  import('./components/MakharijTajweedView').then((m) => ({ default: m.MakharijTajweedView }))
);
const CirclesManagerView = lazy(() =>
  import('./components/CirclesManagerView').then((m) => ({ default: m.CirclesManagerView }))
);
const ExamsIjazahView = lazy(() =>
  import('./components/ExamsIjazahView').then((m) => ({ default: m.ExamsIjazahView }))
);
const StrugglingAndTasksView = lazy(() =>
  import('./components/StrugglingAndTasksView').then((m) => ({ default: m.StrugglingAndTasksView }))
);
const FinanceView = lazy(() =>
  import('./components/FinanceView').then((m) => ({ default: m.FinanceView }))
);
const BroadcastCenterView = lazy(() =>
  import('./components/BroadcastCenterView').then((m) => ({ default: m.BroadcastCenterView }))
);
const GuardianAndGuestView = lazy(() =>
  import('./components/GuardianAndGuestView').then((m) => ({ default: m.GuardianAndGuestView }))
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const QuickSearchModal = lazy(() =>
  import('./components/QuickSearchModal').then((m) => ({ default: m.QuickSearchModal }))
);
const PortalAISuiteModal = lazy(() =>
  import('./components/PortalAISuiteModal').then((m) => ({ default: m.PortalAISuiteModal }))
);
const HybridFoundationView = lazy(() =>
  import('./components/HybridFoundationView').then((m) => ({ default: m.HybridFoundationView }))
);
const OfflineResourceCenterView = lazy(() =>
  import('./components/OfflineResourceCenterView').then((m) => ({
    default: m.OfflineResourceCenterView,
  }))
);
const PublicMushafWaqfPortalView = lazy(() =>
  import('./components/PublicMushafWaqfPortalView').then((m) => ({
    default: m.PublicMushafWaqfPortalView,
  }))
);
const OwnerControlPanelView = lazy(() =>
  import('./components/OwnerControlPanelView').then((m) => ({ default: m.OwnerControlPanelView }))
);
const FaithOasisView = lazy(() =>
  import('./components/FaithOasisView').then((m) => ({ default: m.FaithOasisView }))
);
const AcademyPdfGuideModal = lazy(() =>
  import('./components/AcademyPdfGuideModal').then((m) => ({ default: m.AcademyPdfGuideModal }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
    <div className="w-10 h-10 rounded-2xl bg-[#145a3a]/15 border-2 border-[#c59b27] flex items-center justify-center text-lg animate-pulse">
      🕌
    </div>
    <p className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
      جارٍ فتح القسم القرآني...
    </p>
  </div>
);
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  Bot,
  CheckSquare,
  ChevronDown,
  Compass,
  Crown,
  FileText,
  FolderDown,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';

const MainShell: React.FC = () => {
  const {
    isLoggedIn,
    userRole,
    activeTab,
    setActiveTab,
    setSelectedStudentId,
    settings,
    updateSettings,
    setQuickSearchOpen,
    toastMessage,
    logout,
    loginAsGuardianDirect,
    students,
    teacherAlerts,
    triggerPushReminderNow,
    publicMushafPortalOpen,
    setPublicMushafPortalOpen,
    isFullScreenFocus,
    setIsFullScreenFocus,
    pendingOutboxMessages,
    sendOutboxMessage,
    sendAllQueuedMessages,
    deleteOutboxMessage,
    currentStaffTier,
    setCurrentStaffTier,
    activePortalRoute,
    setActivePortalRoute,
    activeRoleMode,
    setActiveRoleMode,
    accessCodeRequests,
    resolveAccessCodeRequestAndSendWhatsApp,
    deleteAccessCodeRequest,
    effectiveTeacherPermissions,
    managedTeachers,
    googleAuthUser,
    setIsDeveloperModalOpen,
    restoreFromCloudFirestoreNow,
    triggerCloudSyncNow,
    showToast,
  } = useAcademy();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [outboxModalOpen, setOutboxModalOpen] = useState(false);
  const [showAcademyPdfGuide, setShowAcademyPdfGuide] = useState(false);
  const [aiSuiteModalOpen, setAiSuiteModalOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Mobile Pull-to-Refresh state & touch handlers (Feature 7)
  const [pullStartY, setPullStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshingPull, setIsRefreshingPull] = useState<boolean>(false);

  const handleTouchStartPull = (e: React.TouchEvent<HTMLElement>) => {
    const scrollTop =
      e.currentTarget.scrollTop ||
      window.scrollY ||
      document.documentElement.scrollTop ||
      0;
    if (scrollTop <= 4 && !isRefreshingPull) {
      setPullStartY(e.touches[0].clientY);
    } else {
      setPullStartY(null);
    }
  };

  const handleTouchMovePull = (e: React.TouchEvent<HTMLElement>) => {
    if (pullStartY === null || isRefreshingPull) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - pullStartY;
    if (delta > 0) {
      setPullDistance(Math.min(115, Math.round(delta * 0.55)));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEndPull = async () => {
    if (pullStartY === null) return;
    if (pullDistance >= 64 && !isRefreshingPull) {
      setIsRefreshingPull(true);
      setPullDistance(60);
      try {
        await restoreFromCloudFirestoreNow();
        await triggerCloudSyncNow(false);
        showToast('🔄 تم السحب وتحديث أحدث بيانات الأكاديمية من السحابة بنجاح', 'success');
      } catch {
        // handled inside context
      } finally {
        setTimeout(() => {
          setIsRefreshingPull(false);
          setPullDistance(0);
        }, 450);
      }
    } else {
      setPullDistance(0);
    }
    setPullStartY(null);
  };

  // Sync URL route and Dynamic PWA Manifest per portal
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const detectedRoute = detectPortalRouteFromLocation();
      if (params.get('waqf') || detectedRoute === 'almushaf' || detectedRoute === 'sadaqa') {
        setPublicMushafPortalOpen(true);
        setActivePortalRoute(detectedRoute === 'sadaqa' ? 'sadaqa' : 'almushaf');
      } else if (detectedRoute) {
        setActivePortalRoute(detectedRoute);
      }
    } catch {
      // ignore
    }
  }, [setPublicMushafPortalOpen, setActivePortalRoute]);

  useEffect(() => {
    if (publicMushafPortalOpen) {
      updatePortalManifest(
        activePortalRoute === 'sadaqa' ? 'sadaqa' : 'almushaf'
      );
      return;
    }
    if (isLoggedIn) {
      if (userRole === 'guardian') {
        updatePortalManifest(
          activePortalRoute === 'student' ? 'student' : 'guardian'
        );
      } else if (userRole === 'teacher') {
        updatePortalManifest(
          currentStaffTier === 'owner' ? 'owner' : 'general'
        );
      } else {
        updatePortalManifest(activePortalRoute);
      }
    } else {
      updatePortalManifest(activePortalRoute);
    }
  }, [
    activePortalRoute,
    publicMushafPortalOpen,
    isLoggedIn,
    userRole,
    currentStaffTier,
  ]);

  const canGoBackInternally = Boolean(
    aiSuiteModalOpen ||
      showAcademyPdfGuide ||
      outboxModalOpen ||
      mobileMoreOpen ||
      notifPopoverOpen ||
      quickActionsOpen ||
      roleDropdownOpen ||
      publicMushafPortalOpen ||
      (isLoggedIn && userRole === 'teacher' && activeTab !== 'dashboard')
  );

  const handleInternalBack = () => {
    if (quickActionsOpen) {
      setQuickActionsOpen(false);
      return;
    }
    if (roleDropdownOpen) {
      setRoleDropdownOpen(false);
      return;
    }
    if (aiSuiteModalOpen) {
      setAiSuiteModalOpen(false);
      return;
    }
    if (showAcademyPdfGuide) {
      setShowAcademyPdfGuide(false);
      return;
    }
    if (outboxModalOpen) {
      setOutboxModalOpen(false);
      return;
    }
    if (mobileMoreOpen) {
      setMobileMoreOpen(false);
      return;
    }
    if (notifPopoverOpen) {
      setNotifPopoverOpen(false);
      return;
    }
    if (publicMushafPortalOpen) {
      setPublicMushafPortalOpen(false);
      return;
    }
    if (isLoggedIn && userRole === 'teacher' && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  const { showExitConfirm, confirmExit, cancelExit } = useBackButtonGuard({
    canGoBackInternally,
    onBackAction: handleInternalBack,
  });

  if (publicMushafPortalOpen) {
    return (
      <div className="min-h-screen bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec]">
        <div className="max-w-7xl mx-auto px-4 pt-3 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={() => setPublicMushafPortalOpen(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-black cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>🔙 رجوع للخطوة السابقة</span>
          </button>
          <button
            type="button"
            onClick={() => setAiSuiteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#c59b27] to-amber-500 text-[#14281d] text-xs font-black cursor-pointer shadow-xs"
          >
            <Bot className="w-4 h-4" />
            <span>🤖 باحث التدبر القرآني والوقف الذكي (AI)</span>
          </button>
        </div>
        <Suspense fallback={<ViewLoadingFallback />}>
          <PublicMushafWaqfPortalView
            onBackToAcademy={() => setPublicMushafPortalOpen(false)}
          />
        </Suspense>
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <PortalInstallAndShareBar
            route={activePortalRoute === 'sadaqa' ? 'sadaqa' : 'almushaf'}
          />
        </div>
        {aiSuiteModalOpen && (
          <Suspense fallback={null}>
            <PortalAISuiteModal
              isOpen={aiSuiteModalOpen}
              onClose={() => setAiSuiteModalOpen(false)}
              defaultPortal={activePortalRoute === 'sadaqa' ? 'sadaqa' : 'almushaf'}
            />
          </Suspense>
        )}
        <ExitConfirmationModal
          isOpen={showExitConfirm}
          onCancel={cancelExit}
          onConfirmExit={confirmExit}
        />
        <OfflineIndicator />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#145a3a] text-white text-xs font-extrabold shadow-xl border border-[#c59b27]">
            {toastMessage.text}
          </div>
        )}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <AuthGateModal />
        <ExitConfirmationModal
          isOpen={showExitConfirm}
          onCancel={cancelExit}
          onConfirmExit={confirmExit}
        />
        <OfflineIndicator />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#145a3a] text-white text-xs font-extrabold shadow-xl border border-[#c59b27]">
            {toastMessage.text}
          </div>
        )}
      </>
    );
  }

  // If logged in as Guardian or Guest, render the dedicated Guardian/Guest Portal
  if (userRole === 'guardian' || userRole === 'guest') {
    return (
      <div
        onTouchStart={handleTouchStartPull}
        onTouchMove={handleTouchMovePull}
        onTouchEnd={() => void handleTouchEndPull()}
        className="min-h-screen bg-[#f8f9f6] dark:bg-[#0b1510] text-[#14281d] dark:text-[#e9f2ec] selection:bg-[#145a3a] selection:text-white"
      >
        {(pullDistance > 12 || isRefreshingPull) && (
          <div
            style={{ height: `${Math.max(42, pullDistance)}px` }}
            className="flex items-center justify-center gap-2 bg-gradient-to-l from-[#145a3a] to-[#0d3b26] text-[#dfbd69] text-xs font-black border-b border-[#c59b27]/40 transition-all overflow-hidden"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshingPull || pullDistance >= 64 ? 'animate-spin' : ''
              }`}
            />
            <span>
              {isRefreshingPull
                ? 'جاري مزامنة أحدث سجلات التسميع من سحابة الأكاديمية (Firestore)...'
                : pullDistance >= 64
                ? 'أفلت الآن لتحديث البيانات من السحابة ⚡'
                : 'اسحب للأسفل لتحديث البيانات من السحابة...'}
            </span>
          </div>
        )}
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7 space-y-6">
          <Suspense fallback={<ViewLoadingFallback />}>
            <GuardianAndGuestView />
          </Suspense>
          <PortalInstallAndShareBar
            route={activePortalRoute === 'student' ? 'student' : 'guardian'}
          />
          <DeveloperSignatureFooter
            onOpenModal={() => setIsDeveloperModalOpen(true)}
          />
          <div className="hidden print:block pt-4 border-t border-neutral-300 text-center text-xs font-bold text-neutral-800">
            {ACADEMY_BRAND_CONFIG.printAndBoardFooterText}
          </div>
        </div>
        <QuickSupportFloatingButton
          onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
        />
        <ExitConfirmationModal
          isOpen={showExitConfirm}
          onCancel={cancelExit}
          onConfirmExit={confirmExit}
        />
        <OfflineIndicator />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#145a3a] text-white text-xs font-extrabold shadow-xl border border-[#c59b27]">
            {toastMessage.text}
          </div>
        )}
      </div>
    );
  }

  const activeStaffMember = googleAuthUser?.email
    ? managedTeachers.find(
        (m) => m.email.toLowerCase() === googleAuthUser.email.toLowerCase()
      )
    : undefined;
  const isFinancialManager =
    activeStaffMember?.staffRole === 'financial_manager';
  const pendingStaffCount = managedTeachers.filter(
    (m) => m.status === 'pending'
  ).length;
  const pendingAccessCodeRequests = accessCodeRequests.filter(
    (r) => r.status === 'pending'
  );
  const totalNotifBadgeCount =
    teacherAlerts.length + pendingAccessCodeRequests.length;

  const isTabAllowedForCurrentStaff = (tabId: ActiveTab): boolean => {
    // When Owner or Supervisor switches to "وضع المحفظ" (teacher_mode), streamline workspace to direct memorization tools
    if (activeRoleMode === 'teacher_mode') {
      return [
        'dashboard',
        'students',
        'session',
        'smartboard',
        'circles',
        'foundation',
        'tajweed',
        'public_mushaf',
        'faith_oasis',
      ].includes(tabId);
    }

    if (currentStaffTier === 'owner' && activeRoleMode === 'owner_mode') {
      return true;
    }
    if (tabId === 'owner_panel') {
      return currentStaffTier === 'owner';
    }

    if (isFinancialManager) {
      return [
        'dashboard',
        'students',
        'finance',
        'tasks',
        'broadcast',
        'public_mushaf',
      ].includes(tabId);
    }

    if (
      currentStaffTier === 'supervisor' ||
      activeRoleMode === 'supervisor_mode'
    ) {
      if (tabId === 'finance') {
        return Boolean(settings.supervisorPermissions?.canViewFinancialRecords);
      }
      return true;
    }

    // Circle Teacher (محفظ حلقة)
    if (tabId === 'finance') {
      return Boolean(
        effectiveTeacherPermissions.canAccessFinanceSection ||
          effectiveTeacherPermissions.canManageStudentFees
      );
    }
    if (tabId === 'exams') {
      return Boolean(
        effectiveTeacherPermissions.canIssueExamsAndCertificates ||
          effectiveTeacherPermissions.canManageCompetitionsAndQuizzes
      );
    }
    return true;
  };

  const allNavGroups: {
    groupTitle: string;
    items: { id: ActiveTab; label: string; icon: React.ReactNode }[];
  }[] = [
    {
      groupTitle: 'التعليم والحلقات',
      items: [
        {
          id: 'dashboard',
          label: 'الرئيسية',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'students',
          label: 'الطلاب وملف الطالب',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'session',
          label: 'محرك الحصة الخماسي',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          id: 'smartboard',
          label: 'السبورة الذكية',
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          id: 'circles',
          label: 'إدارة الحلقات والحضور',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'faith_oasis',
          label: 'واحة الإيمان والإنجاز',
          icon: <Sparkles className="w-4 h-4" />,
        },
      ],
    },
    {
      groupTitle: 'المناهج والتقييم',
      items: [
        {
          id: 'foundation',
          label: 'منهج الإمام للتأسيس',
          icon: <Layers className="w-4 h-4" />,
        },
        {
          id: 'tajweed',
          label: 'مخارج الحروف والتجويد',
          icon: <Compass className="w-4 h-4" />,
        },
        {
          id: 'exams',
          label: 'الاختبارات والإجازات',
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          id: 'struggling',
          label: 'متابعة المتعثرين',
          icon: <AlertTriangle className="w-4 h-4" />,
        },
      ],
    },
    {
      groupTitle: 'الإدارة والتواصل',
      items: [
        {
          id: 'owner_panel',
          label: '👑 لوحة المالك والصلاحيات',
          icon: <Shield className="w-4 h-4" />,
        },
        {
          id: 'tasks',
          label: 'المهام والمتابعة',
          icon: <CheckSquare className="w-4 h-4" />,
        },
        {
          id: 'finance',
          label: 'الإدارة المالية',
          icon: <Wallet className="w-4 h-4" />,
        },
        {
          id: 'broadcast',
          label: 'رسائل واتساب الجماعية',
          icon: <MessageSquare className="w-4 h-4" />,
        },
        {
          id: 'resources',
          label: 'المواد والعمل أوفلاين',
          icon: <FolderDown className="w-4 h-4" />,
        },
        {
          id: 'settings',
          label: 'الإعدادات والنسخ',
          icon: <Settings className="w-4 h-4" />,
        },
        {
          id: 'public_mushaf',
          label: 'مصحف المدينة العام والوقف',
          icon: <BookOpen className="w-4 h-4" />,
        },
      ],
    },
  ];

  const navGroups = allNavGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => isTabAllowedForCurrentStaff(item.id)),
    }))
    .filter((g) => g.items.length > 0);

  const navItems = navGroups.flatMap((g) => g.items);

  const adjustFontSize = (delta: 1 | -1) => {
    const order: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
    const currentIdx = Math.max(0, order.indexOf(settings.fontSize || 'md'));
    const nextIdx = Math.max(0, Math.min(order.length - 1, currentIdx + delta));
    updateSettings({ fontSize: order[nextIdx] });
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec] flex">
      {/* Desktop RTL Sidebar (Smoothly collapses in SmartFocus Mode) */}
      <aside
        aria-hidden={isFullScreenFocus}
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-white dark:bg-[#12231a] h-screen scrollbar-thin no-print smart-focus-shell-transition ${
          isFullScreenFocus
            ? 'w-0 max-w-0 p-0 opacity-0 translate-x-12 border-l-0 overflow-hidden pointer-events-none select-none'
            : 'w-64 max-w-64 p-4 opacity-100 translate-x-0 border-l border-neutral-200 dark:border-emerald-900/50 overflow-y-auto'
        }`}
      >
        <div className="space-y-5">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-2 border-b border-neutral-100 dark:border-emerald-900/40">
            <img
              src="/assets/aistudio/icon-192_29a1c2ce.png"
              alt="شعار أكاديمية الإمام"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-2xl border border-[#c59b27]/50 shadow-xs object-cover"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] truncate">
                  أكاديمية الإمام
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#c59b27]/25 to-emerald-600/20 border border-[#c59b27]/60 text-[10px] font-black text-[#145a3a] dark:text-amber-300">
                  {ACADEMY_BRAND_CONFIG.slogan}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {currentStaffTier === 'owner'
                  ? '👑 مالك الأكاديمية الأعلى'
                  : currentStaffTier === 'supervisor'
                  ? '🛡️ مشرف الأكاديمية'
                  : isFinancialManager
                  ? '💼 المسؤول المالي'
                  : '📖 محفظ الحلقات'}
              </div>
            </div>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 text-[11px] font-extrabold text-neutral-400 dark:text-emerald-400/70">
                  {group.groupTitle}
                </div>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const isGoldenOwnerTab = item.id === 'owner_panel';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isGoldenOwnerTab
                          ? isActive
                            ? 'bg-gradient-to-l from-[#c59b27] via-amber-400 to-yellow-400 text-[#14281d] font-black shadow-md ring-2 ring-[#c59b27]/50'
                            : 'bg-amber-400/15 hover:bg-amber-400/25 text-[#14281d] dark:text-[#dfbd69] border border-[#c59b27]/60 font-extrabold'
                          : isActive
                          ? 'bg-[#145a3a] text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-[#f6f7f2] dark:hover:bg-[#0b1711] hover:text-[#145a3a] dark:hover:text-[#dfbd69]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <span
                          className={
                            isGoldenOwnerTab
                              ? 'text-[#14281d] dark:text-[#dfbd69]'
                              : isActive
                              ? 'text-[#dfbd69]'
                              : ''
                          }
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      {isGoldenOwnerTab &&
                        pendingStaffCount + pendingAccessCodeRequests.length >
                          0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-black">
                            {pendingStaffCount + pendingAccessCodeRequests.length}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Role Switcher & Logout */}
        <div className="pt-4 border-t border-neutral-200 dark:border-emerald-900/50 space-y-2">
          <a
            href={`https://wa.me/${OFFICIAL_ACADEMY_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب الأكاديمية</span>
            </span>
            <span className="font-mono text-[11px]" dir="ltr">
              +{OFFICIAL_ACADEMY_WHATSAPP}
            </span>
          </a>
          <button
            onClick={() => loginAsGuardianDirect(students[0]?.id || 'st-1')}
            className="w-full py-2 px-3 rounded-xl bg-[#c59b27]/15 text-[#145a3a] dark:text-[#dfbd69] text-xs font-bold hover:bg-[#c59b27]/25 transition-colors cursor-pointer text-right"
          >
            👨‍👩‍👧 معاينة بوابة ولي الأمر
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-neutral-500 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تبديل الحساب / خروج</span>
          </button>

          {/* Interactive Developer Signature in Sidebar Bottom */}
          <div className="pt-2 border-t border-neutral-200/80 dark:border-emerald-900/40 space-y-1.5">
            <button
              type="button"
              onClick={() => setIsDeveloperModalOpen(true)}
              className="w-full text-right p-2 rounded-xl bg-gradient-to-l from-emerald-950 to-[#0d3b26] border border-[#c59b27]/40 text-white hover:border-[#c59b27] transition cursor-pointer"
            >
              <div className="text-[10px] font-black text-amber-300 leading-snug">
                {ACADEMY_BRAND_CONFIG.signatureFooterText}
              </div>
              <div className="text-[10px] text-emerald-200 underline mt-0.5">
                تواصل مع الإدارة / المطور
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        onTouchStart={handleTouchStartPull}
        onTouchMove={handleTouchMovePull}
        onTouchEnd={() => void handleTouchEndPull()}
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-y-auto ${
          isFullScreenFocus ? 'pb-4' : 'pb-20 lg:pb-8'
        }`}
      >
        {(pullDistance > 12 || isRefreshingPull) && (
          <div
            style={{ height: `${Math.max(42, pullDistance)}px` }}
            className="flex items-center justify-center gap-2 bg-gradient-to-l from-[#145a3a] to-[#0d3b26] text-[#dfbd69] text-xs font-black border-b border-[#c59b27]/40 transition-all shrink-0 overflow-hidden no-print"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshingPull || pullDistance >= 64 ? 'animate-spin' : ''
              }`}
            />
            <span>
              {isRefreshingPull
                ? 'جاري مزامنة أحدث سجلات الأكاديمية من السحابة (Firestore)...'
                : pullDistance >= 64
                ? 'أفلت الآن لتحديث البيانات من السحابة ⚡'
                : 'اسحب للأسفل لتحديث البيانات من السحابة...'}
            </span>
          </div>
        )}
        {/* Top Sticky Header (Ultra-Clean Minimalist Header - Max 3 Elements) */}
        <header
          aria-hidden={isFullScreenFocus}
          className={`sticky top-0 z-30 bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 no-print smart-focus-shell-transition ${
            isFullScreenFocus
              ? 'max-h-0 py-0 opacity-0 -translate-y-6 border-b-0 overflow-hidden pointer-events-none select-none'
              : 'opacity-100 translate-y-0 border-b border-neutral-200/80 dark:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
            {/* 1. RIGHT: Brand Identity & Mobile Drawer Trigger */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMoreOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a] cursor-pointer shrink-0"
                aria-label="فتح القائمة"
              >
                <Menu className="w-4 h-4" />
              </button>
              <img
                src="/assets/aistudio/icon-96_3bce66e2.png"
                alt="شعار أكاديمية الإمام"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl border border-[#c59b27]/40 shrink-0 object-cover"
              />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm md:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] truncate">
                  {ACADEMY_BRAND_CONFIG.platformName}
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-emerald-600/15 border border-[#c59b27]/60 text-[#145a3a] dark:text-amber-300 text-[11px] font-black shrink-0">
                  {ACADEMY_BRAND_CONFIG.slogan}
                </span>
              </div>
            </div>

            {/* 2. CENTER: Single Minimalist Role Switcher Dropdown (Owner & Supervisor Only) */}
            <div className="flex items-center justify-center">
              {currentStaffTier === 'owner' ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-l from-amber-400/20 via-[#c59b27]/20 to-emerald-700/20 border border-[#c59b27]/60 text-[#14281d] dark:text-[#dfbd69] text-xs font-black shadow-2xs hover:bg-[#c59b27]/30 transition cursor-pointer"
                    aria-label="تبديل وضع العمل"
                  >
                    <span>
                      {activeRoleMode === 'owner_mode'
                        ? '👑 وضع المالك'
                        : activeRoleMode === 'supervisor_mode'
                        ? '🛡️ وضع المشرف'
                        : '📖 وضع المحفظ'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        roleDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {roleDropdownOpen && (
                    <div
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95"
                      onClick={() => setRoleDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveRoleMode('owner_mode')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-right transition cursor-pointer ${
                          activeRoleMode === 'owner_mode'
                            ? 'bg-gradient-to-l from-[#c59b27] to-amber-500 text-[#14281d]'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950'
                        }`}
                      >
                        👑 وضع المالك
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRoleMode('supervisor_mode');
                          if (activeTab === 'owner_panel') setActiveTab('dashboard');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-right transition cursor-pointer ${
                          activeRoleMode === 'supervisor_mode'
                            ? 'bg-[#145a3a] text-white'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950'
                        }`}
                      >
                        🛡️ وضع المشرف
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRoleMode('teacher_mode');
                          if (
                            ![
                              'dashboard',
                              'students',
                              'session',
                              'smartboard',
                              'circles',
                              'foundation',
                              'tajweed',
                              'public_mushaf',
                              'faith_oasis',
                            ].includes(activeTab)
                          ) {
                            setActiveTab('session');
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-right transition cursor-pointer ${
                          activeRoleMode === 'teacher_mode'
                            ? 'bg-emerald-700 text-white'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950'
                        }`}
                      >
                        📖 وضع المحفظ
                      </button>
                    </div>
                  )}
                </div>
              ) : currentStaffTier === 'supervisor' ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/15 border border-emerald-700/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-black shadow-2xs hover:bg-emerald-700/25 transition cursor-pointer"
                  >
                    <span>
                      {activeRoleMode === 'teacher_mode'
                        ? '📖 وضع المحفظ'
                        : '🛡️ وضع المشرف'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        roleDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {roleDropdownOpen && (
                    <div
                      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95"
                      onClick={() => setRoleDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveRoleMode('supervisor_mode')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-right transition cursor-pointer ${
                          activeRoleMode !== 'teacher_mode'
                            ? 'bg-[#145a3a] text-white'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950'
                        }`}
                      >
                        🛡️ وضع المشرف
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRoleMode('teacher_mode');
                          if (
                            ![
                              'dashboard',
                              'students',
                              'session',
                              'smartboard',
                              'circles',
                              'foundation',
                              'tajweed',
                              'public_mushaf',
                              'faith_oasis',
                            ].includes(activeTab)
                          ) {
                            setActiveTab('session');
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-right transition cursor-pointer ${
                          activeRoleMode === 'teacher_mode'
                            ? 'bg-emerald-700 text-white'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-950'
                        }`}
                      >
                        📖 وضع المحفظ
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* 3. LEFT: Single Sleek Quick Actions Dropdown */}
            <div className="flex items-center gap-2 shrink-0 relative">
              <button
                type="button"
                onClick={() => setQuickActionsOpen((prev) => !prev)}
                className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/90 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] cursor-pointer shadow-2xs transition"
                title="الإجراءات السريعة"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#c59b27]" />
                <span className="hidden sm:inline">إجراءات سريعة</span>
                <ChevronDown
                  className={`w-3 h-3 text-neutral-400 transition-transform duration-150 ${
                    quickActionsOpen ? 'rotate-180' : ''
                  }`}
                />
                {totalNotifBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                    {totalNotifBadgeCount}
                  </span>
                )}
              </button>

              {quickActionsOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95"
                >
                  {/* PWA & AI */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-emerald-900/60">
                    <PWAInstallButton
                      route={currentStaffTier === 'owner' ? 'owner' : 'general'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionsOpen(false);
                        setAiSuiteModalOpen(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-amber-500 text-[#14281d] text-xs font-black cursor-pointer shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>المساعد الذكي</span>
                    </button>
                  </div>

                  {/* Theme Switcher & Font scale */}
                  <div className="space-y-1.5 pb-2 border-b border-neutral-100 dark:border-emerald-900/60">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      <span>المظهر والخط:</span>
                      <div className="flex items-center rounded-lg border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => adjustFontSize(1)}
                          className="px-2 py-0.5 text-xs font-black text-[#145a3a] dark:text-[#dfbd69] hover:bg-neutral-200/60 dark:hover:bg-emerald-950"
                          title="تكبير الخط"
                        >
                          أ+
                        </button>
                        <span className="w-px h-3 bg-neutral-200 dark:bg-emerald-900" />
                        <button
                          type="button"
                          onClick={() => adjustFontSize(-1)}
                          className="px-2 py-0.5 text-xs font-black text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-emerald-950"
                          title="تصغير الخط"
                        >
                          أ-
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'light' as const, label: '☀️ نهاري' },
                        { id: 'dark' as const, label: '🌙 ليلي' },
                        { id: 'sepia' as const, label: '📜 مصحف' },
                      ].map((tMode) => (
                        <button
                          key={tMode.id}
                          type="button"
                          onClick={() => updateSettings({ theme: tMode.id })}
                          className={`py-1 rounded-lg text-xs font-extrabold transition cursor-pointer text-center ${
                            settings.theme === tMode.id
                              ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                              : 'bg-neutral-100 dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                          }`}
                        >
                          {tMode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      setNotifPopoverOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-emerald-950/70 text-xs font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                      <span>مركز التنبيهات والأكواد</span>
                    </span>
                    {totalNotifBadgeCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-black">
                        {totalNotifBadgeCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">0</span>
                    )}
                  </button>

                  {/* Quick Search */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickActionsOpen(false);
                      setQuickSearchOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-emerald-950/70 text-xs font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                      <span>بحث سريع في المنصة</span>
                    </span>
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-emerald-900 border border-neutral-200 dark:border-emerald-800">
                      Ctrl+K
                    </kbd>
                  </button>

                  {/* Offline WhatsApp queue if any */}
                  {pendingOutboxMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionsOpen(false);
                        setOutboxModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span>طابور رسائل واتساب المعلقة</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-mono font-black">
                        {pendingOutboxMessages.length}
                      </span>
                    </button>
                  )}

                  {/* PDF Guide & Support */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-emerald-900/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionsOpen(false);
                        setShowAcademyPdfGuide(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900 hover:bg-neutral-100 dark:hover:bg-emerald-950 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#dfbd69]" />
                      <span>دليل الأكاديمية PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionsOpen(false);
                        setIsDeveloperModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900 hover:bg-neutral-100 dark:hover:bg-emerald-950 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      title="دعم المطور"
                    >
                      <Sparkles className="w-4 h-4 text-[#c59b27]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Popover Panel */}
              {notifPopoverOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-emerald-900">
                    <div>
                      <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        مركز التنبيهات وطلبات الأكواد ({totalNotifBadgeCount})
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        طلبات أكواد ({pendingAccessCodeRequests.length}) • مهام ({teacherAlerts.length})
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void triggerPushReminderNow()}
                        className="px-2 py-1 rounded-lg bg-[#145a3a] text-white text-[10px] font-bold cursor-pointer"
                      >
                        دفع إشعار
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotifPopoverOpen(false);
                          setActiveTab('settings');
                        }}
                        className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 text-neutral-500 cursor-pointer"
                        title="إعدادات التنبيهات"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotifPopoverOpen(false)}
                        className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 text-neutral-500 cursor-pointer"
                        title="إغلاق"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pending Access Code Requests */}
                  {pendingAccessCodeRequests.length > 0 && (
                    <div className="space-y-2 border-b border-neutral-100 dark:border-emerald-900 pb-2.5">
                      <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>
                          🔔 طلبات أكواد الدخول ({pendingAccessCodeRequests.length})
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 pl-1">
                        {pendingAccessCodeRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-400/50 space-y-1.5 text-right"
                          >
                            <div className="flex items-center justify-between gap-2 text-xs font-black text-[#14281d] dark:text-white">
                              <span>👤 {req.studentName}</span>
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                                {req.generatedCode || 'جديد'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                              ولي الأمر: {req.guardianName} •{' '}
                              <span className="font-mono" dir="ltr">
                                {req.guardianPhone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  resolveAccessCodeRequestAndSendWhatsApp(req.id)
                                }
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-[#14281d] text-[10px] font-black cursor-pointer"
                              >
                                ⚡ إرسال الكود واتساب
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAccessCodeRequest(req.id)}
                                className="py-1.5 px-2 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold cursor-pointer"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!settings.notificationsEnabled ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs space-y-2">
                      <p>التنبيهات متوقفة حالياً.</p>
                      <button
                        type="button"
                        onClick={() => {
                          updateSettings({ notificationsEnabled: true });
                        }}
                        className="py-1.5 px-3 rounded-lg bg-[#145a3a] text-white text-[11px] font-bold cursor-pointer"
                      >
                        تفعيل التنبيهات الآن
                      </button>
                    </div>
                  ) : teacherAlerts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-neutral-500">
                      لا توجد مهام متأخرة أو تنبيهات حالياً.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pl-1">
                      {teacherAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => {
                            setNotifPopoverOpen(false);
                            if (alert.category === 'overdue_task') {
                              setActiveTab('tasks');
                            } else {
                              if (alert.studentId) {
                                setSelectedStudentId(alert.studentId);
                              }
                              setActiveTab('struggling');
                            }
                          }}
                          className="w-full text-right p-2.5 rounded-xl border border-neutral-100 dark:border-emerald-900/60 hover:border-[#145a3a] bg-[#f6f7f2] dark:bg-[#0b1711] transition-colors cursor-pointer block"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                alert.category === 'overdue_task'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              }`}
                            >
                              {alert.category === 'overdue_task'
                                ? 'مهمة متأخرة'
                                : 'متابعة عاجلة'}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400">
                              {formatGregorianAndHijri(
                                alert.timestamp,
                                settings.showHijriDates ?? true,
                                'compact'
                              )}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold mt-1 text-[#14281d] dark:text-[#e9f2ec]">
                            {alert.title}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                            {alert.body}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Active View Viewport (Smoothly expands to full width in SmartFocus Mode) */}
        <main
          className={`${
            isFullScreenFocus
              ? 'max-w-full w-full mx-auto p-2 md:p-4 flex-1'
              : 'max-w-7xl w-full mx-auto p-4 md:p-6 flex-1'
          } smart-focus-shell-transition`}
        >
          <Suspense fallback={<ViewLoadingFallback />}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'faith_oasis' && <FaithOasisView />}
            {activeTab === 'owner_panel' && <OwnerControlPanelView />}
            {activeTab === 'students' && <StudentsView />}
            {activeTab === 'session' && <SessionEngineView />}
            {activeTab === 'smartboard' && <SmartBoardView />}
            {activeTab === 'foundation' && <HybridFoundationView />}
            {activeTab === 'tajweed' && <MakharijTajweedView />}
            {activeTab === 'circles' && <CirclesManagerView />}
            {activeTab === 'exams' && <ExamsIjazahView />}
            {activeTab === 'struggling' && (
              <StrugglingAndTasksView mode="struggling" />
            )}
            {activeTab === 'tasks' && <StrugglingAndTasksView mode="tasks" />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'resources' && <OfflineResourceCenterView />}
            {activeTab === 'public_mushaf' && (
              <PublicMushafWaqfPortalView
                onBackToAcademy={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'broadcast' && <BroadcastCenterView />}
            {activeTab === 'settings' && <SettingsView />}
          </Suspense>

          {/* Global Footer & Print Footer */}
          {!isFullScreenFocus && (
            <div className="mt-8 pt-4 space-y-4">
              <PortalInstallAndShareBar
                route={currentStaffTier === 'owner' ? 'owner' : 'general'}
              />
              <DeveloperSignatureFooter
                onOpenModal={() => setIsDeveloperModalOpen(true)}
              />
              <div className="hidden print:block mt-4 pt-3 border-t border-neutral-300 text-center text-xs font-bold text-neutral-800">
                {ACADEMY_BRAND_CONFIG.printAndBoardFooterText}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra-Clean 4-Button Focus Bar) */}
      <nav
        aria-hidden={isFullScreenFocus}
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-t border-neutral-200 dark:border-emerald-900/50 grid grid-cols-4 items-center h-16 px-1.5 no-print smart-focus-shell-transition ${
          isFullScreenFocus
            ? 'translate-y-24 opacity-0 pointer-events-none select-none'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
            activeTab === 'dashboard'
              ? 'text-[#145a3a] dark:text-[#dfbd69] bg-[#145a3a]/10 dark:bg-[#dfbd69]/10'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('session');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
            activeTab === 'session' || activeTab === 'smartboard'
              ? 'text-[#145a3a] dark:text-[#dfbd69] bg-[#145a3a]/10 dark:bg-[#dfbd69]/10'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>غرفة التسميع</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('students');
            setMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
            activeTab === 'students'
              ? 'text-[#145a3a] dark:text-[#dfbd69] bg-[#145a3a]/10 dark:bg-[#dfbd69]/10'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>الطلاب والأكواد</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[44px] rounded-xl text-[11px] font-extrabold cursor-pointer transition ${
            mobileMoreOpen ||
            ['owner_panel', 'finance', 'settings', 'broadcast', 'tasks'].includes(
              activeTab
            )
              ? 'text-[#145a3a] dark:text-[#dfbd69] bg-[#145a3a]/10 dark:bg-[#dfbd69]/10'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>الإدارة والمالية</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Sheet */}
      {mobileMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end lg:hidden"
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white dark:bg-[#12231a] p-5 space-y-4 max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-900">
              <span className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                أقسام ووحدات أكاديمية الإمام
              </span>
              <button
                onClick={() => setMobileMoreOpen(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-emerald-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-2">
                  <div className="text-xs font-extrabold text-neutral-400 dark:text-emerald-400/80">
                    {group.groupTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMoreOpen(false);
                        }}
                        className={`flex items-center gap-2.5 p-3 min-h-[44px] rounded-xl border text-right text-xs font-bold ${
                          activeTab === item.id
                            ? 'bg-[#145a3a] text-white border-[#145a3a]'
                            : 'border-neutral-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-emerald-900 flex gap-2">
              <button
                onClick={() => {
                  setMobileMoreOpen(false);
                  loginAsGuardianDirect(students[0]?.id || 'st-1');
                }}
                className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold"
              >
                بوابة ولي الأمر
              </button>
              <button
                onClick={() => {
                  setMobileMoreOpen(false);
                  logout();
                }}
                className="py-2.5 px-4 min-h-[44px] rounded-xl border border-red-200 text-red-600 text-xs font-bold"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals & Indicators */}
      <Suspense fallback={null}>
        <QuickSearchModal />
      </Suspense>
      <OfflineIndicator />

      {/* WhatsApp Offline Outbox Modal */}
      {outboxModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOutboxModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-600/40 overflow-hidden my-auto p-5 md:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                    طابور رسائل واتساب المعلقة ({pendingOutboxMessages.length})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    تم حفظ هذه الرسائل أثناء انقطاع الإنترنت، ويمكنك إرسالها الآن مباشرة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOutboxModalOpen(false)}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-rose-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pendingOutboxMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 space-y-1">
                <p>طابور رسائل الواتساب فارغ حالياً.</p>
                <p className="text-[11px] text-emerald-600 font-bold">كافة الرسائل تم إرسالها بنجاح ✓</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-3 pl-1">
                {pendingOutboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          {msg.recipientName}
                        </span>
                        <span className="font-mono text-neutral-500 text-[11px]">
                          ({msg.recipientPhone})
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {msg.createdAt}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-800 whitespace-pre-wrap leading-relaxed line-clamp-3">
                      {msg.text}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => deleteOutboxMessage(msg.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-400 hover:text-rose-600 cursor-pointer"
                      >
                        حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => sendOutboxMessage(msg.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-l from-[#25D366] to-[#128C7E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>إرسال عبر واتساب</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingOutboxMessages.length > 0 && (
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setOutboxModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sendAllQueuedMessages();
                    setOutboxModalOpen(false);
                  }}
                  className="py-2.5 px-5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال كافة الرسائل الآن ({pendingOutboxMessages.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAcademyPdfGuide && (
        <Suspense fallback={null}>
          <AcademyPdfGuideModal
            isOpen={showAcademyPdfGuide}
            onClose={() => setShowAcademyPdfGuide(false)}
          />
        </Suspense>
      )}

      {aiSuiteModalOpen && (
        <Suspense fallback={null}>
          <PortalAISuiteModal
            isOpen={aiSuiteModalOpen}
            onClose={() => setAiSuiteModalOpen(false)}
            defaultPortal={currentStaffTier === 'owner' ? 'owner' : 'general'}
          />
        </Suspense>
      )}

      <ExitConfirmationModal
        isOpen={showExitConfirm}
        onCancel={cancelExit}
        onConfirmExit={confirmExit}
      />

      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#145a3a] text-white text-xs font-extrabold shadow-xl border border-[#c59b27]">
          {toastMessage.text}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AcademyProvider>
      <MainShell />
    </AcademyProvider>
  );
}
