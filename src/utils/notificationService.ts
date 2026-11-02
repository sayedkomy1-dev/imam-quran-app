import { SessionRecord, Student, TaskItem } from '../types';
import { getLocalDateString } from '../data/seedData';

export interface UrgentAlertItem {
  id: string;
  category: 'overdue_task' | 'urgent_student';
  title: string;
  body: string;
  priority: 'critical' | 'high';
  studentId?: string;
  taskId?: string;
  timestamp: string;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

export function isNotificationsEnabledInStorage(): boolean {
  try {
    const raw = localStorage.getItem('imam_academy_pwa_store_v1');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.settings &&
      typeof parsed.settings.notificationsEnabled === 'boolean'
    ) {
      return parsed.settings.notificationsEnabled;
    }
  } catch {
    // ignore storage read error
  }
  return true;
}

export interface ScheduledSessionReminderItem {
  id: string;
  title: string;
  body: string;
  tag?: string;
  targetTab?: string;
  studentId?: string | null;
  studentName?: string | null;
  circleName?: string | null;
  meetingUrl?: string | null;
  portalRoute?: string | null;
  url?: string;
  triggerAt: number;
  fired?: boolean;
}

export async function ensurePushServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    }

    // محاولة تفعيل المزامنة الدورية بالخلفية (Periodic Background Sync) لضمان إيقاظ عامل الخدمة عند إغلاق التطبيق
    try {
      const anyReg = reg as ServiceWorkerRegistration & {
        periodicSync?: {
          register: (tag: string, options: { minInterval: number }) => Promise<void>;
        };
        sync?: {
          register: (tag: string) => Promise<void>;
        };
      };
      if (anyReg.periodicSync && typeof anyReg.periodicSync.register === 'function') {
        await anyReg.periodicSync.register('imam-session-reminders-periodic', {
          minInterval: 10 * 60 * 1000, // كل 10 دقائق
        });
      }
      if (anyReg.sync && typeof anyReg.sync.register === 'function') {
        await anyReg.sync.register('imam-session-reminders-sync');
      }
    } catch {
      // المتصفح قد لا يدعم PeriodicSync، وسيعتمد على المؤقتات وإشعارات Push بالخلفية
    }

    return reg;
  } catch {
    return null;
  }
}

