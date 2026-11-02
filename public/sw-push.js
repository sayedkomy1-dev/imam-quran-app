// ============================================================================
// sw-push.js — محرك التنبيهات الفورية وتذكيرات الحصص بالخلفية (PWA Push & Session Reminder Engine)
// أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا
// يضمن وصول تذكيرات الحصص للطلاب وأولياء الأمور والمعلمين حتى عند إغلاق التطبيق
// ============================================================================

const SW_PUSH_VERSION = 'v13.5.0-push-reminders';
const DB_NAME = 'ImamAcademyDB';
const DB_VERSION = 1;
const STATE_STORE = 'state';

const DEFAULT_ICON = '/assets/aistudio/icon-192_29a1c2ce.png';
const DEFAULT_BADGE = '/assets/aistudio/icon-96_3bce66e2.png';

// سجل بالذاكرة لمنع تكرار نفس التنبيه لنفس الحصة في نفس اليوم
const dispatchedReminderKeys = new Set();
// مؤقتات التذكير المجدولة أثناء نشاط عامل الخدمة
const activeSwTimers = new Map();

// ----------------------------------------------------------------------------
// 1. دوال التعامل مع قاعدة البيانات المحلية (IndexedDB) داخل Service Worker
// ----------------------------------------------------------------------------
function openAcademyIndexedDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readRootStateFromIDB() {
  const db = await openAcademyIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        resolve(null);
        return;
      }
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const getReq = store.get('root');
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readPushMetaFromIDB() {
  const db = await openAcademyIndexedDB();
  if (!db) {
    return {
      id: 'push_reminders_meta',
      notifiedKeys: {},
      scheduledReminders: [],
      portalRole: 'guardian',
      guardianStudentIds: [],
    };
  }
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        resolve({
          id: 'push_reminders_meta',
          notifiedKeys: {},
          scheduledReminders: [],
          portalRole: 'guardian',
          guardianStudentIds: [],
        });
        return;
      }
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const getReq = store.get('push_reminders_meta');
      getReq.onsuccess = () => {
        resolve(
          getReq.result || {
            id: 'push_reminders_meta',
            notifiedKeys: {},
            scheduledReminders: [],
            portalRole: 'guardian',
            guardianStudentIds: [],
          }
        );
      };
      getReq.onerror = () =>
        resolve({
          id: 'push_reminders_meta',
          notifiedKeys: {},
          scheduledReminders: [],
          portalRole: 'guardian',
          guardianStudentIds: [],
        });
    } catch {
      resolve({
        id: 'push_reminders_meta',
        notifiedKeys: {},
        scheduledReminders: [],
        portalRole: 'guardian',
        guardianStudentIds: [],
      });
    }
  });
}

