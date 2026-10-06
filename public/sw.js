// Firebase Scripts
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBoaE303Ofp0AzaqQxVczbkPGjumUKy1fs",
  authDomain: "aayupcrm.firebaseapp.com",
  projectId: "aayupcrm",
  storageBucket: "aayupcrm.firebasestorage.app",
  messagingSenderId: "789545656558",
  appId: "1:789545656558:web:db8fd908d322a3bd8993ff",
  measurementId: "G-J76PV66NHY"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background FCM message ', payload);
  const title = payload.notification?.title || payload.data?.title || 'CRM Notification';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New CRM update',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true
  };
  self.registration.showNotification(title, options);
});

// PWA Service Worker lifecycle
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Push notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/dashboard');
    })
  );
});

// Fetch directly from network
self.addEventListener('fetch', () => {
  return;
});
