/**
 * Service Worker for RecuerdaMe PWA
 * Handles caching, offline functionality, and push notifications
 */

const CACHE_NAME = 'recuerdame-v1.0.0';
const CACHE_URLS = [
    '/',
    '/static/css/00-tokens.css',
    '/static/css/01-base.css',
    '/static/css/02-layout.css',
    '/static/css/03-components/buttons.css',
    '/static/css/03-components/cards.css',
    '/static/css/03-components/form.css',
    '/static/css/03-components/chips.css',
    '/static/css/03-components/nav.css',
    '/static/css/03-components/toast.css',
    '/static/css/03-components/map-ui.css',
    '/static/css/04-pages/home.css',
    '/static/css/04-pages/memories.css',
    '/static/css/04-pages/map.css',
    '/static/css/04-pages/settings.css',
    '/static/css/04-pages/alerts.css',
    '/static/css/04-pages/reminders.css',
    '/static/css/dark.css',
    '/static/js/app.js',
    '/static/js/ui.js',
    '/static/js/api.js',
    '/static/js/memories_list.js',
    '/static/js/memory_person.js',
    '/static/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('SW: Install complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('SW: Install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('SW: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (like Google Fonts)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('SW: Serving from cache:', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                console.log('SW: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response for future use
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('SW: Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/offline.html') || new Response(
                                '<html><body><h1>Sin conexión</h1><p>La aplicación no está disponible sin conexión a internet.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        }
                        
                        // Return empty response for other requests
                        return new Response();
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', event => {
    console.log('SW: Push received');
    
    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const title = data.title || 'RecuerdaMe';
    const options = {
        body: data.body || 'Tienes una nueva notificación',
        icon: '/static/img/icon-192.png',
        badge: '/static/img/icon-96.png',
        tag: data.tag || 'recuerdame-notification',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('SW: Notification clicked');
    
    event.notification.close();
    
    // Handle action clicks
    if (event.action) {
        console.log('SW: Notification action clicked:', event.action);
        // Handle specific actions here
        return;
    }

    // Handle notification click
    const data = event.notification.data;
    let urlToOpen = '/';
    
    if (data && data.url) {
        urlToOpen = data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync event (for offline actions)
self.addEventListener('sync', event => {
    console.log('SW: Background sync triggered:', event.tag);
    
    if (event.tag === 'photo-upload') {
        event.waitUntil(syncPhotoUploads());
    }
    
    if (event.tag === 'location-update') {
        event.waitUntil(syncLocationUpdates());
    }
});

// Helper functions for background sync
async function syncPhotoUploads() {
    try {
        // Get pending uploads from IndexedDB
        // This would need to be implemented with your storage strategy
        console.log('SW: Syncing photo uploads...');
        
        // Implementation would go here
        
    } catch (error) {
        console.error('SW: Photo upload sync failed:', error);
    }
}

async function syncLocationUpdates() {
    try {
        // Get pending location updates from IndexedDB
        console.log('SW: Syncing location updates...');
        
        // Implementation would go here
        
    } catch (error) {
        console.error('SW: Location update sync failed:', error);
    }
}

// Message event (communication with main thread)
self.addEventListener('message', event => {
    console.log('SW: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        // Force cache update
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(CACHE_URLS))
        );
    }
});
