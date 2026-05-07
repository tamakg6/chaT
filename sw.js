self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  // データが読めなくても必ず通知を出す
  let title = 'chaT';
  let body  = '（データなし）';

  try {
    if (e.data) {
      const d = e.data.json();
      title = d.title || title;
      body  = d.body  || body;
    }
  } catch (_) {
    try { body = e.data?.text() || body; } catch (_) {}
  }

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: 'chaT-test',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(self.location.origin + '/chaT/'));
});
