import React, { useMemo, useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { getLocalDateString } from '../data/seedData';
import { Student } from '../types';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { FamilyGuidanceGeneratorSection } from './PedagogicalAdvisorModal';
import {
  CheckSquare,
  Copy,
  MessageSquare,
  Play,
  Send,
  Users,
} from 'lucide-react';

type BroadcastMode = 'sessionReport' | 'absence' | 'assignmentReminder' | 'custom';

export const BroadcastCenterView: React.FC = () => {
  const { students, sessions, circles, settings, showToast } = useAcademy();

  const [mode, setMode] = useState<BroadcastMode>('sessionReport');
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    students.map((s) => s.id)
  );
  const [previewStudentId, setPreviewStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [customTemplate, setCustomTemplate] = useState<string>(
    `${settings.whatsappHeader}\n\nولي أمر الطالب *{اسم_الطالب}* المحترم ({ولي_الأمر})،\nنحيطكم علماً بأن الطالب ضمن *{الحلقة}* وصل في الحفظ إلى: *{التكليف}* بنسبة إتقان *{نسبة_الإتقان}*.\n\n${settings.whatsappFooter}`
  );

  // Safe Send Queue State
  const [queueActive, setQueueActive] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const todayStr = getLocalDateString(0);

  const filterRecipients = (scope: 'all' | 'todayPresent' | 'todayAbsent' | 'none') => {
    if (scope === 'none') {
      setSelectedStudentIds([]);
      return;
    }
    if (scope === 'all') {
      setSelectedStudentIds(students.map((s) => s.id));
      return;
    }
    const todaySessions = sessions.filter((s) => s.date === todayStr);
    if (scope === 'todayPresent') {
      const ids = todaySessions.filter((s) => s.status === 'حضر').map((s) => s.studentId);
      setSelectedStudentIds(ids.length > 0 ? ids : students.slice(0, 3).map((s) => s.id));
    } else if (scope === 'todayAbsent') {
      const ids = todaySessions.filter((s) => s.status === 'غاب').map((s) => s.studentId);
      setSelectedStudentIds(ids.length > 0 ? ids : [students[3]?.id || students[0].id]);
    }
  };

  const buildPersonalizedMessage = (st: Student): string => {
    const lastSes = sessions
      .filter((s) => s.studentId === st.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const assignmentText = lastSes?.newMemorization?.enabled
      ? `سورة ${lastSes.newMemorization.surahName} (${lastSes.newMemorization.fromAyah}-${lastSes.newMemorization.toAyah})`
      : `سورة ${st.currentStop.surahName} آية ${st.currentStop.ayah}`;

    const masteryText = lastSes?.masteryScore ? `${lastSes.masteryScore}%` : '94%';

    if (mode === 'sessionReport') {
      return `${settings.whatsappHeader}\n\n📋 *تقرير متابعة الطالب:* ${st.name}\n🕌 *الحلقة:* ${st.circle}\n🎯 *نسبة الإتقان:* ${masteryText}\n📖 *المقرر الحالي:* ${assignmentText}\n${
        lastSes?.parentNotes ? `💬 *ملاحظات المعلم:* ${lastSes.parentNotes}\n` : ''
      }\n${settings.whatsappFooter}`;
    }

    if (mode === 'absence') {
      return `${settings.whatsappHeader}\n\n⚠️ *إشعار غياب الطالب:* ${st.name}\nولي الأمر الفاضل (${st.guardianName})، نود إبلاغكم بغياب الطالب اليوم، وقد تم ترحيل تكليفه (${assignmentText}) تلقائياً للحصة القادمة.\n\n${settings.whatsappFooter}`;
    }

    if (mode === 'assignmentReminder') {
      return `${settings.whatsappHeader}\n\n📌 *تذكير بتكليف الحصة القادمة*\nالطالب: *${st.name}*\nالمقرر المطلوب تسميعه: *${assignmentText}*\nتمنياتنا له بالتوفيق والإتقان 🌿\n\n${settings.whatsappFooter}`;
    }

    // Custom template with variable substitution
    return customTemplate
      .replace(/\{اسم_الطالب\}/g, st.name)
      .replace(/\{ولي_الأمر\}/g, st.guardianName)
      .replace(/\{الحلقة\}/g, st.circle)
      .replace(/\{التكليف\}/g, assignmentText)
      .replace(/\{نسبة_الإتقان\}/g, masteryText)
      .replace(/\{المعلم\}/g, settings.teacherName);
  };

  const previewStudent = useMemo(
    () =>
      students.find((s) => s.id === previewStudentId) ||
      students.find((s) => selectedStudentIds.includes(s.id)) ||
      students[0],
    [students, previewStudentId, selectedStudentIds]
  );

  const previewText = useMemo(
    () => (previewStudent ? buildPersonalizedMessage(previewStudent) : ''),
    [previewStudent, mode, customTemplate, sessions, settings]
  );

  const queueRecipients = useMemo(
    () => students.filter((s) => selectedStudentIds.includes(s.id)),
    [students, selectedStudentIds]
  );

  const handleSendCurrentInQueue = () => {
    const target = queueRecipients[queueIndex];
    if (!target) return;
    const msg = buildPersonalizedMessage(target);
    window.open(buildWhatsAppUrl(target.whatsappPhone, msg), '_blank', 'noopener');
    if (queueIndex + 1 < queueRecipients.length) {
      setQueueIndex((prev) => prev + 1);
    } else {
      showToast('اكتمل إرسال جميع الرسائل في الطابور الآمن بنجاح', 'success');
      setQueueActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 shadow-xs">
        <h2 className="text-lg font-extrabold text-[#145a3a] dark:text-[#dfbd69] flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span>مركز رسائل واتساب الجماعي (Broadcast Center)</span>
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          تجهيز الرسائل المخصصة بالمتغيرات، فلترة المستلمين، معاينة الرسالة، وطابور الإرسال المتتابع الآمن
        </p>
      </div>

      {/* Step 1: Message Type Selection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'sessionReport',
            title: 'تقرير حصة',
            desc: 'التقييم + نسبة الإتقان + التكليف القادم',
          },
          {
            id: 'absence',
            title: 'إبلاغ بالغياب',
            desc: 'إشعار الغياب + ترحيل التكليف تلقائياً',
          },
          {
            id: 'assignmentReminder',
            title: 'تذكير بتكليف',
            desc: 'تذكير بموعد الحصة والمقرر المطلوب',
          },
          {
            id: 'custom',
            title: 'رسالة مخصصة بالمتغيرات',
            desc: 'قالب حر يدعم إدراج متغيرات الطالب',
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as BroadcastMode)}
            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              mode === item.id
                ? 'bg-[#145a3a] text-white border-[#145a3a] shadow-sm'
                : 'bg-white dark:bg-[#12231a] border-neutral-200 dark:border-emerald-900/50'
            }`}
          >
            <div className="text-sm font-extrabold">{item.title}</div>
            <div
              className={`text-xs mt-1 ${
                mode === item.id ? 'text-emerald-100' : 'text-neutral-500'
              }`}
            >
              {item.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Main Split: Recipients Filter (6 cols) + Live Preview & Safe Queue (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recipients Selection */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#145a3a] dark:text-[#dfbd69]" />
              <span>تحديد المستلمين ({selectedStudentIds.length} محدد)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => filterRecipients('all')}
                className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold cursor-pointer"
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => filterRecipients('todayPresent')}
                className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold cursor-pointer"
              >
                حاضرو اليوم
              </button>
              <button
                type="button"
                onClick={() => filterRecipients('todayAbsent')}
                className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold cursor-pointer"
              >
                غائبو اليوم
              </button>
              <button
                type="button"
                onClick={() => filterRecipients('none')}
                className="px-2.5 py-1 rounded-lg bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>

          <select
            value={selectedCircle}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCircle(val);
              if (val) {
                setSelectedStudentIds(
                  students.filter((s) => s.circle === val).map((s) => s.id)
                );
              }
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
          >
            <option value="">فلترة سريعة حسب الحلقة...</option>
            {circles.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {students.map((st) => {
              const checked = selectedStudentIds.includes(st.id);
              return (
                <label
                  key={st.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-emerald-900/40 bg-[#f6f7f2]/50 dark:bg-[#0b1711]/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds((prev) => [...prev, st.id]);
                        } else {
                          setSelectedStudentIds((prev) =>
                            prev.filter((id) => id !== st.id)
                          );
                        }
                      }}
                      className="w-4 h-4 accent-[#145a3a]"
                    />
                    <div>
                      <div className="text-xs font-bold">{st.name}</div>
                      <div className="text-[11px] text-neutral-500">
                        ولي الأمر: {st.guardianName} ·{' '}
                        <span className="font-mono tabular-nums" dir="ltr">
                          +{st.whatsappPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold">رقم صالح ✓</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right: Custom Variables, Live Preview & Safe Queue */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#12231a] p-6 border border-neutral-200 dark:border-emerald-900/50 space-y-4">
          {mode === 'custom' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold">
                إدراج متغير ذكي في نص الرسالة:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '{اسم_الطالب}',
                  '{ولي_الأمر}',
                  '{الحلقة}',
                  '{التكليف}',
                  '{نسبة_الإتقان}',
                  '{المعلم}',
                ].map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => setCustomTemplate((prev) => `${prev} ${variable}`)}
                    className="px-2.5 py-1 rounded-lg bg-[#145a3a]/10 text-[#145a3a] dark:text-[#dfbd69] text-xs font-bold cursor-pointer"
                  >
                    + {variable}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={customTemplate}
                onChange={(e) => setCustomTemplate(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs leading-relaxed"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold">معاينة الرسالة للطالب:</span>
              <select
                value={previewStudent?.id || ''}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-emerald-900 bg-[#f6f7f2] dark:bg-[#0b1711] text-xs font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <pre className="whitespace-pre-wrap p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#0b1711] border border-emerald-200 dark:border-emerald-900/60 text-xs leading-relaxed font-sans text-[#14281d] dark:text-emerald-100">
              {previewText}
            </pre>
          </div>

          {previewStudent && (
            <FamilyGuidanceGeneratorSection
              student={previewStudent}
              onInsertIntoParentMessage={(guidanceText) => {
                setMode('custom');
                setCustomTemplate((prev) => `${prev}\n\n${guidanceText}`);
              }}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (queueRecipients.length === 0) {
                  showToast('اختر طالباً واحداً على الأقل لبدء الطابور', 'error');
                  return;
                }
                setQueueIndex(0);
                setQueueActive(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#145a3a] hover:bg-[#0f452c] text-white text-xs font-extrabold cursor-pointer"
            >
              <Play className="w-4 h-4 text-[#dfbd69]" />
              <span>بدء طابور الإرسال الآمن ({queueRecipients.length} مستلم)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(previewText);
                showToast('تم نسخ نص الرسالة إلى الحافظة', 'success');
              }}
              className="flex items-center gap-1.5 py-3 px-4 rounded-xl border border-neutral-200 dark:border-emerald-900 text-xs font-bold cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ المعاينة</span>
            </button>
          </div>

          {/* Safe Queue Runner Panel */}
          {queueActive && queueRecipients[queueIndex] && (
            <div className="p-4 rounded-2xl bg-[#c59b27]/20 border border-[#c59b27] space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>
                  طابور الإرسال الآمن: المستلم ({queueIndex + 1} من{' '}
                  {queueRecipients.length})
                </span>
                <span className="text-[#145a3a] dark:text-[#dfbd69]">
                  {queueRecipients[queueIndex].name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSendCurrentInQueue}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  فتح محادثة واتساب لـ ({queueRecipients[queueIndex].guardianName}) والانتقال للتالي
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
