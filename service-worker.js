/**
 * RecuerdaMe - Service Worker
 * Enables PWA functionality and handles notifications
 */

const CACHE_NAME = 'recuerdame-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/static/css/styles.css',
    '/static/js/app.js',
    '/static/js/maps.js',
    '/static/js/location.js',
    '/static/js/fcm.js',
    '/static/img/icon.png',
    '/static/img/icon-512.png',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache static resources
self.addEventListener('install', function(event) {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .catch(function(error) {
                console.warn('Cache install failed for some resources:', error);
                // Continue installation even if some resources fail
                return Promise.resolve();
            })
    );
    
    // Force activation of new service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker activated');
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', function(event) {
    // Skip non-HTTP requests
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    // Skip Google Maps API requests (always fetch fresh)
    if (event.request.url.includes('maps.googleapis.com') || 
        event.request.url.includes('gstatic.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(cachedResponse) {
                // Return cached version if available
                if (cachedResponse) {
                    // For HTML pages, try network first for fresh content
                    if (event.request.destination === 'document') {
                        // Network first for HTML
                        return fetch(event.request)
                            .then(function(networkResponse) {
                                // Update cache with fresh content
                                if (networkResponse.status === 200) {
                                    const responseClone = networkResponse.clone();
                                    caches.open(CACHE_NAME).then(function(cache) {
                                        cache.put(event.request, responseClone);
                                    });
                                }
                                return networkResponse;
                            })
                            .catch(function() {
                                // Fallback to cache if network fails
                                return cachedResponse;
                            });
                    }
                    
                    // For other resources, return cache immediately
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // Cache successful responses
                        if (networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(function(error) {
                        console.warn('Network request failed:', event.request.url, error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return new Response(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>RecuerdaMe - Sin conexión</title>
                                    <style>
                                        body { 
                                            font-family: Arial, sans-serif; 
                                            text-align: center; 
                                            padding: 50px; 
                                            background: #f8f9fa;
                                        }
                                        .offline-container {
                                            max-width: 400px;
                                            margin: 0 auto;
                                            background: white;
                                            padding: 40px;
                                            border-radius: 10px;
                                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                        }
                                        .icon { font-size: 64px; margin-bottom: 20px; }
                                        h1 { color: #6c757d; margin-bottom: 20px; }
                                        p { color: #6c757d; line-height: 1.6; }
                                        .btn {
                                            background: #007bff;
                                            color: white;
                                            padding: 12px 24px;
                                            border: none;
                                            border-radius: 5px;
                                            cursor: pointer;
                                            font-size: 16px;
                                            margin-top: 20px;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="offline-container">
                                        <div class="icon">📱</div>
                                        <h1>Sin conexión a internet</h1>
                                        <p>No hay conexión disponible en este momento. Algunas funciones pueden estar limitadas.</p>
                                        <p>Por favor, verifica tu conexión e intenta de nuevo.</p>
                                        <button class="btn" onclick="window.location.reload()">
                                            Intentar de nuevo
                                        </button>
                                    </div>
                                </body>
                                </html>
                            `, {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        }
                        
                        throw error;
                    });
            })
    );
});

// Push event - handle push notifications
self.addEventListener('push', function(event) {
    console.log('📨 Push notification received');
    
    let notificationData = {};
    
    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch (e) {
            notificationData = {
                title: 'RecuerdaMe',
                body: event.data.text() || 'Nueva notificación',
                icon: '/static/img/icon.png'
            };
        }
    } else {
        notificationData = {
            title: 'RecuerdaMe',
            body: 'Nueva notificación',
            icon: '/static/img/icon.png'
        };
    }
    
    // Default notification options
    const options = {
        body: notificationData.body || 'Nueva notificación de RecuerdaMe',
        icon: notificationData.icon || '/static/img/icon.png',
        badge: '/static/img/icon.png',
        vibrate: [200, 100, 200],
        data: notificationData.data || {},
        actions: [
            {
                action: 'view',
                title: 'Ver',
                icon: '/static/img/icon.png'
            },
            {
                action: 'dismiss',
                title: 'Cerrar'
            }
        ],
        requireInteraction: notificationData.requireInteraction || false,
        tag: notificationData.tag || 'recuerdame-notification'
    };
    
    // Show the notification
    event.waitUntil(
        self.registration.showNotification(
            notificationData.title || 'RecuerdaMe',
            options
        )
    );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
    console.log('🔔 Notification clicked:', event.notification.tag);
    
    event.notification.close();
    
    // Handle action buttons
    if (event.action === 'dismiss') {
        return;
    }
    
    // Determine where to navigate based on notification data
    let url = '/dashboard';
    if (event.notification.data) {
        if (event.notification.data.type === 'geofence') {
            url = '/dashboard';
        } else if (event.notification.data.type === 'reminder') {
            url = '/reminders';
        } else if (event.notification.data.type === 'alert') {
            url = '/alerts';
        } else if (event.notification.data.url) {
            url = event.notification.data.url;
        }
    }
    
    // Open or focus app window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Try to focus existing window
                for (const client of clientList) {
                    if (client.url.includes(url.split('/')[1] || 'dashboard') && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if no existing window found
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
    
    // Send message to main app about notification click
    event.waitUntil(
        clients.matchAll({ includeUncontrolled: true })
            .then(function(clientList) {
                clientList.forEach(function(client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        notification: event.notification.data
                    });
                });
            })
    );
});

// Background sync event (for future offline functionality)
self.addEventListener('sync', function(event) {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'location-sync') {
        event.waitUntil(syncLocationData());
    } else if (event.tag === 'data-sync') {
        event.waitUntil(syncOfflineData());
    }
});

// Message event - handle messages from main app
self.addEventListener('message', function(event) {
    console.log('💬 Service Worker message:', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        // Show local notification
        self.registration.showNotification(
            event.data.title,
            {
                body: event.data.body,
                ...event.data.options
            }
        );
    } else if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Sync location data when back online
async function syncLocationData() {
    try {
        console.log('📍 Syncing location data...');
        
        // TODO: Implement offline location data sync
        // This would retrieve stored location data and send to server
        
        return Promise.resolve();
    } catch (error) {
        console.error('Location sync failed:', error);
        throw error;
    }
}

// Sync other offline data
async function syncOfflineData() {
    try {
        console.log('💾 Syncing offline data...');
        
        // TODO: Implement general offline data sync
        // This would handle forms, reminders, etc. saved while offline
        
        return Promise.resolve();
    } catch (error) {
        console.error('Data sync failed:', error);
        throw error;
    }
}

// Handle service worker updates
self.addEventListener('controllerchange', function() {
    console.log('🔄 Service Worker updated');
    // Optionally reload the page to get the new version
});

console.log('🚀 RecuerdaMe Service Worker loaded');
