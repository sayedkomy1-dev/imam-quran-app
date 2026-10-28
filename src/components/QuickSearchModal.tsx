import React, { useMemo, useState } from 'react';
import { ActiveTab, useAcademy } from '../context/AcademyContext';
import { SURAHS } from '../data/quranData';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';

export const QuickSearchModal: React.FC = () => {
  const {
    quickSearchOpen,
    setQuickSearchOpen,
    students,
    tasks,
    setActiveTab,
    setSelectedStudentId,
  } = useAcademy();

  const [query, setQuery] = useState('');

  const navActions: { tab: ActiveTab; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      tab: 'dashboard',
      label: 'الصفحة الرئيسية (Dashboard)',
      desc: 'الإحصائيات، متابعة اليوم، ونشاط الأسبوع',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'session',
      label: 'محرك الحصة والتسميع الخماسي',
      desc: 'تسجيل الحضور، رصد الأخطاء، والتكليفات الخمسة',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      tab: 'smartboard',
      label: 'السبورة الذكية التفاعلية (Imam Smart Board)',
      desc: 'الرسم فوق الآيات واختبار إخفاء الكلمات والتفسير',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      tab: 'students',
      label: 'إدارة الطلاب وملف الطالب الشامل',
      desc: 'البحث، الفلترة، خريطة المصحف، والشهادات',
      icon: <Users className="w-4 h-4" />,
    },
    {
      tab: 'circles',
      label: 'إدارة الحلقات وكشف الحضور اليومي',
      desc: 'التسميع الجماعي، الانضباط، وجداول الحلقات',
      icon: <Users className="w-4 h-4" />,
    },
    {
      tab: 'exams',
      label: 'الاختبارات والإجازات والأسانيد',
      desc: 'لجان التقييم، السند المتصل، وإصدار الشهادات',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      tab: 'struggling',
      label: 'مركز متابعة الطلاب المتعثرين',
      desc: 'ترتيب الأولويات حسب الإتقان والغياب والإعادات',
      icon: <User className="w-4 h-4" />,
    },
    {
      tab: 'tasks',
      label: 'المهام والمتابعة (Tasks)',
      desc: 'مهام المعلم والطلاب والمواعيد المستحقة',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      tab: 'finance',
      label: 'الإدارة المالية للطلاب',
      desc: 'متابعة الرسوم الشهرية وتقارير التحصيل',
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      tab: 'broadcast',
      label: 'مركز رسائل واتساب الجماعي',
      desc: 'قوالب الرسائل بالمتغيرات وطابور الإرسال الآمن',
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  const filteredStudents = useMemo(() => {
    const q = query.trim();
    if (!q) return students.slice(0, 5);
    return students.filter(
      (s) =>
        s.name.includes(q) ||
        s.guardianName.includes(q) ||
        s.circle.includes(q) ||
        s.whatsappPhone.includes(q)
    );
  }, [query, students]);

  const filteredPages = useMemo(() => {
    const q = query.trim();
    if (!q) return navActions.slice(0, 5);
    return navActions.filter((p) => p.label.includes(q) || p.desc.includes(q));
  }, [query]);

  const filteredSurahs = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return SURAHS.filter((s) => s.name.includes(q) || String(s.id) === q).slice(0, 5);
  }, [query]);

  const filteredTasks = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return tasks.filter((t) => t.title.includes(q) || t.notes.includes(q)).slice(0, 4);
  }, [query, tasks]);

  if (!quickSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-14 px-4"
      onClick={() => setQuickSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-emerald-900/50">
          <Search className="w-5 h-5 text-[#145a3a] dark:text-[#dfbd69] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن طالب، حلقة، سورة، مهمة، أو انتقل لأي وحدة... (Ctrl+K)"
            className="w-full bg-transparent text-sm font-semibold text-[#14281d] dark:text-white focus:outline-hidden"
          />
          <button
            onClick={() => setQuickSearchOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[68vh] overflow-y-auto p-4 space-y-5">
          {/* Students */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="text-xs font-bold text-neutral-400 mb-2">الطلاب</div>
              <div className="space-y-1.5">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f6f7f2] dark:hover:bg-[#0b1711] border border-transparent hover:border-neutral-200 dark:hover:border-emerald-900/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActiveTab('students');
                        setQuickSearchOpen(false);
                      }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] flex items-center justify-center font-bold text-xs">
                        {st.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#14281d] dark:text-white">
                          {st.name}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {st.level} · {st.circle} · توقف عند: سورة {st.currentStop.surahName} ({st.currentStop.ayah})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('session');
                          setQuickSearchOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
                      >
                        بدء حصة
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('students');
                          setQuickSearchOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-emerald-800 text-xs font-semibold hover:border-[#145a3a] cursor-pointer"
                      >
                        الملف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules */}
          {filteredPages.length > 0 && (
            <div>
              <div className="text-xs font-bold text-neutral-400 mb-2">وحدات النظام</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPages.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setQuickSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-emerald-900/50 hover:border-[#145a3a] dark:hover:border-[#dfbd69] text-right transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#145a3a] dark:text-[#dfbd69]">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surahs */}
          {filteredSurahs.length > 0 && (
            <div>
              <div className="text-xs font-bold text-neutral-400 mb-2">السور القرآنية</div>
              <div className="flex flex-wrap gap-2">
                {filteredSurahs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveTab('smartboard');
                      setQuickSearchOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900/60 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold hover:border-[#c59b27] cursor-pointer"
                  >
                    {s.id}. سورة {s.name} ({s.ayahs} آية)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-xs font-bold text-neutral-400 mb-2">المهام</div>
              <div className="space-y-1.5">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab('tasks');
                      setQuickSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-emerald-900/40 text-right text-xs font-semibold hover:border-[#145a3a] cursor-pointer"
                  >
                    <span>{t.title}</span>
                    <span className="text-neutral-400 tabular-nums">{t.dueDate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#f6f7f2] dark:bg-[#0b1711] border-t border-neutral-200 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-neutral-500">
          <span>اختصار لوحة المفاتيح: Ctrl + K</span>
          <span>اضغط Esc للإغلاق</span>
        </div>
      </div>
    </div>
  );
};
