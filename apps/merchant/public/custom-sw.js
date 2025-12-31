self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.', event.data ? event.data.text() : 'No Payload');

    if (event.data) {
        const data = event.data.json();
        console.log('[Service Worker] Push Data:', data);

        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            tag: data.tag || 'default',
            renotify: true,
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
                .then(() => console.log('[Service Worker] Notification shown'))
                .catch(err => console.error('[Service Worker] Error showing notification:', err))
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                if (event.notification.data && event.notification.data.url) {
                    client.navigate(event.notification.data.url);
                }
                return client.focus();
            }
            if (clients.openWindow && event.notification.data && event.notification.data.url) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
