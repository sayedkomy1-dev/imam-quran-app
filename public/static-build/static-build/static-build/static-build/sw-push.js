// Service Worker Push & Notification Handler for Imam Academy PWA

function isNotificationsEnabledInIDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(true);
      return;
    }
    try {
      const req = indexedDB.open('ImamAcademyDB', 1);
      req.onerror = () => resolve(true);
      req.onsuccess = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains('state')) {
            resolve(true);
            return;
          }
          const tx = db.transaction('state', 'readonly');
          const getReq = tx.objectStore('state').get('root');
          getReq.onsuccess = () => {
            const data = getReq.result;
            if (
              data &&
              data.settings &&
              typeof data.settings.notificationsEnabled === 'boolean'
            ) {
              resolve(data.settings.notificationsEnabled);
            } else {
              resolve(true);
            }
          };
          getReq.onerror = () => resolve(true);
        } catch {
          resolve(true);
        }
      };
    } catch {
      resolve(true);
    }
  });
}

// Listen for Web Push API 'push' events
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const enabled = await isNotificationsEnabledInIDB();
      if (!enabled) {
        return;
      }

      let payload = {
        title: 'أكاديمية الإمام لتحفيظ القرآن الكريم',
        body: 'لديك مهام متأخرة أو طلاب يحتاجون إلى متابعة عاجلة.',
        tag: 'imam-academy-push',
        targetTab: 'dashboard',
        studentId: null,
        notificationsEnabled: true,
      };

      if (event.data) {
        try {
          const parsed = event.data.json();
          payload = { ...payload, ...parsed };
        } catch {
          try {
            payload.body = event.data.text() || payload.body;
          } catch {
            // keep default payload
          }
        }
      }

      if (payload.notificationsEnabled === false) {
        return;
      }

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        dir: 'rtl',
        lang: 'ar',
        icon: '/assets/aistudio/icon-192_29a1c2ce.png',
        badge: '/assets/aistudio/icon-96_3bce66e2.png',
        tag: payload.tag || 'imam-academy-push',
        data: {
          targetTab: payload.targetTab || 'dashboard',
          studentId: payload.studentId || null,
        },
      });
    })()
  );
});

// Listen for client-triggered local push messages via Service Worker
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'TRIGGER_LOCAL_PUSH') {
    return;
  }

  event.waitUntil(
    (async () => {
      if (data.notificationsEnabled === false) {
        return;
      }
      const enabledInDb = await isNotificationsEnabledInIDB();
      if (!enabledInDb) {
        return;
      }

      await self.registration.showNotification(
        data.title || 'أكاديمية الإمام لتحفيظ القرآن الكريم',
        {
          body: data.body || '',
          dir: 'rtl',
          lang: 'ar',
          icon: '/assets/aistudio/icon-192_29a1c2ce.png',
          badge: '/assets/aistudio/icon-96_3bce66e2.png',
          tag: data.tag || 'imam-academy-alert',
          data: {
            targetTab: data.targetTab || 'dashboard',
            studentId: data.studentId || null,
          },
        }
      );
    })()
  );
});

// Handle native notification click to focus app and route to target view
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};

  event.waitUntil(
    (async () => {
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
          targetTab: notifData.targetTab || 'dashboard',
          studentId: notifData.studentId || null,
        });
        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow('/');
      }
    })()
  );
});