async function savePushMetaToIDB(metaPayload) {
  const db = await openAcademyIndexedDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        resolve(false);
        return;
      }
      const tx = db.transaction(STATE_STORE, 'readwrite');
      const store = tx.objectStore(STATE_STORE);
      store.put({
        ...metaPayload,
        id: 'push_reminders_meta',
        updatedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function isNotificationsEnabledInIDB() {
  const data = await readRootStateFromIDB();
  if (
    data &&
    data.settings &&
    typeof data.settings.notificationsEnabled === 'boolean'
  ) {
    return data.settings.notificationsEnabled;
  }
  return true;
}

// ----------------------------------------------------------------------------
// 2. بناء خيارات الإشعار القياسية المتوافقة مع الهواتف وسطح المكتب
// ----------------------------------------------------------------------------
function buildNotificationOptions(payload = {}) {
  const targetUrl =
    payload.url ||
    (payload.portalRoute === 'guardian'
      ? '/Guardian'
      : payload.portalRoute === 'student'
      ? '/Student'
      : '/');

  const defaultActions =
    Array.isArray(payload.actions) && payload.actions.length > 0
      ? payload.actions
      : [
          {
            action: 'join_session',
            title: '📖 دخول الحلقة الآن',
          },
          {
            action: 'snooze_5m',
            title: '⏰ تذكير بعد 5 دقائق',
          },
        ];

  return {
    body:
      payload.body ||
      'حان موعد الحلقة القرآنية في أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا.',
    dir: 'rtl',
    lang: 'ar',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    tag: payload.tag || 'imam-academy-session-reminder',
    renotify: payload.renotify !== false,
    requireInteraction: payload.requireInteraction !== false,
    vibrate: payload.vibrate || [200, 100, 200, 100, 350],
    timestamp: payload.timestamp || Date.now(),
    actions: defaultActions,
    data: {
      url: targetUrl,
      targetTab: payload.targetTab || 'session',
      studentId: payload.studentId || null,
      studentName: payload.studentName || null,
      circleName: payload.circleName || null,
      meetingUrl: payload.meetingUrl || null,
      portalRoute: payload.portalRoute || null,
      originalTitle:
        payload.title || 'أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا',
      originalBody: payload.body || '',
    },
  };
}

// ----------------------------------------------------------------------------
// 3. خوارزمية فحص مواعيد الحصص وإرسال تذكيرات الطلاب وأولياء الأمور بالخلفية
// ----------------------------------------------------------------------------
function getLocalTodayDateKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseScheduleTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatTimeArabic12Hour(timeStr) {
  const totalMin = parseScheduleTimeToMinutes(timeStr);
  if (totalMin === null) return timeStr || '';
  const h24 = Math.floor(totalMin / 60);
  const m = String(totalMin % 60).padStart(2, '0');
  const period = h24 >= 12 ? 'مساءً' : 'صباحاً';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m} ${period}`;
}

function armTimerForReminder(reminderItem) {
  if (!reminderItem || !reminderItem.id || !reminderItem.triggerAt) return;
  const delayMs = reminderItem.triggerAt - Date.now();
  // إذا كان التذكير خلال الـ 45 دقيقة القادمة، نضبط مؤقتاً داخل عامل الخدمة
  if (delayMs > 0 && delayMs <= 45 * 60 * 1000) {
    if (activeSwTimers.has(reminderItem.id)) {
      clearTimeout(activeSwTimers.get(reminderItem.id));
    }
    const timerId = setTimeout(() => {
      activeSwTimers.delete(reminderItem.id);
      void checkAndDispatchUpcomingSessionReminders();
    }, delayMs + 250);
    activeSwTimers.set(reminderItem.id, timerId);
  }
}

async function checkAndDispatchUpcomingSessionReminders() {
  try {
    const enabled = await isNotificationsEnabledInIDB();
    if (!enabled) return;

    const rootState = await readRootStateFromIDB();
    const pushMeta = await readPushMetaFromIDB();
    const notifiedKeys = { ...(pushMeta.notifiedKeys || {}) };
    const scheduledReminders = Array.isArray(pushMeta.scheduledReminders)
      ? [...pushMeta.scheduledReminders]
      : [];

    const now = new Date();
    const nowMs = now.getTime();
    const todayKey = getLocalTodayDateKey(now);
    const currentDayOfWeek = now.getDay(); // 0 = Sunday ... 6 = Saturday
    const currentMinutesOfDay = now.getHours() * 60 + now.getMinutes();

    let metaChanged = false;

    // تنظيف مفاتيح الأيام السابقة لتوفير المساحة
    for (const key of Object.keys(notifiedKeys)) {
      if (!key.startsWith(todayKey)) {
        delete notifiedKeys[key];
        metaChanged = true;
      }
    }

    // أ) تنفيذ التذكيرات المجدولة صراحةً (مثل الغفوة Snooze أو التذكير المخصص)
    const remainingScheduled = [];
    for (const rem of scheduledReminders) {
      if (!rem || !rem.id) continue;
      if (rem.fired) continue;

      if (nowMs >= rem.triggerAt) {
        const dedupKey = `${todayKey}::scheduled::${rem.id}`;
        if (!notifiedKeys[dedupKey] && !dispatchedReminderKeys.has(dedupKey)) {
          dispatchedReminderKeys.add(dedupKey);
          notifiedKeys[dedupKey] = nowMs;
          metaChanged = true;

          await self.registration.showNotification(
            rem.title || '⏰ تذكير بموعد الحلقة القرآنية — أكاديمية الإمام',
            buildNotificationOptions({
              title: rem.title,
              body: rem.body,
              tag: rem.tag || `imam-scheduled-${rem.id}`,
              targetTab: rem.targetTab || 'session',
              studentId: rem.studentId || null,
              studentName: rem.studentName || null,
              circleName: rem.circleName || null,
              meetingUrl: rem.meetingUrl || null,
              portalRoute: rem.portalRoute || null,
              url: rem.url || '/',
            })
          );
        }
      } else {
        remainingScheduled.push(rem);
        armTimerForReminder(rem);
      }
    }

    if (remainingScheduled.length !== scheduledReminders.length) {
      metaChanged = true;
    }

    // ب) فحص جداول الطلاب والحلقات اليومية تلقائياً حتى لو كان التطبيق مغلقاً
    const students =
      rootState && Array.isArray(rootState.students) ? rootState.students : [];
    const circles =
      rootState && Array.isArray(rootState.circles) ? rootState.circles : [];

    // في حال كان المستخدم ولي أمر أو طالباً محدداً، نركز على طلابه، وإلا نفحص جميع الطلاب النشطين
    const filterStudentIds =
      Array.isArray(pushMeta.guardianStudentIds) &&
      pushMeta.guardianStudentIds.length > 0
        ? new Set(pushMeta.guardianStudentIds)
        : null;

    for (const student of students) {
      if (!student || student.accountStatus === 'مؤرشف' || student.accountStatus === 'متوقف') {
        continue;
      }
      if (filterStudentIds && !filterStudentIds.has(student.id)) {
        continue;
      }

      const circleObj = circles.find(
        (c) => c.name === student.circle || c.id === student.circleId
      );

      const scheduleDays =
        Array.isArray(student.scheduleDays) && student.scheduleDays.length > 0
          ? student.scheduleDays
          : circleObj && Array.isArray(circleObj.scheduleDays)
          ? circleObj.scheduleDays
          : [];

      if (!scheduleDays.includes(currentDayOfWeek)) {
        continue;
      }

      const rawTime =
        student.scheduleTime || (circleObj && circleObj.scheduleTime) || '';
      const sessionMinutes = parseScheduleTimeToMinutes(rawTime);
      if (sessionMinutes === null) continue;

      const diffMinutes = sessionMinutes - currentMinutesOfDay;
      const formattedTime = formatTimeArabic12Hour(rawTime);
      const surahName =
        (student.currentStop && student.currentStop.surahName) ||
        student.currentSurah ||
        'الورد المقرر';
      const ayahNum =
        (student.currentStop && student.currentStop.ayah) ||
        student.currentAyah ||
        1;
      const circleTitle = student.circle || (circleObj && circleObj.name) || 'الحلقة القرآنية';
      const meetingUrl =
        student.permanentMeetingUrl ||
        (circleObj && circleObj.permanentMeetingUrl) ||
        null;

      // تحديد مرحلة التذكير:
      // 1) قبل الحصة بـ 30 دقيقة (بين 16 و 35 دقيقة)
      // 2) قبل الحصة بـ 10 دقائق (بين 3 و 15 دقيقة)
      // 3) عند بدء الحصة الآن (بين -10 و 2 دقيقة)
      let stageKey = null;
      let notifTitle = '';
      let notifBody = '';

      if (diffMinutes > 15 && diffMinutes <= 35) {
        stageKey = 'before_30m';
        notifTitle = `⏰ تذكير بحصة القرآن بعد ${diffMinutes} دقيقة — ${student.name}`;
        notifBody = `موعد حلقة (${circleTitle}) الساعة ${formattedTime} • الورد: سورة ${surahName} (آية ${ayahNum}). نرجو الاستعداد ومراجعة الحصون الخمسة.`;
      } else if (diffMinutes > 2 && diffMinutes <= 15) {
        stageKey = 'before_10m';
        notifTitle = `🕌 اقترب موعد حصة الطالب ${student.name} (خلال ${diffMinutes} دقائق)`;
        notifBody = `تبدأ حلقة (${circleTitle}) الساعة ${formattedTime} • سورة ${surahName} (آية ${ayahNum}). اضغط للدخول وتجهيز المصحف.`;
      } else if (diffMinutes >= -10 && diffMinutes <= 2) {
        stageKey = 'session_now';
        notifTitle = `🟢 حان الآن موعد حصة القرآن الكريم — ${student.name}`;
        notifBody = `بدأت الآن حلقة (${circleTitle}) • المقرر: سورة ${surahName} (آية ${ayahNum}). بارك الله في همتكم، اضغط للدخول مباشرة.`;
      } else if (diffMinutes > 35 && diffMinutes <= 65) {
        // جدولة مؤقت داخلي لعامل الخدمة عندما يحين وقت الـ 30 دقيقة
        const msUntil30m = (diffMinutes - 30) * 60 * 1000;
        armTimerForReminder({
          id: `auto-30m-${student.id}-${todayKey}`,
          triggerAt: nowMs + Math.max(5000, msUntil30m),
        });
      }

      if (!stageKey) continue;

      const dedupKey = `${todayKey}::${student.id}::${stageKey}`;
      if (notifiedKeys[dedupKey] || dispatchedReminderKeys.has(dedupKey)) {
        continue;
      }

      dispatchedReminderKeys.add(dedupKey);
      notifiedKeys[dedupKey] = nowMs;
      metaChanged = true;

      const portalRoute = pushMeta.portalRole || 'guardian';
      const targetUrl =
        portalRoute === 'student'
          ? '/Student'
          : portalRoute === 'guardian'
          ? '/Guardian'
          : '/';

      await self.registration.showNotification(
        notifTitle,
        buildNotificationOptions({
          title: notifTitle,
          body: notifBody,
          tag: `imam-session-${student.id}-${stageKey}`,
          targetTab: 'session',
          studentId: student.id,
          studentName: student.name,
          circleName: circleTitle,
          meetingUrl,
          portalRoute,
          url: targetUrl,
        })
      );
    }

    if (metaChanged) {
      await savePushMetaToIDB({
        ...pushMeta,
        notifiedKeys,
        scheduledReminders: remainingScheduled,
      });
    }
  } catch {
    // تجاهل أي أخطاء غير متوقعة في الخلفية لضمان استقرار عامل الخدمة
  }
}

// ----------------------------------------------------------------------------
// 4. دورة حياة عامل الخدمة (Install & Activate)
// ----------------------------------------------------------------------------
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await checkAndDispatchUpcomingSessionReminders();
    })()
  );
});

// ----------------------------------------------------------------------------
// 5. استقبال إشعارات Web Push الفورية من الخادم حتى والتطبيق مغلق تماماً
// ----------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const enabled = await isNotificationsEnabledInIDB();
      if (!enabled) return;

      let payload = {
        title: 'أكاديمية الإمام لتحفيظ القرآن الكريم — بالقرآن نحيا',
        body: 'لديك تذكير بحصة قرآنية قادمة أو متابعة مهمة للطالب.',
        tag: 'imam-academy-push',
        targetTab: 'dashboard',
        studentId: null,
        portalRoute: null,
        url: '/',
        notificationsEnabled: true,
      };

      if (event.data) {
        try {
          const parsed = event.data.json();
          payload = { ...payload, ...parsed };
        } catch {
          try {
            const textBody = event.data.text();
            if (textBody) payload.body = textBody;
          } catch {
            // الاحتفاظ بالقيم الافتراضية
          }
        }
      }

      if (payload.notificationsEnabled === false) {
        return;
      }

      await self.registration.showNotification(
        payload.title,
        buildNotificationOptions(payload)
      );

      // فحص أي تذكيرات حصص مستحقة بالتوازي
      await checkAndDispatchUpcomingSessionReminders();
    })()
  );
});

// ----------------------------------------------------------------------------
// 6. المزامنة الدورية بالخلفية (Periodic Background Sync & Background Sync)
//    لإيقاظ عامل الخدمة وفحص مواعيد الحصص حتى عند إغلاق المتصفح/التطبيق
// ----------------------------------------------------------------------------
self.addEventListener('periodicsync', (event) => {
  if (
    event.tag === 'imam-session-reminders-periodic' ||
    event.tag === 'check-quran-session-reminders'
  ) {
    event.waitUntil(checkAndDispatchUpcomingSessionReminders());
  }
});

self.addEventListener('sync', (event) => {
  if (
    event.tag === 'imam-session-reminders-sync' ||
    event.tag === 'sync-session-reminders'
  ) {
    event.waitUntil(checkAndDispatchUpcomingSessionReminders());
  }
});

// ----------------------------------------------------------------------------
// 7. استقبال الرسائل من واجهة التطبيق (Message Events)
//    لدعم الجدولة المسبقة ومزامنة مواعيد الطلاب وأولياء الأمور
// ----------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  // أ) إطلاق إشعار فوري من داخل التطبيق عبر عامل الخدمة
  if (data.type === 'TRIGGER_LOCAL_PUSH') {
    event.waitUntil(
      (async () => {
        if (data.notificationsEnabled === false) return;
        const enabledInDb = await isNotificationsEnabledInIDB();
        if (!enabledInDb) return;

        await self.registration.showNotification(
          data.title || 'أكاديمية الإمام لتحفيظ القرآن الكريم',
          buildNotificationOptions(data)
        );
      })()
    );
    return;
  }

  // ب) مزامنة تفضيلات التذكير وهوية البوابة (طالب / ولي أمر / معلم) + جدولة التذكيرات
  if (data.type === 'SYNC_SESSION_REMINDERS') {
    event.waitUntil(
      (async () => {
        const pushMeta = await readPushMetaFromIDB();
        const incomingScheduled = Array.isArray(data.scheduledReminders)
          ? data.scheduledReminders
          : pushMeta.scheduledReminders || [];

        const updatedMeta = {
          ...pushMeta,
          portalRole: data.portalRole || pushMeta.portalRole || 'guardian',
          guardianStudentIds: Array.isArray(data.guardianStudentIds)
            ? data.guardianStudentIds
            : pushMeta.guardianStudentIds || [],
          scheduledReminders: incomingScheduled,
        };

        await savePushMetaToIDB(updatedMeta);

        for (const rem of incomingScheduled) {
          armTimerForReminder(rem);
        }

        await checkAndDispatchUpcomingSessionReminders();
      })()
    );
    return;
  }

  // ج) جدولة تذكير مخصص بعد عدد دقائق محدد (يعمل حتى لو أغلق المستخدم التطبيق بعدها)
  if (data.type === 'SCHEDULE_SESSION_REMINDER') {
    event.waitUntil(
      (async () => {
        const pushMeta = await readPushMetaFromIDB();
        const list = Array.isArray(pushMeta.scheduledReminders)
          ? [...pushMeta.scheduledReminders]
          : [];

        const delayMs =
          typeof data.delayMinutes === 'number'
            ? Math.max(0.1, data.delayMinutes) * 60 * 1000
            : typeof data.delayMs === 'number'
            ? Math.max(1000, data.delayMs)
            : 5 * 60 * 1000;

        const reminderItem = {
          id: data.id || `rem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title:
            data.title ||
            '⏰ تذكير بموعد الحلقة القرآنية — أكاديمية الإمام لتحفيظ القرآن الكريم',
          body:
            data.body ||
            'اقترب موعد حصة القرآن الكريم، يرجى الاستعداد وتجهيز المصحف الشريف.',
          tag: data.tag || 'imam-scheduled-reminder',
          targetTab: data.targetTab || 'session',
          studentId: data.studentId || null,
          studentName: data.studentName || null,
          circleName: data.circleName || null,
          meetingUrl: data.meetingUrl || null,
          portalRoute: data.portalRoute || null,
          url: data.url || '/',
          triggerAt: data.triggerAt || Date.now() + delayMs,
          fired: false,
        };

        const filtered = list.filter((item) => item && item.id !== reminderItem.id);
        filtered.push(reminderItem);

        await savePushMetaToIDB({
          ...pushMeta,
          scheduledReminders: filtered,
        });

        armTimerForReminder(reminderItem);
      })()
    );
    return;
  }

  // د) فحص فوري للتذكيرات المستحقة
  if (data.type === 'CHECK_REMINDERS_NOW') {
    event.waitUntil(checkAndDispatchUpcomingSessionReminders());
  }
});

