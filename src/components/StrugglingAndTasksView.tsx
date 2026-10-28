import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { getLocalDateString } from '../data/seedData';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { formatGregorianAndHijri } from '../utils/dateUtils';
import { computeDropoutRadar } from '../data/educationalInnovationsData';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Clock,
  HeartHandshake,
  Phone,
  Plus,
  Radar,
  Trash2,
  User,
  X,
} from 'lucide-react';

export const StrugglingAndTasksView: React.FC<{
  mode: 'struggling' | 'tasks';
}> = ({ mode }) => {
  const {
    students,
    sessions,
    tasks,
    settings,
    setActiveTab,
    setSelectedStudentId,
    saveTask,
    toggleTask,
    deleteTask,
  } = useAcademy();

  const [struggleFilter, setStruggleFilter] = useState<
    'all' | 'lowMastery' | 'repeats' | 'absence' | 'delayed'
  >('all');

  const [taskFilter, setTaskFilter] = useState<
    'open' | 'today' | 'overdue' | 'completed'
  >('open');
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStudentId, setTaskStudentId] = useState('');
  const [taskDue, setTaskDue] = useState(getLocalDateString(0));
  const [taskPriority, setTaskPriority] = useState<'عادي' | 'مرتفع'>('مرتفع');
  const [taskNotes, setTaskNotes] = useState('');

  const todayStr = getLocalDateString(0);
  const date30DaysAgo = getLocalDateString(-30);

  // Automatic 30-day Struggling Priority Ranking
  const rankedStudents = useMemo(() => {
    return students
      .map((st) => {
        const recentSessions = sessions.filter(
          (s) => s.studentId === st.id && s.date >= date30DaysAgo
        );
        const attended = recentSessions.filter((s) => s.status === 'حضر');
        const absentCount = recentSessions.filter((s) => s.status === 'غاب').length;

        const avgMastery =
          attended.length > 0
            ? Math.round(
                attended.reduce((a, b) => a + b.masteryScore, 0) / attended.length
              )
            : 88;

        const repeatsCount = attended.filter(
          (s) =>
            s.previousEvaluation.newGrade === 'إعادة' ||
            s.previousEvaluation.newGrade === 'ضعيف' ||
            s.previousEvaluation.nearGrade === 'إعادة'
        ).length;

        const lastSessionDate =
          recentSessions.sort((a, b) => b.date.localeCompare(a.date))[0]?.date ||
          '2026-01-01';
        const daysSinceLast = Math.max(
          0,
          Math.round(
            (new Date(todayStr).getTime() - new Date(lastSessionDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        let priorityScore = 0;
        const reasons: string[] = [];

        if (avgMastery < 80) {
          priorityScore += 40;
          reasons.push(`إتقان منخفض (${avgMastery}%)`);
        }
        if (repeatsCount > 0) {
          priorityScore += repeatsCount * 25;
          reasons.push(`كثرة الإعادات (${repeatsCount} مرات)`);
        }
        if (absentCount > 0 || st.disciplineWarnings.length > 0) {
          priorityScore += (absentCount + st.disciplineWarnings.length) * 20;
          reasons.push(
            `غياب متكرر (${absentCount + st.disciplineWarnings.length} تنبيهات)`
          );
        }
        if (daysSinceLast >= 3) {
          priorityScore += 20;
          reasons.push(`متابعة متأخرة (منذ ${daysSinceLast} أيام)`);
        }

        return {
          student: st,
          avgMastery,
          repeatsCount,
          absentCount: absentCount + st.disciplineWarnings.length,
          daysSinceLast,
          priorityScore,
          reasons,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [students, sessions, date30DaysAgo, todayStr]);

  const filteredStruggling = useMemo(() => {
    return rankedStudents.filter((item) => {
      if (struggleFilter === 'lowMastery') return item.avgMastery < 85;
      if (struggleFilter === 'repeats') return item.repeatsCount > 0;
      if (struggleFilter === 'absence') return item.absentCount > 0;
      if (struggleFilter === 'delayed') return item.daysSinceLast >= 3;
      return true;
    });
  }, [rankedStudents, struggleFilter]);

  // Early Warning Dropout Radar Computation
  const dropoutRadarList = useMemo(
    () =>
      computeDropoutRadar(
        students,
        sessions,
        settings.academyName,
        settings.teacherName
      ),
    [students, sessions, settings.academyName, settings.teacherName]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === 'open') return !t.completed;
      if (taskFilter === 'today') return !t.completed && t.dueDate === todayStr;
      if (taskFilter === 'overdue') return !t.completed && t.dueDate < todayStr;
      if (taskFilter === 'completed') return t.completed;
      return true;
    });
  }, [tasks, taskFilter, todayStr]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    saveTask({
      title: taskTitle.trim(),
      studentId: taskStudentId || undefined,
      dueDate: taskDue,
      priority: taskPriority,
      completed: false,
      notes: taskNotes.trim(),
    });
    setTaskTitle('');
    setTaskNotes('');
    setNewTaskModal(false);
  };

  if (mode === 'struggling') {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>مركز متابعة الطلاب المتعثرين (آخر 30 يوماً)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              ترتيب تلقائي للطلاب حسب الأولوية: إتقان منخفض، كثرة الإعادات، غياب متكرر، ومتابعة متأخرة
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'جميع الطلاب حسب الأولوية' },
              { id: 'lowMastery', label: 'إتقان منخفض' },
              { id: 'repeats', label: 'كثرة الإعادات' },
              { id: 'absence', label: 'غياب متكرر' },
              { id: 'delayed', label: 'متابعة متأخرة' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStruggleFilter(f.id as typeof struggleFilter)}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  struggleFilter === f.id
                    ? 'bg-[#145a3a] text-white'
                    : 'bg-[#f6f7f2] dark:bg-[#0b1711] text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* NEW: Early Warning Dropout Radar (رادار الإنذار المبكر لانقطاع الطلاب) */}
        <div className="rounded-3xl bg-gradient-to-l from-[#145a3a]/10 via-[#fcfaf2] to-amber-50/60 dark:from-[#12231a] dark:via-[#0b1711] dark:to-[#12231a] p-6 border-2 border-[#c59b27]/50 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#145a3a] text-[#dfbd69] flex items-center justify-center shrink-0">
                <Radar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#145a3a] dark:text-[#dfbd69]">
                  📡 رادار الإنذار المبكر لانقطاع الطلاب (Dropout Prevention Radar)
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  يرصد تلقائياً مؤشرات الفتور أو الانقطاع المحتمل (انخفاض تدريجي في الدرجات، غياب متتالٍ، عدم تسميع الأمس) مع قالب رسالة اطمئنان دافئة لولي الأمر
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-xs font-extrabold">
              حالات مرصودة للوقاية: {dropoutRadarList.length} طلاب
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dropoutRadarList.slice(0, 6).map((radarItem) => {
              const st = students.find((s) => s.id === radarItem.studentId);
              if (!st) return null;
              return (
                <div
                  key={radarItem.studentId}
                  className="p-4 rounded-2xl bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-[#14281d] dark:text-white">
                        {radarItem.studentName}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          radarItem.riskLevel === 'حرج'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : radarItem.riskLevel === 'متوسط'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        مؤشر الخطر: {radarItem.riskLevel} ({radarItem.riskScore}%)
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500">
                      {radarItem.circle} • آخر حضور منذ {radarItem.daysSinceLastSession} يوم
                    </div>

                    <div className="space-y-1 text-[11px]">
                      {radarItem.indicators.map((ind, i) => (
                        <div
                          key={i}
                          className="text-amber-800 dark:text-amber-300 font-semibold"
                        >
                          ⚠️ {ind}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded-xl bg-[#f6f7f2] dark:bg-[#0b1711] text-[11px] text-[#145a3a] dark:text-[#dfbd69] font-bold">
                      💡 التوصية التربوية: {radarItem.recommendedAction}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-emerald-950">
                    <a
                      href={buildWhatsAppUrl(
                        st.whatsappPhone,
                        radarItem.gentleWhatsAppMessage
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>رسالة اطمئنان وتشجيع دافئة (واتساب)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActiveTab('session');
                      }}
                      className="py-2 px-2.5 rounded-xl bg-[#145a3a] text-[#dfbd69] text-[11px] font-extrabold cursor-pointer"
                      title="بدء حصة تشجيعية خفيفة"
                    >
                      حصة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStruggling.map((item, idx) => (
            <div
              key={item.student.id}
              className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-extrabold ${
                      item.priorityScore >= 40
                        ? 'text-red-600 dark:text-red-400'
                        : item.priorityScore >= 20
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    #{idx + 1} ·{' '}
                    {item.priorityScore >= 40
                      ? 'أولوية قصوى للمتابعة'
                      : item.priorityScore >= 20
                      ? 'يحتاج تثبيت ومتابعة'
                      : 'أداء مستقر ومتقن'}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-neutral-400">
                    متوسط الإتقان: {item.avgMastery}%
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[#14281d] dark:text-white">
                  {item.student.name}
                </h3>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {item.student.circle} · توقف عند: سورة{' '}
                  {item.student.currentStop.surahName} ({item.student.currentStop.ayah})
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  {item.reasons.length > 0 ? (
                    item.reasons.map((r, rIdx) => (
                      <div
                        key={rIdx}
                        className="text-red-700 dark:text-red-300 font-semibold"
                      >
                        • {r}
                      </div>
                    ))
                  ) : (
                    <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      • منتظم في الحضور والتسميع دون مؤشرات تعثر.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-emerald-950 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStudentId(item.student.id);
                      setActiveTab('session');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#dfbd69]" />
                    <span>بدء حصة تثبيت</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStudentId(item.student.id);
                      setActiveTab('students');
                    }}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 text-xs font-bold cursor-pointer"
                  >
                    ملف الطالب
                  </button>
                </div>

                <a
                  href={buildWhatsAppUrl(
                    item.student.whatsappPhone,
                    `${settings.whatsappHeader}\n\nولي أمر الطالب *${item.student.name}*، نود التعاون معكم في تكثيف المراجعة المنزلية لسورة ${item.student.currentStop.surahName} لرفع نسبة الإتقان.\n\n${settings.whatsappFooter}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>رسالة متابعة</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mode: Tasks & Follow-up
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <span>المهام والمتابعة (Tasks)</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            إدارة مهام المعلم ومتابعة الطلاب (مفتوحة، اليوم، متأخرة، مكتملة)
          </p>
        </div>

        <button
          onClick={() => setNewTaskModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold hover:bg-[#0f452c] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#dfbd69]" />
          <span>مهمة جديدة</span>
        </button>
      </div>

      {/* 4 Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            id: 'open',
            label: `مفتوحة (${tasks.filter((t) => !t.completed).length})`,
          },
          {
            id: 'today',
            label: `اليوم (${
              tasks.filter((t) => !t.completed && t.dueDate === todayStr).length
            })`,
          },
          {
            id: 'overdue',
            label: `متأخرة (${
              tasks.filter((t) => !t.completed && t.dueDate < todayStr).length
            })`,
          },
          {
            id: 'completed',
            label: `مكتملة (${tasks.filter((t) => t.completed).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTaskFilter(tab.id as typeof taskFilter)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              taskFilter === tab.id
                ? 'bg-[#145a3a] text-white'
                : 'bg-white dark:bg-[#12231a] border border-neutral-200 dark:border-emerald-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((t) => {
            const st = students.find((s) => s.id === t.studentId);
            const isOverdue = !t.completed && t.dueDate < todayStr;
            return (
              <div
                key={t.id}
                className="rounded-2xl bg-white dark:bg-[#12231a] p-4 border border-neutral-200 dark:border-emerald-900/50 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 cursor-pointer ${
                      t.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 dark:border-emerald-800'
                    }`}
                  >
                    {t.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <div
                      className={`text-sm font-bold ${
                        t.completed ? 'line-through text-neutral-400' : ''
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        {formatGregorianAndHijri(
                          t.dueDate,
                          settings.showHijriDates ?? true
                        )}
                      </span>
                      {isOverdue && (
                        <span className="text-red-600 font-bold">· متأخرة</span>
                      )}
                      {st && (
                        <span className="flex items-center gap-1 text-[#145a3a] dark:text-[#dfbd69] font-semibold">
                          · <User className="w-3.5 h-3.5" /> {st.name}
                        </span>
                      )}
                      <span>· الأولوية: {t.priority}</span>
                    </div>
                    {t.notes && (
                      <p className="text-xs text-neutral-500 mt-1">{t.notes}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(t.id)}
                  className="p-2 text-neutral-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#12231a] p-10 text-center text-xs text-neutral-500 border border-neutral-200 dark:border-emerald-900/50">
            لا توجد مهام في هذا التصنيف حالياً.
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {newTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-emerald-900">
              <h3 className="text-sm font-extrabold">إضافة مهمة جديدة</h3>
              <button onClick={() => setNewTaskModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="مثال: اختبار تثبيت سورة الكهف"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  ارتباط بطالب (اختياري)
                </label>
                <select
                  value={taskStudentId}
                  onChange={(e) => setTaskStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                >
                  <option value="">مهمة عامة للحلقة</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الأولوية</label>
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as 'عادي' | 'مرتفع')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
                  >
                    <option value="مرتفع">مرتفع</option>
                    <option value="عادي">عادي</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#145a3a] text-white text-xs font-bold cursor-pointer"
              >
                حفظ المهمة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