export async function syncSessionRemindersWithServiceWorker(params: {
  students: Student[];
  circles?: { id: string; name: string; scheduleDays?: number[]; scheduleTime?: string; permanentMeetingUrl?: string }[];
  portalRole?: string;
  guardianStudentIds?: string[];
  notificationsEnabled?: boolean;
}): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  if (params.notificationsEnabled === false) {
    return;
  }

  try {
    const reg = await ensurePushServiceWorkerRegistered();
    const targetWorker =
      reg?.active || reg?.waiting || reg?.installing || navigator.serviceWorker.controller;
    if (!targetWorker) return;

    const now = new Date();
    const currentDay = now.getDay();
    const todayDateStr = getLocalDateString(0);
    const filterIds =
      params.guardianStudentIds && params.guardianStudentIds.length > 0
        ? new Set(params.guardianStudentIds)
        : null;

    const scheduledReminders: ScheduledSessionReminderItem[] = [];

    for (const st of params.students) {
      if (!st || st.accountStatus === 'مؤرشف' || st.accountStatus === 'متوقف') {
        continue;
      }
      if (filterIds && !filterIds.has(st.id)) {
        continue;
      }

      const circleObj = params.circles?.find(
        (c) => c.name === st.circle || c.id === st.circleId
      );
      const days =
        Array.isArray(st.scheduleDays) && st.scheduleDays.length > 0
          ? st.scheduleDays
          : circleObj?.scheduleDays || [];

      if (!days.includes(currentDay)) continue;

      const rawTime = st.scheduleTime || circleObj?.scheduleTime || '';
      const match = rawTime.trim().match(/^(\d{1,2}):(\d{2})/);
      if (!match) continue;

      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

      const sessionDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      );
      const sessionMs = sessionDate.getTime();
      const surahName = st.currentStop?.surahName || st.currentSurah || 'الورد المقرر';
      const ayahNum = st.currentStop?.ayah || st.currentAyah || 1;
      const circleTitle = st.circle || circleObj?.name || 'الحلقة القرآنية';
      const meetingUrl = st.permanentMeetingUrl || circleObj?.permanentMeetingUrl || null;
      const portalUrl =
        params.portalRole === 'student'
          ? '/Student'
          : params.portalRole === 'guardian'
          ? '/Guardian'
          : '/';

      // 1) تذكير قبل الحصة بـ 30 دقيقة
      const trigger30m = sessionMs - 30 * 60 * 1000;
      if (trigger30m > Date.now() - 2 * 60 * 1000) {
        scheduledReminders.push({
          id: `${todayDateStr}-${st.id}-30m`,
          title: `⏰ تذكير بحصة القرآن بعد 30 دقيقة — ${st.name}`,
          body: `موعد حلقة (${circleTitle}) الساعة ${rawTime} • الورد: سورة ${surahName} (آية ${ayahNum}). نرجو الاستعداد ومراجعة الحصون الخمسة.`,
          tag: `imam-rem-30m-${st.id}`,
          targetTab: 'session',
          studentId: st.id,
          studentName: st.name,
          circleName: circleTitle,
          meetingUrl,
          portalRoute: params.portalRole || 'guardian',
          url: portalUrl,
          triggerAt: trigger30m,
        });
      }

      // 2) تذكير قبل الحصة بـ 10 دقائق
      const trigger10m = sessionMs - 10 * 60 * 1000;
      if (trigger10m > Date.now() - 2 * 60 * 1000) {
        scheduledReminders.push({
          id: `${todayDateStr}-${st.id}-10m`,
          title: `🕌 اقترب موعد حصة الطالب ${st.name} (خلال 10 دقائق)`,
          body: `تبدأ حلقة (${circleTitle}) الساعة ${rawTime} • سورة ${surahName} (آية ${ayahNum}). اضغط للدخول وتجهيز المصحف.`,
          tag: `imam-rem-10m-${st.id}`,
          targetTab: 'session',
          studentId: st.id,
          studentName: st.name,
          circleName: circleTitle,
          meetingUrl,
          portalRoute: params.portalRole || 'guardian',
          url: portalUrl,
          triggerAt: trigger10m,
        });
      }

      // 3) إشعار بدء الحصة الآن
      if (sessionMs > Date.now() - 5 * 60 * 1000) {
        scheduledReminders.push({
          id: `${todayDateStr}-${st.id}-now`,
          title: `🟢 حان الآن موعد حصة القرآن الكريم — ${st.name}`,
          body: `بدأت الآن حلقة (${circleTitle}) • المقرر: سورة ${surahName} (آية ${ayahNum}). بارك الله في همتكم، اضغط للدخول مباشرة.`,
          tag: `imam-rem-now-${st.id}`,
          targetTab: 'session',
          studentId: st.id,
          studentName: st.name,
          circleName: circleTitle,
          meetingUrl,
          portalRoute: params.portalRole || 'guardian',
          url: portalUrl,
          triggerAt: sessionMs,
        });
      }
    }

    targetWorker.postMessage({
      type: 'SYNC_SESSION_REMINDERS',
      portalRole: params.portalRole || 'guardian',
      guardianStudentIds: params.guardianStudentIds || [],
      scheduledReminders,
    });
  } catch {
    // ignore SW sync error
  }
}

export async function scheduleBackgroundSessionReminder(options: {
  title: string;
  body: string;
  delayMinutes?: number;
  studentId?: string | null;
  studentName?: string | null;
  circleName?: string | null;
  meetingUrl?: string | null;
  portalRoute?: string | null;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }
  try {
    const reg = await ensurePushServiceWorkerRegistered();
    const targetWorker =
      reg?.active || reg?.waiting || reg?.installing || navigator.serviceWorker.controller;
    if (!targetWorker) return false;

    targetWorker.postMessage({
      type: 'SCHEDULE_SESSION_REMINDER',
      title: options.title,
      body: options.body,
      delayMinutes: options.delayMinutes ?? 5,
      studentId: options.studentId || null,
      studentName: options.studentName || null,
      circleName: options.circleName || null,
      meetingUrl: options.meetingUrl || null,
      portalRoute: options.portalRoute || 'guardian',
      url:
        options.portalRoute === 'student'
          ? '/Student'
          : options.portalRoute === 'guardian'
          ? '/Guardian'
          : '/',
    });
    return true;
  } catch {
    return false;
  }
}

export interface LocalPushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  targetTab?: string;
  studentId?: string | null;
  portalRoute?: string | null;
  url?: string;
  notificationsEnabled?: boolean;
  onClick?: () => void;
}