// ----------------------------------------------------------------------------
// 8. التعامل الذكي مع نقر المستخدم على الإشعار وأزرار الإجراءات (Notification Click)
// ----------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  const notif = event.notification;
  const notifData = (notif && notif.data) || {};
  const action = event.action;

  notif.close();

  // إذا اختار المستخدم "تذكير بعد 5 دقائق" (Snooze)
  if (action === 'snooze_5m') {
    event.waitUntil(
      (async () => {
        const snoozeDelayMs = 5 * 60 * 1000;
        const snoozeItem = {
          id: `snooze-${notifData.studentId || 'general'}-${Date.now()}`,
          title:
            notifData.originalTitle ||
            '⏰ تذكير متجدد بالحلقة القرآنية — أكاديمية الإمام',
          body:
            notifData.originalBody ||
            'مرّت 5 دقائق على التذكير السابق، حان وقت الدخول للحلقة القرآنية الآن.',
          tag: `imam-snooze-${notifData.studentId || 'general'}`,
          targetTab: notifData.targetTab || 'session',
          studentId: notifData.studentId || null,
          studentName: notifData.studentName || null,
          circleName: notifData.circleName || null,
          meetingUrl: notifData.meetingUrl || null,
          portalRoute: notifData.portalRoute || null,
          url: notifData.url || '/',
          triggerAt: Date.now() + snoozeDelayMs,
          fired: false,
        };

        const pushMeta = await readPushMetaFromIDB();
        const scheduled = Array.isArray(pushMeta.scheduledReminders)
          ? [...pushMeta.scheduledReminders, snoozeItem]
          : [snoozeItem];
        await savePushMetaToIDB({
          ...pushMeta,
          scheduledReminders: scheduled,
        });
        armTimerForReminder(snoozeItem);
      })()
    );
    return;
  }

  if (action === 'dismiss') {
    return;
  }

  // فتح التطبيق أو التركيز على النافذة المفتوحة وتوجيه المستخدم مباشرة للحصة أو البوابة
  event.waitUntil(
    (async () => {
      const targetUrl = notifData.url || '/';
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
        }
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          action: action || 'default',
          targetTab: notifData.targetTab || 'dashboard',
          studentId: notifData.studentId || null,
          circleName: notifData.circleName || null,
          meetingUrl: notifData.meetingUrl || null,
          portalRoute: notifData.portalRoute || null,
          version: SW_PUSH_VERSION,
        });
        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// ----------------------------------------------------------------------------
// 9. تجديد اشتراك Web Push تلقائياً عند تغييره من المتصفح
// ----------------------------------------------------------------------------
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration && self.registration.pushManager) {
          const newSub = await self.registration.pushManager.subscribe(
            (event.oldSubscription && event.oldSubscription.options) || {
              userVisibleOnly: true,
            }
          );
          const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
          });
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: newSub ? JSON.parse(JSON.stringify(newSub)) : null,
            });
          });
        }
      } catch {
        // تجاهل الخطأ إن لم يتوفر خادم VAPID خارجي
      }
    })()
  );
});
