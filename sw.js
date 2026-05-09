// chaT Service Worker — ブラウザを閉じても通知を受け取る

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ──────────────────────────────────────────
//  Web Push 受信
// ──────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;

  let title = 'chaT';
  let body  = '新しいメッセージがあります';
  let tag   = 'chaT-msg';

  try {
    const data = e.data.json();
    title = data.title || title;
    body  = data.body  || body;
    tag   = data.tag   || tag;
  } catch (_) {
    body = e.data.text();
  }

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:      '/favicon.ico',
      badge:     '/favicon.ico',
      tag,
      renotify:  true,
      vibrate:   [200, 100, 200],
      data:      { url: self.location.origin },
    })
  );
});

// ──────────────────────────────────────────
//  通知クリック時にアプリを開く
// ──────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || self.location.origin;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.startsWith(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
