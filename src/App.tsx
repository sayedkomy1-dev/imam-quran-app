import React, { useState } from 'react';
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
import { OfflineIndicator, PWAInstallButton } from './components/PWAComponents';
import { HybridFoundationView } from './components/HybridFoundationView';
import { OfflineResourceCenterView } from './components/OfflineResourceCenterView';
import { PublicMushafWaqfPortalView } from './components/PublicMushafWaqfPortalView';
import { OFFICIAL_ACADEMY_WHATSAPP } from './data/hybridFoundationData';
import { formatGregorianAndHijri } from './utils/dateUtils';
import {
  AlertTriangle,
  Bell,
  BellOff,
  BookOpen,
  CheckSquare,
  Compass,
  FolderDown,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Type,
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
  } = useAcademy();

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);

  if (publicMushafPortalOpen) {
    return (
      <div className="min-h-screen bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec]">
        <PublicMushafWaqfPortalView
          onBackToAcademy={() => setPublicMushafPortalOpen(false)}
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
      <div className="min-h-screen bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec]">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <GuardianAndGuestView />
        </div>
        <OfflineIndicator />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#145a3a] text-white text-xs font-extrabold shadow-xl border border-[#c59b27]">
            {toastMessage.text}
          </div>
        )}
      </div>
    );
  }

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
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
      id: 'circles',
      label: 'إدارة الحلقات والحضور',
      icon: <Users className="w-4 h-4" />,
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
      id: 'resources',
      label: 'المواد والعمل أوفلاين',
      icon: <FolderDown className="w-4 h-4" />,
    },
    {
      id: 'public_mushaf',
      label: 'مصحف المدينة العام والوقف',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'broadcast',
      label: 'رسائل واتساب الجماعية',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'الإعدادات والنسخ',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const adjustFontSize = (delta: 1 | -1) => {
    const order: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
    const currentIdx = Math.max(0, order.indexOf(settings.fontSize || 'md'));
    const nextIdx = Math.max(0, Math.min(order.length - 1, currentIdx + delta));
    updateSettings({ fontSize: order[nextIdx] });
  };

  return (
    <div className="min-h-screen bg-[#f6f7f2] dark:bg-[#0b1711] text-[#14281d] dark:text-[#e9f2ec] flex">
      {/* Desktop RTL Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-white dark:bg-[#12231a] border-l border-neutral-200 dark:border-emerald-900/50 p-4 sticky top-0 h-screen overflow-y-auto no-print">
        <div className="space-y-6">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <img
              src="/assets/aistudio/icon-192_29a1c2ce.png"
              alt="شعار أكاديمية الإمام"
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-2xl border border-[#c59b27]/50 shadow-xs object-cover"
            />
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[#145a3a] dark:text-[#dfbd69] truncate">
                أكاديمية الإمام
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                بالقرآن نحيا
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#145a3a] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-[#f6f7f2] dark:hover:bg-[#0b1711] hover:text-[#145a3a] dark:hover:text-[#dfbd69]'
                  }`}
                >
                  <span className={isActive ? 'text-[#dfbd69]' : ''}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Role Switcher & Logout */}
        <div className="pt-4 border-t border-neutral-200 dark:border-emerald-900/50 space-y-2">
          <a
            href="/al-imam-quran-academy-complete.zip"
            download="al-imam-quran-academy-complete.zip"
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white border border-[#c59b27]/60 text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-1.5">
              <FolderDown className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span>تحميل النسخة المضغوطة (ZIP)</span>
            </span>
            <span className="font-mono text-[10px] text-[#dfbd69]">v12.0.0</span>
          </a>
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
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#12231a]/90 backdrop-blur-md border-b border-neutral-200 dark:border-emerald-900/50 px-4 md:px-6 py-3 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/icon-96_3bce66e2.png"
              alt="أيقونة"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl lg:hidden border border-[#c59b27]/40"
            />
            <span className="text-sm md:text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69] truncate">
              {navItems.find((n) => n.id === activeTab)?.label || 'أكاديمية الإمام'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            <a
              href="/al-imam-quran-academy-complete.zip"
              download="al-imam-quran-academy-complete.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white border border-[#c59b27]/70 text-xs font-extrabold shadow-xs cursor-pointer transition"
              title="تحميل النسخة المضغوطة للبرنامج كاملة بدون أخطاء (ZIP - Release v12.0.0)"
            >
              <FolderDown className="w-3.5 h-3.5 text-[#dfbd69]" />
              <span className="hidden sm:inline">📦 النسخة المضغوطة (ZIP)</span>
            </a>
            <PWAInstallButton />

            {/* Local Push Notification Center Button */}
            <div className="relative">
              <button
                onClick={() => setNotifPopoverOpen((prev) => !prev)}
                className="relative p-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] hover:border-[#145a3a] cursor-pointer"
                title="التنبيهات المحلية للمهام المتأخرة والطلاب المتعثرين"
              >
                {settings.notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
                ) : (
                  <BellOff className="w-4 h-4 text-neutral-400" />
                )}
                {settings.notificationsEnabled && teacherAlerts.length > 0 && (
                  <span className="absolute -top-1 -left-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                    {teacherAlerts.length}
                  </span>
                )}
              </button>

              {notifPopoverOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-800 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-emerald-900">
                    <div>
                      <div className="text-xs font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                        مركز تنبيهات المتابعة والمهام ({teacherAlerts.length})
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Notification API — {settings.notificationsEnabled ? 'نشط' : 'متوقف'}
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
                    <div className="py-6 text-center text-xs text-neutral-500">
                      لا توجد مهام متأخرة أو طلاب بحاجة لمتابعة عاجلة حالياً.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pl-1">
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
        </header>

        {/* Active View Viewport */}
        <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1">
          {activeTab === 'dashboard' && <DashboardView />}
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
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#12231a]/95 backdrop-blur-md border-t border-neutral-200 dark:border-emerald-900/50 grid grid-cols-5 items-center h-16 px-2 no-print">
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
              className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
                active
                  ? 'text-[#145a3a] dark:text-[#dfbd69]'
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
          className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span>المزيد</span>
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
                جميع وحدات أكاديمية الإمام
              </span>
              <button onClick={() => setMobileMoreOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMoreOpen(false);
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-right text-xs font-bold ${
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

            <div className="pt-3 border-t border-neutral-200 dark:border-emerald-900 flex gap-2">
              <button
                onClick={() => {
                  setMobileMoreOpen(false);
                  loginAsGuardianDirect(students[0]?.id || 'st-1');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#c59b27] text-[#14281d] text-xs font-extrabold"
              >
                بوابة ولي الأمر
              </button>
              <button
                onClick={() => {
                  setMobileMoreOpen(false);
                  logout();
                }}
                className="py-2.5 px-4 rounded-xl border border-red-200 text-red-600 text-xs font-bold"
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
