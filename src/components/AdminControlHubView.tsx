import React, { Suspense, lazy, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { Shield, Wallet, Bot, Settings, MessageSquare, CheckSquare } from 'lucide-react';

const OwnerControlPanelView = lazy(() =>
  import('./OwnerControlPanelView').then((m) => ({ default: m.OwnerControlPanelView }))
);
const FinanceView = lazy(() =>
  import('./FinanceView').then((m) => ({ default: m.FinanceView }))
);
const SettingsView = lazy(() =>
  import('./SettingsView').then((m) => ({ default: m.SettingsView }))
);
const BroadcastCenterView = lazy(() =>
  import('./BroadcastCenterView').then((m) => ({ default: m.BroadcastCenterView }))
);
const StrugglingAndTasksView = lazy(() =>
  import('./StrugglingAndTasksView').then((m) => ({ default: m.StrugglingAndTasksView }))
);

const SubLoadingFallback: React.FC = () => (
  <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
    <div className="w-8 h-8 rounded-xl bg-[#145a3a]/15 border-2 border-[#c59b27] flex items-center justify-center text-sm animate-pulse">
      ⚙️
    </div>
    <p className="text-xs font-bold text-[#145a3a] dark:text-[#dfbd69]">
      جارٍ تحميل القسم الإداري...
    </p>
  </div>
);

export type AdminSubSection = 'staff' | 'finance' | 'ai_tasks' | 'settings_broadcast';

interface AdminControlHubViewProps {
  initialSection?: AdminSubSection;
}

export const AdminControlHubView: React.FC<AdminControlHubViewProps> = ({
  initialSection = 'staff',
}) => {
  const { currentStaffTier, managedTeachers, accessCodeRequests } = useAcademy();
  const [activeSection, setActiveSection] = useState<AdminSubSection>(initialSection);

  const pendingStaffCount = managedTeachers.filter((m) => m.status === 'pending').length;
  const pendingRequestsCount = accessCodeRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Summary Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-emerald-900/50">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#14281d] dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#c59b27]" />
            <span>لوحة الإدارة العليا والمنظومة الذكية</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            إدارة الكادر التعليمي والصلاحيات، السجل المالي، المساعد الذكي، والإعدادات العامة
          </p>
        </div>

        {/* 4 Clean Sub-Tab Selectors */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSection('staff')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSection === 'staff'
                ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>الكادر والصلاحيات</span>
            {pendingStaffCount + pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono font-black">
                {pendingStaffCount + pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('finance')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSection === 'finance'
                ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>المالية والاشتراكات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ai_tasks')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSection === 'ai_tasks'
                ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>الذكاء الاصطناعي والمهام</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('settings_broadcast')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeSection === 'settings_broadcast'
                ? 'bg-[#145a3a] text-[#dfbd69] shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الإعدادات والرسائل</span>
          </button>
        </div>
      </div>

      {/* Active Sub-Section Viewport (Single Source of View) */}
      <Suspense fallback={<SubLoadingFallback />}>
        {activeSection === 'staff' && <OwnerControlPanelView />}
        {activeSection === 'finance' && <FinanceView />}
        {activeSection === 'ai_tasks' && <StrugglingAndTasksView mode="tasks" />}
        {activeSection === 'settings_broadcast' && (
          <div className="space-y-6">
            <SettingsView />
            <BroadcastCenterView />
          </div>
        )}
      </Suspense>
    </div>
  );
};
