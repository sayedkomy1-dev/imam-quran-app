import React, { useEffect, useState } from 'react';
import { ActiveTab, AcademyProvider, useAcademy } from './context/AcademyContext';
import { AuthGateModal } from './components/AuthGateModal';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { SessionEngineView } from './components/SessionEngineView';
import { SmartBoardView } from './components/SmartBoardView';
import { MakharijTajweedView } from './components/MakharijTajweedView';
import { CirclesManagerView } from './components/CirclesManagerView';
import { ExamsIjazahView } from './components/ExamsIjazahView';
import { StrugglingAndTasksView } from './components/StrugglingAndTasksView';
import { FinanceView } from './components/FinanceView';
import { BroadcastCenterView } from './components/BroadcastCenterView';
import { GuardianAndGuestView } from './components/GuardianAndGuestView';
import { SettingsView } from './components/SettingsView';
import { QuickSearchModal } from './components/QuickSearchModal';
import {
  ExitConfirmationModal,
  OfflineIndicator,
  PWAInstallButton,
  PortalInstallAndShareBar,
  detectPortalRouteFromLocation,
  updatePortalManifest,
} from './components/PWAComponents';
import { PortalAISuiteModal } from './components/PortalAISuiteModal';
import { useBackButtonGuard } from './hooks/useBackButtonGuard';
import { HybridFoundationView } from './components/HybridFoundationView';
import { OfflineResourceCenterView } from './components/OfflineResourceCenterView';
import { PublicMushafWaqfPortalView } from './components/PublicMushafWaqfPortalView';
import { OwnerControlPanelView } from './components/OwnerControlPanelView';
import { FaithOasisView } from './components/FaithOasisView';
import { AcademyPdfGuideModal } from './components/AcademyPdfGuideModal';
import { OFFICIAL_ACADEMY_WHATSAPP } from './data/hybridFoundationData';
import { ACADEMY_BRAND_CONFIG } from './constants/brandConfig';
import {
  DeveloperSignatureFooter,
  QuickSupportFloatingButton,
} from './components/DeveloperSupportModal';
import { formatGregorianAndHijri } from './utils/dateUtils';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  Bot,
  CheckSquare,
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
      publicMushafPortalOpen ||
      (isLoggedIn && userRole === 'teacher' && activeTab !== 'dashboard')
  );

  const handleInternalBack = () => {
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
        <PublicMushafWaqfPortalView
          onBackToAcademy={() => setPublicMushafPortalOpen(false)}
        />
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <PortalInstallAndShareBar
            route={activePortalRoute === 'sadaqa' ? 'sadaqa' : 'almushaf'}
          />
        </div>
        <PortalAISuiteModal
          isOpen={aiSuiteModalOpen}
          onClose={() => setAiSuiteModalOpen(false)}
          defaultPortal={activePortalRoute === 'sadaqa' ? 'sadaqa' : 'almushaf'}
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
          <GuardianAndGuestView />
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
      {/* Desktop RTL Sidebar */}
      <aside
        className={`${
          isFullScreenFocus ? 'hidden' : 'hidden lg:flex'
        } flex-col justify-between w-64 shrink-0 bg-white dark:bg-[#12231a] border-l border-neutral-200 dark:border-emerald-900/50 p-4 h-screen overflow-y-auto scrollbar-thin no-print`}
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
        {/* Top Sticky Header (Hidden in Focus Mode to eliminate distractions) */}
        <header
          className={`${
            isFullScreenFocus ? 'hidden' : 'flex'
          } flex-col sticky top-0 z-30 bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-b border-neutral-200 dark:border-emerald-900/50 px-4 md:px-6 py-2.5 gap-2 no-print`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {activeTab !== 'dashboard' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-[#dfbd69] text-xs font-black cursor-pointer shadow-2xs transition"
                  title="رجوع للخطوة السابقة (الرئيسية)"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>🔙 رجوع للخطوة السابقة</span>
                </button>
              )}
              <img
                src="/assets/aistudio/icon-96_3bce66e2.png"
                alt="أيقونة"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl lg:hidden border border-[#c59b27]/40 shrink-0"
              />
              <span className="text-sm md:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] truncate">
                {ACADEMY_BRAND_CONFIG.platformName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-600/20 border border-[#c59b27]/60 text-[#145a3a] dark:text-amber-300 text-xs font-black shrink-0">
                {ACADEMY_BRAND_CONFIG.slogan}
              </span>
              <span className="hidden md:inline text-neutral-300 dark:text-emerald-800">
                |
              </span>
              <span className="hidden md:inline text-xs font-bold text-neutral-600 dark:text-emerald-200 truncate">
                {navItems.find((n) => n.id === activeTab)?.label || 'الرئيسية'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 relative flex-wrap">
              {/* Omnipresent AI Assistant Trigger */}
              <button
                type="button"
                onClick={() => setAiSuiteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-l from-[#c59b27] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-[#14281d] text-xs font-black cursor-pointer shadow-xs transition"
                title="منظومة الذكاء الاصطناعي الشاملة للأكاديمية"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>🤖 المساعد الذكي</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAcademyPdfGuide(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-[#c59b27]/50 text-[#145a3a] dark:text-[#dfbd69] text-xs font-extrabold cursor-pointer transition"
                title="الدليل التعريفي للأكاديمية PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 الدليل التعريفي PDF</span>
              </button>

              <PWAInstallButton
                route={currentStaffTier === 'owner' ? 'owner' : 'general'}
              />

              {/* Offline WhatsApp Outbox Queue Trigger */}
              {pendingOutboxMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOutboxModalOpen(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold cursor-pointer transition animate-pulse"
                  title="طابور رسائل واتساب المعلقة للإرسال"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span className="hidden sm:inline">طابور واتساب</span>
                  <span className="min-w-4 h-4 px-1 rounded-full bg-emerald-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {pendingOutboxMessages.length}
                  </span>
                </button>
              )}

              {/* Local Push Notification Center Button + Access Code Requests Alert */}
              <div className="relative">
                <button
                  onClick={() => setNotifPopoverOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] cursor-pointer"
                  title="طلبات أكواد الدخول والتنبيهات الفورية"
                >
                  {settings.notificationsEnabled ? (
                    <Bell className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                  ) : (
                    <BellOff className="w-4 h-4 text-neutral-400" />
                  )}
                  {totalNotifBadgeCount > 0 && (
                    <span className="absolute -top-1 -left-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                      {totalNotifBadgeCount}
                    </span>
                  )}
                </button>

                {notifPopoverOpen && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-emerald-900">
                      <div>
                        <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                          مركز التنبيهات وطلبات الأكواد ({totalNotifBadgeCount})
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          طلبات أكواد الدخول ({pendingAccessCodeRequests.length}) • مهام ({teacherAlerts.length})
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => void triggerPushReminderNow()}
                          className="px-2 py-1 rounded-lg bg-[#145a3a] text-white text-[10px] font-bold cursor-pointer"
                        >
                          دفع إشعار الآن
                        </button>
                        <button
                          onClick={() => {
                            setNotifPopoverOpen(false);
                            setActiveTab('settings');
                          }}
                          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-950 text-neutral-500 cursor-pointer"
                          title="إعدادات التنبيهات"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pending Access Code Requests inside Notification Popover */}
                    {pendingAccessCodeRequests.length > 0 && (
                      <div className="space-y-2 border-b border-neutral-100 dark:border-emerald-900 pb-2.5">
                        <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>
                            🔔 طلبات أكواد دخول أولياء الأمور والطلاب ({pendingAccessCodeRequests.length})
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pl-1">
                          {pendingAccessCodeRequests.map((req) => (
                            <div
                              key={req.id}
                              className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-400/50 space-y-1.5 text-right"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-black text-[#14281d] dark:text-white">
                                <span>👤 الطالب: {req.studentName}</span>
                                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                                  {req.generatedCode || 'جديد'}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                ولي الأمر: {req.guardianName} • واتساب:{' '}
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
                                  ⚡ توليد وإرسال الكود عبر واتساب
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
                        <p>نظام التنبيهات الدفعية المحلية متوقف حالياً من الإعدادات.</p>
                        <button
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
                        لا توجد مهام متأخرة أو طلاب بحاجة لمتابعة عاجلة حالياً.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pl-1">
                        {teacherAlerts.map((alert) => (
                          <button
                            key={alert.id}
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
                                  ? 'مهمة متأخرة / مستحقة'
                                  : 'طالب يحتاج متابعة عاجلة'}
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

              <button
                onClick={() => setQuickSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:border-[#145a3a] cursor-pointer"
                title="بحث سريع (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#145a3a] dark:text-[#dfbd69]" />
                <span className="hidden sm:inline">بحث سريع</span>
                <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900">
                  Ctrl+K
                </kbd>
              </button>

              {/* Font Size Controls (أ+ / أ-) */}
              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] overflow-hidden">
                <button
                  type="button"
                  onClick={() => adjustFontSize(1)}
                  className="px-2.5 py-1.5 text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69] hover:bg-neutral-200/60 dark:hover:bg-emerald-950 cursor-pointer"
                  title="تكبير حجم الخط (أ+)"
                >
                  أ+
                </button>
                <span className="w-px h-4 bg-neutral-200 dark:bg-emerald-900" />
                <button
                  type="button"
                  onClick={() => adjustFontSize(-1)}
                  className="px-2.5 py-1.5 text-xs font-extrabold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-emerald-950 cursor-pointer"
                  title="تصغير حجم الخط (أ-)"
                >
                  أ-
                </button>
              </div>

              {/* 3-Mode Global Theme Switcher (☀️ نهاري / 🌙 ليلي / 📜 كريمي للمصحف) */}
              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] p-0.5">
                {(
                  [
                    { id: 'light' as const, label: '☀️', title: 'الوضع النهاري الورقي' },
                    { id: 'dark' as const, label: '🌙', title: 'الوضع الليلي الزمردي' },
                    { id: 'sepia' as const, label: '📜', title: 'الوضع الكريمي للمصحف' },
                  ]
                ).map((tMode) => (
                  <button
                    key={tMode.id}
                    type="button"
                    onClick={() => updateSettings({ theme: tMode.id })}
                    className={`px-2 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      settings.theme === tMode.id
                        ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                    }`}
                    title={tMode.title}
                  >
                    {tMode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3️⃣ Hierarchical Role-Mode Switcher (التبديل الهرمي للأدوار بين الإشراف والتحفيظ) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-900/50 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold text-neutral-500 dark:text-emerald-300">
                🔄 وضع العمل النشط:
              </span>
              {currentStaffTier === 'owner' ? (
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-[#c59b27]/50">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoleMode('owner_mode');
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      activeRoleMode === 'owner_mode'
                        ? 'bg-gradient-to-l from-[#c59b27] to-amber-500 text-[#14281d] shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                    }`}
                  >
                    👑 الوضع الإداري (المالك)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoleMode('supervisor_mode');
                      if (activeTab === 'owner_panel') setActiveTab('dashboard');
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      activeRoleMode === 'supervisor_mode'
                        ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      activeRoleMode === 'teacher_mode'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                    }`}
                  >
                    📖 وضع المحفظ (حلقاتي)
                  </button>
                </div>
              ) : currentStaffTier === 'supervisor' ? (
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] border border-emerald-700/40">
                  <button
                    type="button"
                    onClick={() => setActiveRoleMode('supervisor_mode')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      activeRoleMode !== 'teacher_mode'
                        ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                    }`}
                  >
                    🛡️ وضع الإشراف الإداري
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
                    className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      activeRoleMode === 'teacher_mode'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-[#145a3a]'
                    }`}
                  >
                    📖 وضع المحفظ (إدارة الحصة)
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-emerald-700/15 border border-emerald-700/40 text-[#145a3a] dark:text-emerald-300 text-[11px] font-black">
                  📖 وضع المحفظ (التسميع والحلقات)
                </span>
              )}
            </div>

            {activeRoleMode === 'teacher_mode' &&
              (currentStaffTier === 'owner' ||
                currentStaffTier === 'supervisor') && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <span>
                    ✓ تم تركيز الشاشة على أدوات التحفيظ المباشر (محرك الحصة الخماسي، السبورة، المصحف، الطلاب)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveRoleMode(
                        currentStaffTier === 'owner'
                          ? 'owner_mode'
                          : 'supervisor_mode'
                      )
                    }
                    className="px-2.5 py-0.5 rounded-lg bg-[#c59b27] text-[#14281d] font-black cursor-pointer"
                  >
                    العودة للوضع الإداري ↩
                  </button>
                </div>
              )}
          </div>
        </header>

        {/* Active View Viewport (Expands to full width in Focus Mode) */}
        <main
          className={`${
            isFullScreenFocus
              ? 'max-w-full w-full mx-auto p-2 md:p-4 flex-1'
              : 'max-w-7xl w-full mx-auto p-4 md:p-6 flex-1'
          } transition-all duration-200`}
        >
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

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className={`${
          isFullScreenFocus ? 'hidden' : 'lg:hidden'
        } fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-t border-neutral-200 dark:border-emerald-900/50 grid grid-cols-5 items-center h-16 px-2 no-print`}
      >
        {[
          {
            id: 'dashboard',
            label: 'الرئيسية',
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          { id: 'students', label: 'الطلاب', icon: <Users className="w-5 h-5" /> },
          { id: 'session', label: 'بدء حصة', icon: <BookOpen className="w-5 h-5" /> },
          {
            id: 'smartboard',
            label: 'السبورة',
            icon: <Sparkles className="w-5 h-5" />,
          },
        ].map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as ActiveTab);
                setMobileMoreOpen(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] rounded-xl text-[11px] font-bold cursor-pointer transition ${
                active
                  ? 'text-[#145a3a] dark:text-[#dfbd69] bg-[#145a3a]/10 dark:bg-[#dfbd69]/10'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setMobileMoreOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] rounded-xl text-[11px] font-bold text-neutral-500 dark:text-neutral-400 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>الأقسام</span>
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
      <QuickSearchModal />
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

      <AcademyPdfGuideModal
        isOpen={showAcademyPdfGuide}
        onClose={() => setShowAcademyPdfGuide(false)}
      />

      <PortalAISuiteModal
        isOpen={aiSuiteModalOpen}
        onClose={() => setAiSuiteModalOpen(false)}
        defaultPortal={currentStaffTier === 'owner' ? 'owner' : 'general'}
      />

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
