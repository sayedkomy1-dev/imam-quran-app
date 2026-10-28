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

export async function ensurePushServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return existing;
    }
    return await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
  } catch {
    return null;
  }
}

export interface LocalPushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  targetTab?: string;
  studentId?: string | null;
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
      targetTab: payload.targetTab || 'dashboard',
      studentId: payload.studentId || null,
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