export async function sendLocalPushNotification(
  titleOrPayload: string | LocalPushNotificationPayload,
  bodyArg?: string,
  tagArg = 'imam-academy-alert',
  onClickArg?: () => void,
  notificationsEnabledArg?: boolean
): Promise<boolean> {
  const payload: LocalPushNotificationPayload =
    typeof titleOrPayload === 'string'
      ? {
          title: titleOrPayload,
          body: bodyArg || '',
          tag: tagArg,
          onClick: onClickArg,
          notificationsEnabled: notificationsEnabledArg,
        }
      : titleOrPayload;

  // Strictly respect notificationsEnabled setting
  const isEnabled =
    typeof payload.notificationsEnabled === 'boolean'
      ? payload.notificationsEnabled
      : isNotificationsEnabledInStorage();

  if (!isEnabled) {
    return false;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      // ignore
    }
  }

  if (permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body: payload.body,
    dir: 'rtl',
    lang: 'ar',
    icon: '/assets/aistudio/icon-192_29a1c2ce.png',
    badge: '/assets/aistudio/icon-96_3bce66e2.png',
    tag: payload.tag || 'imam-academy-alert',
    data: {
      url: payload.url || '/',
      targetTab: payload.targetTab || 'dashboard',
      studentId: payload.studentId || null,
      portalRoute: payload.portalRoute || null,
    },
  };

  // 1. Prefer displaying native browser push notification via ServiceWorkerRegistration
  try {
    const reg = await ensurePushServiceWorkerRegistered();
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(payload.title, options);
      return true;
    }
  } catch {
    // Fallback to window Notification constructor below
  }

  // 2. Fallback to native window Notification API
  try {
    const notif = new Notification(payload.title, options);
    if (payload.onClick) {
      notif.onclick = () => {
        window.focus();
        payload.onClick?.();
        notif.close();
      };
    }
    return true;
  } catch {
    return false;
  }
}

export function computeTeacherAlerts(
  students: Student[],
  sessions: SessionRecord[],
  tasks: TaskItem[],
  options: { notifyOverdueTasks: boolean; notifyUrgentStudents: boolean }
): UrgentAlertItem[] {
  const today = getLocalDateString(0);
  const cutoff30Days = getLocalDateString(-30);
  const alerts: UrgentAlertItem[] = [];

  // 1. Overdue and high-priority due-today tasks
  if (options.notifyOverdueTasks) {
    tasks
      .filter((t) => !t.completed && t.dueDate <= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .forEach((task) => {
        const isOverdue = task.dueDate < today;
        const st = task.studentId
          ? students.find((s) => s.id === task.studentId)
          : undefined;
        alerts.push({
          id: `alert-task-${task.id}`,
          category: 'overdue_task',
          title: isOverdue ? `مهمة متأخرة: ${task.title}` : `مهمة مستحقة اليوم: ${task.title}`,
          body: `${st ? `الطالب: ${st.name} — ` : ''}تاريخ الاستحقاق: ${task.dueDate}${
            task.notes ? ` (${task.notes})` : ''
          }`,
          priority: isOverdue || task.priority === 'مرتفع' ? 'critical' : 'high',
          taskId: task.id,
          studentId: task.studentId,
          timestamp: task.dueDate,
        });
      });
  }

  // 2. Students needing urgent follow-up (Struggling / Absent / Low Mastery)
  if (options.notifyUrgentStudents) {
    students.forEach((st) => {
      const recentSessions = sessions.filter(
        (s) => s.studentId === st.id && s.date >= cutoff30Days
      );
      const attended = recentSessions.filter((s) => s.status === 'حضر');
      const absentCount = recentSessions.filter((s) => s.status === 'غاب').length;
      const avgMastery =
        attended.length > 0
          ? Math.round(
              attended.reduce((acc, s) => acc + s.masteryScore, 0) / attended.length
            )
          : 100;
      const totalErrors = recentSessions.reduce(
        (acc, s) => acc + s.errors.length,
        0
      );

      const reasons: string[] = [];
      if (avgMastery < 78) reasons.push(`متوسط إتقان منخفض (${avgMastery}%)`);
      if (absentCount >= 1) reasons.push(`غياب متكرر (${absentCount})`);
      if (totalErrors >= 3) reasons.push(`كثرة أخطاء التسميع (${totalErrors} أخطاء)`);
      if (st.disciplineWarnings.length > 0) {
        reasons.push(`إنذار انضباط (${st.disciplineWarnings[0].level})`);
      }

      if (reasons.length > 0) {
        alerts.push({
          id: `alert-student-${st.id}`,
          category: 'urgent_student',
          title: `متابعة عاجلة للطالب: ${st.name}`,
          body: `${reasons.join(' • ')} — متوقف عند سورة ${st.currentStop.surahName} آية ${st.currentStop.ayah}`,
          priority: avgMastery < 75 || absentCount >= 1 ? 'critical' : 'high',
          studentId: st.id,
          timestamp: today,
        });
      }
    });
  }

  return alerts;
}
