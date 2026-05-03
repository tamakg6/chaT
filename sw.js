// chaT Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Web Push（VAPID）が設定済みのときに動く ──
self.addEventListener('push', e => {
    if (!e.data) return;
    const { title, body, tag } = e.data.json();
    e.waitUntil(
        self.registration.showNotification(title || 'chaT', {
            body: body || '新しいメッセージがあります',
            icon: '/icon.png',
            badge: '/icon.png',
            tag: tag || 'chat',
            renotify: true,
        })
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // すでに開いているタブがあればフォーカス
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            // なければ新しいタブで開く
            return clients.openWindow('/');
        })
    );
});
