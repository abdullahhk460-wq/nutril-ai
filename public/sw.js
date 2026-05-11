self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[Service Worker] Push data:', data);
    } catch (e) {
      console.warn('[Service Worker] Push event data is not JSON, using as text.');
      data = { title: 'NutriLife', message: event.data.text() };
    }
  }

  const title = data.title || 'NutriLife';
  const options = {
    body: data.message || 'You have a new update.',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard/notifications'
    },
    tag: 'nutrilife-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[Service Worker] Notification shown.'))
      .catch(err => console.error('[Service Worker] Failed to show notification:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
